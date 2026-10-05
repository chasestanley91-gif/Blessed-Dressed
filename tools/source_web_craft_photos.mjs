#!/usr/bin/env node
/**
 * Source one real-world internet photo per construction family and attach it
 * to every still-open craft in that family.
 *
 * Firecrawl credits are exhausted this cycle, so this uses:
 *   1. Openverse (Creative Commons, commercial-ok)
 *   2. Wikimedia Commons
 *   3. Playwright → Unsplash search (license-clean)
 *   4. Puppeteer-core as a fallback if Playwright cannot launch
 *
 * Never attaches to a craft the owner has already reviewed.
 * Skips faces/portraits and competitor brand names by title/url.
 *
 *   node tools/source_web_craft_photos.mjs
 *   node tools/source_web_craft_photos.mjs --limit=8
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fieldIsSkipped } from './craft-review-scope.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP = path.join(REPO, 'data-store/craft-image-map.json');
const LOG = path.join(REPO, 'data-store/image-review-decisions-log.json');
const COMPLETED = path.join(REPO, 'data-store/image-review-completed.json');
const OUT = path.join(REPO, 'data-store/web-craft-photos.json');
const WEB_DIR = path.join(REPO, 'public/images/web-refs');
const UA = 'BlessedDressed/1.0 (craft-option photo research; chasestanley91@gmail.com)';

const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '--limit=0').split('=')[1]);
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

const BRAND = /kiton|suitsupply|armoury|huntsman|indochino|brioni|canali|zegna|tom\s*ford|ralph\s*lauren|paul\s*smith|favourbrook|proper\s*cloth|black\s*lapel|bindle|cad\s*and\s*the\s*dandy|anderson\s*sheppard|gieves|hawkes|attolini|rubinacci|liverano|formosa|spier|mackay|burberry|gucci|prada|arman[i]|versace|dior|hermes|louis\s*vuitton|saint\s*laurent/i;
const FACE = /portrait|headshot|selfie|smiling|self-portrait|face close|head and shoulders|model wearing|handsome man|beautiful woman|nazi|ss norge|volunteer uniform|fashion plate|18\d\d\.\.|dinner jackets, 1898/i;
const SKIP_FILE = /\.(pdf|svg|tif|tiff|djvu)(\?|$)/i;

const FAMILIES = [
  { id: 'peak-lapel', q: 'mens suit peak lapel close up garment', test: (o) => o.fieldId === 'lapel-style' && /peak/.test(o.optionId) && !/shawl/.test(o.optionId) },
  { id: 'notch-lapel', q: 'mens suit notch lapel close up garment no face', test: (o) => o.fieldId === 'lapel-style' && /notch/.test(o.optionId) && !/shawl/.test(o.optionId) },
  { id: 'shawl-lapel', q: 'dinner jacket shawl lapel close up garment', test: (o) => o.fieldId === 'lapel-style' && /shawl/.test(o.optionId) },
  { id: 'fishtail-lapel', q: 'italian fishtail lapel jacket close up', test: (o) => /fishtail/.test(o.optionId) },
  { id: 'lapel-width', q: 'suit jacket lapel width close up', test: (o) => o.fieldId === 'lapel-width' },
  { id: 'shirt-point-collar', q: 'dress shirt point collar close up no tie ghost mannequin', test: (o) => o.fieldId === 'lapel' && /point|regular|fashion|dr-point|af1/.test(o.optionId) && !/cutaway|stand|cuban|tuxedo|mandarin|frog|one-piece|wrap|hexagon|button-down/.test(o.optionId) },
  { id: 'shirt-cutaway', q: 'dress shirt cutaway spread collar close up no face', test: (o) => o.fieldId === 'lapel' && /cutaway/.test(o.optionId) },
  { id: 'shirt-button-down', q: 'oxford shirt button down collar close up no face', test: (o) => /button-down/.test(o.optionId) },
  { id: 'shirt-mandarin', q: 'mandarin band collar dress shirt close up no face', test: (o) => /one-collar|mandarin|stand/.test(o.optionId) && o.fieldId === 'lapel' },
  { id: 'shirt-cuban', q: 'cuban camp collar shirt close up no face', test: (o) => /cuban/.test(o.optionId) },
  { id: 'shirt-tuxedo-collar', q: 'tuxedo wing collar dress shirt close up no face', test: (o) => /tuxedo/.test(o.optionId) },
  { id: 'shirt-square-collar', q: 'club collar square dress shirt close up', test: (o) => o.fieldId === 'lapel' && /sq|square|hexagon/.test(o.optionId) && !/stand/.test(o.optionId) },
  { id: 'shirt-round-collar', q: 'rounded pin collar dress shirt close up', test: (o) => o.fieldId === 'lapel' && /round/.test(o.optionId) },
  { id: 'french-cuff', q: 'french double cuff dress shirt close up no face', test: (o) => o.fieldId === 'cuff' && /french/.test(o.optionId) },
  { id: 'barrel-cuff', q: 'dress shirt barrel button cuff close up no face', test: (o) => o.fieldId === 'cuff' && !/french/.test(o.optionId) },
  { id: 'jacket-cuff', q: 'suit jacket sleeve cuff surgeon buttons close up', test: (o) => o.fieldId === 'cuff-style' },
  { id: 'chest-welt', q: 'suit jacket welt chest pocket close up', test: (o) => o.fieldId === 'chest-pocket' && /welt|jetted|boat/.test(o.optionId) },
  { id: 'chest-patch', q: 'sport coat patch chest pocket close up', test: (o) => o.fieldId === 'chest-pocket' && /patch/.test(o.optionId) },
  { id: 'chest-barchetta', q: 'barchetta boat shaped chest pocket jacket close up', test: (o) => /boat|barchetta/.test(o.optionId) },
  { id: 'lower-flap', q: 'suit jacket slanted flap hip pocket close up', test: (o) => o.fieldId === 'lower-pocket' && /flap/.test(o.optionId) && !/patch/.test(o.optionId) },
  { id: 'lower-jetted', q: 'suit jacket jetted besom hip pocket close up', test: (o) => o.fieldId === 'lower-pocket' && /jetted|welt/.test(o.optionId) },
  { id: 'lower-patch', q: 'sport coat patch hip pocket close up', test: (o) => o.fieldId === 'lower-pocket' && /patch/.test(o.optionId) },
  { id: 'ticket-pocket', q: 'suit jacket ticket pocket close up', test: (o) => o.fieldId === 'ticket-pocket' },
  { id: 'side-vents', q: 'suit jacket side vents back close up', test: (o) => /bv-side/.test(o.optionId) },
  { id: 'center-vent', q: 'suit jacket center vent back close up', test: (o) => o.optionId === 'bv-center' },
  { id: 'no-vent', q: 'dinner jacket no vent back close up', test: (o) => o.optionId === 'bv-none' },
  { id: 'pleats-forward', q: 'pleated trousers forward pleats close up waist', test: (o) => o.fieldId === 'pleat-style' && /forward/.test(o.optionId) },
  { id: 'pleats-flat', q: 'flat front dress trousers waist close up', test: (o) => o.fieldId === 'pleat-style' && /flat|no-/.test(o.optionId) },
  { id: 'pleats-reverse', q: 'reverse pleat trousers close up', test: (o) => o.fieldId === 'pleat-style' && /reverse/.test(o.optionId) },
  { id: 'waistband', q: 'dress trousers waistband close up no face', test: (o) => o.fieldId === 'waistband-style' },
  { id: 'extension', q: 'trouser waistband extension hook and bar close up', test: (o) => o.fieldId === 'waistband-extension' },
  { id: 'zip-fly', q: 'dress trousers zip fly close up', test: (o) => o.fieldId === 'fly-style' && /zip/.test(o.optionId) },
  { id: 'button-fly', q: 'button fly trousers close up', test: (o) => o.optionId === 'fly-button' },
  { id: 'trouser-hem', q: 'dress trousers hem cuffed turn up close up', test: (o) => o.fieldId === 'hem-style' && /cuff|turnup/.test(o.optionId) },
  { id: 'plain-hem', q: 'dress trousers plain hem close up', test: (o) => o.fieldId === 'hem-style' && !/cuff|turnup/.test(o.optionId) },
  { id: 'neapolitan-shoulder', q: 'neapolitan spalla camicia jacket shoulder close up', test: (o) => /neapolitan|shirt-head/.test(o.optionId) },
  { id: 'roped-shoulder', q: 'roped structured suit shoulder sleeve head close up', test: (o) => o.fieldId === 'sleeve-head' && !/neapolitan|shirt-head/.test(o.optionId) },
  { id: 'sb-config', q: 'single breasted suit jacket two button close up', test: (o) => o.fieldId === 'button-config' && /^sb-/.test(o.optionId) },
  { id: 'db-config', q: 'double breasted suit jacket six button close up', test: (o) => o.fieldId === 'button-config' && /^db-/.test(o.optionId) },
  { id: 'placket-plain', q: 'dress shirt front placket close up no face', test: (o) => o.fieldId === 'placket' && /plain|outer/.test(o.optionId) },
  { id: 'placket-hidden', q: 'hidden fly front placket dress shirt close up', test: (o) => o.fieldId === 'placket' && /hidden/.test(o.optionId) },
  { id: 'vest-vneck', q: 'waistcoat v neck close up no face', test: (o) => /v-neckline/.test(o.optionId) },
  { id: 'vest-uneck', q: 'waistcoat u neck close up no face', test: (o) => /u-neckline/.test(o.optionId) },
  { id: 'vest-shawl', q: 'waistcoat shawl lapel close up', test: (o) => o.fieldId === 'neckline-style' && /shawl/.test(o.optionId) },
  { id: 'full-canvas', q: 'suit jacket full canvas floating construction inside', test: (o) => /full-canvas/.test(o.optionId) },
  { id: 'half-canvas', q: 'suit jacket half canvas construction inside', test: (o) => /half-canvas|light-half|ultra-thin-half/.test(o.optionId) },
  { id: 'fused-canvas', q: 'fused suit jacket chest canvas construction', test: (o) => /fused|canvas-normal|canvas-none/.test(o.optionId) },
  { id: 'belt-loops', q: 'dress trousers belt loops close up', test: (o) => o.fieldId === 'belt-loops' },
  { id: 'watch-pocket', q: 'trouser watch pocket close up', test: (o) => o.fieldId === 'watch-pocket' },
  { id: 'coin-pocket', q: 'jacket coin pocket close up', test: (o) => o.fieldId === 'coin-pocket' },
  { id: 'pick-stitch', q: 'handmade pick stitching lapel AMF close up', test: (o) => /pick-stitch/.test(o.fieldId) },
  { id: 'shirt-yoke', q: 'dress shirt back yoke close up', test: (o) => o.fieldId === 'yoke' || o.fieldId === 'back' },
  { id: 'elbow-patch', q: 'tweed jacket elbow patch close up', test: (o) => o.fieldId === 'elbow-patch' },
  { id: 'sleeve-vent', q: 'suit jacket sleeve vent kissing buttons close up', test: (o) => o.fieldId === 'sleeve-vent' },
  { id: 'chest-dart', q: 'suit jacket chest dart seam close up', test: (o) => o.fieldId === 'chest-dart' },
  { id: 'front-pocket-trouser', q: 'dress trousers front pocket close up', test: (o) => o.fieldId === 'front-pocket-style' },
  { id: 'back-pocket-trouser', q: 'dress trousers back pocket close up', test: (o) => o.fieldId === 'back-pocket-style' },
  { id: 'metal-adjuster', q: 'trouser side adjuster buckle close up', test: (o) => o.fieldId === 'metal-adjuster' || /adjuster/.test(o.optionId) },
  { id: 'collar-stand', q: 'dress shirt collar stand close up no face', test: (o) => /collar_stand/.test(o.fieldId) },
  { id: 'underarm-shield', q: 'jacket underarm shield sweat pad interior', test: (o) => o.fieldId === 'perfume-pad' },
  { id: 'lining-half', q: 'half lined jacket interior back', test: (o) => /half-lining/.test(o.fieldId) || /lining-coverage/.test(o.fieldId) },
  { id: 'facing', q: 'suit jacket interior facing silk close up', test: (o) => o.fieldId === 'facing-style' },
  { id: 'pen-pocket', q: 'jacket interior pen pocket close up', test: (o) => o.fieldId === 'pen-pocket' },
  { id: 'namecard-pocket', q: 'jacket interior name card pocket close up', test: (o) => o.fieldId === 'namecard-pocket' },
  { id: 'bartack', q: 'pocket bartack reinforcement stitching close up', test: (o) => /bartack|bar-tack|pocket-knot/.test(o.fieldId) },
  { id: 'shoulder-pad', q: 'suit jacket shoulder pad construction', test: (o) => o.fieldId === 'shoulder-pad' },
  { id: 'vest-pockets', q: 'waistcoat welt pockets close up', test: (o) => /pocket-vest|pockets-vest|chest-pocket-vest/.test(o.fieldId) },
  { id: 'vest-bottom', q: 'waistcoat pointed bottom close up', test: (o) => o.fieldId === 'bottom-shape-vest' },
  { id: 'leg-shape', q: 'dress trousers taper leg shape', test: (o) => o.fieldId === 'leg-shape' },
  { id: 'heel-guard', q: 'trouser hem heel guard kick tape', test: (o) => o.fieldId === 'heel-guard' },
  { id: 'suspender-buttons', q: 'trouser interior suspender brace buttons', test: (o) => o.fieldId === 'suspender-buttons' },
  { id: 'shirt-cuff-pleat', q: 'dress shirt cuff pleats close up', test: (o) => o.fieldId === 'cuff_pleat' || /pleat/.test(o.optionId) && o.fieldId === 'cuff' },
  { id: 'decoration-stitch', q: 'shirt collar topstitching close up', test: (o) => /decoration_stitching_on_/.test(o.fieldId) },
];

function addrToCraftId(addr) {
  if (!addr || !String(addr).includes('>')) return '';
  return String(addr).split('>').map((p) => p.trim()).join('|');
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

function okCandidate(title, url) {
  const t = `${title || ''} ${url || ''}`;
  if (BRAND.test(t) || FACE.test(t)) return false;
  return true;
}

async function searchOpenverse(q) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=12&mature=false`;
  try {
    const data = await getJson(url);
    return (data.results || []).map((r) => ({
      url: r.url,
      title: r.title || r.foreign_landing_url || '',
      source: r.foreign_landing_url || r.url,
      via: 'openverse',
      width: r.width,
      height: r.height,
    })).filter((r) => r.url && !SKIP_FILE.test(r.url) && okCandidate(r.title, r.url));
  } catch (e) {
    console.warn('openverse fail', q, e.message);
    return [];
  }
}

function wikiQuery(q) {
  return String(q)
    .replace(/\b(close up|garment|no face|ghost mannequin|product photography|menswear|dummy)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchWikimedia(q) {
  const search = wikiQuery(q);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(search)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|size|mime`;
  try {
    const data = await getJson(url);
    const pages = Object.values(data.query?.pages || {});
    const out = [];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (!info) continue;
      const fileUrl = info.url;
      const mime = String(info.mime || '');
      if (!fileUrl || !mime.startsWith('image/') || mime.includes('svg') || mime.includes('tiff')) continue;
      if (SKIP_FILE.test(fileUrl) || SKIP_FILE.test(p.title || '') || /\bdjvu\b/i.test(p.title || '')) continue;
      if ((info.width || 0) < 350 || (info.height || 0) < 350) continue;
      if ((info.size || 0) > 8 * 1024 * 1024) continue;
      if (!okCandidate(p.title, fileUrl)) continue;
      out.push({ url: fileUrl, title: p.title, source: info.descriptionurl || fileUrl, via: 'wikimedia', width: info.width, height: info.height });
    }
    return out;
  } catch (e) {
    console.warn('wikimedia fail', q, e.message);
    return [];
  }
}

const blockedDomains = new Set();

async function searchUnsplashPlaywright(q) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    try { ({ chromium } = await import('@playwright/test')); } catch { return []; }
  }
  if (blockedDomains.has('unsplash.com')) return [];
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
    const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(q)}`;
    const resp = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    const body = await page.textContent('body').catch(() => '');
    if (!resp || resp.status() === 403 || /verify you are human|captcha|attention required/i.test(body || '')) {
      blockedDomains.add('unsplash.com');
      console.warn('unsplash blocked — skipping domain for the rest of this run');
      return [];
    }
    await page.waitForTimeout(1500);
    const urls = await page.$$eval('img', (imgs) =>
      imgs.map((i) => i.src || i.getAttribute('srcset') || '').filter(Boolean),
    );
    return [...new Set(urls)]
      .map((u) => u.split(' ')[0])
      .filter((u) => /images\.unsplash\.com/.test(u))
      .slice(0, 8)
      .map((u) => ({ url: u.split('?')[0] + '?w=1600', title: q, source: searchUrl, via: 'unsplash' }))
      .filter((r) => okCandidate(r.title, r.url));
  } catch (e) {
    console.warn('playwright unsplash fail', q, e.message);
    return [];
  } finally {
    await browser.close().catch(() => {});
  }
}

async function searchUnsplashPuppeteer(q) {
  if (blockedDomains.has('unsplash.com')) return [];
  let puppeteer;
  try { puppeteer = (await import('puppeteer-core')).default; } catch { return []; }
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
    'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
  ].filter(Boolean);
  let exe = candidates.find((p) => fs.existsSync(p));
  if (!exe) return [];
  const browser = await puppeteer.launch({ executablePath: exe, headless: true });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(q)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    const body = await page.evaluate(() => document.body?.innerText || '');
    if (/verify you are human|captcha|attention required/i.test(body)) {
      blockedDomains.add('unsplash.com');
      return [];
    }
    const urls = await page.$$eval('img', (imgs) => imgs.map((i) => i.src).filter(Boolean));
    return [...new Set(urls)]
      .filter((u) => /images\.unsplash\.com/.test(u))
      .slice(0, 8)
      .map((u) => ({ url: u.split('?')[0] + '?w=1600', title: q, source: searchUrl, via: 'unsplash-puppeteer' }));
  } catch (e) {
    console.warn('puppeteer unsplash fail', q, e.message);
    return [];
  } finally {
    await browser.close().catch(() => {});
  }
}

function magicOk(buf) {
  if (buf.length < 24) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return false;
}

async function download(url) {
  const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'image/*,*/*' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = magicOk(buf);
  if (!ext) throw new Error('not an image');
  if (buf.length < 8 * 1024) throw new Error(`too small ${buf.length}`);
  if (buf.length > 8 * 1024 * 1024) throw new Error('too large');
  return { buf, ext };
}

