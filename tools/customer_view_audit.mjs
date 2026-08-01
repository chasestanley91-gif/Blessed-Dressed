#!/usr/bin/env node
// customer_view_audit.mjs — what is a paying customer actually looking at?
//
// "125 of 1747 shipped" measures OUR pipeline's progress. It does not measure
// the storefront. Most in-scope rows already show something, and the useful
// question is what KIND of thing: a photograph (right), a technical line
// drawing (wrong — the customer is being shown manufacturing documentation),
// or nothing.
//
// Path prefixes only get you so far: 616 in-scope rows point outside both
// /images/generated/ and /images/blueprints/, into folders like /images/jacket/
// that hold a mix. So classify by CONTENT, reusing the same measurements
// blueprint_triage.mjs uses — line art is mostly paper-white with sharp sparse
// strokes and almost no colour; a photograph is none of those.
//
// Usage: node tools/customer_view_audit.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const idx = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'images/reports/repo-index.json'), 'utf8'));
const { default: sharp } = await import('sharp');

const cache = new Map();
async function looksLikeDrawing(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const abs = path.join(PUBLIC, rel.replace(/^\//, ''));
  let verdict = 'MISSING';
  try {
    const W = 128;
    const meta = await sharp(abs).metadata();
    const H = Math.max(16, Math.round((meta.height / meta.width) * W)) || W;
    const rgb = await sharp(abs).flatten({ background: { r: 255, g: 255, b: 255 } }).resize(W, H, { fit: 'fill' }).raw().toBuffer();
    let white = 0, sat = 0;
    for (let i = 0; i < rgb.length; i += 3) {
      const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
      if (0.299 * r + 0.587 * g + 0.114 * b > 240) white += 1;
      sat += Math.max(r, g, b) - Math.min(r, g, b);
    }
    const n = rgb.length / 3;
    const whiteFrac = white / n;
    const meanSat = sat / n;
    // A technical drawing is overwhelmingly paper with near-zero colour. A
    // studio photograph on a light-grey sweep still carries tone and colour
    // across most of the frame.
    // ACCURACY, measured rather than assumed: checked against the 1,006 rows
    // whose liveImage sits on a /images/generated/ path and is therefore known
    // to be a photograph, this misclassifies 4 — a 0.4% false-DRAWING rate.
    // All four are the same edge case and it is a real one: pale ecru pocketing
    // photographed on a light-grey sweep (coin-none, coin-left) is genuinely
    // mostly-white and nearly colourless, so it trips both tests. Treat the
    // DRAWING count as carrying a handful of pale photographs, not as exact.
    verdict = (whiteFrac > 0.55 && meanSat < 12) ? 'DRAWING' : 'PHOTO';
  } catch { verdict = 'MISSING'; }
  cache.set(rel, verdict);
  return verdict;
}

const rows = idx.records.filter((r) => r.inScope && r.liveImage);
const tally = { PHOTO: 0, DRAWING: 0, MISSING: 0 };
const drawingRows = [];

for (const r of rows) {
  const v = await looksLikeDrawing(r.liveImage);
  tally[v] += 1;
  if (v === 'DRAWING') drawingRows.push(`${r.product}/${r.field}/${r.option}  <-  ${r.liveImage}`);
}

const total = rows.length;
const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

console.log(`\ncustomer_view_audit — what the storefront actually shows, by content\n`);
console.log(`  in-scope rows with an image   ${total}`);
console.log(`  PHOTOGRAPH                    ${String(tally.PHOTO).padStart(5)}   ${pct(tally.PHOTO)}`);
console.log(`  TECHNICAL DRAWING             ${String(tally.DRAWING).padStart(5)}   ${pct(tally.DRAWING)}   <- customer sees manufacturing documentation`);
console.log(`  unreadable / missing on disk  ${String(tally.MISSING).padStart(5)}   ${pct(tally.MISSING)}`);

console.log(`\n  first 20 rows showing a drawing:`);
for (const l of drawingRows.slice(0, 20)) console.log(`    ${l}`);
if (drawingRows.length > 20) console.log(`    ... and ${drawingRows.length - 20} more`);

const out = path.join(PUBLIC, 'images/reports/customer-view-audit.json');
fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), total, tally, drawingRows }, null, 2));
console.log(`\nwrote ${path.relative(ROOT, out).split(path.sep).join('/')}`);
