/**
 * Extract critical CSS from base.css and inject it into the template.
 *
 * Reads css/base.css, extracts the above-the-fold critical styles
 * (reset, custom properties, layout, sidebar, section titles, profile,
 * accessibility helpers, and responsive overrides), minifies them,
 * and replaces the <style> block in templates/index.hbs.
 *
 * Run with: node scripts/extract-critical-css.js
 * Called automatically during build (before build-html.js).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const TEMPLATE_PATH = path.join(ROOT, 'templates', 'index.hbs');
const CSS_DIR = path.join(ROOT, 'css');

/**
 * Selectors/blocks considered critical for first paint.
 * These are extracted from the full CSS sources.
 */
const CRITICAL_SELECTORS = [
  // Reset
  /^\*\s*\{/,
  // :root custom properties (light + dark definitions)
  /^:root\s*\{/,
  // Dark theme overrides
  /^\[data-theme=['"]dark['"]\]\s*\{/,
  // prefers-color-scheme dark media query
  /^@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/,
  // Body
  /^body\s*\{/,
  // Layout
  /^\.container\s*\{/,
  /^\.sidebar\s*\{/,
  /^\.content\s*\{/,
  // Sections
  /^\.section\s*\{/,
  /^\.section-title\s*\{/,
  /^\.section-title::after\s*\{/,
  // Profile
  /^\.profile\s*\{/,
  /^\.avatar\s*\{/,
  /^\.avatar\s+img\s*\{/,
  /^\.name\s*\{/,
  // Accessibility
  /^\.sr-only\s*\{/,
  /^\.skip-to-content\s*\{/,
  /^\.skip-to-content:focus\s*\{/,
];

/**
 * Critical responsive breakpoints (max-width: 1024px and 768px for layout).
 */
const CRITICAL_MEDIA_QUERIES = [
  { query: '(max-width: 1024px)', selectors: [/\.sidebar/, /\.content/] },
  { query: '(max-width: 768px)', selectors: [/\.sidebar/, /\.content/] },
];

/**
 * Parse a CSS file into rule blocks (selector + body).
 * Handles nested braces (media queries).
 */
function parseRules(cssContent) {
  const rules = [];
  let i = 0;
  const len = cssContent.length;

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(cssContent[i])) i++;
    if (i >= len) break;

    // Skip comments
    if (cssContent[i] === '/' && cssContent[i + 1] === '*') {
      const end = cssContent.indexOf('*/', i + 2);
      i = end === -1 ? len : end + 2;
      continue;
    }

    // Read selector/at-rule
    const start = i;
    let braceCount = 0;
    let foundOpen = false;

    while (i < len) {
      if (cssContent[i] === '{') {
        braceCount++;
        foundOpen = true;
      } else if (cssContent[i] === '}') {
        braceCount--;
        if (foundOpen && braceCount === 0) {
          i++;
          break;
        }
      }
      i++;
    }

    if (foundOpen) {
      const block = cssContent.slice(start, i).trim();
      const selectorEnd = block.indexOf('{');
      const selector = block.slice(0, selectorEnd).trim();
      const body = block.slice(selectorEnd);
      rules.push({ selector, body, full: block });
    }
  }

  return rules;
}

/**
 * Extract critical rules from parsed CSS.
 */
function extractCritical(rules) {
  const critical = [];

  for (const rule of rules) {
    // Check if this rule matches any critical selector
    const isCritical = CRITICAL_SELECTORS.some(pattern =>
      pattern.test(rule.selector)
    );

    if (isCritical) {
      critical.push(rule.full);
    }
  }

  return critical;
}

/**
 * Extract critical rules from responsive.css media queries.
 */
function extractCriticalMedia(responsiveCss) {
  const rules = parseRules(responsiveCss);
  const mediaBlocks = [];

  for (const rule of rules) {
    if (!rule.selector.startsWith('@media')) continue;

    for (const mq of CRITICAL_MEDIA_QUERIES) {
      if (rule.selector.includes(mq.query)) {
        // Parse inner rules of this media query
        const innerStart = rule.full.indexOf('{') + 1;
        const innerEnd = rule.full.lastIndexOf('}');
        const innerCss = rule.full.slice(innerStart, innerEnd);
        const innerRules = parseRules(innerCss);

        const criticalInner = innerRules.filter(inner =>
          mq.selectors.some(sel => sel.test(inner.selector))
        );

        if (criticalInner.length > 0) {
          const innerBlock = criticalInner.map(r => r.full).join('');
          mediaBlocks.push(`@media${mq.query}{${innerBlock}}`);
        }
      }
    }
  }

  return mediaBlocks;
}

/**
 * Minify CSS by removing comments, extra whitespace, and newlines.
 */
function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove space around punctuation
    .replace(/;}/g, '}') // Remove last semicolons
    .trim();
}

/**
 * Main: extract critical CSS and inject into template.
 */
function main() {
  // Read CSS source files
  const baseCss = fs.readFileSync(path.join(CSS_DIR, 'base.css'), 'utf8');
  const responsiveCss = fs.readFileSync(
    path.join(CSS_DIR, 'responsive.css'),
    'utf8'
  );

  // Parse and extract critical rules
  const baseRules = parseRules(baseCss);
  const criticalRules = extractCritical(baseRules);
  const criticalMedia = extractCriticalMedia(responsiveCss);

  // Combine and minify
  const combined = [...criticalRules, ...criticalMedia].join('\n');
  const minified = minify(combined);

  // Read template and replace the <style> block
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  const styleStart = template.indexOf('<style>');
  const styleEnd = template.indexOf('</style>') + '</style>'.length;

  if (styleStart === -1 || styleEnd === -1) {
    console.error('✗ Could not find <style> block in template');
    process.exit(1);
  }

  const newStyleBlock = `<style>\n      /* Critical CSS — auto-extracted from source (do not edit manually) */\n      ${minified}\n    </style>`;

  template =
    template.slice(0, styleStart) + newStyleBlock + template.slice(styleEnd);

  fs.writeFileSync(TEMPLATE_PATH, template);
  console.log(
    `✓ Critical CSS extracted (${(Buffer.byteLength(minified) / 1024).toFixed(
      1
    )}KB minified)`
  );
}

main();
