import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'visual-qa');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
const INVENTORY_FILE = path.join(OUTPUT_DIR, 'inventory.json');

const pagePaths = [
  '/',
  '/collections',
  '/fabric-book',
  '/consultation',
  '/cart',
  '/checkout',
  '/builder/suit-2pc',
  '/builder/shirt',
  '/builder/trousers',
];

const possibleBrowsers = [
  process.env.PUPPETEER_EXEC_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];
const executablePath = possibleBrowsers.find((p) => p && fs.existsSync(p));

if (!executablePath) {
  throw new Error(
    'No browser executable found. Set PUPPETEER_EXEC_PATH to Chrome/Edge/Chromium binary.'
  );
}

function mkdirp(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function pageNameForPath(pagePath) {
  return pagePath === '/' ? 'home' : pagePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
}

async function collectPageData(page, pageUrl) {
  const results = await page.evaluate(() => {
    function getComputedBackground(el) {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundImage || '';
      if (!bg || bg === 'none') return null;
      const match = /url\(([^)]+)\)/.exec(bg);
      if (!match) return null;
      return match[1].replace(/['"]+/g, '');
    }

    function guessContext(el) {
      const hints = ['hero', 'banner', 'card', 'product', 'fabric', 'swatch', 'gallery', 'collection', 'tile', 'detail', 'preview', 'thumbnail'];
      const classes = (el.className || '').toString().toLowerCase();
      const ids = (el.id || '').toString().toLowerCase();
      const tag = el.tagName.toLowerCase();
      const attr = [classes, ids, tag].join(' ');
      for (const hint of hints) {
        if (attr.includes(hint)) return hint;
      }
      return null;
    }

    function normalizeUrl(url) {
      if (!url) return null;
      return url.trim();
    }

    const imageEntries = [];

    for (const img of Array.from(document.images || [])) {
      const rect = img.getBoundingClientRect();
      imageEntries.push({
        type: 'img',
        tagName: img.tagName,
        src: normalizeUrl(img.currentSrc || img.src),
        alt: img.alt || null,
        title: img.title || null,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: Math.round(rect.width),
        displayHeight: Math.round(rect.height),
        context: guessContext(img) || guessContext(img.closest('section') || img.closest('article') || img.closest('div') || img.closest('a')),
        area: Math.round(rect.width * rect.height),
        path: null,
      });
    }

    const allEls = Array.from(document.querySelectorAll('*'));
    for (const el of allEls) {
      const bg = getComputedBackground(el);
      if (!bg) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 24 || rect.height < 24) continue;
      imageEntries.push({
        type: 'background',
        tagName: el.tagName,
        src: normalizeUrl(bg),
        alt: null,
        title: null,
        naturalWidth: null,
        naturalHeight: null,
        displayWidth: Math.round(rect.width),
        displayHeight: Math.round(rect.height),
        context: guessContext(el) || guessContext(el.closest('section') || el.closest('article') || el.closest('div') || el.closest('a')),
        area: Math.round(rect.width * rect.height),
        path: null,
      });
    }

    return imageEntries.map((entry, index) => ({
      ...entry,
      ordinal: index + 1,
    }));
  });

  return results;
}

async function run() {
  mkdirp(OUTPUT_DIR);
  mkdirp(SCREENSHOT_DIR);

  const browser = await puppeteer.launch({ executablePath, headless: true });
  const inventory = [];

  try {
    for (const pagePath of pagePaths) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 1000 });
      const pageUrl = new URL(pagePath, SITE_URL).toString();
      console.log('Crawling', pageUrl);

      await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const screenshotName = `${pageNameForPath(pagePath)}.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, screenshotName), fullPage: true });

      const images = await collectPageData(page, pageUrl);
      inventory.push({
        path: pagePath,
        url: pageUrl,
        screenshot: `screenshots/${screenshotName}`,
        imageCount: images.length,
        images,
      });

      await page.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(INVENTORY_FILE, JSON.stringify({ site: SITE_URL, generatedAt: new Date().toISOString(), pages: inventory }, null, 2));
  console.log(`Inventory written to ${INVENTORY_FILE}`);
  console.log(`Pages crawled: ${inventory.length}`);
  const totalImages = inventory.reduce((sum, page) => sum + page.imageCount, 0);
  console.log(`Total images found: ${totalImages}`);
}

run().catch((error) => {
  console.error('Visual QA crawler failed:', error);
  process.exit(1);
});
