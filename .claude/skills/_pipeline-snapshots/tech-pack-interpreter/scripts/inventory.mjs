#!/usr/bin/env node
// inventory.mjs — the catalogue-wide DISCOVERY + COVERAGE GATE.
//
// The catalog is the source of truth, not this skill. This tool reads EVERY
// product, section, field and option that exists today (and any added later)
// and builds each option's profile (part + parsed geometry), then proves
// coverage. It is the authoritative map and the gate to run before any batch
// extraction:
//
//   every option must have a specific profile (part != generic-detail),
//   and is reported by blueprint status (local file / remote URL / none).
//
// This is deliberately self-contained (no dependency on garment-image-director
// or garment-image-qc) — it only reports what THIS skill owns: structural
// interpretation. Prompt/checklist coverage is that skill's own concern.
//
// Usage:
//   node inventory.mjs                      # human coverage summary + gate
//   node inventory.mjs --json               # full machine-readable inventory
//   node inventory.mjs --gaps               # only options needing attention
//   node inventory.mjs --product=shirt      # scope to one product
//   node inventory.mjs --options=<dir>      # explicit catalog dir
//
// Exit 0 = 100% profiled. Exit 1 = a coverage hole exists.

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

const inv = [];
const perProduct = {};
let unprofiled = 0;

for (const opt of iterateOptions(cat, { product: args.product })) {
  const spec = extractSpec(opt);
  const blueprint = spec.illustrationExists ? 'local' : spec.illustrationRemote ? 'remote' : 'none';
  const profiled = spec.part !== 'generic-detail';
  const kind = spec.part.startsWith('fin-') ? 'finishing' : profiled ? 'structural' : 'unprofiled';
  if (!profiled) unprofiled++;

  const rec = {
    addr: spec.addr,
    product: spec.productId,
    section: opt.sectionId,
    field: opt.fieldId,
    option: opt.optionId,
    label: spec.label,
    part: spec.part,
    kind,
    blueprint,
    excluded: spec.excluded || null,
    generate: spec.generate,
    illustration: spec.illustration,
    source: spec.source,
    dimensions: spec.dimensions,
    angles: spec.angles,
    counts: spec.counts,
    shapes: spec.shapes,
    flags: spec.flags,
  };
  inv.push(rec);

  const p = (perProduct[spec.productId] ||= {
    total: 0, structural: 0, finishing: 0, unprofiled: 0,
    local: 0, remote: 0, none: 0, generable: 0, excluded: 0, craft: 0,
  });
  p.total++;
  p[kind]++;
  p[blueprint]++;
  if (blueprint !== 'none') p.generable++;
  if (spec.excluded) p.excluded++;
  if (spec.generate) p.craft++; // in-scope: has blueprint AND not an excluded swatch
}

const exclBy = { button: 0, 'thread-color': 0, fabric: 0 };
for (const r of inv) if (r.excluded) exclBy[r.excluded] = (exclBy[r.excluded] || 0) + 1;

// Shared-illustration detection: when one drawing backs several DIFFERENT
// in-scope options, the hard reference cannot disambiguate them — "the drawing
// is law" breaks. This is a catalog/data defect (each option needs its own tech
// pack), not a skill bug, but the skill must surface it.
const byIllu = new Map();
for (const r of inv) {
  if (!r.generate || !r.illustration) continue;
  const list = byIllu.get(r.illustration) || [];
  list.push(r.addr);
  byIllu.set(r.illustration, list);
}
const sharedBlueprints = [...byIllu.entries()].filter(([, a]) => a.length > 1).sort((x, y) => y[1].length - x[1].length);
const sharedOptionCount = sharedBlueprints.reduce((n, [, a]) => n + a.length, 0);

