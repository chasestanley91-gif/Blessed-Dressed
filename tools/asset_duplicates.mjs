#!/usr/bin/env node
// asset_duplicates.mjs — group shipped images by FILE HASH FIRST, across the whole
// in-scope catalog, then describe how each group spreads across fields.
//
// WHY THIS EXISTS ALONGSIDE image_collisions.mjs.
//
// That tool partitions its results into `sameFieldCollisions` and
// `crossFieldCollisions` and never unions across the partition. Measured
// 2026-08-01: its largest same-field group holds 10 options and its largest
// cross-field group 7 — while a QC grader hashing the actually-served .webp files
// found ONE file serving 13 options spanning both `chest-pocket` and
// `lower-pocket`. A group that straddles two fields is split into a same-field
// fragment plus a cross-field fragment and is never seen whole, so the blast
// radius of any single duplicated file is systematically under-stated.
//
// Field is an ATTRIBUTE of a collision, not a way to partition the search. This
// tool groups by hash first and reports field spread as a property of the group.
//
// It also separates the two things that look alike but mean opposite things:
//
//   FAN-OUT      the same craft option recurring across products (shirt /
//                sport-coat / suit-2pc / …). One photo SHOULD serve all of them —
//                that is what makes the catalog affordable. Not a defect.
//   COLLISION    genuinely DISTINCT craft options sharing one photo. A customer
//                choosing between them sees the same picture twice.
//
// image_collisions.mjs is left in place; project_state.mjs consumes its output.
//
// Usage: node tools/asset_duplicates.mjs [--json] [--min 2] [--top 20]

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const MIN = Number(arg('--min', 2));
const TOP = Number(arg('--top', 20));

const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/images/reports/repo-index.json'), 'utf8'));

// Group by the SHA-1 of the bytes actually served. repo-index already computes it,
// so this needs no re-hashing and cannot drift from what the site serves.
const byHash = new Map();
for (const r of idx.records) {
  if (!r.inScope || !r.shipped || !r.shippedSha1) continue;
  if (!byHash.has(r.shippedSha1)) byHash.set(r.shippedSha1, []);
  byHash.get(r.shippedSha1).push(r);
}

const groups = [];
for (const [sha, rows] of byHash) {
  const options = [...new Set(rows.map((r) => r.option))];
  if (options.length < MIN) continue;                 // one option over many products = fan-out, fine
  const fields = [...new Set(rows.map((r) => r.field))];
  const products = [...new Set(rows.map((r) => r.product))];
  groups.push({
    sha: sha.slice(0, 8),
    file: rows[0].shippedPath,
    optionCount: options.length,
    fieldCount: fields.length,
    rowCount: rows.length,
    options,
    fields,
    products,
    spread: fields.length === 1 ? 'same-field' : 'CROSS-FIELD',
  });
}
groups.sort((a, b) => b.optionCount - a.optionCount || b.rowCount - a.rowCount);

const fanOut = [...byHash.values()].filter((rows) => new Set(rows.map((r) => r.option)).size === 1 && rows.length > 1);

if (argv.includes('--json')) {
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), groups }, null, 2));
} else {
  const rows = groups.reduce((s, g) => s + g.rowCount, 0);
  const opts = groups.reduce((s, g) => s + g.optionCount, 0);
  const cross = groups.filter((g) => g.fieldCount > 1);
  console.log(`\nasset_duplicates — grouped by file hash across the whole in-scope catalog\n`);
  console.log(`  ${groups.length} distinct files each serve ${MIN}+ DISTINCT craft options`);
  console.log(`  covering ${opts} options and ${rows} catalog rows`);
  console.log(`  of those, ${cross.length} span more than one field — the groups the field-partitioned`);
  console.log(`  view splits in half and never reports whole`);
  console.log(`\n  (${fanOut.length} further files are legitimate FAN-OUT: one option recurring across`);
  console.log(`   products. Not counted above and not a defect.)`);
  console.log(`\n  --- largest groups ---`);
  for (const g of groups.slice(0, TOP)) {
    console.log(`\n  ${String(g.optionCount).padStart(3)} options  ${String(g.rowCount).padStart(3)} rows  [${g.sha}]  ${g.spread}`);
    console.log(`      ${g.file}`);
    console.log(`      fields: ${g.fields.join(', ')}`);
    console.log(`      options: ${g.options.slice(0, 9).join(', ')}${g.options.length > 9 ? `, … +${g.options.length - 9}` : ''}`);
  }
  if (groups.length > TOP) console.log(`\n  … and ${groups.length - TOP} more groups`);
}

const out = path.join(ROOT, 'public/images/reports/asset-duplicates.json');
fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), groups }, null, 2));
console.log(`\nwrote ${path.relative(ROOT, out).split(path.sep).join('/')}`);
process.exit(groups.length ? 1 : 0);
