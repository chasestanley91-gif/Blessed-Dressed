#!/usr/bin/env node
/**
 * propose_by_matcher.mjs — find supplier fields using the SAME join logic that
 * applies them, instead of a weaker separate scorer.
 *
 * WHY
 * ---
 * `propose_field_mapping.mjs` scored candidates by counting exact-ish label
 * hits. That scorer is weaker than the matcher in `apply_field_mapping.mjs`,
 * which now understands compact forms ("Flap4.5CM"), measurement units
 * ("4cm" -> 4 + cm), token containment with minimal excess, and inflections
 * ("stitch" -> "stitching"). Every field mapped in the last three sessions was
 * found by hand precisely because the proposer could not see them:
 * `chest-pocket` -> REQPU, `sleeve-vent` -> GCOXC and `pick-stitching` -> GTEGZ
 * all scored 0 or 1 label hits under the old rule and would have been dismissed.
 *
 * This runs the REAL matcher over every supplier field that has artwork, and
 * reports how many of a catalog field's options it can actually join. A field
 * that joins most of its options is a candidate worth opening the drawing for;
 * one that joins two is not.
 *
 * Still proposes only. A high join rate says the LABELS correspond; it does not
 * say the drawing depicts that craft, and only opening it can say that.
 *
 * USAGE
 *   node tools/propose_by_matcher.mjs
 *   node tools/propose_by_matcher.mjs --write
 *   node tools/propose_by_matcher.mjs --field=perfume-pad
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V2 = path.join(REPO, 'public/images/factory/baoxiniao-v2-manifest.json');
const QUEUE = path.join(REPO, 'data-store/generation-queue.json');
const OUT = path.join(REPO, 'public/images/reports/matcher-candidates.json');

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const WRITE = process.argv.includes('--write');
const ONLY = arg('field', '');
const MIN_RATE = Number(arg('min', '0.5'));
/**
 * --artless: score against the LABEL DICTIONARY instead of the image manifest,
 * and report only fields whose best match publishes ZERO drawings.
 *
 * The blocked crafts split into two very different groups, and lumping them
 * together hid a concrete ask. Sometimes no supplier field corresponds at all -
 * genuinely unsolvable here. But sometimes the field EXISTS with correct English
 * labels matching our options nearly one-to-one, and the supplier simply has not
 * published artwork for it:
 *
 *   pen-pocket        -> KPEND  "Left jetted pocket / Drop shape left pen pocket
 *                                / Diamond..."      7 values, 0 drawings
 *   half-lining-shape -> KINBL  "Half lining / Small cut-away / 1/2 lining..."
 *   lining-coverage   -> KHALI  "Full lining / Half lining / No lining"
 *
 * That is not a mapping problem. It is a request to the supplier, naming the
 * exact field code.
 */
const ARTLESS = process.argv.includes('--artless');

// ── the matcher, kept byte-identical in behaviour to apply_field_mapping ────
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tight = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const nums = (s) => (String(s ?? '').match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n)));
const wordTokens = (s) => new Set(
  norm(s).replace(/(\d)\s*(cm|mm)(?![a-z])/g, '$1 $2').split(' ').filter((w) => w.length >= 2 && !/^\d+$/.test(w))
);

function joinOption(ourLabel, values) {
  const o = norm(ourLabel), ot = tight(ourLabel), on = nums(ourLabel);
  let hit = values.find((v) => norm(v.label) === o);
  if (hit) return hit;
  hit = values.find((v) => tight(v.label) === ot);
  if (hit) return hit;
  const pref = values.filter((v) => {
    const vt = tight(v.label);
    // ONE DIRECTION ONLY: their label may EXTEND ours with a manufacturing note
    // ("British Turn-up" -> "British turn-up cuff"). Ours extending theirs is a
    // different thing: "Side Vents + Inner Belt" prefix-matched plain "Side
    // Vents" and silently dropped the inner belt - the one feature that option
    // exists for - while REQAP publishes "Side vents with inner belt" separately.
    if (!vt.startsWith(ot)) return false;
    const vn = nums(v.label);
    return on.length === 0 ? vn.length === 0 : on.every((n, i) => vn[i] === n);
  });
  if (pref.length === 1) return pref[0];
  const ourToks = wordTokens(ourLabel);
  if (!ourToks.size) return null;
  const contained = values
    .map((v) => {
      if (on.length) { const vn = nums(v.label); if (!on.every((n) => vn.includes(n))) return null; }
      const vt = wordTokens(v.label);
      const has = (t) => vt.has(t) || (t.length >= 4 && [...vt].some((w) => w.startsWith(t) && w.length - t.length <= 3));
      for (const t of ourToks) if (!has(t)) return null;
      let excess = 0;
      for (const t of vt) if (!ourToks.has(t)) excess += 1;
      return { v, excess };
    })
    .filter(Boolean)
    .sort((a, b) => a.excess - b.excess);
  if (contained.length === 1) return contained[0].v;
  if (contained.length > 1 && contained[0].excess < contained[1].excess) return contained[0].v;
  return null;
}

function partFor(product, sectionId) {
  if (/^Trousers-/i.test(sectionId) || product === 'trousers') return 'trousers';
  if (/^Vest-/i.test(sectionId) || product === 'vest') return 'vest';
  if (product === 'shirt') return 'shirt';
  return 'jacket';
}

