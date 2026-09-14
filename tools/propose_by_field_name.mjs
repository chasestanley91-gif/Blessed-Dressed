#!/usr/bin/env node
/**
 * propose_by_field_name.mjs — propose supplier fields for blocked catalog fields
 * by matching the supplier's HUMAN FIELD NAME, recovered by extract_field_names.
 *
 * WHY THIS BEATS EVERY EARLIER PROPOSER
 * -------------------------------------
 * Every previous proposer scored VALUE labels, because that was the only text
 * available. That is a weak signal and it produced two whole classes of error:
 *
 *   false positives — four interior-pocket fields all publish exactly
 *     Left / Right / Both / None, so each scored a perfect 4/4 against the other
 *     three. Three catalog fields sat blocked for months on that ambiguity.
 *   false negatives — `waistband-width` was tested against RECTL, whose values
 *     run 5cm..15CM, and rejected as "a different measurement". It is. The
 *     trouser waistband width field is RECTK. Nothing in the value labels could
 *     have said so; the field NAME says it outright.
 *
 * This proposes only. It applies nothing and it rejects nothing — a name match
 * proves the two fields are ABOUT the same thing, not that their value sets
 * join. That still needs the drawings.
 *
 * USAGE
 *   node tools/propose_by_field_name.mjs
 *   node tools/propose_by_field_name.mjs --min=70
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'public', 'images', 'reports', 'field-name-candidates.json');
const CAT = { jacket: 'BB', shirt: 'BC', trousers: 'BD', vest: 'BM' };

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const MIN = Number(arg('min', '70'));

const FN = JSON.parse(fs.readFileSync(path.join(REPO, 'data-store/supplier/field-names.json'), 'utf8'));
const queue = JSON.parse(fs.readFileSync(path.join(REPO, 'data-store/generation-queue.json'), 'utf8'));
const labels = {};
for (const c of Object.values(CAT)) {
  const p = path.join(REPO, 'data-store/supplier', `craft-labels-${c}.json`);
  labels[c] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')).fields : {};
}

const partFor = (p, s) => {
  s = String(s || '');
  if (/^Trousers-/i.test(s)) return 'trousers';
  if (/^Vest-/i.test(s)) return 'vest';
  if (['shirt', 'trousers', 'vest'].includes(p)) return p;
  return 'jacket';
};
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const toks = (s) => new Set(norm(s).split(' ').filter((w) => w.length >= 3));

/**
 * Groups that are not craft options at all. `LREWA "Waist"` sits under Body
 * measurement and `BDJHD "Head"` under Bodyshape adjustment — both scored high
 * against `waist-detail` and `sleeve-head` purely on the word. A measurement is
 * not a craft option and can never illustrate one.
 */
const NON_CRAFT_GROUPS = /body measurement|bodyshape adjustment|try-on measurement|finished measurement/i;

const blocked = new Map();
for (const e of queue.entries) {
  if (e.state !== 'A') continue;
  const part = partFor(e.product, e.sectionId);
  const fieldId = e.fieldId || e.field;
  const k = `${part}|${fieldId}`;
  if (!blocked.has(k)) blocked.set(k, { part, fieldId, fieldLabel: e.field ?? '', rows: 0, options: new Set() });
  const b = blocked.get(k);
  b.rows += 1;
  b.options.add(e.label);
}

const proposals = [];
for (const [, info] of blocked) {
  const cat = CAT[info.part];
  const dict = FN.byCategory[cat]?.fields ?? {};
  // Match on the field ID with hyphens as spaces, and on the human field label
  // the catalog itself carries — whichever scores better.
  const targets = [norm(info.fieldId.replace(/[-_]/g, ' ')), norm(info.fieldLabel)].filter(Boolean);
  const cands = [];
  for (const [code, d] of Object.entries(dict)) {
    if (!d.name) continue;
    if (NON_CRAFT_GROUPS.test(d.group ?? '')) continue;
    const nt = toks(d.name);
    let best = 0;
    for (const t of targets) {
      const tt = toks(t);
      if (!tt.size || !nt.size) continue;
      let score = 0;
      if (norm(d.name) === t) score = 100;
      else if ([...tt].every((w) => nt.has(w))) score = 80;
      else if ([...nt].every((w) => tt.has(w))) score = 70;
      else { const inter = [...tt].filter((w) => nt.has(w)).length; if (inter >= 2) score = 40 + inter; }
      best = Math.max(best, score);
    }
    if (best >= MIN) cands.push({ code, name: d.name, group: d.group, score: best, valueCount: (labels[cat]?.[code]?.values ?? []).length });
  }
  cands.sort((a, b) => b.score - a.score || Math.abs(a.valueCount - info.options.size) - Math.abs(b.valueCount - info.options.size));
  if (!cands.length) continue;
  proposals.push({
    part: info.part, catalogField: info.fieldId, catalogFieldLabel: info.fieldLabel,
    blockedRows: info.rows, optionCount: info.options.size,
    options: [...info.options],
    candidates: cands.slice(0, 3),
    // A candidate that publishes FEWER values than we have options can never
    // fill the field on its own; flagged so it is not mistaken for a solution.
    note: cands[0].valueCount < info.options.size
      ? `top candidate publishes ${cands[0].valueCount} values for ${info.options.size} options — cannot fill the field alone`
      : '',
  });
}
proposals.sort((a, b) => b.blockedRows - a.blockedRows);

const rows = proposals.reduce((a, p) => a + p.blockedRows, 0);
fs.writeFileSync(OUT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  minScore: MIN,
  note: 'Proposals only. A field-NAME match proves the two fields are about the same thing; it does NOT prove their value sets join. Confirm against the drawings before applying.',
  blockedFieldsWithCandidate: proposals.length, blockedRowsCovered: rows,
  proposals,
}, null, 2) + '\n', 'utf8');

console.log(`blocked fields with a named candidate : ${proposals.length}`);
console.log(`blocked rows covered                  : ${rows}`);
console.log(`exact name matches (score 100)        : ${proposals.filter((p) => p.candidates[0].score === 100).length}`);
console.log(`top candidate too few values          : ${proposals.filter((p) => p.note).length}`);
console.log(`-> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
