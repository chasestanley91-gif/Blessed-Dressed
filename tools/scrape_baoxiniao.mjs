#!/usr/bin/env node
/**
 * scrape_baoxiniao.mjs — capture the craft-option tree from the PRIMARY
 * supplier's MTM portal, WITH English labels.
 *
 * Why this exists
 * ---------------
 * mtm.baoxiniao.co is the main supplier; kutetailor is reference-only. The
 * repo already holds 7,224 Baoxiniao option images, but the original capture
 * saved values as bare codes ("A", "B", "C") with no English label, so nothing
 * could be mapped onto a catalog option without guessing the order. Guessing
 * would violate the standing rule that the drawing is law — a wrong drawing is
 * invisible to QC and scores HIGHER the more faithfully it is rendered.
 *
 * This run captures every XHR the design screen makes, so the endpoint that
 * carries per-value labels can be identified from evidence rather than assumed.
 *
 * Credentials come from the environment. Never hardcode them:
 *   FACTORY_USER=... FACTORY_PASS=... node tools/scrape_baoxiniao.mjs --explore
 *
 * Modes
 *   --explore   log in, open the design screen, dump every JSON response + DOM
 *   --category=BB|BS|BD|BV   restrict to one garment category
 *
 * Read-only against the portal: it logs in and looks. It places no order.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'factory-screenshots', 'baoxiniao-capture');

const BASE = 'https://mtm.baoxiniao.co';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

/**
 * Credentials come from .env.local (gitignored) so they never appear in a
 * command line, a shell history, or this file.
 *   FACTORY_USER=...
 *   FACTORY_PASS=...
 */
function fromEnvFile(key) {
  for (const name of ['.env.local', '.env']) {
    const p = path.join(REPO, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, '');
    }
  }
  return undefined;
}

const USER = process.env.FACTORY_USER ?? fromEnvFile('FACTORY_USER');
const PASS = process.env.FACTORY_PASS ?? fromEnvFile('FACTORY_PASS');
const HEADFUL = process.argv.includes('--headful');

if (!USER || !PASS) {
  console.error('Set FACTORY_USER and FACTORY_PASS in .env.local (gitignored) or the environment.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: !HEADFUL,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 1000 },
  });

  const page = await browser.newPage();
  const captured = [];

  page.on('response', async (res) => {
    const url = res.url();
    if (!url.includes('/eis/')) return;
    const ct = res.headers()['content-type'] ?? '';
    if (!ct.includes('json')) return;
    try {
      const body = await res.json();
      captured.push({ url, status: res.status(), body });
    } catch { /* non-JSON or already consumed */ }
  });

  console.log('login…');
  await page.goto(`${BASE}/eis/login`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await page.screenshot({ path: path.join(OUT, '01-login.png') });

  // The login form is a plain two-input form; type into the first text and
  // first password field rather than guessing framework-specific selectors.
  await page.type('input[type="text"]', USER, { delay: 20 });
  await page.type('input[type="password"]', PASS, { delay: 20 });
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 }).catch(() => {});
  await sleep(3000);
  await page.screenshot({ path: path.join(OUT, '02-after-login.png') });
  console.log('after login:', page.url());

  // The craft-option XHRs only fire once the design flow is entered, which is
  // behind the "New MTM Order" tile on the portal home. Click by visible text
  // rather than a framework-specific selector.
  const clickByText = async (needle) => {
    const handle = await page.evaluateHandle((text) => {
      const els = [...document.querySelectorAll('a,button,div,span,li,p')];
      return els.find((e) => {
        const t = (e.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
        return t === text.toLowerCase() || t.replace(/\s+/g, '') === text.toLowerCase().replace(/\s+/g, '');
      }) ?? null;
    }, needle);
    const el = handle.asElement();
    if (!el) return false;
    await el.click().catch(() => {});
    return true;
  };

  // "New MTM Order" resolves to this route (read out of the portal DOM — the
  // tile only sets a selected state, it does not navigate on click).
  console.log('entering the design flow…');
  const DESIGN_ROUTES = [
    '/eis/measureOrder/international/personal/create_v3',
    '/eis/measureOrder/orderInfo',
    '/eis/measureOrder/fabric',
    // Read-only views that may already contain the craft tree WITH labels,
    // without creating anything in the supplier's live system.
    '/eis/measureOrder/templateSelection',
    '/eis/customTemp/getUserCustomTempListFull',
    '/eis/customTemp/getZlCustomMapGroupByOrdtps',
  ];
  for (const route of DESIGN_ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60_000 });
      await sleep(3500);
      await page.screenshot({ path: path.join(OUT, `03${route.replace(/\W+/g, '-')}.png`), fullPage: true });
      fs.writeFileSync(path.join(OUT, `dom${route.replace(/\W+/g, '-')}.html`), await page.content(), 'utf8');
      console.log('  ', route, '->', page.url(), `(${captured.length} json captured)`);
    } catch (e) {
      console.log('   skip', route, '-', e.message.split('\n')[0]);
    }
  }

  // Step through the wizard without ever submitting: each "Next" reveals more
  // of the craft tree. Stop after a few steps — we are reading, not ordering.
  for (let step = 1; step <= 3; step += 1) {
    const advanced = (await clickByText('Next')) || (await clickByText('next step'));
    if (!advanced) { console.log(`  no Next control at step ${step} — stopping`); break; }
    await sleep(4000);
    await page.screenshot({ path: path.join(OUT, `04-step${step}.png`), fullPage: true });
    console.log(`  step ${step} ->`, page.url(), `(${captured.length} json captured)`);
  }

  // Dump the DOM so per-value labels can be read even if no API carries them.
  const html = await page.content();
  fs.writeFileSync(path.join(OUT, 'design-dom.html'), html, 'utf8');

  fs.writeFileSync(
    path.join(OUT, 'captured-json.json'),
    JSON.stringify(captured.map((c) => ({ url: c.url, status: c.status, body: c.body })), null, 1),
    'utf8'
  );

  console.log('\ncaptured endpoints:');
  const seen = new Map();
  for (const c of captured) {
    const key = c.url.split('?')[0];
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [u, n] of seen) console.log(`  ${String(n).padStart(3)}x  ${u}`);
  console.log(`\nartifacts -> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);

  await browser.close();
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
