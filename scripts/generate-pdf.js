/**
 * Generate PDF versions of the CV using Puppeteer.
 * Serves the built dist/ folder locally, then prints to PDF
 * with print media emulation (same as browser Ctrl+P).
 *
 * Output:
 *   dist/files/CV_<Name>.pdf    (English)
 *   dist/files/CV_<Name>_DE.pdf (German)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUTPUT_DIR = path.join(DIST, 'files');
const PORT = 9333;

const dataRoot = process.env.CV_DATA_DIR || path.join(ROOT, 'data');
const sidebar = yaml.load(
  fs.readFileSync(path.join(dataRoot, 'en', 'sidebar.yaml'), 'utf8')
);
const fullName = sidebar.profile.name.replace(/\s+/g, '_');

const PAGES = [
  { url: '/', output: `CV_${fullName}.pdf` },
  { url: '/de/', output: `CV_${fullName}_DE.pdf` },
];

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.webp': 'image/webp',
};

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      // Serve index.html for directory paths
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.join(DIST, urlPath);
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
    server.listen(PORT, () => resolve(server));
  });
}

async function generatePdf() {
  const server = await startServer();

  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    for (const { url, output } of PAGES) {
      const outputFile = path.join(OUTPUT_DIR, output);
      const page = await browser.newPage();

      // Emulate print media to trigger @media print styles
      await page.emulateMediaType('print');

      await page.goto(`http://localhost:${PORT}${url}`, {
        waitUntil: 'networkidle0',
      });

      await page.pdf({
        path: outputFile,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await page.close();
      console.log(
        `✓ PDF generated: ${path.relative(process.cwd(), outputFile)}`
      );
    }

    await browser.close();
  } finally {
    server.close();
  }
}

generatePdf().catch(err => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
