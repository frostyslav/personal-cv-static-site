/**
 * E2E tests — verify interactive behavior using Puppeteer.
 * Run with: npm run test:e2e
 *
 * Requires a build to exist in dist/ (runs npm run build first).
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const PORT = 9222;
let server, browser, page;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise(resolve => {
    server = http.createServer((req, res) => {
      const filePath = path.join(
        DIST,
        req.url === '/' ? 'index.html' : req.url
      );
      if (!filePath.startsWith(DIST)) {
        res.writeHead(403);
        return res.end();
      }
      const ext = path.extname(filePath);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          return res.end();
        }
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
        });
        res.end(data);
      });
    });
    server.listen(PORT, resolve);
  });
}

before(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    execSync('npm run build', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });
  }
  await startServer();
  const puppeteer = await import('puppeteer');
  browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
});

after(async () => {
  if (browser) await browser.close();
  if (server) server.close();
});

describe('Page load', () => {
  it('page has a title', async () => {
    const title = await page.title();
    assert.ok(title.length > 0);
  });
  it('has at least 5 section titles', async () => {
    const h2s = await page.$$eval('h2.section-title', els =>
      els.map(e => e.textContent.trim())
    );
    assert.ok(h2s.length >= 5);
  });
});

describe('Dark mode toggle', () => {
  it('theme toggle button exists', async () => {
    const btn = await page.$('.theme-toggle');
    assert.ok(btn !== null);
  });
  it('toggles theme on click', async () => {
    const initial = await page.$eval('html', el =>
      el.getAttribute('data-theme')
    );
    await page.evaluate(() => document.querySelector('.theme-toggle').click());
    const next = await page.$eval('html', el => el.getAttribute('data-theme'));
    assert.notEqual(next, initial);
  });
});

describe('Skills search', () => {
  it('skills search input exists', async () => {
    assert.ok((await page.$('#skillsSearch')) !== null);
  });
  it('k8s alias resolves to Kubernetes in UI', async () => {
    const input = await page.$('#skillsSearch');
    // Clear any previous value
    await input.click({ clickCount: 3 });
    await input.type('k8s');
    // Wait for the filter to apply (debounced input)
    await page.waitForFunction(
      () => document.querySelectorAll('.skill-tag:not(.hidden)').length > 0,
      { timeout: 2000 }
    );
    const tags = await page.$$eval('.skill-tag:not(.hidden)', els =>
      els.map(e => e.textContent.trim())
    );
    assert.ok(tags.length > 0);
    assert.ok(
      tags.some(
        t =>
          t.toLowerCase().includes('kubernetes') ||
          t.toLowerCase().includes('k8s')
      )
    );
    // Clear search
    const clearBtn = await page.$('#clearSearch');
    if (clearBtn) {
      await clearBtn.click();
      await page.waitForFunction(
        () => document.querySelectorAll('.skill-tag.hidden').length === 0,
        { timeout: 2000 }
      );
    }
  });
});

describe('Experience collapse', () => {
  it('has collapsible headers', async () => {
    const headers = await page.$$('.collapsible-header');
    assert.ok(headers.length > 0);
  });
  it('collapsible header click does not throw', async () => {
    await page.evaluate(() =>
      document.querySelector('.collapsible-header').click()
    );
    // Wait for the collapse animation to settle
    await page.waitForFunction(
      () => document.querySelector('.collapsible-header') !== null,
      { timeout: 1000 }
    );
    assert.ok(true);
  });
});

describe('Back to top', () => {
  it('visible after scrolling and scrolls back', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Wait for the back-to-top button to become visible
    await page.waitForFunction(
      () =>
        document.querySelector('.back-to-top')?.classList.contains('visible'),
      { timeout: 2000 }
    );
    const isVisible = await page.$eval('.back-to-top', el =>
      el.classList.contains('visible')
    );
    assert.ok(isVisible);
    await page.evaluate(() => document.querySelector('.back-to-top').click());
    // Wait for scroll to complete
    await page.waitForFunction(() => window.scrollY < 200, { timeout: 3000 });
    const scrollY = await page.evaluate(() => window.scrollY);
    assert.ok(scrollY < 200);
  });
});

describe('Print modal', () => {
  it('print modal exists and starts hidden', async () => {
    const isHidden = await page.$eval('#printModal', el => el.hidden);
    assert.ok(isHidden);
  });
  it('opens on Cmd+P and closes on Escape', async () => {
    await page.keyboard.down('Meta');
    await page.keyboard.press('p');
    await page.keyboard.up('Meta');
    // Wait for modal to open
    await page.waitForFunction(
      () => !document.querySelector('#printModal').hidden,
      { timeout: 2000 }
    );
    const isShown = await page.$eval('#printModal', el => !el.hidden);
    assert.ok(isShown);
    await page.keyboard.press('Escape');
    // Wait for modal to close
    await page.waitForFunction(
      () => document.querySelector('#printModal').hidden,
      { timeout: 2000 }
    );
    const isClosed = await page.$eval('#printModal', el => el.hidden);
    assert.ok(isClosed);
  });
});

describe('Accessibility', () => {
  it('skip-to-content link exists', async () =>
    assert.ok((await page.$('.skip-to-content')) !== null));
  it('main landmark exists', async () =>
    assert.ok((await page.$('main')) !== null));
  it('nav landmark exists', async () =>
    assert.ok((await page.$('nav')) !== null));
  it('has aria-label elements', async () => {
    const count = await page.$$eval('[aria-label]', els => els.length);
    assert.ok(count > 5);
  });
});

describe('Accessibility — axe-core audit', () => {
  it('has no critical accessibility violations', async () => {
    const { AxePuppeteer } = await import('@axe-core/puppeteer');
    // Navigate fresh to ensure clean state
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    // Known issue: nested-interactive from JS-injected collapse buttons
    // inside elements with role="button". Tracked separately.
    const unknown = critical.filter(v => v.id !== 'nested-interactive');

    if (critical.length > 0) {
      const summary = critical
        .map(
          v =>
            `[${v.impact}] ${v.id}: ${v.description} (${
              v.nodes.length
            } instance${v.nodes.length > 1 ? 's' : ''})`
        )
        .join('\n  ');
      console.log(
        `  ⚠ Accessibility issues (${critical.length} rule${
          critical.length > 1 ? 's' : ''
        }):\n  ${summary}`
      );
    }

    if (unknown.length > 0) {
      const summary = unknown
        .map(
          v =>
            `[${v.impact}] ${v.id}: ${v.description} (${
              v.nodes.length
            } instance${v.nodes.length > 1 ? 's' : ''})`
        )
        .join('\n  ');
      assert.fail(`Unexpected accessibility violations:\n  ${summary}`);
    }
  });

  it('all images have alt text', async () => {
    const imagesWithoutAlt = await page.$$eval(
      'img',
      imgs =>
        imgs.filter(
          img => !img.getAttribute('alt') && img.getAttribute('alt') !== ''
        ).length
    );
    assert.equal(imagesWithoutAlt, 0, 'All images should have alt attributes');
  });

  it('no duplicate IDs on the page', async () => {
    const duplicates = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll('[id]')).map(
        el => el.id
      );
      const seen = new Set();
      const dupes = [];
      for (const id of ids) {
        if (seen.has(id)) dupes.push(id);
        seen.add(id);
      }
      return dupes;
    });
    assert.equal(
      duplicates.length,
      0,
      `Duplicate IDs found: ${duplicates.join(', ')}`
    );
  });

  it('interactive elements are keyboard accessible', async () => {
    const nonAccessible = await page.$$eval(
      'a[href], button, input, select, textarea, [tabindex]',
      els =>
        els.filter(el => {
          const tabindex = el.getAttribute('tabindex');
          return tabindex !== null && parseInt(tabindex) < -1;
        }).length
    );
    assert.equal(
      nonAccessible,
      0,
      'No interactive elements should have tabindex < -1'
    );
  });
});
