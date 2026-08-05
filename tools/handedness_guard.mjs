#!/usr/bin/env node
// handedness_guard.mjs — catch the mirror-flip defect that QC structurally cannot.
//
// WHY. An option whose identity is a SIDE ("Right Side", "Left Chest Besom",
// "Watch Pocket Right") is decided by one bit of information. That bit is the
// one thing a flat tech-pack drawing cannot pin down in a render: mirror the
// image and it still matches the drawing's shapes, spacing and proportions
// exactly, so garment-image-qc scores it 100 and passes it. This is the same
// failure shape as a wrong blueprint — the more faithful the render, the higher
// it scores, and the defect is invisible precisely because fidelity is high.
//
// It bit us for real on coin-pocket: coin-right shows the correct COUNT (one
// patch) but sits on the viewer's right in an interior cutaway, where the
// garment is inverted and splayed and the fly-overlap convention does not
// apply. There was no cue in the frame to settle wearer-left from viewer-left,
// so it had to be logged UNSURE rather than graded.
//
// WHAT THIS DOES. Three things, none of which spend a credit:
//   1. Enumerates every in-scope option whose LABEL encodes a side.
//   2. Splits them by lifecycle stage, so the already-SHIPPED ones surface as a
//      re-verify queue rather than being assumed good.
//   3. Reports whether each option's persisted spec.json carries an explicit
//      orientation, which is the only field that can make the side checkable.
//
// It writes a queue and changes no catalog data.
//
// Usage:
//   node tools/handedness_guard.mjs              # report + write queue
//   node tools/handedness_guard.mjs --shipped    # only the shipped re-verify queue

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const shippedOnly = process.argv.includes('--shipped');

const idx = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'images/reports/repo-index.json'), 'utf8'));

// A side-word in the LABEL is the signal. Matching the option id instead would
// miss "Watch Pocket Right" (id wp-2) and fire on unrelated ids containing 'l'.
const SIDE = /\b(left|right)\b/i;

const rows = idx.records.filter((r) => r.inScope && SIDE.test(r.label || ''));

// Does a persisted spec exist, and does it state an orientation? Without one,
// the prompt cannot have restated the side in wearer terms.
const specState = (product, option) => {
  const p = path.join(ROOT, '.craft-pipeline', product, option, 'spec.json');
  if (!fs.existsSync(p)) return 'no-spec';
  try {
    const s = JSON.parse(fs.readFileSync(p, 'utf8'));
    const o = s.orientation || s.view || s.orientationView || null;
    return o ? `orientation:${typeof o === 'string' ? o : o.view || 'set'}` : 'spec-no-orientation';
  } catch {
    return 'spec-unreadable';
  }
};

const byStage = {};
const enriched = [];
for (const r of rows) {
  byStage[r.stage] = (byStage[r.stage] || 0) + 1;
  enriched.push({
    addr: `${r.product}/${r.option}`,
    label: r.label,
    field: r.field,
    stage: r.stage,
    liveImage: r.liveImage || null,
    illustration: r.illustration || null,
    spec: specState(r.product, r.option),
  });
}

const SHIPPED = new Set(['shipped', 'shipped-waived']);
const shipped = enriched.filter((e) => SHIPPED.has(e.stage));
const pending = enriched.filter((e) => !SHIPPED.has(e.stage));

console.log('handedness_guard — options whose identity is a SIDE');
console.log('');
console.log(`  ${rows.length} in-scope rows · ${new Set(rows.map((r) => r.option)).size} distinct options · ${new Set(rows.map((r) => r.field)).size} fields`);
console.log('');
console.log('  by stage:');
for (const [k, v] of Object.entries(byStage).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(v).padStart(4)}  ${k}`);
}

const noOrientation = enriched.filter((e) => e.spec !== 'no-spec' && !e.spec.startsWith('orientation:'));
console.log('');
console.log(`  ${enriched.filter((e) => e.spec === 'no-spec').length} have no spec.json yet (orientation will be required at interpret time)`);
console.log(`  ${noOrientation.length} have a spec.json that does NOT state an orientation`);

console.log('');
console.log(`  --- ALREADY SHIPPED (${shipped.length}) — QC passed these, but QC cannot see a mirror flip ---`);
for (const s of shipped) {
  console.log(`    ${s.addr.padEnd(34)} ${String(s.label).padEnd(30)} ${s.stage}`);
}

if (!shippedOnly) {
  const byField = {};
  for (const e of pending) byField[e.field] = (byField[e.field] || 0) + 1;
  console.log('');
  console.log(`  --- NOT YET SHIPPED (${pending.length}) — lock the convention BEFORE generating ---`);
  for (const [k, v] of Object.entries(byField).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(v).padStart(4)}  ${k}`);
  }
}

const dest = path.join(PUBLIC, 'images/reports/handedness-queue.json');
fs.writeFileSync(
  dest,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      what:
        'Options whose identity is a side (left/right). A mirrored render scores 100 against a ' +
        'flat drawing, so garment-image-qc cannot detect this class. Shipped rows need re-verification ' +
        'against an agreed view convention; pending rows must state handedness in wearer terms in the prompt.',
      convention:
        'RECOMMENDED: exterior, worn, wearer-facing. State the side in WEARER terms in every prompt ' +
        '("on the wearer\'s right forepart"), never in viewer terms, and never rely on the drawing alone.',
      counts: { total: rows.length, shipped: shipped.length, pending: pending.length },
      shipped,
      pending,
    },
    null,
    2,
  ),
);
console.log('');
console.log(`wrote ${path.relative(ROOT, dest)}`);
