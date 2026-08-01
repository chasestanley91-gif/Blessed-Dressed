#!/usr/bin/env node
// collision_triage.mjs — split the image collisions into the two kinds that
// need OPPOSITE responses, so credits are not spent where they cannot help.
//
// tools/image_collisions.mjs says WHICH options show the customer the same
// picture. It does not say WHY, and the why decides everything:
//
//   SOURCE-LIMITED      the colliding options share one blueprint, or their
//                       blueprints are byte-identical. No prompt can separate
//                       them, and QC actively drives them together, because QC
//                       scores fidelity TO the blueprint. Regenerating burns
//                       credits to produce images that must still match.
//                       -> needs drawings, or a merge/reprice ruling.
//
//   GENERATION-LIMITED  the blueprints genuinely differ. The material to tell
//                       these apart already exists and the generator did not
//                       use it. -> recoverable by re-running, no new source.
//
// The distinction is not theoretical. jeans-arc and jeans-square rendered the
// same side-seam pocket and scored 15-24, and their sheets differ measurably —
// drop 1.31 vs 1.00 waistband depths, run angle 3.8 vs 5.7 degrees, and one
// carries a terminal 34-degree hook the other lacks. That pair was recoverable,
// and the cause turned out to be catalog prose describing the wrong geometry.
// The peak-lapel ladder is the opposite: ten options, one drawing, nothing to
// recover.
//
// Usage: node tools/collision_triage.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const idx = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'images/reports/repo-index.json'), 'utf8'));
const col = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'images/reports/image-collisions.json'), 'utf8'));

const hashCache = new Map();
const hashOf = (rel) => {
  if (!rel) return null;
  if (hashCache.has(rel)) return hashCache.get(rel);
  let h = null;
  try { h = crypto.createHash('md5').update(fs.readFileSync(path.join(PUBLIC, rel.replace(/^\//, '')))).digest('hex'); } catch { h = null; }
  hashCache.set(rel, h);
  return h;
};

// option key -> its blueprint, taken from the catalog index
const blueprintOf = new Map();
for (const r of idx.records) {
  if (r.inScope && r.illustration) blueprintOf.set(`${r.product}/${r.field}/${r.option}`, r.illustration);
}

const sourceLimited = [];
const generationLimited = [];
const unknown = [];

for (const entry of col.sameFieldCollisions) {
  // Only the options that actually collide on one field matter here.
  const keys = entry.rows.map((r) => r.split(' "')[0]);
  const blueprints = keys.map((k) => blueprintOf.get(k)).filter(Boolean);
  if (blueprints.length < 2) { unknown.push({ ...entry, why: 'blueprints not resolvable for these rows' }); continue; }

  const hashes = blueprints.map(hashOf);
  if (hashes.some((h) => h === null)) { unknown.push({ ...entry, why: 'a blueprint file is missing on disk' }); continue; }

  const distinctPaths = new Set(blueprints).size;
  const distinctBytes = new Set(hashes).size;

  const rec = {
    image: entry.image,
    optionCount: entry.options.length,
    rowCount: entry.rows.length,
    distinctBlueprintPaths: distinctPaths,
    distinctBlueprintBytes: distinctBytes,
    options: entry.options,
    blueprints: [...new Set(blueprints)],
    optionBlueprint: Object.fromEntries(keys.map((k,i)=>[k.split("/").pop(), blueprints[i]]).filter(([,v])=>v)),
  };

  // One drawing behind them all — by path or, more damningly, by bytes.
  if (distinctBytes === 1) {
    rec.why = distinctPaths === 1
      ? 'all colliding options point at ONE blueprint file'
      : `${distinctPaths} filenames, but the files are BYTE-IDENTICAL`;
    sourceLimited.push(rec);
  } else {
    rec.why = `${distinctBytes} genuinely different blueprints — the material to separate these exists`;
    generationLimited.push(rec);
  }
}

// FAMILY GRANULARITY IS NOT ENOUGH, and reporting only at that level is
// actively misleading. lp-slanted-flap-55 is flagged recoverable because it
// contains two different sheets — but inside it:
//
//   lp-slanted-flap-55, -65        share 02A1  -> a cm ladder, NOT separable
//   lp-straight-jetted-40 ... -65  share 0201  -> a cm ladder, NOT separable
//   slanted-flap vs straight-jetted   two sheets -> genuinely separable
//
// Someone reading "recoverable" and regenerating six straight-jetted options
// would get six identical images and spend three credits proving it. So also
// enumerate every PAIR of colliding options and say which pairs a regeneration
// could actually separate.
function separablePairs(list) {
  const out = [];
  for (const fam of list) {
    const keys = fam.rows ? fam.rows : null;
    const opts = fam.options;
    for (let i = 0; i < opts.length; i += 1) {
      for (let j = i + 1; j < opts.length; j += 1) {
        const a = fam.optionBlueprint?.[opts[i]];
        const b = fam.optionBlueprint?.[opts[j]];
        if (!a || !b) continue;
        out.push({ family: fam.image, a: opts[i], b: opts[j], separable: hashOf(a) !== hashOf(b) });
      }
    }
  }
  return out;
}

const rows = (l) => l.reduce((s, e) => s + e.rowCount, 0);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ sourceLimited, generationLimited, unknown }, null, 2));
} else {
  console.log('\ncollision_triage — why each collision happened, and what fixes it\n');
  console.log(`  SOURCE-LIMITED      ${String(sourceLimited.length).padStart(3)} families  ${String(rows(sourceLimited)).padStart(4)} rows   needs DRAWINGS or a merge ruling`);
  console.log(`  GENERATION-LIMITED  ${String(generationLimited.length).padStart(3)} families  ${String(rows(generationLimited)).padStart(4)} rows   RECOVERABLE by re-running`);
  if (unknown.length) console.log(`  unresolved          ${String(unknown.length).padStart(3)} families  ${String(rows(unknown)).padStart(4)} rows`);

  console.log('\n  --- GENERATION-LIMITED: spend credits here, the source is adequate ---');
  for (const e of generationLimited.sort((a, b) => b.rowCount - a.rowCount)) {
    console.log(`  ${String(e.rowCount).padStart(3)} rows  ${e.optionCount} options  ${e.image}`);
    console.log(`           ${e.why}`);
  }

  const pairs = separablePairs(generationLimited);
  const sep = pairs.filter((p) => p.separable);
  const stuck = pairs.filter((p) => !p.separable);
  console.log('\n  --- PAIR DETAIL inside those families ---');
  console.log(`  ${sep.length} of ${pairs.length} option pairs can actually be separated by re-running.`);
  if (stuck.length) {
    console.log(`  The other ${stuck.length} share one drawing and will stay identical however many times they are regenerated:`);
    for (const p of stuck) console.log(`    NOT separable:  ${p.a}  vs  ${p.b}`);
  }

  console.log('\n  --- SOURCE-LIMITED: regenerating cannot help ---');
  for (const e of sourceLimited.sort((a, b) => b.rowCount - a.rowCount).slice(0, 12)) {
    console.log(`  ${String(e.rowCount).padStart(3)} rows  ${e.optionCount} options  ${e.image}`);
    console.log(`           ${e.why}`);
  }
  if (sourceLimited.length > 12) console.log(`  ... and ${sourceLimited.length - 12} more`);
}

const out = path.join(PUBLIC, 'images/reports/collision-triage.json');
fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), sourceLimited, generationLimited, unknown }, null, 2));
console.log(`\nwrote ${path.relative(ROOT, out).split(path.sep).join('/')}`);
