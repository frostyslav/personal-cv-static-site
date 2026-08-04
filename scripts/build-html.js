import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Handlebars from 'handlebars';
import { validate, dataSchema } from './data-schema.js';

// Parse --locale flag (default: en)
const args = process.argv.slice(2);
const localeIdx = args.indexOf('--locale');
const locale =
  localeIdx !== -1 && args[localeIdx + 1] ? args[localeIdx + 1] : 'en';

// Data directory — override with CV_DATA_DIR env variable for private data
const dataRoot = process.env.CV_DATA_DIR || 'data';

// Load i18n to determine defaultLocale and compute output paths
const i18nRaw = yaml.load(
  fs.readFileSync(path.join(dataRoot, 'i18n.yaml'), 'utf8')
);
const defaultLocale = i18nRaw.defaultLocale || 'en';
const outputDir = locale === defaultLocale ? 'dist' : path.join('dist', locale);

// Load YAML data files with error handling
function loadYaml(filename) {
  const filePath = path.join(dataRoot, filename);
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

// Load locale-specific YAML from <dataRoot>/<locale>/
function loadLocalizedYaml(filename) {
  const localePath = path.join(dataRoot, locale, filename);
  if (!fs.existsSync(localePath)) {
    console.error(`✗ Missing localized data file: ${localePath}`);
    process.exit(1);
  }
  try {
    return yaml.load(fs.readFileSync(localePath, 'utf8'));
  } catch (e) {
    console.error(`✗ Invalid YAML in ${localePath}: ${e.message}`);
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

// Load i18n strings
const i18n = i18nRaw[locale] || i18nRaw[defaultLocale];

// Compute altLangUrl based on defaultLocale (override static value in YAML)
if (i18n.altLang) {
  i18n.altLangUrl = i18n.altLang === defaultLocale ? '/' : `/${i18n.altLang}/`;
}

const data = {
  site: loadLocalizedYaml('site.yaml'),
  hero: loadLocalizedYaml('hero.yaml'),
  about: loadLocalizedYaml('about.yaml'),
  experience: loadLocalizedYaml('experience.yaml'),
  projects: loadLocalizedYaml('projects.yaml'),
  education: loadLocalizedYaml('education.yaml'),
  skills: loadLocalizedYaml('skills.yaml'),
  certifications: loadYaml('certifications.yaml'),
  i18n,
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

// Interpolate i18n meta placeholders with actual data
if (data.site.careerStartYear) {
  const years = new Date().getFullYear() - data.site.careerStartYear;
  const rounded = Math.floor(years / 5) * 5;
  const replacements = {
    name: data.hero.profile.name,
    title: data.hero.profile.title,
    years: String(rounded),
  };
  for (const [key, val] of Object.entries(replacements)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    if (i18n.metaDescription) {
      i18n.metaDescription = i18n.metaDescription.replace(re, val);
    }
    if (i18n.ogDescription) {
      i18n.ogDescription = i18n.ogDescription.replace(re, val);
    }
  }
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
 * {{t key}} — returns the i18n string for the current locale.
 */
Handlebars.registerHelper('t', function (key) {
  return i18n[key] || key;
});

/**
 * {{displayUrl url}} — strips protocol prefixes (mailto:, https://, http://)
 * and trailing slashes from a URL for human-readable display in print.
 */
Handlebars.registerHelper('displayUrl', function (url) {
  if (typeof url !== 'string') return '';
  return url
    .replace(/^mailto:/i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
});

/**
 * {{safeUrl value}} — outputs a URL without HTML-escaping (so & stays &),
 * but only if the value looks like a safe URL. Blocks javascript: URIs and
 * other potentially dangerous schemes.
 */
/**
 * {{dateRange dateStr}} — converts a date range string like "Nov 2023 - Present"
 * into semantic <time> elements with machine-readable datetime attributes.
 * Supports formats: "Mon YYYY - Mon YYYY", "Mon YYYY - Present", "YYYY - YYYY".
 */
Handlebars.registerHelper('dateRange', function (dateStr) {
  if (typeof dateStr !== 'string') return '';

  const monthMap = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12',
    Mär: '03',
    Okt: '10',
    Dez: '12',
  };

  function parseDate(part) {
    const trimmed = part.trim();
    if (
      trimmed.toLowerCase() === 'present' ||
      trimmed.toLowerCase() === 'heute'
    ) {
      return { display: trimmed, datetime: '' };
    }
    // "Mon YYYY" format
    const monthYear = trimmed.match(/^([A-Za-zä]{3,4})\s+(\d{4})$/);
    if (monthYear) {
      const mon = monthMap[monthYear[1]];
      const year = monthYear[2];
      if (mon) {
        return { display: trimmed, datetime: `${year}-${mon}` };
      }
    }
    // "YYYY" format
    const yearOnly = trimmed.match(/^(\d{4})$/);
    if (yearOnly) {
      return { display: trimmed, datetime: yearOnly[1] };
    }
    return { display: trimmed, datetime: '' };
  }

  const parts = dateStr.split('-').map(p => p.trim());
  if (parts.length === 2) {
    const start = parseDate(parts[0]);
    const end = parseDate(parts[1]);
    const startTag = start.datetime
      ? `<time datetime="${start.datetime}">${start.display}</time>`
      : start.display;
    const endTag = end.datetime
      ? `<time datetime="${end.datetime}">${end.display}</time>`
      : end.display;
    return new Handlebars.SafeString(`${startTag} - ${endTag}`);
  }

  // Fallback: single date or unrecognised format
  const single = parseDate(dateStr);
  if (single.datetime) {
    return new Handlebars.SafeString(
      `<time datetime="${single.datetime}">${single.display}</time>`
    );
  }
  return dateStr;
});

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

/**
 * {{linkIcon url}} — returns an appropriate FA icon class based on the URL domain.
 */
Handlebars.registerHelper('linkIcon', function (url) {
  if (typeof url !== 'string') return 'fa-solid fa-link';
  if (url.includes('github.com')) return 'fab fa-github';
  if (url.includes('youtube.com') || url.includes('youtu.be'))
    return 'fab fa-youtube';
  return 'fa-solid fa-link';
});

// Register partials
const partialsDir = path.join('templates', 'partials');
for (const file of fs.readdirSync(partialsDir)) {
  const name = path.basename(file, '.hbs');
  const content = fs.readFileSync(path.join(partialsDir, file), 'utf8');
  Handlebars.registerPartial(name, content);
}

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

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
  fs.writeFileSync(path.join(outputDir, 'index.html'), cleaned);
  console.log(`✓ ${outputDir}/index.html generated (locale: ${locale})`);
} catch (e) {
  console.error(`✗ Template compilation failed: ${e.message}`);
  process.exit(1);
}
