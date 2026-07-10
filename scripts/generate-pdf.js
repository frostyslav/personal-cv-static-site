/**
 * Generate a PDF version of the CV using Puppeteer.
 * Serves the built dist/ folder locally, then prints to PDF
 * with print media emulation (same as browser Ctrl+P).
 *
 * Output: dist/files/CV_Rostyslav_Fridman.pdf
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const OUTPUT_DIR = path.join(DIST, 'files');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'CV_Rostyslav_Fridman.pdf');
const PORT = 9333;

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
      const urlPath = req.url.split('?')[0];
      const filePath = path.join(
        DIST,
        urlPath === '/' ? 'index.html' : urlPath
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
    const page = await browser.newPage();

    // Emulate print media to trigger @media print styles
    await page.emulateMediaType('print');

    await page.goto(`http://localhost:${PORT}`, {
      waitUntil: 'networkidle0',
    });

    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    await page.pdf({
      path: OUTPUT_FILE,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    await browser.close();
    console.log(
      `✓ PDF generated: ${path.relative(process.cwd(), OUTPUT_FILE)}`
    );
  } finally {
    server.close();
  }
}

generatePdf().catch(err => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
