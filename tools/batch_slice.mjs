#!/usr/bin/env node
/**
 * batch_slice.mjs — hand one worker its own slice of the prepared batch.
 *
 * The batch payload is a single ~800 KB file holding every prepared prompt.
 * Nothing should read the whole thing just to work on five cuffs, so this
 * groups the payload by (part, field) and prints one group on request.
 *
 * It also decides whether a group is a MEASURED LADDER, which changes how the
 * photographs must be taken. The 2026-07-28 stitch-ladder work and the
 * 2026-08-08 hem work both measured the same hard limit: at full-garment
 * framing 1 mm is about 1% of frame width, so a graduated series comes back
 * non-monotonic — the 0.5 cm rung rendered shorter than the 0.1 cm rung.
 * Exact values, ratio anchors and FORBIDDEN lines all failed to fix it.
 *
 * The fix on record is to shoot the whole ladder as a SET: extreme macro,
 * identical cloth and crop on every rung, a shared physical scale reference in
 * frame, and monotonicity judged across the set rather than per image. That is
 * what --group emits, with the macro block appended identically to every rung
 * so the rungs differ only in the dimension being sold.
 *
 * A ladder is detected structurally, not by field name: two labels that become
 * the SAME string once their numbers are removed differ only by measurement.
 * "3.0 cm (1 Button)" vs "3.4 cm (1 Button)" is a ladder pair; "3.7 cm
 * (1 Button)" vs "3.7 cm (2 Button)" is not — a button count is renderable.
 *
 * Usage
 *   node tools/batch_slice.mjs --list
 *   node tools/batch_slice.mjs --group="shirt-cuff::long_sleeve_cuff_width"
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PAYLOAD = path.join(REPO, 'public/images/reports/batch-payload.json');

const arg = (k) => { const h = process.argv.find((a) => a.startsWith(`--${k}=`)); return h ? h.split('=').slice(1).join('=') : undefined; };

const payload = JSON.parse(fs.readFileSync(PAYLOAD, 'utf8'));

/** Strip every number so two rungs of one ladder collapse to the same string. */
const skeleton = (label) => String(label)
  .replace(/[0-9]+(?:[.,][0-9]+)?/g, '#')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

