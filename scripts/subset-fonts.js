/**
 * Font subsetting — scans source files for FontAwesome icon usage,
 * resolves codepoints from the FA CSS, and runs pyftsubset to produce
 * minimal woff2 files containing only the glyphs actually used.
 *
 * Prerequisites: pip install fonttools brotli
 * Run with: node scripts/subset-fonts.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const FA_CSS = path.join(ROOT, 'vendor/fontawesome/css/all.min.css');
const WEBFONTS_DIR = path.join(ROOT, 'vendor/fontawesome/webfonts');

// Directories/files to scan for icon usage
const SCAN_PATHS = ['templates', 'scripts', 'data', 'css'];

// Font files and which icon families they serve
const FONTS = [
  {
    file: 'fa-solid-900.woff2',
    families: ['fa-solid', 'fas', 'fa'],
  },
  {
    file: 'fa-brands-400.woff2',
    families: ['fa-brands', 'fab'],
  },
  {
    file: 'fa-regular-400.woff2',
    families: ['fa-regular', 'far'],
  },
];

/**
 * Parse the FA CSS to build a map of icon-name -> codepoint.
 * Handles patterns like:
 *   .fa-arrow-up { --fa: '\f062'; }
 *   .fa-github-square, .fa-square-github { --fa: '\f092'; }
 */
function parseCSSCodepoints(cssContent) {
  const map = new Map();
  const lines = cssContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match lines that define --fa with a codepoint
    const cpMatch = line.match(/--fa:\s*'\\([0-9a-f]+)'/i);
    if (!cpMatch) continue;

    const codepoint = cpMatch[1];

    // Look backwards for the selector(s) — they may span multiple lines
    // Find the icon class names associated with this codepoint
    let j = i - 1;
    while (j >= 0 && !lines[j].includes('}') && !lines[j].includes('@')) {
      j--;
    }
    j++; // move past the closing brace or start

    for (let k = j; k <= i; k++) {
      const selectorLine = lines[k];
      const classMatches = selectorLine.matchAll(/\.fa-([a-z0-9-]+)/g);
      for (const m of classMatches) {
        const iconName = m[1];
        // Skip utility classes (sizes, modifiers)
        if (isUtilityClass(iconName)) continue;
        map.set(iconName, codepoint);
      }
    }
  }

  return map;
}

/**
 * Returns true for FA utility/modifier classes that aren't icons.
 */
function isUtilityClass(name) {
  return /^(solid|regular|brands|classic|[0-9]+x|2?xs|sm|lg|xl|2xl|fw|width-|pull-|border|spin|pulse|rotate-|flip-|stack|inverse|sr-only|screen-reader)/.test(
    name
  );
}

/**
 * Determine which FA family section an icon belongs to by checking
 * where it appears in the CSS relative to the brands/regular markers.
 */
function determineIconFamily(iconName, cssContent) {
  // Brand icons are defined between the .fa-brands declaration and the
  // .fa-regular declaration. We check by position in the file.
  const brandsStart = cssContent.indexOf('.fa-brands,\n.fa-classic.fa-brands,');
  const regularStart = cssContent.indexOf(
    '.fa-regular,\n.fa-classic.fa-regular,'
  );

  const iconDef = cssContent.indexOf(`.fa-${iconName}`);
  if (iconDef === -1) return 'solid'; // fallback

  if (brandsStart !== -1 && regularStart !== -1) {
    if (iconDef > brandsStart && iconDef < regularStart) return 'brands';
    if (iconDef > regularStart) return 'regular';
  } else if (brandsStart !== -1) {
    if (iconDef > brandsStart) return 'brands';
  }

  return 'solid';
}

/**
 * Scan source files for FA icon class references.
 * Returns a Set of icon names (without the fa- prefix).
 */
function scanForIcons(scanPaths) {
  const icons = new Set();
  const pattern = /fa-([a-z][a-z0-9-]*)/g;

  for (const scanPath of scanPaths) {
    const fullPath = path.join(ROOT, scanPath);
    if (!fs.existsSync(fullPath)) continue;

    const files = getFiles(fullPath);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        if (!isUtilityClass(name)) {
          icons.add(name);
        }
      }
    }
  }

  return icons;
}

