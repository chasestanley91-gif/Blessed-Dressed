#!/usr/bin/env node
// select_options.mjs — list catalog options (optionally filtered) with their
// extracted spec + illustration path. The work-list for single or batch runs.
//
// Usage:
//   node select_options.mjs --product=shirt --field=lapel
//   node select_options.mjs --product=suit-2pc --section=lapel --json
//   node select_options.mjs --match="small square"          # label/id substring
//   node select_options.mjs --options=<dir>                 # explicit catalog
//
// Filters (all optional, AND-combined): --product --section --field --option
//   --match=<substr>  matches option id OR label (case-insensitive)
// Output: human table, or --json for the full machine-readable array.

import { resolveCatalog, iterateOptions, parseArgs } from './lib/catalog.mjs';
import { extractSpec } from './lib/spec.mjs';

const args = parseArgs();
let cat;
try {
  cat = resolveCatalog({ options: args.options, public: args.public });
} catch (e) {
  console.error('ERROR: ' + e.message);
  process.exit(1);
}

const match = (args.match || '').toLowerCase();
const rows = [];
for (const opt of iterateOptions(cat, { product: args.product })) {
  if (args.section && opt.sectionId !== args.section) continue;
  if (args.field && opt.fieldId !== args.field) continue;
  if (args.option && opt.optionId !== args.option) continue;
  if (match && !(`${opt.optionId} ${opt.label}`.toLowerCase().includes(match))) continue;
  const spec = extractSpec(opt);
  rows.push(spec);
}

if (args.json) {
  console.log(JSON.stringify({ catalog: cat.optionsDir, count: rows.length, options: rows }, null, 2));
  process.exit(0);
}

if (!rows.length) {
  console.log('No options matched. Check --product/--section/--field/--match.');
  process.exit(0);
}

console.log(`Catalog: ${cat.optionsDir}`);
console.log(`${rows.length} option(s):\n`);
for (const s of rows) {
  const illu = s.illustrationExists ? 'DISK' : s.illustrationRemote ? 'URL ' : s.illustration ? 'MISS' : 'NONE';
  const dims = [...s.dimensions, ...s.angles, ...(s.counts || [])].join(' ') || '-';
  console.log(`• ${s.addr}`);
  console.log(`    label : ${s.label}`);
  console.log(`    part  : ${s.part}   dims: ${dims}   shapes: ${s.shapes.join('/') || '-'}`);
  console.log(`    flags : ${s.flags.join(', ') || '-'}`);
  console.log(`    illus : [${illu}] ${s.illustration || '(none)'}`);
}
console.log(`\nNext: extract_spec.mjs --product=… --option=… to preview + persist the spec.`);
