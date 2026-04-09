/**
 * Unit tests — test core logic extracted from browser scripts.
 * Run with: npm run test:unit
 *
 * These tests exercise the fuzzy matching algorithm and build-html
 * validation logic without needing a browser environment.
 */
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

// ─── Extract fuzzy match logic for testing ───────────────────────────────────
// Mirror of the ALIASES and fuzzyMatch from scripts/skills.js
const ALIASES = {
  k8s: 'kubernetes',
  aws: 'amazon web services',
  gcp: 'google cloud platform',
  tf: 'terraform',
  tg: 'terragrunt',
  gh: 'github',
  gl: 'gitlab',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  pg: 'postgresql',
  mongo: 'mongodb',
  iac: 'infrastructure as code',
  otel: 'opentelemetry',
  eks: 'amazon eks',
  aks: 'azure aks',
  gke: 'google gke',
  ecs: 'amazon ecs',
  rds: 'amazon rds',
  cdk: 'aws cdk',
  cfn: 'aws cloudformation',
  ovs: 'openvswitch',
  ovn: 'open virtual network',
  dpdk: 'data plane development kit',
  cni: 'container network interface',
  rag: 'retrieval-augmented generation',
  vm: 'virtualization',
  kvm: 'kvm',
  hv: 'hyper-v',
};

function fuzzyMatch(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact substring match
  if (t.includes(q)) return true;

  // Alias match — check if query is a known alias
  const aliasTarget = ALIASES[q];
  if (aliasTarget && t.includes(aliasTarget)) return true;

  // Reverse alias — check if any alias value matches and query matches the key
  for (const [abbr, full] of Object.entries(ALIASES)) {
    if (q.includes(full) && t.includes(abbr)) return true;
  }

  // Fuzzy character sequence match
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
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

// ─── Service worker path validation ─────────────────────────────────────────
console.log('\n🔧 Service worker — source template');
const swContent = require('fs').readFileSync(
  require('path').join(__dirname, '..', 'sw.js'),
  'utf8'
);
assert(
  !swContent.includes('/dist/'),
  'sw.js source has no /dist/ prefixed paths'
);
assert(
  swContent.includes('/styles.min.css'),
  'sw.js source has /styles.min.css placeholder'
);
assert(
  swContent.includes('/scripts.min.js'),
  'sw.js source has /scripts.min.js placeholder'
);
assert(
  /CACHE_NAME\s*=\s*'cv-cache-v\d+'/.test(swContent),
  'sw.js source has versioned cache name template'
);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(
  `\n${passes + failures} tests, ${passes} passed, ${failures} failed\n`
);
process.exit(failures > 0 ? 1 : 0);
