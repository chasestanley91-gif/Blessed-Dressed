#!/usr/bin/env node
/**
 * scan_reference_photos.mjs — find supplier reference images that are REAL
 * PHOTOGRAPHS, so the catalog can use a genuine garment photo instead of
 * paying to generate an imitation of one.
 *
 * There are ~18,000 supplier reference files on disk. Most are technical flats
 * (line art on white) which are blueprints, not catalog images. A minority are
 * actual product photographs of the actual garment — those are strictly better
 * than anything generated: real cloth, real light, real construction, no
 * hallucinated geometry, and no credits.
 *
 * This pass is deterministic and free. It classifies by pixel statistics only
 * and is deliberately CONSERVATIVE: it reports candidates for a human to look
 * at, and never rewires the catalog. Two things it cannot decide and does not
 * pretend to — whether a photo carries supplier branding or a watermark, and
 * whether the photo actually shows the option it is filed under. Both need eyes.
 *
 * Signals used:
 *   entropy      — line art on white is very low entropy; photographs are high
 *   whiteShare   — share of near-white pixels; flats are mostly paper
 *   saturation   — flats are near-greyscale plus a red annotation ink
 *   edgeFlatness — flats have hard black strokes and empty space between them
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(REPO, 'public/images/reports/reference-photo-scan.json');

const arg = (k, d) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const LIMIT = Number(arg('limit', 0));
const CONC = Number(arg('concurrency', 12));

const POOLS = (arg('pools', [
  'factory-screenshots/shirt',
  'factory-screenshots/vest',
  'factory-screenshots/suit-jacket',
  'factory-screenshots/trousers',
  'factory-screenshots/baoxiniao',
  'factory-screenshots/kute',
  'factory-screenshots/hero-library',
  'public/images/factory',
  'public/images/techpacks',
].join(','))).split(',').filter(Boolean);

const IMG = /\.(jpe?g|png|webp)$/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (IMG.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * Classify one file. Returns null when the file cannot be decoded — a corrupt
 * or zero-byte file is a finding in itself, so it is counted, not swallowed.
 */
async function classify(file) {
  const img = sharp(file, { failOn: 'none' });
  const meta = await img.metadata();
  // Work from a small thumbnail: the statistics we want survive downsampling
  // and reading 18,000 full-size files would dominate the runtime.
  const raw = await img.clone().resize(96, 96, { fit: 'inside' }).removeAlpha()
    .toColorspace('srgb').raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  const n = info.width * info.height;

  let white = 0, satSum = 0, satSq = 0, dark = 0;
  const buckets = new Set();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    if (mx > 242 && mx - mn < 14) white += 1;
    if (mx < 60) dark += 1;
    satSum += sat; satSq += sat * sat;
    buckets.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
  }
  const whiteShare = white / n;
  const darkShare = dark / n;
  const satMean = satSum / n;
  const satStd = Math.sqrt(Math.max(0, satSq / n - satMean * satMean));
  const colours = buckets.size;

  const { entropy } = await img.clone().stats();

  // A photograph occupies its frame with continuous tone. A technical flat is
  // mostly paper with a few hard strokes on it. whiteShare separates them more
  // cleanly than entropy alone, which stays high for a dense drawing.
  const isFlat = whiteShare > 0.45 || (colours < 90 && satMean < 0.14);
  const isPhoto = !isFlat && entropy > 4.2 && colours >= 120 && whiteShare < 0.35;

  return {
    file: path.relative(REPO, file).split(path.sep).join('/'),
    bytes: fs.statSync(file).size,
    w: meta.width ?? null, h: meta.height ?? null,
    entropy: Number(entropy.toFixed(3)),
    colours, whiteShare: Number(whiteShare.toFixed(3)),
    darkShare: Number(darkShare.toFixed(3)),
    satMean: Number(satMean.toFixed(3)), satStd: Number(satStd.toFixed(3)),
    verdict: isPhoto ? 'PHOTO' : isFlat ? 'FLAT' : 'UNSURE',
  };
}

const files = POOLS.flatMap((p) => walk(path.join(REPO, p)));
const work = LIMIT ? files.slice(0, LIMIT) : files;
console.error(`scanning ${work.length} file(s) across ${POOLS.length} pool(s)…`);

const results = [];
const broken = [];
let cursor = 0;
async function worker() {
  while (cursor < work.length) {
    const i = cursor++;
    try { results.push(await classify(work[i])); }
    catch (e) { broken.push({ file: path.relative(REPO, work[i]).split(path.sep).join('/'), error: String(e.message || e).slice(0, 120) }); }
    if (results.length % 500 === 0) console.error(`  ${results.length}/${work.length}`);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));

const byVerdict = { PHOTO: [], FLAT: [], UNSURE: [] };
for (const r of results) byVerdict[r.verdict].push(r);

// Group photo candidates by their directory: a whole folder of photographs is
// a usable library, one stray photo in a folder of flats is probably misfiled.
const dirs = new Map();
for (const r of results) {
  const d = path.posix.dirname(r.file);
  if (!dirs.has(d)) dirs.set(d, { dir: d, total: 0, photo: 0 });
  const e = dirs.get(d); e.total += 1; if (r.verdict === 'PHOTO') e.photo += 1;
}
const dirRows = [...dirs.values()].filter((d) => d.photo > 0)
  .map((d) => ({ ...d, share: Number((d.photo / d.total).toFixed(2)) }))
  .sort((a, b) => b.photo - a.photo);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(), pools: POOLS,
  scanned: results.length, broken: broken.length,
  counts: { PHOTO: byVerdict.PHOTO.length, FLAT: byVerdict.FLAT.length, UNSURE: byVerdict.UNSURE.length },
  directories: dirRows, brokenFiles: broken.slice(0, 100),
  photos: byVerdict.PHOTO, unsure: byVerdict.UNSURE.slice(0, 400),
}, null, 2) + '\n', 'utf8');

console.log(`scanned      : ${results.length}`);
console.log(`PHOTO        : ${byVerdict.PHOTO.length}`);
console.log(`FLAT (art)   : ${byVerdict.FLAT.length}`);
console.log(`UNSURE       : ${byVerdict.UNSURE.length}`);
console.log(`unreadable   : ${broken.length}`);
console.log('\ndirectories richest in photographs:');
for (const d of dirRows.slice(0, 20)) console.log(`  ${String(d.photo).padStart(5)} / ${String(d.total).padEnd(5)} (${d.share})  ${d.dir}`);
console.log(`\n-> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
