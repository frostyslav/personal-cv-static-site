/**
 * Unit tests — test core logic extracted from browser scripts.
 * Run with: npm run test:unit
 *
 * These tests exercise the fuzzy matching algorithm and build-html
 * validation logic without needing a browser environment.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALIASES, fuzzyMatch } from '../utils/fuzzy-match.js';
import { validate, dataSchema, isValidUrl } from '../scripts/data-schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// ─── Build validation logic (schema-based) ──────────────────────────────────
describe('data-schema — validate()', () => {
  const validData = {
    site: {
      baseUrl: 'https://example.com',
      cvPdfPath: '/files/cv.pdf',
      careerStartYear: 2007,
    },
    sidebar: {
      profile: { name: 'Test', title: 'Dev' },
      nav: [{ href: '#about', text: 'About' }],
    },
    about: { paragraphs: ['Hello'] },
    experience: {
      groups: [
        {
          company: 'Acme',
          date: '2020',
          title: 'Dev',
          positions: [{ date: '2020', title: 'Dev' }],
        },
      ],
    },
    education: { groups: [{}] },
    skills: [
      {
        title: 'Cloud',
        icon: 'fa-solid fa-cloud',
        color: 'blue',
        tags: ['AWS'],
      },
    ],
    certifications: [
      {
        group: 'AWS',
        certs: [
          {
            title: 'SA Pro',
            image: 'https://img.example.com/sa.webp',
            href: 'https://credly.com/badge',
          },
        ],
      },
    ],
  };

  it('valid data passes validation', () => {
    assert.equal(validate(validData, dataSchema).length, 0);
  });

  it('catches missing sidebar.profile.name', () => {
    const d = JSON.parse(JSON.stringify(validData));
    d.sidebar.profile.name = '';
    const errors = validate(d, dataSchema);
    assert.ok(
      errors.some(e => e.includes('profile.name') && e.includes('required'))
    );
  });

  it('catches empty about.paragraphs', () => {
    const d = JSON.parse(JSON.stringify(validData));
    d.about.paragraphs = [];
    const errors = validate(d, dataSchema);
    assert.ok(
      errors.some(e => e.includes('paragraphs') && e.includes('at least'))
    );
  });

  it('catches missing experience groups/singles', () => {
    const d = JSON.parse(JSON.stringify(validData));
    delete d.experience.groups;
    const errors = validate(d, dataSchema);
    assert.ok(errors.some(e => e.includes('experience')));
  });

  it('catches empty skills array', () => {
    const d = JSON.parse(JSON.stringify(validData));
    d.skills = [];
    const errors = validate(d, dataSchema);
    assert.ok(errors.some(e => e.includes('skills') && e.includes('at least')));
  });

  it('catches invalid URL format', () => {
    const d = JSON.parse(JSON.stringify(validData));
    d.site.baseUrl = 'not-a-url';
    const errors = validate(d, dataSchema);
    assert.ok(
      errors.some(e => e.includes('baseUrl') && e.includes('invalid URL'))
    );
  });

  it('catches missing required fields on empty data', () => {
    const errors = validate({}, dataSchema);
    assert.ok(errors.length >= 7, `Expected >= 7 errors, got ${errors.length}`);
  });

  it('experience.singles is accepted as alternative to groups', () => {
    const d = JSON.parse(JSON.stringify(validData));
    delete d.experience.groups;
    d.experience.singles = [{ company: 'X', date: '2020', title: 'Y' }];
    const errors = validate(d, dataSchema);
    assert.equal(errors.filter(e => e.includes('experience')).length, 0);
  });

  it('validates certification URLs', () => {
    const d = JSON.parse(JSON.stringify(validData));
    d.certifications[0].certs[0].href = 'javascript:alert(1)';
    const errors = validate(d, dataSchema);
    assert.ok(
      errors.some(e => e.includes('href') && e.includes('invalid URL'))
    );
  });

  it('isValidUrl accepts all safe schemes', () => {
    assert.ok(isValidUrl('https://example.com'));
    assert.ok(isValidUrl('http://example.com'));
    assert.ok(isValidUrl('mailto:a@b.com'));
    assert.ok(isValidUrl('tel:+123'));
    assert.ok(isValidUrl('#section'));
    assert.ok(isValidUrl('/path'));
  });

  it('isValidUrl rejects dangerous schemes', () => {
    assert.ok(!isValidUrl('javascript:alert(1)'));
    assert.ok(!isValidUrl('data:text/html,x'));
    assert.ok(!isValidUrl(''));
    assert.ok(!isValidUrl(null));
  });
});

// ─── Service worker template validation ─────────────────────────────────────
describe('Service worker — template', () => {
  const swTemplate = fs.readFileSync(
    path.join(__dirname, '..', 'templates', 'sw.template.js'),
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

// ─── safeUrl Handlebars helper ──────────────────────────────────────────────
describe('safeUrl helper logic', () => {
  // Replicate the safeUrl logic for unit testing without Handlebars dependency
  function safeUrl(url) {
    if (typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (
      /^https?:\/\//i.test(trimmed) ||
      /^mailto:/i.test(trimmed) ||
      /^tel:/i.test(trimmed) ||
      /^#/.test(trimmed) ||
      /^\/[^/]/.test(trimmed)
    ) {
      return trimmed;
    }
    return '';
  }

  it('allows https URLs', () =>
    assert.equal(safeUrl('https://example.com'), 'https://example.com'));
  it('allows http URLs', () =>
    assert.equal(safeUrl('http://example.com'), 'http://example.com'));
  it('allows mailto links', () =>
    assert.equal(
      safeUrl('mailto:test@example.com'),
      'mailto:test@example.com'
    ));
  it('allows tel links', () =>
    assert.equal(safeUrl('tel:+1234567890'), 'tel:+1234567890'));
  it('allows fragment links', () =>
    assert.equal(safeUrl('#section'), '#section'));
  it('allows absolute path links', () =>
    assert.equal(safeUrl('/about'), '/about'));
  it('blocks javascript: URIs', () =>
    assert.equal(safeUrl('javascript:alert(1)'), ''));
  it('blocks data: URIs', () =>
    assert.equal(safeUrl('data:text/html,<script>alert(1)</script>'), ''));
  it('blocks empty protocol', () => assert.equal(safeUrl('//evil.com'), ''));
  it('returns empty for non-string input', () =>
    assert.equal(safeUrl(undefined), ''));
  it('returns empty for null input', () => assert.equal(safeUrl(null), ''));
  it('trims whitespace', () =>
    assert.equal(safeUrl('  https://example.com  '), 'https://example.com'));
  it('blocks vbscript: URIs', () =>
    assert.equal(safeUrl('vbscript:msgbox'), ''));
  it('blocks relative protocol with no path', () =>
    assert.equal(safeUrl('//'), ''));
});
