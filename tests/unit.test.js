/**
 * Unit tests — test core logic extracted from browser scripts.
 * Run with: npm run test:unit
 *
 * These tests exercise the fuzzy matching algorithm and build-html
 * validation logic without needing a browser environment.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ALIASES, fuzzyMatch } = require('../utils/fuzzy-match.cjs');

// ─── Fuzzy Match: Exact substring ────────────────────────────────────────────
describe('fuzzyMatch — exact substring', () => {
  it('case-insensitive exact match', () =>
    assert.ok(fuzzyMatch('docker', 'Docker')));
  it('uppercase query matches lowercase text', () =>
    assert.ok(fuzzyMatch('DOCKER', 'docker')));
  it('partial substring match', () =>
    assert.ok(fuzzyMatch('kube', 'Kubernetes')));
  it('prefix match', () => assert.ok(fuzzyMatch('java', 'JavaScript')));
  it('no match for unrelated query', () =>
    assert.ok(!fuzzyMatch('xyz123', 'Docker')));
  it('empty query matches everything', () =>
    assert.ok(fuzzyMatch('', 'anything')));
});

// ─── Fuzzy Match: Alias resolution ──────────────────────────────────────────
describe('fuzzyMatch — alias resolution', () => {
  it('k8s alias resolves to kubernetes', () =>
    assert.ok(fuzzyMatch('k8s', 'Kubernetes')));
  it('aws alias resolves', () =>
    assert.ok(fuzzyMatch('aws', 'Amazon Web Services')));
  it('tf alias resolves to terraform', () =>
    assert.ok(fuzzyMatch('tf', 'Terraform')));
  it('js alias resolves to javascript', () =>
    assert.ok(fuzzyMatch('js', 'JavaScript')));
  it('ts alias resolves to typescript', () =>
    assert.ok(fuzzyMatch('ts', 'TypeScript')));
  it('py alias resolves to python', () =>
    assert.ok(fuzzyMatch('py', 'Python')));
  it('pg alias resolves to postgresql', () =>
    assert.ok(fuzzyMatch('pg', 'PostgreSQL')));
  it('mongo alias resolves to mongodb', () =>
    assert.ok(fuzzyMatch('mongo', 'MongoDB')));
  it('gcp alias resolves', () =>
    assert.ok(fuzzyMatch('gcp', 'Google Cloud Platform')));
  it('gh alias resolves to github', () =>
    assert.ok(fuzzyMatch('gh', 'GitHub')));
  it('iac alias resolves', () =>
    assert.ok(fuzzyMatch('iac', 'Infrastructure as Code')));
  it('cdk alias resolves to aws cdk', () =>
    assert.ok(fuzzyMatch('cdk', 'AWS CDK')));
  it('cfn alias resolves', () =>
    assert.ok(fuzzyMatch('cfn', 'AWS CloudFormation')));
});

// ─── Fuzzy Match: Reverse alias ─────────────────────────────────────────────
describe('fuzzyMatch — reverse alias', () => {
  it('full name matches text containing abbreviation', () =>
    assert.ok(fuzzyMatch('kubernetes', 'k8s')));
  it('terraform matches text containing tf', () =>
    assert.ok(fuzzyMatch('terraform', 'tf')));
});

// ─── Fuzzy Match: Character sequence ────────────────────────────────────────
describe('fuzzyMatch — fuzzy character sequence', () => {
  it('fuzzy: d-k-r in Docker', () => assert.ok(fuzzyMatch('dkr', 'Docker')));
  it('fuzzy: k-b-s in Kubernetes', () =>
    assert.ok(fuzzyMatch('kbs', 'Kubernetes')));
  it('fuzzy: no match for reversed chars', () =>
    assert.ok(!fuzzyMatch('zyx', 'Docker')));
  it('fuzzy: a-n-s in Ansible', () => assert.ok(fuzzyMatch('ans', 'Ansible')));
});

// ─── Fuzzy Match: Edge cases ────────────────────────────────────────────────
describe('fuzzyMatch — edge cases', () => {
  it('single char match', () => assert.ok(fuzzyMatch('a', 'Ansible')));
  it('no match when chars not present', () =>
    assert.ok(!fuzzyMatch('zzz', 'abc')));
  it('exact full match', () => assert.ok(fuzzyMatch('docker', 'docker')));
  it('all caps query matches lowercase', () =>
    assert.ok(fuzzyMatch('KUBERNETES', 'kubernetes')));
  it('alias matches itself', () => assert.ok(fuzzyMatch('k8s', 'k8s')));
});

// ─── Shared module integrity ────────────────────────────────────────────────
describe('Shared module', () => {
  it('ALIASES is exported', () => assert.equal(typeof ALIASES, 'object'));
  it('has at least 29 aliases', () =>
    assert.ok(Object.keys(ALIASES).length >= 29));
  it('fuzzyMatch is exported', () =>
    assert.equal(typeof fuzzyMatch, 'function'));
});

// ─── Build validation logic ─────────────────────────────────────────────────
describe('build-html — data validation', () => {
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

  const validData = {
    sidebar: { profile: { name: 'Test', title: 'Dev' }, nav: [{ href: '#' }] },
    about: { paragraphs: ['Hello'] },
    experience: { groups: [{}] },
    education: { groups: [{}] },
    skills: [{ name: 'JS' }],
    certifications: [{ name: 'AWS' }],
  };

  it('valid data passes validation', () => {
    assert.equal(validateData(validData).length, 0);
  });

  it('catches missing sidebar.profile.name', () => {
    const d = JSON.parse(JSON.stringify(validData));
    d.sidebar.profile.name = '';
    assert.ok(validateData(d).includes('sidebar.profile.name is required'));
  });

  it('catches empty about.paragraphs', () => {
    const d = JSON.parse(JSON.stringify(validData));
    d.about.paragraphs = [];
    assert.ok(
      validateData(d).includes('about.paragraphs must have at least one entry')
    );
  });

  it('catches missing experience groups/singles', () => {
    const d = JSON.parse(JSON.stringify(validData));
    delete d.experience.groups;
    assert.ok(
      validateData(d).includes('experience must have groups or singles')
    );
  });

  it('catches empty skills array', () => {
    const d = JSON.parse(JSON.stringify(validData));
    d.skills = [];
    assert.ok(validateData(d).includes('skills must be a non-empty array'));
  });

  it('catches all 8 errors on empty data', () => {
    assert.equal(validateData({}).length, 8);
  });

  it('experience.singles is accepted as alternative to groups', () => {
    const d = JSON.parse(JSON.stringify(validData));
    delete d.experience.groups;
    d.experience.singles = [{}];
    assert.equal(
      validateData(d).filter(e => e.includes('experience')).length,
      0
    );
  });
});

// ─── Service worker template validation ─────────────────────────────────────
describe('Service worker — template', () => {
  const swTemplate = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'templates', 'sw.template.js'),
    'utf8'
  );

  it('has {{CACHE_NAME}} placeholder', () =>
    assert.ok(swTemplate.includes('{{CACHE_NAME}}')));
  it('has {{CSS_BUNDLE}} placeholder', () =>
    assert.ok(swTemplate.includes('{{CSS_BUNDLE}}')));
  it('has {{JS_BUNDLE}} placeholder', () =>
    assert.ok(swTemplate.includes('{{JS_BUNDLE}}')));
  it('has no /dist/ prefixed paths', () =>
    assert.ok(!swTemplate.includes('/dist/')));
});
