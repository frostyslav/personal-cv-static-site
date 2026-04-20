/**
 * Parallel build orchestrator — runs HTML, CSS, JS, and asset copy
 * concurrently, then fingerprints the output.
 *
 * Replaces the sequential `npm run build:html && build:css && ...` pipeline.
 * Run with: node scripts/build-parallel.js
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function run(label, command) {
  const start = Date.now();
  execSync(command, { cwd: ROOT, stdio: 'pipe' });
  const elapsed = Date.now() - start;
  console.log(`  ✓ ${label} (${elapsed}ms)`);
  return elapsed;
}

async function build() {
  const totalStart = Date.now();
  console.log('Building in parallel…\n');

  // Phase 1: HTML, CSS, JS, and assets can all run concurrently
  await Promise.all([
    new Promise(resolve =>
      resolve(
        run(
          'HTML',
          'node scripts/build-html.js && npx prettier --write dist/index.html'
        )
      )
    ),
    new Promise(resolve =>
      resolve(
        run(
          'CSS',
          'npx lightningcss --bundle --minify --sourcemap css/main.css -o dist/styles.min.css'
        )
      )
    ),
    new Promise(resolve =>
      resolve(
        run(
          'JS',
          'npx esbuild scripts/main.js --bundle --minify --sourcemap --outfile=dist/scripts.min.js'
        )
      )
    ),
    new Promise(resolve =>
      resolve(
        run(
          'Assets',
          'cp assets/favicon.svg assets/robots.txt assets/sitemap.xml dist/ && cp -r vendor dist/'
        )
      )
    ),
  ]);

  // Phase 2: Fingerprinting must run after all assets are built
  run('Fingerprint', 'node scripts/fingerprint.js');

  const total = Date.now() - totalStart;
  console.log(`\n✓ Build complete in ${total}ms`);
}

build().catch(err => {
  console.error('✗ Build failed:', err.message);
  process.exit(1);
});
