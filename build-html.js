const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');

// Load YAML data files
function loadYaml(filename) {
  return yaml.load(fs.readFileSync(path.join('data', filename), 'utf8'));
}

const data = {
  sidebar: loadYaml('sidebar.yaml'),
  about: loadYaml('about.yaml'),
  experience: loadYaml('experience.yaml'),
  education: loadYaml('education.yaml'),
  skills: loadYaml('skills.yaml'),
  certifications: loadYaml('certifications.yaml'),
};

// Register partials
const partialsDir = path.join('templates', 'partials');
for (const file of fs.readdirSync(partialsDir)) {
  const name = path.basename(file, '.hbs');
  const content = fs.readFileSync(path.join(partialsDir, file), 'utf8');
  Handlebars.registerPartial(name, content);
}

// Compile and render
const templateSrc = fs.readFileSync(
  path.join('templates', 'index.hbs'),
  'utf8'
);
const template = Handlebars.compile(templateSrc);
const html = template(data);

fs.writeFileSync('index.html', html);
console.log('✓ index.html generated from templates + data');
