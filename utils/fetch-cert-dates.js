#!/usr/bin/env node

/**
 * Fetches certification issue dates from Credly badge pages.
 * Uses Puppeteer to render JS-heavy pages and extract dates.
 *
 * Usage:
 *   npx puppeteer browsers install chrome
 *   node scripts/fetch-cert-dates.js
 */

const puppeteer = require('puppeteer');

const BADGES = [
  {
    name: 'AWS Certified Generative AI Developer - Professional (Early Adopter)',
    url: 'https://www.credly.com/badges/37cfb608-4bf3-4988-97b3-37c6873d124b/public_url',
  },
  {
    name: 'AWS Certified DevOps Engineer - Professional',
    url: 'https://www.credly.com/badges/87b9bb74-1e2c-48f7-a100-dfac174dcd45/public_url',
  },
  {
    name: 'AWS Certified Solutions Architect - Professional',
    url: 'https://www.credly.com/badges/d936d48c-6dee-4f9e-96a6-ca64e6d32af1/public_url',
  },
  {
    name: 'AWS Certified Advanced Networking - Specialty',
    url: 'https://www.credly.com/badges/d4b435e0-918f-4fc1-b613-fadb126d91c2/public_url',
  },
  {
    name: 'AWS Certified Security - Specialty',
    url: 'https://www.credly.com/badges/3f3f8caf-f6f2-435d-ac42-e7d46c84d1ca/public_url',
  },
  {
    name: 'Google Cloud Certified - Professional Cloud Architect',
    url: 'https://www.credly.com/badges/52c92eaa-0eff-48e2-8c1b-8b6646f33f0e/public_url',
  },
  {
    name: 'Nutanix Certified Professional - Multicloud Infrastructure 6',
    url: 'https://www.credly.com/badges/bcfc142f-5f87-4a34-a46b-f41345afe4eb/public_url',
  },
  {
    name: 'Certified Kubernetes Administrator',
    url: 'https://www.credly.com/badges/f81c46f8-354a-4797-aeb6-4a97a6a9f406/public_url',
  },
  {
    name: 'Certified Kubernetes Security Specialist',
    url: 'https://www.credly.com/badges/f39fbd15-c837-4bf5-bb5b-42602baf5de5/public_url',
  },
  {
    name: 'HashiCorp Certified: Terraform Associate',
    url: 'https://www.credly.com/badges/cd9b66db-5008-4cb0-8973-c3fb2fb7f225/public_url',
  },
  {
    name: 'Certified SAFe 6 Agilist',
    url: 'https://www.credly.com/badges/1487d904-6b6d-4dc9-a78d-7a6d2c230435/public_url',
  },
  {
    name: 'CompTIA Linux+ (Powered by LPI)',
    url: 'https://www.credly.com/badges/5c1ad4e9-6169-4590-aaa6-c50edecd1ace/public_url',
  },
  {
    name: 'Cisco Certified Networking Professional - Enterprise',
    url: 'https://www.credly.com/badges/cc205dbf-2796-4110-a8c5-5e25f14ec258/public_url',
  },
];

async function fetchDate(browser, badge) {
  const page = await browser.newPage();
  try {
    await page.goto(badge.url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Accept cookies if the banner appears
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', {
        timeout: 5000,
      });
      await page.click('#onetrust-accept-btn-handler');
      await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
    } catch {
      // No cookie banner, continue
    }

    // Wait for the badge content to render
    await page.waitForSelector(
      '.cr-badge-banner__issued-to-text, .badge-banner-issued-to-text',
      {
        timeout: 20000,
      }
    );

    const dateText = await page.evaluate(() => {
      // Try multiple selectors Credly has used
      const el =
        document.querySelector('.cr-badge-banner__issued-to-text') ||
        document.querySelector('.badge-banner-issued-to-text');
      return el ? el.textContent.trim() : null;
    });

    // Extract date from text like "Issued to Rostyslav Fridman on January 15, 2024"
    const match = dateText?.match(/on\s+(.+)$/i);
    const date = match ? match[1].trim() : dateText;

    return { name: badge.name, date: date || 'NOT FOUND' };
  } catch (err) {
    return { name: badge.name, date: `ERROR: ${err.message}` };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('Launching browser...\n');
  const browser = await puppeteer.launch({ headless: true });

  const results = [];
  for (const badge of BADGES) {
    process.stdout.write(`Fetching: ${badge.name}... `);
    const result = await fetchDate(browser, badge);
    console.log(result.date);
    results.push(result);
  }

  await browser.close();

  console.log('\n--- Results ---\n');
  const maxLen = Math.max(...results.map(r => r.name.length));
  for (const r of results) {
    console.log(`${r.name.padEnd(maxLen)}  →  ${r.date}`);
  }
}

main().catch(console.error);
