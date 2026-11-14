/**
 * Real-browser functional E2E smoke test for production build (`vite preview`).
 * Usage:
 *   BASE_URL=http://127.0.0.1:4173 node scripts/e2e-smoke.mjs
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');

const ROUTES = [
  '/newHome',
  '/newHome/stats',
  '/newHome/favorites',
  '/newHome/about',
  '/newHome/chat',
  '/newHome/feedback',
  '/ncre3',
  '/computer-question',
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const pageErrors = [];
  const consoleErrors = [];
  const failedResponses = [];

  page.on('pageerror', (err) => {
    pageErrors.push(`${page.url()}: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore expected offline/external R2 or /api network errors in isolated preview
      if (!text.includes('mypan.yutkit.com') && !text.includes('/api/')) {
        consoleErrors.push(`${page.url()}: ${text}`);
      }
    }
  });
  page.on('response', (res) => {
    const url = res.url();
    if (url.startsWith(BASE_URL) && res.status() >= 400 && !url.includes('/api/')) {
      failedResponses.push(`${res.status()} ${url}`);
    }
  });

  try {
    for (const route of ROUTES) {
      const target = `${BASE_URL}${route}`;
      console.log(`[e2e-smoke] Visiting ${target}`);
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('#app', { timeout: 10000 });
      await page.waitForTimeout(400);

      const appHtmlLen = await page.evaluate(() => {
        const el = document.querySelector('#app');
        return el ? el.innerHTML.trim().length : 0;
      });
      if (appHtmlLen < 20) {
        throw new Error(`Route ${route} rendered empty #app (len=${appHtmlLen})`);
      }
    }

    // Verify theme persistence across reload
    await page.goto(`${BASE_URL}/newHome/about`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => {
      localStorage.setItem('qb_theme', 'dark');
    });
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
    const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!hasDarkClass) {
      throw new Error('Expected html.dark class after reload when qb_theme=dark');
    }

    if (pageErrors.length > 0) {
      throw new Error(`Uncaught pageerror(s):\n${pageErrors.join('\n')}`);
    }
    if (consoleErrors.length > 0) {
      throw new Error(`Console error(s):\n${consoleErrors.join('\n')}`);
    }
    if (failedResponses.length > 0) {
      throw new Error(`Failed local asset/route response(s):\n${failedResponses.join('\n')}`);
    }

    console.log(`[e2e-smoke] All ${ROUTES.length} routes + theme persistence passed with 0 errors.`);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('[e2e-smoke] FAILED:', err);
  process.exit(1);
});
