/**
 * E2E tests — verify interactive behavior using Puppeteer.
 * Run with: npm run test:e2e
 *
 * Requires a build to exist in dist/ (runs npm run build first).
 */
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 9222;
let server;
let browser;
let page;
let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passes++;
  } else {
    console.error(`  ✗ ${message}`);
    failures++;
  }
}

// Minimal static server
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

async function run() {
  // Ensure build exists
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.log('Building first...');
    execSync('npm run build', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });
  }

  await startServer();
  console.log(`\n🌐 E2E server on http://localhost:${PORT}`);

  const puppeteer = require('puppeteer');
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

  // --- Page loads ---
  console.log('\n📄 Page load');
  const title = await page.title();
  assert(title.length > 0, `page has a title: "${title}"`);

  const h2s = await page.$$eval('h2.section-title', els =>
    els.map(e => e.textContent.trim())
  );
  assert(h2s.length >= 5, `has ${h2s.length} section titles`);

  // --- Dark mode toggle ---
  console.log('\n🌙 Dark mode toggle');
  const themeBtn = await page.$('.theme-toggle');
  assert(themeBtn !== null, 'theme toggle button exists');

  const initialTheme = await page.$eval('html', el =>
    el.getAttribute('data-theme')
  );
  await page.evaluate(() => document.querySelector('.theme-toggle').click()); // eslint-disable-line no-undef
  await page.waitForFunction(
    // eslint-disable-next-line no-undef
    t => document.documentElement.getAttribute('data-theme') !== t,
    {},
    initialTheme
  );
  const newTheme = await page.$eval('html', el =>
    el.getAttribute('data-theme')
  );
  assert(
    newTheme !== initialTheme,
    `theme toggled from ${initialTheme} to ${newTheme}`
  );

  // --- Skills search ---
  console.log('\n🔍 Skills search');
  const searchInput = await page.$('#skillsSearch');
  assert(searchInput !== null, 'skills search input exists');

  await searchInput.type('k8s');
  // Wait for debounce
  await new Promise(r => setTimeout(r, 300));

  const visibleTags = await page.$$eval('.skill-tag:not(.hidden)', els =>
    els.map(e => e.textContent.trim())
  );
  assert(
    visibleTags.length > 0,
    `search "k8s" shows ${visibleTags.length} results`
  );
  const hasK8sMatch = visibleTags.some(
    t =>
      t.toLowerCase().includes('kubernetes') || t.toLowerCase().includes('k8s')
  );
  assert(hasK8sMatch, 'k8s alias resolves to Kubernetes in UI');

  // Clear search
  const clearBtn = await page.$('#clearSearch');
  if (clearBtn) {
    await clearBtn.click();
    await new Promise(r => setTimeout(r, 200));
  }

  // --- Experience collapse ---
  console.log('\n📂 Experience collapse');
  const collapsibleHeaders = await page.$$('.collapsible-header');
  assert(
    collapsibleHeaders.length > 0,
    `has ${collapsibleHeaders.length} collapsible headers`
  );

  // Click first company header to toggle
  if (collapsibleHeaders.length > 0) {
    // eslint-disable-next-line no-undef
    await page.evaluate(() =>
      document.querySelector('.collapsible-header').click()
    );
    await new Promise(r => setTimeout(r, 200));
    assert(true, 'collapsible header click does not throw');
  }

  // --- Back to top ---
  console.log('\n⬆️  Back to top');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); // eslint-disable-line no-undef
  await new Promise(r => setTimeout(r, 500));

  const backToTop = await page.$('.back-to-top');
  const isVisible = await page.$eval('.back-to-top', el =>
    el.classList.contains('visible')
  );
  assert(
    backToTop !== null && isVisible,
    'back-to-top visible after scrolling'
  );

  await page.evaluate(() => document.querySelector('.back-to-top').click()); // eslint-disable-line no-undef
  await new Promise(r => setTimeout(r, 2000));
  const scrollY = await page.evaluate(() => window.scrollY); // eslint-disable-line no-undef
  assert(scrollY < 200, `scrolled back to top (scrollY=${scrollY})`);

  // --- Print modal ---
  console.log('\n🖨️  Print modal');
  const modal = await page.$('#printModal');
  assert(modal !== null, 'print modal exists in DOM');

  const isHidden = await page.$eval('#printModal', el => el.hidden);
  assert(isHidden, 'print modal starts hidden');

  // Trigger Ctrl+P
  await page.keyboard.down('Meta');
  await page.keyboard.press('p');
  await page.keyboard.up('Meta');
  await new Promise(r => setTimeout(r, 200));

  const isShown = await page.$eval('#printModal', el => !el.hidden);
  assert(isShown, 'print modal opens on Cmd+P');

  // Close with Escape
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 200));
  const isClosed = await page.$eval('#printModal', el => el.hidden);
  assert(isClosed, 'print modal closes on Escape');

  // --- Accessibility basics ---
  console.log('\n♿ Accessibility');
  const skipLink = await page.$('.skip-to-content');
  assert(skipLink !== null, 'skip-to-content link exists');

  const mainLandmark = await page.$('main');
  assert(mainLandmark !== null, 'main landmark exists');

  const navLandmark = await page.$('nav');
  assert(navLandmark !== null, 'nav landmark exists');

  const ariaLabels = await page.$$eval('[aria-label]', els => els.length);
  assert(ariaLabels > 5, `${ariaLabels} elements have aria-label`);

  // --- Cleanup ---
  await browser.close();
  server.close();

  console.log(
    `\n${passes + failures} tests, ${passes} passed, ${failures} failed\n`
  );
  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('E2E test error:', err);
  if (browser) browser.close();
  if (server) server.close();
  process.exit(1);
});