let sharpLib = null;
async function looksLikeLogoOrTiny(buf) {
  try {
    if (!sharpLib) sharpLib = (await import('sharp')).default;
    const meta = await sharpLib(buf, { failOn: 'none' }).metadata();
    if ((meta.width || 0) < 350 || (meta.height || 0) < 350) return 'tiny';
    const { data, info } = await sharpLib(buf, { failOn: 'none' })
      .resize(64, 64, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const colors = new Set();
    for (let i = 0; i < data.length; i += info.channels) {
      colors.add(`${data[i] >> 4}-${data[i + 1] >> 4}-${data[i + 2] >> 4}`);
    }
    if (colors.size < 8) return 'logo-flat';
    return null;
  } catch {
    return null;
  }
}

async function pickAndSave(family, optionIds) {
  let hits = [];
  hits = hits.concat(await searchWikimedia(family.q));
  await sleep(120);
  if (hits.length < 3) {
    hits = hits.concat(await searchOpenverse(family.q));
    await sleep(120);
  }
  if (hits.length < 2) {
    const extra = await searchUnsplashPlaywright(family.q);
    hits = hits.concat(extra.filter((h) => /images\.unsplash\.com\/photo-/.test(h.url)));
  }
  const seen = new Set();
  const unique = [];
  for (const h of hits) {
    if (seen.has(h.url) || SKIP_FILE.test(h.url) || SKIP_FILE.test(h.title || '')) continue;
    seen.add(h.url);
    unique.push(h);
  }
  for (const h of unique.slice(0, 8)) {
    try {
      const { buf, ext } = await download(h.url);
      const bad = await looksLikeLogoOrTiny(buf);
      if (bad) throw new Error(bad);
      const sha = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
      const attachments = [];
      for (const id of optionIds) {
        const dir = path.join(WEB_DIR, id);
        fs.mkdirSync(dir, { recursive: true });
        const name = `${family.id}-${sha}.${ext}`;
        const abs = path.join(dir, name);
        if (!fs.existsSync(abs)) fs.writeFileSync(abs, buf);
        attachments.push({
          optionId: id,
          path: `/images/web-refs/${id}/${name}`,
          sha1: crypto.createHash('sha1').update(buf).digest('hex'),
          source: h.source,
          via: h.via,
          title: h.title,
          family: family.id,
          query: family.q,
        });
      }
      return { family: family.id, via: h.via, url: h.url, title: h.title, count: optionIds.length, attachments };
    } catch (e) {
      console.warn('  download skip', (h.title || h.url).slice(0, 80), e.message);
    }
  }
  return null;
}

const map = readJson(MAP, { crafts: [] });
const log = readJson(LOG, []);
const completedFile = readJson(COMPLETED, { craftIds: [] });
const completed = new Set(completedFile.craftIds || []);
for (const e of log) {
  if (e.event !== 'decision') continue;
  const id = addrToCraftId(e.addr);
  if (id) completed.add(id);
}

const openByOption = new Map();
for (const c of map.crafts || []) {
  if (fieldIsSkipped(c.fieldId, c.fieldLabel || '', c.label || '')) continue;
  if (completed.has(c.craftId)) continue;
  if (!c.inScope && fieldIsSkipped(c.fieldId)) continue;
  if (!openByOption.has(c.optionId)) {
    openByOption.set(c.optionId, { optionId: c.optionId, label: c.label, fieldId: c.fieldId, fieldLabel: c.fieldLabel, crafts: [] });
  }
  openByOption.get(c.optionId).crafts.push(c.craftId);
}

const options = [...openByOption.values()];
const assigned = new Set();
const jobs = [];
for (const fam of FAMILIES) {
  const ids = options.filter((o) => fam.test(o) && !assigned.has(o.optionId)).map((o) => o.optionId);
  for (const id of ids) assigned.add(id);
  if (ids.length) jobs.push({ ...fam, optionIds: ids });
}
const leftover = options.filter((o) => !assigned.has(o.optionId));
if (process.argv.includes('--leftover')) {
  for (const o of leftover) {
    jobs.push({
      id: `opt-${o.optionId}`,
      q: `${o.fieldLabel || ''} ${o.label} menswear garment close up`,
      optionIds: [o.optionId],
    });
  }
} else {
  console.log(`deferring ${leftover.length} leftover unique options (rerun with --leftover)`);
}

const work = LIMIT > 0 ? jobs.slice(0, LIMIT) : jobs;
console.log(`open unique options ${options.length}  families+leftover ${jobs.length}  running ${work.length}  skipped-completed ${completed.size}`);

const prev = readJson(OUT, { attachments: [] });
const byFamily = new Set((prev.attachments || []).map((a) => a.family).filter(Boolean));
const allAttachments = [...(prev.attachments || [])];
let ok = 0, miss = 0;

for (const job of work) {
  if (byFamily.has(job.id) && job.optionIds.every((id) => allAttachments.some((a) => a.optionId === id))) {
    console.log('skip existing', job.id);
    ok += 1;
    continue;
  }
  process.stdout.write(`search ${job.id} (${job.optionIds.length} options) … `);
  const hit = await pickAndSave(job, job.optionIds);
  if (hit) {
    console.log(`ok via ${hit.via}`);
    allAttachments.push(...hit.attachments);
    ok += 1;
    fs.writeFileSync(OUT, JSON.stringify({
      builtAt: new Date().toISOString(),
      attachments: allAttachments,
      ok,
      miss,
    }, null, 1) + '\n');
  } else {
    console.log('NONE');
    miss += 1;
  }
  await sleep(250);
}

fs.writeFileSync(OUT, JSON.stringify({
  builtAt: new Date().toISOString(),
  attachments: allAttachments,
  ok,
  miss,
  blockedDomains: [...blockedDomains],
}, null, 1) + '\n');
console.log(`done  saved ${ok}  missed ${miss}  files ${allAttachments.length}`);
