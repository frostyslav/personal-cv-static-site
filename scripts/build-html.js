import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Handlebars from 'handlebars';
import { validate, dataSchema } from './data-schema.js';

// Load YAML data files with error handling
function loadYaml(filename) {
  const filePath = path.join('data', filename);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Missing data file: ${filePath}`);
    process.exit(1);
  }
  try {
    return yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`✗ Invalid YAML in ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

// Validate merged data against the declarative schema
function validateData(data) {
  const errors = validate(data, dataSchema);

  if (errors.length) {
    console.error('✗ Data validation failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}

const data = {
  site: loadYaml('site.yaml'),
  sidebar: loadYaml('sidebar.yaml'),
  about: loadYaml('about.yaml'),
  experience: loadYaml('experience.yaml'),
  education: loadYaml('education.yaml'),
  skills: loadYaml('skills.yaml'),
  certifications: loadYaml('certifications.yaml'),
};

validateData(data);

// Replace {{yearsOfExperience}} placeholder in about paragraphs
if (data.site.careerStartYear && data.about?.paragraphs) {
  const years = new Date().getFullYear() - data.site.careerStartYear;
  const rounded = Math.floor(years / 5) * 5;
  data.about.paragraphs = data.about.paragraphs.map(p =>
    p.replace(/\{\{yearsOfExperience\}\}/g, String(rounded))
  );
}

// Register helpers

/**
 * {{yearsSince year}} — computes the number of full years from a given year
 * to the current year. Used for dynamic "X+ years of experience" text.
 */
Handlebars.registerHelper('yearsSince', function (year) {
  if (typeof year !== 'number' || year < 1900) return '';
  const total = new Date().getFullYear() - year;
  return Math.floor(total / 5) * 5;
});

/**
 * {{safeUrl value}} — outputs a URL without HTML-escaping (so & stays &),
 * but only if the value looks like a safe URL. Blocks javascript: URIs and
 * other potentially dangerous schemes.
 */
Handlebars.registerHelper('safeUrl', function (url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Allow http(s), mailto, tel, fragment-only, and absolute-path links
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed) ||
    /^#/.test(trimmed) ||
    /^\/[^/]/.test(trimmed)
  ) {
    return new Handlebars.SafeString(trimmed);
  }
  console.warn(`⚠ Blocked unsafe URL in template: ${trimmed}`);
  return '';
});

// Register partials
const partialsDir = path.join('templates', 'partials');
for (const file of fs.readdirSync(partialsDir)) {
  const name = path.basename(file, '.hbs');
  const content = fs.readFileSync(path.join(partialsDir, file), 'utf8');
  Handlebars.registerPartial(name, content);
}

// Compile and render
try {
  const templateSrc = fs.readFileSync(
    path.join('templates', 'index.hbs'),
    'utf8'
  );
  const template = Handlebars.compile(templateSrc);
  const html = template(data);
  // Remove trailing whitespace from each line (Handlebars leaves indentation on blank lines)
  const cleaned = html.replace(/[ \t]+$/gm, '');
  fs.writeFileSync(path.join('dist', 'index.html'), cleaned);
  console.log('✓ dist/index.html generated from templates + data');
} catch (e) {
  console.error(`✗ Template compilation failed: ${e.message}`);
  process.exit(1);
}
