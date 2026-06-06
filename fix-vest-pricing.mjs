import { readFileSync, writeFileSync } from 'fs';

const KEEP_IDS = new Set([
  'vest-bh-hand',   // hand-worked buttonholes
  'vest-pick-full', // full edge pick stitch by hand
]);

const filePath = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/src/data/options/vest.ts';
const src = readFileSync(filePath, 'utf8');
let removed = 0;

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
console.log(`✓ vest.ts — stripped priceAdj from ${removed} options`);