/**
 * Recursively get all files in a directory.
 */
function getFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, dist, vendor
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      results.push(...getFiles(full));
    } else if (/\.(js|hbs|yaml|yml|html|css)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Run pyftsubset to create a subset font.
 */
function subsetFont(inputFile, outputFile, unicodes) {
  if (unicodes.length === 0) {
    console.log(`  - Skipping ${path.basename(inputFile)} (no icons used)`);
    return;
  }

  const unicodeArg = unicodes.map(u => `U+${u}`).join(',');
  const cmd = [
    'pyftsubset',
    `"${inputFile}"`,
    `--unicodes="${unicodeArg}"`,
    `--output-file="${outputFile}"`,
    '--flavor=woff2',
    '--layout-features=*',
    '--no-hinting',
    '--desubroutinize',
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });
}

// --- Main ---

function main() {
  console.log('Font subsetting\n');

  // Check pyftsubset is available
  try {
    execSync('pyftsubset --help', { stdio: 'pipe' });
  } catch {
    console.error(
      'Error: pyftsubset not found. Install with: pip install fonttools brotli'
    );
    process.exit(1);
  }

  // Parse FA CSS for codepoint map
  const cssContent = fs.readFileSync(FA_CSS, 'utf8');
  const codepointMap = parseCSSCodepoints(cssContent);
  console.log(`  Parsed ${codepointMap.size} icon definitions from FA CSS`);

  // Scan source files for icon usage
  const usedIcons = scanForIcons(SCAN_PATHS);
  console.log(`  Found ${usedIcons.size} unique icon names in source files`);

  // Categorize icons by font family
  const familyIcons = { solid: [], brands: [], regular: [] };

  for (const iconName of usedIcons) {
    const codepoint = codepointMap.get(iconName);
    if (!codepoint) {
      // Could be a modifier class that slipped through, or a typo
      continue;
    }

    const family = determineIconFamily(iconName, cssContent);
    familyIcons[family].push({ name: iconName, codepoint });
  }

  console.log(`\n  Solid icons: ${familyIcons.solid.length}`);
  familyIcons.solid.forEach(i =>
    console.log(`    - ${i.name} (\\${i.codepoint})`)
  );
  console.log(`  Brand icons: ${familyIcons.brands.length}`);
  familyIcons.brands.forEach(i =>
    console.log(`    - ${i.name} (\\${i.codepoint})`)
  );
  console.log(`  Regular icons: ${familyIcons.regular.length}`);
  familyIcons.regular.forEach(i =>
    console.log(`    - ${i.name} (\\${i.codepoint})`)
  );

  // Subset each font
  console.log('\n  Subsetting fonts...');

  for (const font of FONTS) {
    const familyKey = font.families[0]
      .replace('fa-', '')
      .replace('fas', 'solid')
      .replace('fab', 'brands')
      .replace('far', 'regular');
    const icons = familyIcons[familyKey] || [];
    const inputFile = path.join(WEBFONTS_DIR, font.file);
    const backupFile = inputFile + '.full';

    if (!fs.existsSync(inputFile)) {
      console.log(`  - Skipping ${font.file} (not found)`);
      continue;
    }

    if (icons.length === 0) {
      console.log(`  - Skipping ${font.file} (no icons used from this family)`);
      continue;
    }

    // Back up original if not already backed up
    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(inputFile, backupFile);
    }

    const originalSize = fs.statSync(backupFile).size;
    const unicodes = icons.map(i => i.codepoint);

    subsetFont(backupFile, inputFile, unicodes);

    const newSize = fs.statSync(inputFile).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(
      `  - ${font.file}: ${formatBytes(originalSize)} -> ${formatBytes(
        newSize
      )} (${savings}% smaller)`
    );
  }

  console.log('\n  Done. Original fonts backed up as *.woff2.full');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

main();
