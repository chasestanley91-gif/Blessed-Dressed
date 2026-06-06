/**
 * Strip priceAdj from all jacket options EXCEPT canvas tiers and handmade options.
 */
import { readFileSync, writeFileSync } from 'fs';

const KEEP_IDS = new Set([
  // suit.ts — canvas
  'ultra-thin-half', 'light-half-canvas', 'half-canvas', 'full-canvas', 'quarter-canvas',
  // suit.ts — handmade buttonholes (lapel)
  'lbh-005-hand', 'lbh-006-hand', 'lbh-017-hand', 'lbh-008-hand',
  'lbh-rome-18',       // "(H)" = by hand
  // suit.ts — front/sleeve buttonholes by hand
  'fbh-hands', 'slbh-hands',
  // suit.ts — handmade construction + decorative
  'hm-individual', 'hm-full',
  'hmd-shoulder-vent', 'hmd-full',
  // suit.ts — button sewing by hand
  'sbs-cross-hand', 'sbs-down-hand', 'sbs-eq-hand', 'sbs-sq-hand', 'sbs-under-hand',
  // suit.ts — pick stitching by hand
  'ps-015-hand', 'ps-06-hand', 'ps-double',
  // sport-coat.ts — canvas
  'sc-full-canvas', 'sc-half-canvas',
]);

function processFile(filePath) {
  const src = readFileSync(filePath, 'utf8');
  let removed = 0;

  // Each design option is on a single line like:
  //   { id: "some-id", label: "...", ..., priceAdj: 50, ... }
  // Replace `, priceAdj: N` (positive or negative) when the id is not in the keep set.
  const result = src.replace(
    /\{ id: "([^"]+)",[^\n]+\n?/g,
    (line, id) => {
      if (KEEP_IDS.has(id)) return line;
      const cleaned = line.replace(/,\s*priceAdj:\s*-?\d+/g, '');
      if (cleaned !== line) removed++;
      return cleaned;
    }
  );

  writeFileSync(filePath, result, 'utf8');
  console.log(`✓ ${filePath.split(/[\\/]/).pop()} — stripped priceAdj from ${removed} options`);
}

const base = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/src/data/options';
processFile(`${base}/suit.ts`);
processFile(`${base}/sport-coat.ts`);
console.log('\nDone — jacket pricing cleaned.');
