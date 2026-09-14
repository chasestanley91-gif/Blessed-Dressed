#!/usr/bin/env node
/**
 * sibling_framing_sets.mjs — assemble the comparison sets that per-image QC
 * cannot see.
 *
 * THE GAP
 * -------
 * `garment-image-qc` grades one photograph against one illustration. That is the
 * right test for a craft with a shape of its own — a shawl lapel, a patch pocket,
 * a bellows. It is NOT sufficient for the 444 catalog rows (88 families) whose
 * members differ from one another by nothing but a number:
 *
 *     lapel-width          4.5 · 5.0 · 5.5 … 12.5 cm   (17 values, ×3 products)
 *     extension-length     5 · 5.5 · 6 · 6.5 · 7 · 13 · 15 cm
 *     lapel-style peaks    99° · 101° · 102° · 105° · 110° · 115°
 *
 * Every member of such a family can pass its own QC — accurate feature, faithful
 * to its own drawing — and the set can still be useless, because the six images
 * were shot at six different distances. Put them side by side in the builder and
 * a 5 cm lapel can look wider than a 7 cm one. V4's test ("the customer should be
 * able to compare any two craft options side-by-side and immediately understand
 * the difference") is a test on the SET, and nothing was applying it.
 *
 * `build_prompt` already emits a MATCHED FRAMING clause for these, and it is
 * precise about the two ways it can fail — exaggerating the feature, or moving
 * the camera. This tool does not re-state the rule; it assembles the evidence
 * needed to check whether the rule held.
 *
 * WHAT IT DOES
 * ------------
 * Reads measurement-families.json, finds which members already have a candidate
 * image on disk, and emits the sets that are ready to be compared. It decides
 * nothing — comparing images is a vision job. It makes that job possible.
 *
 * USAGE
 *   node tools/sibling_framing_sets.mjs
 *   node tools/sibling_framing_sets.mjs --min=2      # sets with at least N members shot
 *   node tools/sibling_framing_sets.mjs --ready      # only sets that are COMPLETE
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAMILIES = path.join(REPO, 'public/images/reports/measurement-families.json');
const PIPE = path.join(REPO, '.craft-pipeline');
const OUT = path.join(REPO, 'public/images/reports/sibling-framing-sets.json');
const NL = String.fromCharCode(10);

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const MIN = Number(arg('min', '2'));
const READY_ONLY = process.argv.includes('--ready');

if (!fs.existsSync(FAMILIES)) {
  console.error('missing measurement-families.json — build it first.');
  process.exit(1);
}
const { families } = JSON.parse(fs.readFileSync(FAMILIES, 'utf8'));

/** Every candidate on disk for one craft, newest attempt last. */
function candidates(product, option) {
  const dir = path.join(PIPE, product, option);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /^candidate-\d+\.png$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map((f) => path.join(dir, f));
}

/** The option id behind a label, read back out of the catalog. */
const optionIdByLabel = new Map();
for (const file of fs.readdirSync(path.join(REPO, 'data-store/options'))) {
  if (!file.endsWith('.json')) continue;
  const productId = file.replace(/\.json$/, '');
  const doc = JSON.parse(fs.readFileSync(path.join(REPO, 'data-store/options', file), 'utf8'));
  for (const s of doc.sections ?? []) {
    for (const fl of s.fields ?? []) {
      for (const o of fl.options ?? []) optionIdByLabel.set(`${productId}|${fl.id}|${o.label}`, o.id);
    }
  }
}

const sets = [];
for (const fam of families) {
  const members = [];
  for (const label of fam.labels) {
    const optionId = optionIdByLabel.get(`${fam.prod}|${fam.field}|${label}`);
    if (!optionId) continue;
    const cands = candidates(fam.prod, optionId);
    members.push({
      option: optionId,
      label,
      shot: cands.length > 0,
      latest: cands.length ? path.relative(REPO, cands[cands.length - 1]).split(path.sep).join('/') : null,
      attempts: cands.length,
    });
  }
  const shot = members.filter((m) => m.shot);
  if (shot.length < MIN) continue;
  const complete = shot.length === members.length;
  if (READY_ONLY && !complete) continue;
  sets.push({
    product: fam.prod, field: fam.field, stem: fam.stem,
    membersTotal: members.length, membersShot: shot.length, complete,
    // A set is only worth comparing once every member exists; a partial set can
    // still be checked for drift between the members that DO exist, but it must
    // not be signed off, because the missing ones may be the outliers.
    status: complete ? 'ready-to-compare' : 'partial',
    members,
  });
}

sets.sort((a, b) => b.membersShot - a.membersShot || b.membersTotal - a.membersTotal);

const ready = sets.filter((s) => s.complete);
fs.writeFileSync(OUT, JSON.stringify({
  ranAt: new Date().toISOString(),
  note: 'Comparison sets for measurement families. Per-image QC cannot detect the failure these expose: every member accurate to its own drawing, but shot at different distances, so the set misleads when the customer compares two options side by side. Compare a set by opening every `latest` together and checking that garment scale, crop and camera distance are constant across the set - the FEATURE should change, nothing else.',
  familiesConsidered: families.length,
  setsWithAtLeast: MIN,
  setsFound: sets.length,
  setsComplete: ready.length,
  sets,
}, null, 2) + NL, 'utf8');

console.log(`measurement families            : ${families.length}`);
console.log(`sets with >= ${MIN} member(s) shot    : ${sets.length}`);
console.log(`sets COMPLETE (every member shot): ${ready.length}`);
for (const s of sets.slice(0, 12)) {
  console.log(`   ${s.complete ? 'READY  ' : 'partial'} ${s.product}/${s.field.padEnd(20)} ${s.membersShot}/${s.membersTotal}  ${s.members.filter((m) => m.shot).map((m) => m.label).slice(0, 5).join(' | ')}`);
}
console.log(`-> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
