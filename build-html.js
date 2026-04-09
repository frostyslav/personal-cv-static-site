const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');

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

// Validate required data fields
function validateData(data) {
  const errors = [];

  if (!data.sidebar?.profile?.name)
    errors.push('sidebar.profile.name is required');
  if (!data.sidebar?.profile?.title)
    errors.push('sidebar.profile.title is required');
  if (!data.sidebar?.nav?.length)
    errors.push('sidebar.nav must have at least one entry');
  if (!data.about?.paragraphs?.length)
    errors.push('about.paragraphs must have at least one entry');
  if (!data.experience?.groups && !data.experience?.singles) {
    errors.push('experience must have groups or singles');
  }
  if (!data.education?.groups && !data.education?.singles) {
    errors.push('education must have groups or singles');
  }
  if (!Array.isArray(data.skills) || !data.skills.length) {
    errors.push('skills must be a non-empty array');
  }
  if (!Array.isArray(data.certifications) || !data.certifications.length) {
    errors.push('certifications must be a non-empty array');
  }

  if (errors.length) {
    console.error('✗ Data validation failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}

const data = {
  sidebar: loadYaml('sidebar.yaml'),
  about: loadYaml('about.yaml'),
  experience: loadYaml('experience.yaml'),
  education: loadYaml('education.yaml'),
  skills: loadYaml('skills.yaml'),
  certifications: loadYaml('certifications.yaml'),
};

validateData(data);

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
  fs.writeFileSync('index.html', html);
  console.log('✓ index.html generated from templates + data');
} catch (e) {
  console.error(`✗ Template compilation failed: ${e.message}`);
  process.exit(1);
}
