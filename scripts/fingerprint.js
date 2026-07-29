/**
 * Asset fingerprinting — renames CSS/JS bundles with content hashes,
 * generates sw.js from template, and rewrites references in index.html.
 *
 * Run after the full build: node scripts/fingerprint.js
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/** Number of hex characters to keep from SHA-256 digests (32 bits of entropy). */
const HASH_LENGTH = 8;

const ASSETS_TO_FINGERPRINT = [
  { original: 'styles.min.css', pattern: /styles\.min\.css/g },
  { original: 'scripts.min.js', pattern: /scripts\.min\.js/g },
];

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, HASH_LENGTH);
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

    // Rename associated source map if it exists
    const mapPath = filePath + '.map';
    if (fs.existsSync(mapPath)) {
      fs.renameSync(mapPath, path.join(DIST, fingerprinted + '.map'));
      console.log(`  ${asset.original}.map → ${fingerprinted}.map`);
    }
  }

  // Rewrite references in all HTML files (root and locale subdirectories)
  const htmlFiles = [path.join(DIST, 'index.html')];

  // Find locale subdirectory HTML files
  for (const entry of fs.readdirSync(DIST, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const localeHtml = path.join(DIST, entry.name, 'index.html');
      if (fs.existsSync(localeHtml)) {
        htmlFiles.push(localeHtml);
      }
    }
  }

  for (const htmlFile of htmlFiles) {
    let html = fs.readFileSync(htmlFile, 'utf8');
    for (const asset of ASSETS_TO_FINGERPRINT) {
      // Match both /styles.min.css and styles.min.css (absolute or relative)
      const absPattern = new RegExp(
        `/${asset.original.replace('.', '\\.')}`,
        'g'
      );
      html = html.replace(absPattern, `/${manifest[asset.original]}`);
    }
    fs.writeFileSync(htmlFile, html);
  }

  // Generate sw.js from template with actual fingerprinted values
  const cacheHash = crypto
    .createHash('sha256')
    .update(Object.values(manifest).sort().join(','))
    .digest('hex')
    .slice(0, HASH_LENGTH);

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