// ── supplier fields that actually have artwork ─────────────────────────────
const v2 = JSON.parse(fs.readFileSync(V2, 'utf8'));
const supplierFields = new Map(); // part|field -> [{code,label}]
const artCount = new Map();
for (const e of v2.images) {
  const k = `${e.part}|${e.field}`;
  artCount.set(k, (artCount.get(k) ?? 0) + 1);
  if (ARTLESS) continue;
  if (!supplierFields.has(k)) supplierFields.set(k, []);
  supplierFields.get(k).push({ code: e.value, label: e.label });
}
if (ARTLESS) {
  const CATEGORY_PART = { BB: 'jacket', BC: 'shirt', BD: 'trousers', BM: 'vest' };
  for (const [code, part] of Object.entries(CATEGORY_PART)) {
    const f = path.join(REPO, 'data-store', 'supplier', `craft-labels-${code}.json`);
    if (!fs.existsSync(f)) continue;
    for (const [fc, def] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')).fields)) {
      const vals = (def.values ?? []).map((v) => ({ code: v.code, label: v.label }));
      if (vals.length) supplierFields.set(`${part}|${fc}`, vals);
    }
  }
}

/**
 * Which supplier fields are ALREADY the source for some catalog field?
 *
 * `front-buttonhole` and `sleeve-buttonhole-type` both join 2/2 against GTECH -
 * which is the LAPEL buttonhole field, already verified and in use. A high join
 * rate says the WORDS correspond; it says nothing about the place on the
 * garment. Flagging the clash automatically is the difference between a
 * proposer that helps and one that hands over a confident wrong answer.
 */
const takenBy = new Map();
{
  const optDir = path.join(REPO, 'data-store', 'options');
  for (const file of fs.readdirSync(optDir)) {
    if (!file.endsWith('.json')) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(optDir, file), 'utf8'));
    const productId = doc.productId ?? path.basename(file, '.json');
    for (const section of doc.sections ?? []) {
      const part = partFor(productId, section.id ?? '');
      for (const field of section.fields ?? []) {
        for (const opt of field.options ?? []) {
          const ill = opt.illustration ?? opt.techpackIllustration;
          if (typeof ill !== 'string') continue;
          const m = ill.match(/\/([A-Z0-9]{3,8})\/[^/]+$/);
          if (!m) continue;
          const k = `${part}|${m[1]}`;
          if (!takenBy.has(k)) takenBy.set(k, new Set());
          takenBy.get(k).add(field.id);
        }
      }
    }
  }
}

// ── catalog fields still missing drawings ──────────────────────────────────
const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const needy = new Map();
for (const e of queue.entries) {
  if (e.state !== 'A' || e.why !== 'illustration missing') continue;
  const part = partFor(e.product, e.sectionId);
  const key = `${part}|${e.fieldId}`;
  if (!needy.has(key)) needy.set(key, { part, fieldId: e.fieldId, rows: 0, options: new Map() });
  const n = needy.get(key);
  n.rows += 1;
  n.options.set(e.optionId, e.label);
}

const out = [];
for (const n of needy.values()) {
  if (ONLY && n.fieldId !== ONLY) continue;
  const labels = [...n.options.values()];
  const scored = [];
  for (const [key, values] of supplierFields) {
    if (!key.startsWith(`${n.part}|`)) continue;
    const claimed = new Set();
    let joined = 0;
    const pairs = [];
    for (const l of labels) {
      const avail = values.filter((v) => !claimed.has(v.code));
      const m = joinOption(l, avail);
      if (!m) continue;
      claimed.add(m.code);
      joined += 1;
      if (pairs.length < 6) pairs.push({ ours: l, theirs: m.label, code: m.code });
    }
    if (!joined) continue;
    const sf = key.split('|')[1];
    const claimedByOther = [...(takenBy.get(`${n.part}|${sf}`) ?? [])].filter((f) => f !== n.fieldId);
    scored.push({
      supplierField: sf,
      alreadySourceFor: claimedByOther,
      warning: claimedByOther.length ? `ALREADY the source for ${claimedByOther.join(', ')} - a different place on the garment unless proven otherwise` : null,
      values: values.length,
      joined,
      ofOptions: labels.length,
      rate: Number((joined / labels.length).toFixed(2)),
      pairs,
    });
  }
  scored.sort((a, b) => b.rate - a.rate || b.joined - a.joined);
  if (!scored.length || scored[0].rate < MIN_RATE) continue;
  if (ARTLESS) {
    const drawings = artCount.get(`${n.part}|${scored[0].supplierField}`) ?? 0;
    if (drawings > 0) continue;          // solvable already; not an artwork gap
    scored[0].drawingsPublished = 0;
  }
  out.push({ catalogField: n.fieldId, part: n.part, rowsAtStake: n.rows, optionCount: labels.length, optionLabels: labels.slice(0, 8), candidates: scored.slice(0, 3) });
}
out.sort((a, b) => b.rowsAtStake - a.rowsAtStake);

const payload = { generatedAt: new Date().toISOString(), note: 'CANDIDATES ONLY. A high join rate says the LABELS correspond; only opening the drawing says the craft does.', minRate: MIN_RATE, fields: out };
if (WRITE) fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log(`needy fields with a candidate joining >= ${Math.round(MIN_RATE * 100)}% of options : ${out.length}`);
for (const f of out.slice(0, 16)) {
  const t = f.candidates[0];
  console.log(`${String(f.rowsAtStake).padStart(3)}r ${f.catalogField.padEnd(24)}[${f.part.padEnd(8)}] -> ${t.supplierField.padEnd(8)} joins ${t.joined}/${t.ofOptions} (${Math.round(t.rate * 100)}%) of ${t.values} values${t.warning ? '   [!] ' + t.warning : ''}`);
}
console.log(WRITE ? `\n-> ${path.relative(REPO, OUT).split(path.sep).join('/')}` : '\nreport only - re-run with --write.');