/** Does this label carry a measurement at all? A bare shape name never does. */
const hasMeasure = (label) => /[0-9]+(?:[.,][0-9]+)?\s*(?:cm|mm|"|inch)/i.test(String(label));

const groups = new Map();
for (const it of payload.items ?? []) {
  const key = `${it.part}::${it.field}`;
  if (!groups.has(key)) groups.set(key, { key, part: it.part, field: it.field, items: [] });
  groups.get(key).items.push(it);
}

/**
 * A group is a ladder when at least two of its members are the same option
 * apart from a number. Those members — and only those — get the macro
 * treatment; a shape option sharing the field is still shot normally.
 */
function ladderMembers(g) {
  const bySkeleton = new Map();
  for (const it of g.items) {
    if (!hasMeasure(it.label)) continue;
    const s = skeleton(it.label);
    if (!bySkeleton.has(s)) bySkeleton.set(s, []);
    bySkeleton.get(s).push(it);
  }
  const rungs = [];
  for (const members of bySkeleton.values()) if (members.length >= 2) rungs.push(...members);
  return rungs;
}

/** The numeric value being sold, used to order the rungs and check monotonicity. */
const measureOf = (label) => {
  const m = String(label).match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:cm|mm|"|inch)/i);
  return m ? Number(m[1].replace(',', '.')) : null;
};

/**
 * The block appended to every rung of a ladder, byte-identical across the set.
 * Any variation here would reintroduce the confound the set is meant to remove:
 * if the cloth or the crop moves between rungs, a size difference cannot be
 * attributed to the dimension.
 */
function macroBlock(dimension, value, unit, siblings) {
  const others = siblings.filter((v) => v !== value).sort((a, b) => a - b);
  return [
    '',
    'MACRO SET DISCIPLINE — this photograph belongs to a graduated series.',
    `The single subject of this frame is the ${dimension}, measured at ${value} ${unit}.`,
    'EXTREME MACRO: the finished edge fills the frame. No more than about 3 cm of',
    'garment is visible corner to corner. The viewer is close enough that a',
    'millimetre is an obvious fraction of the picture, not a rounding error.',
    'A SCALE REFERENCE is in frame and in focus: a tailor\'s steel rule laid flat',
    'against the edge, its engraved centimetre graduations legible and running',
    'parallel to the dimension being measured, so the size can be read off the',
    'photograph itself rather than inferred.',
    'The cloth is a plain mid-grey worsted with a visible twill, lit identically,',
    'shot square-on at the same distance and the same crop as every other member',
    'of this series. Nothing about the frame changes between members except the',
    'dimension itself.',
    `FORBIDDEN: rendering this dimension at ${others.length ? others.join(' or ') + ' ' + unit : 'any other size'};`,
    'pulling back to a full-garment or half-garment view; omitting the rule;',
    'a rule whose graduations are decorative, blurred, or unreadable; printed',
    'numerals, captions, dimension arrows or annotation text added onto the image.',
  ].join('\n');
}

const enriched = [...groups.values()].map((g) => {
  const rungs = ladderMembers(g);
  const rungIds = new Set(rungs.map((r) => r.option));
  const values = rungs.map((r) => measureOf(r.label)).filter((v) => v != null);
  return { ...g, isLadder: rungs.length >= 2, rungIds, values };
});

if (process.argv.includes('--list')) {
  const rows = enriched.sort((a, b) => (b.items.length - b.rungIds.size) - (a.items.length - a.rungIds.size));
  let shootable = 0;
  for (const g of rows) {
    const n = g.items.length - g.rungIds.size;
    shootable += n;
    if (!n) { console.log(`  -  ALL-RUNGS  ${g.key}  (${g.rungIds.size} spec-only)`); continue; }
    console.log(`${String(n).padStart(3)}  ${g.rungIds.size ? `+${g.rungIds.size} rungs` : '         '}  ${g.key}`);
  }
  console.log(`\ngroups ${rows.length}   shootable ${shootable}   measured rungs excluded ${rows.reduce((n, g) => n + g.rungIds.size, 0)}`);
  process.exit(0);
}

/**
 * --skip-rungs: emit the group WITHOUT its measured-ladder members.
 *
 * Settled 2026-08-10, third independent test. The macro-set fix from the
 * 2026-07-28 stitch ladder was finally run properly — extreme macro, a steel
 * rule in frame, the whole series shot together — on the 7-rung trouser
 * extension ladder. Every rung failed: minimum category scores 20 to 70 with
 * three or four blocking findings each. The "15 cm" rung rendered an extension
 * measuring about 4 cm against its own ruler, and the model would not even hold
 * the crop and rule scale constant between rungs, which the method depends on.
 *
 * The photographs were beautiful. That is the trap. And the ruler made it
 * strictly worse: without it a wrong dimension is invisible, with it the error
 * is measurable by the customer, in frame, in our own catalog.
 *
 * A dimension is the entire content of these options, so an image that gets it
 * wrong has no residual value — unlike a shape option, where a near-miss still
 * teaches the customer something. Their tech-pack drawing already carries the
 * dimension and is the correct reference. These are spec-only.
 */
const SKIP_RUNGS = process.argv.includes('--skip-rungs');

const want = arg('group');
if (!want) { console.error('need --list or --group=<part>::<field>'); process.exit(2); }
const g = enriched.find((x) => x.key === want);
if (!g) { console.error(`no such group: ${want}`); process.exit(2); }

const unitOf = (label) => (/mm/i.test(label) ? 'mm' : 'cm');
const source = SKIP_RUNGS ? g.items.filter((it) => !g.rungIds.has(it.option)) : g.items;
const out = source.map((it) => {
  const isRung = g.rungIds.has(it.option);
  const value = measureOf(it.label);
  const prompt = isRung && value != null
    ? it.prompt + '\n' + macroBlock(g.field.replace(/[-_]/g, ' '), value, unitOf(it.label), g.values)
    : it.prompt;
  return {
    product: it.product, option: it.option, label: it.label, field: it.field, part: it.part,
    rows: it.rows.length, publicUrl: it.publicUrl, isRung, measure: value,
    checklist: it.checklist, requiredTokens: it.requiredTokens, prompt,
  };
});

console.log(JSON.stringify({
  group: g.key, isLadder: g.isLadder,
  ladderValues: g.isLadder ? [...new Set(g.values)].sort((a, b) => a - b) : [],
  count: out.length, items: out,
}, null, 2));
