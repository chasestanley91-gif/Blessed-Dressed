#!/usr/bin/env node
// image_collisions.mjs — find catalog options that show the customer the SAME
// picture, and separate the harmless cases from the real ones.
//
// WHY. A craft option exists so a customer can choose between it and its
// siblings. If two options on the SAME field render byte-identical images, the
// choice is not a choice — and QC cannot catch it, because QC grades one image
// against one blueprint and never compares siblings. This is the blocking
// DISTINCT_OPTION_IMAGE_COLLISION finding, computed rather than estimated.
//
// NOT every shared image is a defect. The catalog deliberately fans one
// approved photo across the same option on several PRODUCTS — jacket/suit-2pc/
// suit-3pc all offer "Notch 68" and share its photograph. That is correct.
// The defect is two DIFFERENT options colliding, and the sharper case is two
// different options on the same field, where they compete directly on a menu.
//
// Usage: node tools/image_collisions.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const idx = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'images/reports/repo-index.json'), 'utf8'));

const sha = new Map();
const hashOf = (rel) => {
  if (sha.has(rel)) return sha.get(rel);
  const abs = path.join(PUBLIC, rel.replace(/^\//, ''));
  let h = null;
  try { h = crypto.createHash('md5').update(fs.readFileSync(abs)).digest('hex'); } catch { h = null; }
  sha.set(rel, h);
  return h;
};

// Group every in-scope row that shows a live image, keyed by that image's BYTES
// rather than its path — two different filenames holding the same file collide
// just as badly as one path reused.
const byHash = new Map();
for (const r of idx.records) {
  if (!r.inScope || !r.liveImage) continue;
  const h = hashOf(r.liveImage);
  if (!h) continue;
  if (!byHash.has(h)) byHash.set(h, []);
  byHash.get(h).push(r);
}

const sameOptionFanOut = [];
const crossFieldCollisions = [];
const sameFieldCollisions = [];

for (const [h, rows] of byHash) {
  if (rows.length < 2) continue;
  const options = new Set(rows.map((r) => r.option));
  if (options.size === 1) { sameOptionFanOut.push({ hash: h, option: rows[0].option, rows: rows.length }); continue; }

  // Two or more DIFFERENT options share these bytes.
  const fields = new Set(rows.map((r) => `${r.product}|${r.field}`));
  const entry = {
    hash: h,
    image: rows[0].liveImage,
    options: [...options].sort(),
    rows: rows.map((r) => `${r.product}/${r.field}/${r.option} "${r.label}"`).sort(),
  };
  // Do any two DIFFERENT options sit on the SAME product+field? That is the
  // sharp case: they appear side by side in one picker.
  const perField = new Map();
  for (const r of rows) {
    const k = `${r.product}|${r.field}`;
    if (!perField.has(k)) perField.set(k, new Set());
    perField.get(k).add(r.option);
  }
  const clashing = [...perField.entries()].filter(([, o]) => o.size > 1);
  if (clashing.length) {
    entry.sameFieldMenus = clashing.map(([k, o]) => `${k}: ${[...o].sort().join(' vs ')}`);
    sameFieldCollisions.push(entry);
  } else {
    entry.fields = [...fields].sort();
    crossFieldCollisions.push(entry);
  }
}

const rowsIn = (list) => list.reduce((s, e) => s + e.rows.length, 0);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ sameFieldCollisions, crossFieldCollisions, sameOptionFanOut: sameOptionFanOut.length }, null, 2));
} else {
  console.log(`\nimage_collisions — options sharing identical image bytes\n`);
  console.log(`  SAME-FIELD  ${String(sameFieldCollisions.length).padStart(4)} image(s)  ${rowsIn(sameFieldCollisions)} row(s)   <- BLOCKING: rival options on one menu, indistinguishable`);
  console.log(`  CROSS-FIELD ${String(crossFieldCollisions.length).padStart(4)} image(s)  ${rowsIn(crossFieldCollisions)} row(s)   <- different options, different menus: suspicious, not fatal`);
  console.log(`  fan-out     ${String(sameOptionFanOut.length).padStart(4)} image(s)             <- one option across products: CORRECT, ignored\n`);

  for (const e of sameFieldCollisions.slice(0, 25)) {
    console.log(`  BLOCKING  ${e.image}`);
    for (const m of e.sameFieldMenus) console.log(`            ${m}`);
  }
  if (sameFieldCollisions.length > 25) console.log(`  ... and ${sameFieldCollisions.length - 25} more`);

  if (crossFieldCollisions.length) {
    console.log('');
    for (const e of crossFieldCollisions.slice(0, 10)) {
      console.log(`  cross     ${e.image}`);
      console.log(`            ${e.options.join(' / ')}  across  ${e.fields.join(', ')}`);
    }
    if (crossFieldCollisions.length > 10) console.log(`  ... and ${crossFieldCollisions.length - 10} more`);
  }
}

const out = path.join(PUBLIC, 'images/reports/image-collisions.json');
fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), sameFieldCollisions, crossFieldCollisions, sameOptionFanOutCount: sameOptionFanOut.length }, null, 2));
console.log(`\nwrote ${path.relative(ROOT, out).split(path.sep).join('/')}`);
process.exit(sameFieldCollisions.length ? 1 : 0);
