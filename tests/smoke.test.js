/**
 * Smoke tests — verify the build produces valid, complete output.
 * Run with: npm test
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
let html, css, js, sw, cssBundle, jsBundle;

before(() => {
  execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });

  const distFiles = fs.readdirSync(DIST);
  cssBundle = distFiles.find(f => /^styles\.min\.[a-f0-9]+\.css$/.test(f));
  jsBundle = distFiles.find(f => /^scripts\.min\.[a-f0-9]+\.js$/.test(f));
  html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  css = cssBundle ? fs.readFileSync(path.join(DIST, cssBundle), 'utf8') : '';
  js = jsBundle ? fs.readFileSync(path.join(DIST, jsBundle), 'utf8') : '';
  sw = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
});

describe('Required files in dist/', () => {
  for (const file of [
    'index.html',
    'sw.js',
    'sw-register.js',
    'favicon.svg',
    'vendor/fontawesome/css/all.min.css',
  ]) {
    it(`${file} exists`, () => assert.ok(fs.existsSync(path.join(DIST, file))));
  }
  it('fingerprinted CSS bundle exists', () => assert.ok(cssBundle));
  it('fingerprinted JS bundle exists', () => assert.ok(jsBundle));
});

describe('HTML content', () => {
  it('has doctype', () =>
    assert.ok(
      html.includes('<!doctype html>') || html.includes('<!DOCTYPE html>')
    ));
  it('has lang attribute', () => assert.ok(html.includes('<html lang="en">')));
  it('has charset meta', () => assert.ok(html.includes('<meta charset="')));
  it('has viewport meta', () =>
    assert.ok(html.includes('<meta name="viewport"')));
  it('has skip-to-content link', () =>
    assert.ok(html.includes('skip-to-content')));
  it('has structured data', () => assert.ok(html.includes('schema.org')));
  it('has main landmark', () => assert.ok(html.includes('<main')));
  it('has aside landmark', () => assert.ok(html.includes('<aside')));
  it('has nav landmark', () => assert.ok(html.includes('<nav')));
  it('references fingerprinted CSS bundle', () =>
    assert.match(html, /styles\.min\.[a-f0-9]+\.css/));
  it('references fingerprinted JS bundle', () =>
    assert.match(html, /scripts\.min\.[a-f0-9]+\.js/));
  it('references service worker registration', () =>
    assert.ok(html.includes('sw-register.js')));
  it('has noscript fallback', () => assert.ok(html.includes('<noscript>')));
  it('has print modal', () => assert.ok(html.includes('print-modal')));
});

describe('Sections', () => {
  for (const id of [
    'about',
    'qualifications',
    'experience',
    'education',
    'skills',
    'certifications',
  ]) {
    it(`section #${id} present`, () => assert.ok(html.includes(`id="${id}"`)));
  }
});

describe('HTML validation', () => {
  it('html-validate passes with no errors', () => {
    try {
      execSync('npx html-validate dist/index.html', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
      });
    } catch (e) {
      const output = e.stdout?.toString() || '';
      if (!output.includes('0 errors')) {
        assert.fail(
          'html-validate reported errors:\n' +
            output.split('\n').slice(0, 10).join('\n')
        );
      }
    }
  });
});

describe('CSS bundle', () => {
  it('CSS bundle is non-trivial', () => assert.ok(css.length > 500));
  it('CSS has custom properties', () =>
    assert.ok(css.includes('--primary-color')));
});

describe('JS bundle', () => {
  it('JS bundle is non-trivial', () => assert.ok(js.length > 500));
});

describe('Asset fingerprinting', () => {
  it('sw.js has no unresolved template placeholders', () =>
    assert.ok(!sw.includes('{{CACHE_NAME}}')));
  it('sw.js CSS placeholder was replaced', () =>
    assert.ok(!sw.includes('{{CSS_BUNDLE}}')));
  it('sw.js JS placeholder was replaced', () =>
    assert.ok(!sw.includes('{{JS_BUNDLE}}')));
  it('sw.js references fingerprinted CSS', () =>
    assert.match(sw, /styles\.min\.[a-f0-9]+\.css/));
  it('sw.js references fingerprinted JS', () =>
    assert.match(sw, /scripts\.min\.[a-f0-9]+\.js/));
  it('sw.js has content-hashed cache name', () =>
    assert.match(sw, /cv-cache-[a-f0-9]{8}/));
});
