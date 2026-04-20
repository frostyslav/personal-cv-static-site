/**
 * Subset FontAwesome CSS — strips icon definitions not used by the project.
 * Keeps: base styles, @font-face declarations, animation utilities,
 * and only the .fa-* icon rules that are actually referenced.
 *
 * Run after assets are copied to dist:
 *   node scripts/subset-fa-css.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FA_CSS_SRC = path.join(ROOT, 'vendor/fontawesome/css/all.min.css');
const FA_CSS_DIST = path.join(ROOT, 'dist/vendor/fontawesome/css/all.min.css');

// Directories to scan for icon usage
const SCAN_PATHS = ['templates', 'scripts', 'data', 'css'];

/**
 * Recursively get all scannable files.
 */
function getFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'vendor'].includes(entry.name))
        continue;
      results.push(...getFiles(full));
    } else if (/\.(js|hbs|yaml|yml|html|css)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Scan source files for all fa-* class names used.
 */
function scanUsedIcons() {
  const icons = new Set();
  const pattern = /fa-([a-z][a-z0-9-]*)/g;

  for (const scanPath of SCAN_PATHS) {
    const fullPath = path.join(ROOT, scanPath);
    if (!fs.existsSync(fullPath)) continue;
    const files = getFiles(fullPath);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = pattern.exec(content)) !== null) {
        icons.add(match[1]);
      }
    }
  }

  return icons;
}

/**
 * Parse the FA CSS into logical blocks and filter to only used icons.
 */
function subsetCSS(cssContent, usedIcons) {
  const lines = cssContent.split('\n');
  const output = [];
  let i = 0;

  // Track which icon definitions we've seen to identify the icon block
  const iconDefPattern = /^\.fa-([a-z][a-z0-9-]+)/;

  while (i < lines.length) {
    const line = lines[i];

    // Detect icon definition blocks: .fa-icon-name { --fa: '\xxxx'; }
    // or multi-selector blocks: .fa-icon-a,\n.fa-icon-b { --fa: '\xxxx'; }
    const iconMatch = line.match(iconDefPattern);
    if (iconMatch && !isStructuralRule(line)) {
      // Collect the full rule (selectors + body)
      const block = collectBlock(lines, i);

      // Check if any selector in this block matches a used icon
      const selectors = extractIconNames(block.text);
      const isUsed = selectors.some(name => usedIcons.has(name));

      if (isUsed) {
        output.push(block.text);
      }

      i = block.endLine + 1;
      continue;
    }

    // Keep all non-icon lines (base styles, @font-face, utilities, etc.)
    output.push(line);
    i++;
  }

  return output.join('\n');
}

/**
 * Check if a line starting with .fa- is a structural rule (not an icon def).
 * Structural rules: .fa-solid, .fa-brands, .fa-regular, .fa-classic, etc.
 */
function isStructuralRule(line) {
  return /^\.(fa-solid|fa-brands|fa-regular|fa-classic|fa-fw|fa-width|fa-pull|fa-border|fa-spin|fa-pulse|fa-rotate|fa-flip|fa-stack|fa-inverse|fa-sr-only|fa-screen-reader|fa-[0-9]|fa-2?xs|fa-sm|fa-lg|fa-xl|fa-2xl)/.test(
    line
  );
}

/**
 * Collect a CSS rule block starting at line index.
 * Handles multi-line selectors and the rule body.
 */
function collectBlock(lines, startLine) {
  let text = '';
  let braceCount = 0;
  let foundOpen = false;
  let i = startLine;

  while (i < lines.length) {
    text += (text ? '\n' : '') + lines[i];

    for (const ch of lines[i]) {
      if (ch === '{') {
        braceCount++;
        foundOpen = true;
      }
      if (ch === '}') braceCount--;
    }

    if (foundOpen && braceCount === 0) {
      return { text, endLine: i };
    }
    i++;
  }

  return { text, endLine: i - 1 };
}

/**
 * Extract icon names from a CSS block's selectors.
 */
function extractIconNames(blockText) {
  const names = [];
  const pattern = /\.fa-([a-z][a-z0-9-]+)/g;
  let match;
  while ((match = pattern.exec(blockText)) !== null) {
    const name = match[1];
    if (!isStructuralClassName(name)) {
      names.push(name);
    }
  }
  return names;
}

function isStructuralClassName(name) {
  return /^(solid|brands|regular|classic|fw|width-|pull-|border|spin|pulse|rotate-|flip-|stack|inverse|sr-only|screen-reader|[0-9]|2?xs|sm|lg|xl|2xl)/.test(
    name
  );
}

// --- Main ---

function main() {
  const usedIcons = scanUsedIcons();
  console.log(`  FA CSS subset: ${usedIcons.size} icon names found in source`);

  const cssContent = fs.readFileSync(FA_CSS_SRC, 'utf8');
  const originalSize = Buffer.byteLength(cssContent);

  const subsetted = subsetCSS(cssContent, usedIcons);
  const newSize = Buffer.byteLength(subsetted);

  fs.writeFileSync(FA_CSS_DIST, subsetted);

  const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
  console.log(
    `  FA CSS: ${(originalSize / 1024).toFixed(1)}KB -> ${(
      newSize / 1024
    ).toFixed(1)}KB (${savings}% smaller)`
  );
}

main();
