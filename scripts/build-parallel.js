/**
 * Parallel build orchestrator — runs HTML, CSS, JS, and asset copy
 * concurrently, then fingerprints the output.
 *
 * Replaces the sequential `npm run build:html && build:css && ...` pipeline.
 * Run with: node scripts/build-parallel.js
 *
 * Environment:
 *   SOURCEMAPS=1  — keep source maps in dist (default: removed for production)
 */
import { exec, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const KEEP_SOURCEMAPS = process.env.SOURCEMAPS === '1';

/**
 * Run a shell command asynchronously and return a promise.
 * Used for phase 1 tasks that can execute in true parallel.
 */
function runAsync(label, command) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    exec(command, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }, err => {
      const elapsed = Date.now() - start;
      if (err) {
        console.error(`  ✗ ${label} failed (${elapsed}ms): ${err.message}`);
        return reject(err);
      }
      console.log(`  ✓ ${label} (${elapsed}ms)`);
      resolve(elapsed);
    });
  });
}

/**
 * Run a shell command synchronously.
 * Used for phase 2 tasks that depend on phase 1 output.
 */
function runSync(label, command) {
  const start = Date.now();
  execSync(command, { cwd: ROOT, stdio: 'pipe' });
  const elapsed = Date.now() - start;
  console.log(`  ✓ ${label} (${elapsed}ms)`);
  return elapsed;
}

async function build() {
  const totalStart = Date.now();
  console.log('Building in parallel…\n');

  // Phase 1: HTML, CSS, JS, and assets run concurrently
  await Promise.all([
    runAsync(
      'HTML',
      'node scripts/extract-critical-css.js && node scripts/build-html.js && npx prettier --write dist/index.html'
    ),
    runAsync(
      'CSS',
      'npx lightningcss --bundle --minify css/main.css -o dist/styles.min.css'
    ),
    runAsync(
      'JS',
      'npx esbuild scripts/main.js --bundle --minify --outfile=dist/scripts.min.js && npx esbuild scripts/sw-register.js --minify --outfile=dist/sw-register.js'
    ),
    runAsync(
      'Assets',
      [
        // Copy only what's needed (no full vendor tree)
        'cp assets/favicon.svg assets/robots.txt assets/sitemap.xml dist/',
        'mkdir -p dist/vendor/fontawesome/css dist/vendor/fontawesome/webfonts',
        'cp vendor/fontawesome/css/all.min.css dist/vendor/fontawesome/css/',
        'cp vendor/fontawesome/webfonts/fa-solid-900.woff2 dist/vendor/fontawesome/webfonts/',
        'cp vendor/fontawesome/webfonts/fa-brands-400.woff2 dist/vendor/fontawesome/webfonts/',
        'npx svgo dist/favicon.svg --config svgo.config.cjs --quiet',
      ].join(' && ')
    ),
  ]);

  // Phase 2: Post-processing (sequential — depends on phase 1 output)
  runSync('FA CSS subset', 'node scripts/subset-fa-css.js');
  runSync('Fingerprint', 'node scripts/fingerprint.js');

  // Phase 3: Remove source maps unless explicitly requested
  if (!KEEP_SOURCEMAPS) {
    const maps = fs.readdirSync(DIST).filter(f => f.endsWith('.map'));
    maps.forEach(f => fs.unlinkSync(path.join(DIST, f)));
    if (maps.length) {
      console.log(`  ✓ Removed ${maps.length} source map(s)`);
    }
  }

  const total = Date.now() - totalStart;
  console.log(`\n✓ Build complete in ${total}ms`);
}

build().catch(err => {
  console.error('✗ Build failed:', err.message);
  process.exit(1);
});