if (args.dupes) {
  console.log(`${sharedBlueprints.length} illustration(s) are shared by ${sharedOptionCount} in-scope options ` +
    `(each needs its own tech pack — "the drawing is law" cannot disambiguate shared blueprints):\n`);
  for (const [illu, addrs] of sharedBlueprints.slice(0, 60)) {
    console.log(`• ${illu}  ←  ${addrs.length} options`);
    for (const a of addrs) console.log(`     ${a}`);
  }
  process.exit(0);
}

if (args.json) {
  console.log(JSON.stringify({ catalog: cat.optionsDir, count: inv.length, inventory: inv }, null, 2));
  process.exit(unprofiled ? 1 : 0);
}

if (args.gaps) {
  const gaps = inv.filter((r) => r.kind === 'unprofiled' || r.blueprint === 'none');
  console.log(`${gaps.length} option(s) needing attention:\n`);
  for (const r of gaps) {
    const why = [];
    if (r.kind === 'unprofiled') why.push('NO PROFILE');
    if (r.blueprint === 'none') why.push('no blueprint (cannot generate)');
    console.log(`• ${r.addr}  [${r.part}]  — ${why.join(', ')}`);
  }
  process.exit(unprofiled ? 1 : 0);
}

// Human summary -------------------------------------------------------------
const g = { total: 0, structural: 0, finishing: 0, unprofiled: 0, local: 0, remote: 0, none: 0, generable: 0, excluded: 0, craft: 0 };
console.log(`Catalog: ${cat.optionsDir}\n`);
console.log(
  'product'.padEnd(12) + 'total  struct   fin  unprof | local remote  none | excl  CRAFT'
);
for (const [prod, p] of Object.entries(perProduct)) {
  for (const k of Object.keys(g)) g[k] += p[k];
  console.log(
    prod.padEnd(12) +
      String(p.total).padStart(5) +
      String(p.structural).padStart(8) +
      String(p.finishing).padStart(6) +
      String(p.unprofiled).padStart(8) +
      ' |' + String(p.local).padStart(6) + String(p.remote).padStart(7) + String(p.none).padStart(6) +
      ' |' + String(p.excluded).padStart(5) + String(p.craft).padStart(7)
  );
}
console.log(
  '\n' + 'TOTAL'.padEnd(12) +
    String(g.total).padStart(5) + String(g.structural).padStart(8) + String(g.finishing).padStart(6) +
    String(g.unprofiled).padStart(8) +
    ' |' + String(g.local).padStart(6) + String(g.remote).padStart(7) + String(g.none).padStart(6) +
    ' |' + String(g.excluded).padStart(5) + String(g.craft).padStart(7)
);

const profiledPct = (((g.total - g.unprofiled) / g.total) * 100).toFixed(1);
console.log(`\nProfiled: ${g.total - g.unprofiled}/${g.total} (${profiledPct}%)   ` +
  `Has blueprint: ${g.generable}/${g.total}`);
console.log(`Excluded swatches (out of scope): ${g.excluded}  ` +
  `(buttons ${exclBy.button}, thread-colours ${exclBy['thread-color']}, fabrics ${exclBy.fabric})`);
console.log(`IN-SCOPE CRAFT to interpret (has blueprint, not a swatch): ${g.craft}`);
if (sharedBlueprints.length) {
  console.log(`⚠ Shared blueprints: ${sharedBlueprints.length} illustration(s) back ${sharedOptionCount} different in-scope options ` +
    `— these cannot be disambiguated by the reference (data defect). Run --dupes to list; fix the tech packs before relying on those generations.`);
}

if (unprofiled) {
  console.log(`\n✗ COVERAGE GATE FAILED — ${unprofiled} unprofiled option(s). ` +
    `Extend classifyFinish()/resolvePart() in lib/spec.mjs. Run --gaps to list them.`);
  process.exit(1);
}
console.log(`\n✓ COVERAGE GATE PASSED — every option has a specific profile.`);
console.log(`  (${g.none} option(s) have no blueprint illustration and cannot be generated — non-visual ` +
  `choices like pocket depth or thread colour; they are mapped but skipped at generation.)`);
process.exit(0);
