/**
 * File watcher — rebuilds on changes to source files, then serves.
 * Uses only Node.js built-ins.
 *
 * Usage: node scripts/dev-watch.js
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WATCH_DIRS = ['css', 'scripts', 'templates', 'data'];
const DEBOUNCE_MS = 300;

let debounceTimer = null;
let building = false;

function rebuild() {
  if (building) return;
  building = true;
  console.log('\n🔄 Rebuilding...');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
    console.log('✓ Build complete');
  } catch (e) {
    console.error('✗ Build failed');
  }
  building = false;
}

function debouncedRebuild() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(rebuild, DEBOUNCE_MS);
}

// Initial build
rebuild();

// Start dev server in background
const server = spawn('node', [path.join(__dirname, 'dev-server.js')], {
  cwd: ROOT,
  stdio: 'inherit',
});

// Watch source directories
WATCH_DIRS.forEach(dir => {
  const fullPath = path.join(ROOT, dir);
  if (!fs.existsSync(fullPath)) return;

  fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    console.log(`  ↻ ${dir}/${filename} changed`);
    debouncedRebuild();
  });
});

console.log(`\n👀 Watching: ${WATCH_DIRS.join(', ')}`);
console.log('   Press Ctrl+C to stop\n');

// Clean up on exit
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  server.kill();
  process.exit(0);
});
