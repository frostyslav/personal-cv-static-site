/**
 * Asset fingerprinting — renames CSS/JS bundles with content hashes,
 * generates sw.js from template, and rewrites references in index.html.
 *
 * Run after the full build: node scripts/fingerprint.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const ASSETS_TO_FINGERPRINT = [
  { original: 'styles.min.css', pattern: /styles\.min\.css/g },
  { original: 'scripts.min.js', pattern: /scripts\.min\.js/g },
];

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
}

function fingerprint() {
  const manifest = {};

  // Rename each asset with its content hash
  for (const asset of ASSETS_TO_FINGERPRINT) {
    const filePath = path.join(DIST, asset.original);
    if (!fs.existsSync(filePath)) {
      console.error(`✗ Missing asset: ${filePath}`);
      process.exit(1);
    }

    const hash = hashFile(filePath);
    const ext = path.extname(asset.original);
    const base = path.basename(asset.original, ext);
    const fingerprinted = `${base}.${hash}${ext}`;

    fs.renameSync(filePath, path.join(DIST, fingerprinted));
    manifest[asset.original] = fingerprinted;
    console.log(`  ${asset.original} → ${fingerprinted}`);
  }

  // Rewrite references in index.html
  const htmlPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  for (const asset of ASSETS_TO_FINGERPRINT) {
    html = html.replace(asset.pattern, manifest[asset.original]);
  }
  fs.writeFileSync(htmlPath, html);

  // Generate sw.js from template with actual fingerprinted values
  const cacheHash = crypto
    .createHash('sha256')
    .update(Object.values(manifest).sort().join(','))
    .digest('hex')
    .slice(0, 8);

  const swTemplate = fs.readFileSync(
    path.join(ROOT, 'templates', 'sw.template.js'),
    'utf8'
  );
  const sw = swTemplate
    .replace('{{CACHE_NAME}}', `cv-cache-${cacheHash}`)
    .replace('{{CSS_BUNDLE}}', `/${manifest['styles.min.css']}`)
    .replace('{{JS_BUNDLE}}', `/${manifest['scripts.min.js']}`);
  fs.writeFileSync(path.join(DIST, 'sw.js'), sw);

  console.log(
    `✓ Fingerprinted ${ASSETS_TO_FINGERPRINT.length} assets, cache: cv-cache-${cacheHash}`
  );
}

fingerprint();
