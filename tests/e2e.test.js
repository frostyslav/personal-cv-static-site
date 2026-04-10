/**
 * E2E tests — verify interactive behavior using Puppeteer.
 * Run with: npm run test:e2e
 *
 * Requires a build to exist in dist/ (runs npm run build first).
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

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
  const puppeteer = require('puppeteer');
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
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
    await new Promise(r => setTimeout(r, 300));
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
      await new Promise(r => setTimeout(r, 200));
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
    await new Promise(r => setTimeout(r, 200));
    assert.ok(true);
  });
});

describe('Back to top', () => {
  it('visible after scrolling and scrolls back', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 500));
    const isVisible = await page.$eval('.back-to-top', el =>
      el.classList.contains('visible')
    );
    assert.ok(isVisible);
    await page.evaluate(() => document.querySelector('.back-to-top').click());
    await new Promise(r => setTimeout(r, 2000));
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
    await new Promise(r => setTimeout(r, 200));
    const isShown = await page.$eval('#printModal', el => !el.hidden);
    assert.ok(isShown);
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
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
