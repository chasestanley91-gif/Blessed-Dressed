#!/usr/bin/env node
// propagate_legacy_audit.mjs — carry an existing legacy verdict across products.
//
// WHY. The catalog deliberately fans ONE approved photo across the same craft
// option on several products: sport-coat/lbh-no1-dc-straight and
// suit-2pc/lbh-no1-dc-straight are the same option identity showing the same
// file. image_collisions.mjs already treats that fan-out as correct, not a
// defect. So once a photo has been judged against a blueprint for one product,
// re-running a vision audit on the identical (optionId, photo, blueprint)
// triple on a sibling product cannot produce new information — it can only
// produce disagreement noise.
//
// This tool does NOT grade anything. It copies a verdict that already exists,
// and only when all three of these match exactly:
//
//   1. optionId      — same craft option
//   2. liveImage     — byte-path of the same shipped photo
//   3. illustration  — the same blueprint was the yardstick
//
// If the blueprint differs, the verdict is NOT propagated: the same photo
// judged against a different drawing is a genuinely different question, and
// gets queued for a real audit instead.
//
// Every emitted row is marked propagated:true and names its source row, so the
// ledger never claims a vision pass that did not happen.
//
// Usage:
//   node tools/propagate_legacy_audit.mjs            # write verdicts file
//   node tools/propagate_legacy_audit.mjs --dry-run  # report only

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const dryRun = process.argv.includes('--dry-run');

const idx = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'images/reports/repo-index.json'), 'utf8'));
const led = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'images/reports/legacy-visual-audit.json'), 'utf8'));

// Catalog lookup so we can compare the blueprint behind each graded row.
const recordOf = new Map();
for (const r of idx.records) recordOf.set(`${r.product}/${r.option}`, r);

const graded = new Map(led.rows.map((r) => [r.option, r]));

// Key a graded verdict on the triple that makes it transferable.
const byTriple = new Map();
for (const row of led.rows) {
  const src = recordOf.get(row.option);
  if (!src) continue;
  const optId = row.option.split('/')[1];
  const key = `${optId}|${row.liveImage}|${src.illustration || ''}`;
  if (!byTriple.has(key)) byTriple.set(key, row);
}

const out = [];
const skippedBlueprint = [];
for (const r of idx.records) {
  if (!r.inScope || r.stage !== 'legacy-shipped-unverified') continue;
  const addr = `${r.product}/${r.option}`;
  if (graded.has(addr)) continue;

  const key = `${r.option}|${r.liveImage}|${r.illustration || ''}`;
  const hit = byTriple.get(key);
  if (!hit) {
    // Same option + same photo but a DIFFERENT drawing — do not propagate.
    const loose = [...byTriple.values()].find(
      (v) => v.option.split('/')[1] === r.option && v.liveImage === r.liveImage,
    );
    if (loose) skippedBlueprint.push({ addr, source: loose.option });
    continue;
  }

  out.push({
    option: addr,
    verdict: hit.verdict,
    liveImage: r.liveImage,
    confidence: hit.confidence,
    propagated: true,
    propagatedFrom: hit.option,
    why:
      `Propagated from ${hit.option}: same craft option, same shipped photo ` +
      `(${r.liveImage}) and same blueprint (${r.illustration}). No new vision ` +
      `pass was run. Original finding: ${hit.why}`,
  });
}

const byVerdict = {};
for (const o of out) byVerdict[o.verdict] = (byVerdict[o.verdict] || 0) + 1;

console.log(`propagate_legacy_audit — ${out.length} verdict(s) transferable`);
for (const [v, n] of Object.entries(byVerdict).sort()) console.log(`  ${v.padEnd(7)} ${n}`);
if (skippedBlueprint.length) {
  console.log(
    `\n  ${skippedBlueprint.length} row(s) NOT propagated: same photo, different blueprint — needs a real audit`,
  );
  for (const s of skippedBlueprint.slice(0, 10)) console.log(`    ${s.addr}  (source ${s.source})`);
  if (skippedBlueprint.length > 10) console.log(`    … ${skippedBlueprint.length - 10} more`);
}

if (dryRun) {
  console.log('\n--dry-run: nothing written');
} else {
  const dest = path.join(PUBLIC, 'images/reports/legacy-propagated-verdicts.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(`\nwrote ${path.relative(ROOT, dest)}`);
  console.log('Apply with: node tools/log_legacy_audit.mjs public/images/reports/legacy-propagated-verdicts.json');
}
