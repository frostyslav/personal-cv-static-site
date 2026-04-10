/**
 * Smoke tests — verify the build produces valid, complete output.
 * Run with: npm test
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
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

// --- Build succeeds ---
console.log('\n🔨 Build');
try {
  execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  assert(true, 'build completes without errors');
} catch (e) {
  assert(false, 'build completes without errors');
  console.error(e.stderr?.toString());
}

// --- Required files exist ---
console.log('\n📁 Required files in dist/');
const requiredExact = [
  'index.html',
  'sw.js',
  'favicon.svg',
  'vendor/fontawesome/css/all.min.css',
];

for (const file of requiredExact) {
  assert(fs.existsSync(path.join(DIST, file)), `${file} exists`);
}

// Fingerprinted assets — find by pattern
const distFiles = fs.readdirSync(DIST);
const cssBundle = distFiles.find(f => /^styles\.min\.[a-f0-9]+\.css$/.test(f));
const jsBundle = distFiles.find(f => /^scripts\.min\.[a-f0-9]+\.js$/.test(f));
assert(
  cssBundle,
  `fingerprinted CSS bundle exists (${cssBundle || 'not found'})`
);
assert(jsBundle, `fingerprinted JS bundle exists (${jsBundle || 'not found'})`);

// --- HTML content checks ---
console.log('\n📄 HTML content');
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

assert(
  html.includes('<!doctype html>') || html.includes('<!DOCTYPE html>'),
  'has doctype'
);
assert(html.includes('<html lang="en">'), 'has lang attribute');
assert(html.includes('<meta charset="'), 'has charset meta');
assert(html.includes('<meta name="viewport"'), 'has viewport meta');
assert(html.includes('skip-to-content'), 'has skip-to-content link');
assert(html.includes('schema.org'), 'has structured data');
assert(html.includes('<main'), 'has main landmark');
assert(html.includes('<aside'), 'has aside landmark');
assert(html.includes('<nav'), 'has nav landmark');
assert(
  /styles\.min\.[a-f0-9]+\.css/.test(html),
  'references fingerprinted CSS bundle'
);
assert(
  /scripts\.min\.[a-f0-9]+\.js/.test(html),
  'references fingerprinted JS bundle'
);
assert(html.includes('sw.js'), 'references service worker');
assert(html.includes('<noscript>'), 'has noscript fallback');
assert(html.includes('print-modal'), 'has print modal');

// --- Sections present ---
console.log('\n📑 Sections');
const sections = [
  'about',
  'qualifications',
  'experience',
  'education',
  'skills',
  'certifications',
];
for (const id of sections) {
  assert(html.includes(`id="${id}"`), `section #${id} present`);
}

// --- HTML validation ---
console.log('\n🔍 HTML validation');
try {
  execSync('npx html-validate dist/index.html', {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  });
  assert(true, 'html-validate passes with no errors');
} catch (e) {
  const output = e.stdout?.toString() || '';
  // Warnings are OK, only fail on actual errors
  if (output.includes('0 errors')) {
    assert(true, 'html-validate passes with no errors (has warnings)');
  } else {
    assert(false, 'html-validate passes with no errors');
    console.error('    ' + output.split('\n').slice(0, 10).join('\n    '));
  }
}

// --- CSS bundle not empty ---
console.log('\n🎨 CSS bundle');
const css = fs.readFileSync(path.join(DIST, cssBundle), 'utf8');
assert(css.length > 500, `CSS bundle is non-trivial (${css.length} chars)`);
assert(css.includes('--primary-color'), 'CSS has custom properties');

// --- JS bundle not empty ---
console.log('\n⚡ JS bundle');
const js = fs.readFileSync(path.join(DIST, jsBundle), 'utf8');
assert(js.length > 500, `JS bundle is non-trivial (${js.length} chars)`);

// --- Fingerprinting & cache busting ---
console.log('\n🔑 Asset fingerprinting');
const sw = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
assert(
  !sw.includes('{{CACHE_NAME}}'),
  'sw.js has no unresolved template placeholders'
);
assert(!sw.includes('{{CSS_BUNDLE}}'), 'sw.js CSS placeholder was replaced');
assert(!sw.includes('{{JS_BUNDLE}}'), 'sw.js JS placeholder was replaced');
assert(
  /styles\.min\.[a-f0-9]+\.css/.test(sw),
  'sw.js references fingerprinted CSS'
);
assert(
  /scripts\.min\.[a-f0-9]+\.js/.test(sw),
  'sw.js references fingerprinted JS'
);
assert(/cv-cache-[a-f0-9]{8}/.test(sw), 'sw.js has content-hashed cache name');
// --- Summary ---
console.log(
  `\n${passes + failures} tests, ${passes} passed, ${failures} failed\n`
);
process.exit(failures > 0 ? 1 : 0);
