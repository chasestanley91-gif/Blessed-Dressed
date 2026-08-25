#!/usr/bin/env node
// Classifies the craft-option catalog by PATTERN IMPACT, which is the axis a
// pattern-supplied MTM factory cares about — not the axis the customer-facing
// configurator is organised around.
//
// Yamamoto EXCY's factories register master patterns WE supply and adjust size
// and posture from them; they cannot originate design patterns. So the question
// they need answered is not "how many options" but "how many patterns".
//
//   node sourcing/classify-options.mjs
//
// The lists below are judgement calls by garment construction and MUST be
// reviewed by a patternmaker before any list is sent to a factory.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Groups that change the MASTER BODY BLOCK — a distinct pattern per variant.
const BODY_BLOCK = new Set([
  // suit
  'front-style', 'button-config', 'lapel-style', 'back-vent-style', 'lining-coverage',
  // shirt
  'front', 'back', 'shoulder',
  // trousers
  'pleat-style', 'leg-shape', 'back-darts',
  // vest
  'back-style-vest', 'neckline-style', 'lapel-neckline', 'bottom-shape-vest',
]);

// Groups needing a COMPONENT pattern piece that attaches to an existing block.
const COMPONENT = new Set([
  // suit
  'chest-pocket', 'lower-pocket', 'ticket-pocket', 'coin-pocket', 'chest-dart',
  'hem-gusset', 'sleeve-vent', 'cuff-style', 'elbow-patch', 'facing-style',
  'pen-pocket', 'namecard-pocket', 'inner-ticket-pocket', 'mp3-pocket',
  'half-lining-shape', 'lapel-width',
  // shirt
  'collar', 'collar_stand', 'collar_stand_height', 'placket', 'placket_width',
  'pocket', 'hem', 'yoke', 'cuff', 'cuff_pleat', 'sleeve_tab', 'epaulet',
  'long_sleeve_cuff_width',
  // trousers
  'front-pocket-style', 'watch-pocket', 'back-pocket-style', 'waistband-style',
  'waistband-extension', 'belt-loops', 'fly-style', 'hem-style', 'heel-guard',
  'lining-style', 'back-crotch-lining', 'pocket-depth',
  // vest
  'chest-pocket-vest', 'lower-pockets-vest', 'ticket-pocket-vest', 'back-waist-belt-fabric',
]);

// Non-selectable section headings in the configurator.
const HEADER = new Set([
  // suit
  'shoulder-structure', 'lapel', 'suit-pockets', 'sleeves-cuffs', 'back-vents',
  'handmade', 'suit-details', 'interior', 'suit-lining', 'external-decoration',
  // shirt
  'canvas-front', 'pocket-hem', 'cuffs', 'back-structure', 'details-contrast', 'labels',
  // trousers
  'front-pockets', 'waist-detail', 'pleats-structure', 'back', 'lining-internal',
  'details-contrast', 'extras',
  // vest
  'pockets', 'back-fit', 'contrast-vest', 'lining-vest', 'buttons-thread-vest', 'fitting-vest',
]);

const GROUP_RE = /id:\s*['"]([a-z0-9_-]+)['"],\s*\n\s*label:\s*['"]([^'"]+)['"]/g;

const products = ['suit', 'shirt', 'trousers', 'vest'];
const report = [];

for (const product of products) {
  let src;
  try {
    src = readFileSync(join(root, 'src/data/options', `${product}.ts`), 'utf8');
  } catch {
    continue;
  }
  const buckets = { block: [], component: [], finishing: [], header: [] };
  for (const [, id, label] of src.matchAll(GROUP_RE)) {
    if (HEADER.has(id)) buckets.header.push(label);
    else if (BODY_BLOCK.has(id)) buckets.block.push(label);
    else if (COMPONENT.has(id)) buckets.component.push(label);
    else buckets.finishing.push(label);
  }
  const selectable = buckets.block.length + buckets.component.length + buckets.finishing.length;
  report.push({ product, selectable, ...buckets });
}

for (const r of report) {
  console.log(`\n${r.product.toUpperCase()}  —  ${r.selectable} selectable groups`);
  console.log(`  master body block   ${String(r.block.length).padStart(3)}   ${r.block.join(', ') || '—'}`);
  console.log(`  component pattern   ${String(r.component.length).padStart(3)}   ${r.component.join(', ') || '—'}`);
  console.log(`  finishing / spec    ${String(r.finishing.length).padStart(3)}   (no pattern required)`);
}

const totals = report.reduce((a, r) => ({
  selectable: a.selectable + r.selectable,
  block: a.block + r.block.length,
  component: a.component + r.component.length,
  finishing: a.finishing + r.finishing.length,
}), { selectable: 0, block: 0, component: 0, finishing: 0 });

console.log(`\nACROSS ALL PRODUCTS`);
console.log(`  ${totals.selectable} selectable groups`);
console.log(`  ${totals.block} change the master body block  — a pattern each`);
console.log(`  ${totals.component} need a component pattern piece`);
console.log(`  ${totals.finishing} are finishing or construction spec — NO pattern (${Math.round(totals.finishing / totals.selectable * 100)}%)`);
