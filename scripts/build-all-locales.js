/**
 * Build HTML for all configured locales, then format with Prettier.
 * Reads defaultLocale and locales from data/i18n.yaml.
 */
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const i18nConfig = yaml.load(
  fs.readFileSync(path.join(ROOT, 'data', 'i18n.yaml'), 'utf8')
);
const defaultLocale = i18nConfig.defaultLocale || 'en';
const locales = i18nConfig.locales || [defaultLocale];

// Build each locale
for (const locale of locales) {
  execSync(`node scripts/build-html.js --locale ${locale}`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

// Format output HTML files
const outputFiles = locales
  .map(l => (l === defaultLocale ? 'dist/index.html' : `dist/${l}/index.html`))
  .join(' ');

execSync(`npx prettier --write ${outputFiles}`, {
  cwd: ROOT,
  stdio: 'inherit',
});
