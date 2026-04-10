/**
 * Unit tests — test core logic extracted from browser scripts.
 * Run with: npm run test:unit
 *
 * These tests exercise the fuzzy matching algorithm and build-html
 * validation logic without needing a browser environment.
 */
const { ALIASES, fuzzyMatch } = require('../utils/fuzzy-match.js');

let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passes++;
  } else {
    console.error(`  ✗ ${message}`);
    failures++;
  }
}

function assertEqual(actual, expected, message) {
  const pass = actual === expected;
  if (pass) {
    console.log(`  ✓ ${message}`);
    passes++;
  } else {
    console.error(`  ✗ ${message}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failures++;
  }
}

// ─── Fuzzy Match: Exact substring ────────────────────────────────────────────
console.log('\n🔍 fuzzyMatch — exact substring');
assert(fuzzyMatch('docker', 'Docker'), 'case-insensitive exact match');
assert(
  fuzzyMatch('DOCKER', 'docker'),
  'uppercase query matches lowercase text'
);
assert(fuzzyMatch('kube', 'Kubernetes'), 'partial substring match');
assert(fuzzyMatch('java', 'JavaScript'), 'prefix match');
assert(!fuzzyMatch('xyz123', 'Docker'), 'no match for unrelated query');
assert(fuzzyMatch('', 'anything'), 'empty query matches everything');

// ─── Fuzzy Match: Alias resolution ──────────────────────────────────────────
console.log('\n🏷️  fuzzyMatch — alias resolution');
assert(fuzzyMatch('k8s', 'Kubernetes'), 'k8s alias resolves to kubernetes');
assert(fuzzyMatch('aws', 'Amazon Web Services'), 'aws alias resolves');
assert(fuzzyMatch('tf', 'Terraform'), 'tf alias resolves to terraform');
assert(fuzzyMatch('js', 'JavaScript'), 'js alias resolves to javascript');
assert(fuzzyMatch('ts', 'TypeScript'), 'ts alias resolves to typescript');
assert(fuzzyMatch('py', 'Python'), 'py alias resolves to python');
assert(fuzzyMatch('pg', 'PostgreSQL'), 'pg alias resolves to postgresql');
assert(fuzzyMatch('mongo', 'MongoDB'), 'mongo alias resolves to mongodb');
assert(fuzzyMatch('gcp', 'Google Cloud Platform'), 'gcp alias resolves');
assert(fuzzyMatch('gh', 'GitHub'), 'gh alias resolves to github');
assert(fuzzyMatch('iac', 'Infrastructure as Code'), 'iac alias resolves');
assert(fuzzyMatch('cdk', 'AWS CDK'), 'cdk alias resolves to aws cdk');
assert(fuzzyMatch('cfn', 'AWS CloudFormation'), 'cfn alias resolves');

// ─── Fuzzy Match: Reverse alias ─────────────────────────────────────────────
console.log('\n🔄 fuzzyMatch — reverse alias');
assert(
  fuzzyMatch('kubernetes', 'k8s'),
  'full name matches text containing abbreviation'
);
assert(fuzzyMatch('terraform', 'tf'), 'terraform matches text containing tf');

// ─── Fuzzy Match: Character sequence ────────────────────────────────────────
console.log('\n🔤 fuzzyMatch — fuzzy character sequence');
assert(fuzzyMatch('dkr', 'Docker'), 'fuzzy: d-k-r in Docker');
assert(fuzzyMatch('kbs', 'Kubernetes'), 'fuzzy: k-b-s in Kubernetes');
assert(!fuzzyMatch('zyx', 'Docker'), 'fuzzy: no match for reversed chars');
assert(fuzzyMatch('ans', 'Ansible'), 'fuzzy: a-n-s in Ansible');

// ─── Fuzzy Match: Edge cases ────────────────────────────────────────────────
console.log('\n⚠️  fuzzyMatch — edge cases');
assert(fuzzyMatch('a', 'Ansible'), 'single char match');
assert(!fuzzyMatch('zzz', 'abc'), 'no match when chars not present');
assert(fuzzyMatch('docker', 'docker'), 'exact full match');
assert(
  fuzzyMatch('KUBERNETES', 'kubernetes'),
  'all caps query matches lowercase'
);
assert(fuzzyMatch('k8s', 'k8s'), 'alias matches itself');

// ─── Shared module integrity ────────────────────────────────────────────────
console.log('\n📦 Shared module');
assert(typeof ALIASES === 'object', 'ALIASES is exported');
assert(
  Object.keys(ALIASES).length >= 29,
  `has ${Object.keys(ALIASES).length} aliases`
);
assert(typeof fuzzyMatch === 'function', 'fuzzyMatch is exported');

// ─── Build validation logic ─────────────────────────────────────────────────
console.log('\n🏗️  build-html — data validation');

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
  if (!data.experience?.groups && !data.experience?.singles)
    errors.push('experience must have groups or singles');
  if (!data.education?.groups && !data.education?.singles)
    errors.push('education must have groups or singles');
  if (!Array.isArray(data.skills) || !data.skills.length)
    errors.push('skills must be a non-empty array');
  if (!Array.isArray(data.certifications) || !data.certifications.length)
    errors.push('certifications must be a non-empty array');
  return errors;
}

// Valid data
const validData = {
  sidebar: { profile: { name: 'Test', title: 'Dev' }, nav: [{ href: '#' }] },
  about: { paragraphs: ['Hello'] },
  experience: { groups: [{}] },
  education: { groups: [{}] },
  skills: [{ name: 'JS' }],
  certifications: [{ name: 'AWS' }],
};
assertEqual(validateData(validData).length, 0, 'valid data passes validation');

// Missing sidebar name
const missingName = JSON.parse(JSON.stringify(validData));
missingName.sidebar.profile.name = '';
assert(
  validateData(missingName).includes('sidebar.profile.name is required'),
  'catches missing sidebar.profile.name'
);

// Missing about paragraphs
const missingAbout = JSON.parse(JSON.stringify(validData));
missingAbout.about.paragraphs = [];
assert(
  validateData(missingAbout).includes(
    'about.paragraphs must have at least one entry'
  ),
  'catches empty about.paragraphs'
);

// Missing experience
const missingExp = JSON.parse(JSON.stringify(validData));
delete missingExp.experience.groups;
assert(
  validateData(missingExp).includes('experience must have groups or singles'),
  'catches missing experience groups/singles'
);

// Empty skills
const emptySkills = JSON.parse(JSON.stringify(validData));
emptySkills.skills = [];
assert(
  validateData(emptySkills).includes('skills must be a non-empty array'),
  'catches empty skills array'
);

// Completely empty data
const emptyData = {};
const emptyErrors = validateData(emptyData);
assert(
  emptyErrors.length === 8,
  `catches all 8 errors on empty data (got ${emptyErrors.length})`
);

// Experience with singles instead of groups
const singlesExp = JSON.parse(JSON.stringify(validData));
delete singlesExp.experience.groups;
singlesExp.experience.singles = [{}];
assertEqual(
  validateData(singlesExp).filter(e => e.includes('experience')).length,
  0,
  'experience.singles is accepted as alternative to groups'
);

// ─── Service worker template validation ─────────────────────────────────────
console.log('\n🔧 Service worker — template');
const swTemplate = require('fs').readFileSync(
  require('path').join(__dirname, '..', 'templates', 'sw.template.js'),
  'utf8'
);
assert(
  swTemplate.includes('{{CACHE_NAME}}'),
  'sw.template.js has {{CACHE_NAME}} placeholder'
);
assert(
  swTemplate.includes('{{CSS_BUNDLE}}'),
  'sw.template.js has {{CSS_BUNDLE}} placeholder'
);
assert(
  swTemplate.includes('{{JS_BUNDLE}}'),
  'sw.template.js has {{JS_BUNDLE}} placeholder'
);
assert(
  !swTemplate.includes('/dist/'),
  'sw.template.js has no /dist/ prefixed paths'
);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(
  `\n${passes + failures} tests, ${passes} passed, ${failures} failed\n`
);
process.exit(failures > 0 ? 1 : 0);
