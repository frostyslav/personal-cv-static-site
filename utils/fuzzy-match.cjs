/**
 * CJS wrapper for fuzzy-match.js — used by Node tests (which run as CJS).
 * The canonical source is utils/fuzzy-match.js (ESM).
 * This file exists solely because Node's --test runner uses CJS by default
 * and cannot directly import the ESM module. Do not edit the matching logic
 * here; update fuzzy-match.js instead.
 */
const fs = require('fs');
const path = require('path');

// Read the ESM source and evaluate it in a CJS-compatible way
const src = fs.readFileSync(path.join(__dirname, 'fuzzy-match.js'), 'utf8');
const cleaned = src
  .replace(/^export\s+const\s+/gm, 'const ')
  .replace(/^export\s+function\s+/gm, 'function ')
  .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');

const mod = {};
const fn = new Function(
  'module',
  'exports',
  cleaned + '\nmodule.exports = { ALIASES, fuzzyMatch };'
);
fn(mod, (mod.exports = {}));

module.exports = mod.exports;
