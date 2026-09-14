#!/usr/bin/env node
/**
 * audit_prompts.mjs — look for the defect classes wave-02 found, across a whole
 * prepared batch, BEFORE any credit is spent on it.
 *
 * WHY
 * ---
 * Wave-02 was 40 crafts and five prompt defects were found by reading them —
 * a catalogue number read as the word "no", a per-side count stated as a
 * whole-garment total, a styling rule the owner had overruled, a duplicated
 * correction block, and a prompt claiming photographs were attached when none
 * were. Each one would have produced a confident, wrong photograph that QC
 * cannot see is wrong, because QC scores fidelity to the reference.
 *
 * 248 identities remain. Reading them all by hand is not realistic; the failures
 * above all have a machine-checkable signature, and this checks for exactly
 * those. It spends nothing and it decides nothing — it prints what to look at.
 *
 * CHECKS
 *   absence-vs-label      the prompt frames the option as an ABSENCE while its
 *                         label names a positive feature (the No.1 class)
 *   per-side-count        the description says "on each"/"per side" but the
 *                         COUNT LOCK states a bare total
 *   phantom-references    claims photographs are attached, but the craft has no
 *                         non-withheld owner reference on disk
 *   duplicate-correction  the same OWNER CORRECTION text emitted more than once
 *   missing-correction    a state-C craft (owner rejected a prior attempt) whose
 *                         prompt carries no correction block at all
 *   label-vs-description  the option label names a shape the description
 *                         contradicts (the ext-curved / ext-pointed class)
 *   leaked-placeholder    a raw null / undefined / NaN / [object Object] made it
 *                         into the prompt text, which the model reads literally
 *   measurement-dropped   the option label states a dimension (8.5 cm, 101°) that
 *                         the prompt never repeats — the model would guess it
 *   checklist-thin        too few review points for the owner to judge against
 *   checklist-measurement-dropped
 *                         the checklist omits a dimension the label states
 *   correction-markup     the owner's rejection note reached the prompt as raw
 *                         LaTeX / drafting derivation rather than an instruction
 *   correction-bloated    an unsanitised correction over 2,000 characters
 *
 * USAGE
 *   node tools/audit_prompts.mjs                     # audits batch-payload.json
 *   node tools/audit_prompts.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAYLOAD = path.join(REPO, 'public/images/reports/batch-payload.json');
const QUEUE = path.join(REPO, 'data-store/generation-queue.json');
const PIPE = path.join(REPO, '.craft-pipeline');
const OUT = path.join(REPO, 'public/images/reports/prompt-audit.json');

const JSON_OUT = process.argv.includes('--json');

const payload = JSON.parse(fs.readFileSync(PAYLOAD, 'utf8'));
const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));

/** craft rows keyed by product/option, so state and rejection history are known. */
const stateOf = new Map();
for (const e of queue.entries) {
  const k = `${e.product}/${e.optionId}`;
  if (!stateOf.has(k)) stateOf.set(k, e);
}

const SHAPE_WORDS = ['square', 'round', 'pointed', 'curved', 'sharp', 'straight', 'slanted'];
/**
 * Shapes that are the SAME shape under two names. A tab nose described as
 * "pointed" for a label that says "Sharp" is not the ext-curved/ext-pointed
 * defect — it is a synonym, and flagging it buries the real contradictions.
 */
const SHAPE_SYNONYMS = [new Set(['pointed', 'sharp']), new Set(['round', 'curved'])];
const sameShape = (a, b) => a === b || SHAPE_SYNONYMS.some((g) => g.has(a) && g.has(b));

/**
 * Only ANTONYMS are a contradiction. "Different word" was too blunt: a Square
 * Jeans Pocket described as having "a sharp 90° corner" is not a conflict — a
 * square corner is a sharp one. Flagging that buries the two real defects.
 */
const CONTRADICTS = {
  square: ['round', 'curved'],
  round: ['square', 'pointed', 'sharp', 'straight'],
  curved: ['square', 'straight', 'pointed', 'sharp'],
  pointed: ['round', 'curved'],
  sharp: ['round', 'curved'],
  straight: ['curved', 'round', 'slanted'],
  slanted: ['straight'],
};

/**
 * A shape word inside a negation is not an assertion about this craft.
 * "…follow a gentle concave arc rather than a STRAIGHT line" describes what the
 * collar is NOT, and reading it as the collar's shape inverted the meaning.
 */
function assertedShapes(text) {
  const t = text.toLowerCase();
  return SHAPE_WORDS.filter((w) => {
    let i = t.indexOf(w);
    while (i !== -1) {
      const before = t.slice(Math.max(0, i - 30), i);
      // `than` covers both "rounded off rather than left SQUARE" and the
      // comparative "more refined than a SHARP squared cuff" — in shape prose,
      // whatever follows "than" is the thing this craft is NOT.
      if (!/\b(than|instead of|not|never|no longer|as opposed to|unlike)\s[^.]*$/.test(before)) return true;
      i = t.indexOf(w, i + 1);
    }
    return false;
  });
}

/**
 * Every measurement in a text, canonicalised to "<number><unit>" — no spaces, no
 * trailing zeros. Compared by SET MEMBERSHIP rather than by building a regex per
 * measurement: a per-measurement regex has to escape the decimal point and the
 * word boundary, and this session lost those backslashes through a shell layer
 * twice, producing a checker that reported 38 of 38 prompts as broken when none
 * were. Set membership has nothing to escape.
 */
function measurements(text) {
  const out = new Set();
  const re = /(\d+(?:\.\d+)?)\s*(cm|mm|°)/gi;
  let m;
  while ((m = re.exec(String(text ?? ''))) !== null) {
    let n = m[1];
    if (n.includes('.')) n = n.replace(/0+$/, '').replace(/\.$/, '');
    out.add(n + m[2].toLowerCase());
  }
  return out;
}

const findings = [];
const flag = (it, kind, detail) => findings.push({ kind, craft: `${it.product}/${it.option}`, label: it.label, detail });

for (const it of payload.items) {
  const p = it.prompt ?? '';
  const label = String(it.label ?? '');
  const lower = label.toLowerCase();

  // 1. framed as an absence while the label names a real feature
  const framedAbsence = /ABSENCE of a feature|This option is the ABSENCE|PROVE THE ABSENCE/.test(p);
  // Mirror the builder's rule exactly, or this reports its own disagreement as a
  // defect. "Plain Hem 5.0 cm" and "Flat Front, Single Dart" ARE distinguished
  // by what is missing (a cuff; a pleat) and the absence framing is deliberate
  // there — that is what the rule was written for. What must still flag is the
  // word appearing MID-label on a positive feature ("RL Flat Dress Pocket").
  const labelIsAbsence = (/^(no|none|without|clean|ventless|unlined|flat|plain)\b/.test(lower)
    || /\((?:\s*(?:no|none|without)\b[^)]*)\)/i.test(lower))
    && !/^no\.?\s*\d/.test(lower);
  if (framedAbsence && !labelIsAbsence) {
    flag(it, 'absence-vs-label', `prompt frames an ABSENCE but the label "${label}" names a positive feature`);
  }

  // 2. per-side wording with a bare total in the COUNT LOCK
  const detail = (p.match(/Distinguishing construction detail[^\n]*/) ?? [''])[0];
  const perSide = /\b(on each|each lapel|each side|per side|per lapel|both lapels)\b/i.test(`${detail} ${label}`);
  const countLock = (p.match(/COUNT LOCK[^\n]*/) ?? [''])[0];
  if (perSide && countLock && !/PER SIDE|ON EACH SIDE/i.test(countLock)) {
    flag(it, 'per-side-count', `description says per-side but COUNT LOCK reads: ${countLock.slice(0, 110)}`);
  }

  // 3. claims attached photographs it does not have
  const claimsAttached = /photographs are attached|photograph\(s\) of THIS exact craft option, supplied by the owner and attached/i.test(p);
  const refFile = path.join(PIPE, it.product, it.option, 'owner-references.json');
  let liveRefs = 0;
  if (fs.existsSync(refFile)) {
    try { liveRefs = (JSON.parse(fs.readFileSync(refFile, 'utf8')).references ?? []).filter((r) => !r.withheld).length; } catch { /* ignore */ }
  }
  if (claimsAttached && liveRefs === 0) {
    flag(it, 'phantom-references', 'prompt says photographs are attached, but no non-withheld owner reference exists');
  }

  // 4. the same correction emitted twice
  const blocks = p.split('OWNER CORRECTION AFTER REVIEW').slice(1).map((s) => s.slice(0, 240));
  if (blocks.length !== new Set(blocks).size) {
    flag(it, 'duplicate-correction', `${blocks.length} correction blocks, ${new Set(blocks).size} distinct`);
  }

  // 5. a rejected craft with nothing encoding the rejection
  const st = stateOf.get(`${it.product}/${it.option}`);
  if (st?.state === 'C' && blocks.length === 0) {
    flag(it, 'missing-correction', `state C (${st.why}) but the prompt carries no OWNER CORRECTION block`);
  }

  // 7. a template hole that filled with nothing. Found 2026-08-26: the owner
  // correction block interpolated `c.attemptRejected` raw and printed "attempt
  // null was rejected by the owner". The image model reads that literally and a
  // human reviewing the prompt reads it as a bug. Cheap to check, and it covers
  // every future interpolation of a missing value, not just that one.
  const leaked = [...p.matchAll(/(?:null|undefined|NaN)|\[object Object\]/g)].map((m) => m[0]);
  if (leaked.length) {
    const at = p.indexOf(leaked[0]);
    flag(it, 'leaked-placeholder', `prompt contains a raw ${leaked[0]} — "${p.slice(Math.max(0, at - 45), at + 25).replace(/\s+/g, ' ')}"`);
  }

  // 8. V4 requires REAL measurements, not "wide" or "narrow". If the option
  // label states a dimension, the prompt must state that same dimension - a
  // "Peak 101°" rendered without 101° anywhere in the prompt is the model's
  // guess, and every peak angle we sell would collapse onto one generic lapel.
  const wantDims = measurements(label);
  if (wantDims.size) {
    const haveDims = measurements(p);
    const missingDims = [...wantDims].filter((d) => !haveDims.has(d));
    if (missingDims.length) {
      flag(it, 'measurement-dropped', `label states ${missingDims.join(', ')} but the prompt never does`);
    }
  }

  // 9. the CHECKLIST is what the owner reviews the photograph against. An empty
  // or trivial one hands them a picture and no criteria - measured on 2026-08-26,
  // 29 of the 41 queued candidates had none at all. And if the label states a
  // dimension, the checklist must state it too, or the owner cannot check the one
  // thing that separates this craft from its neighbours on the same field.
  const cl = it.checklist ?? [];
  if (cl.length < 4) {
    flag(it, 'checklist-thin', cl.length ? `only ${cl.length} checklist point(s) - too few to review against` : 'no checklist at all');
  } else if (wantDims.size) {
    const clDims = measurements(cl.join(' '));
    const missCl = [...wantDims].filter((d) => !clDims.has(d));
    if (missCl.length) flag(it, 'checklist-measurement-dropped', `label states ${missCl.join(', ')} but no checklist point does`);
  }

  // 10. an owner correction pasted in as a pattern-drafting derivation. Found
  // 2026-08-27: 18 of 190 staged prompts carried ~3,000 characters of LaTeX each
  // (\text{}, \boxed{}, Bezier control points, ASCII fold diagrams) inside a
  // prompt that, paragraphs earlier, forbids rendering any number or measurement
  // mark on the cloth. The prompt contradicted itself, and a diffusion model
  // handed pages of formulae is likelier to draw them than to satisfy them.
  const corrText = p.split('OWNER CORRECTION AFTER REVIEW').slice(1).join(' ');
  if (corrText) {
    // String.raw, deliberately. Written as ordinary quoted strings these became
    // TAB+"ext{", BACKSPACE+"oxed{" and the bare word "circ" — the last of which
    // matched "circumference" and reported clean prompts as broken. That is the
    // third pattern this run lost its backslashes passing through a shell layer;
    // String.raw removes the escape level entirely.
    const LATEX = [String.raw`\text{`, String.raw`\boxed{`, String.raw`\frac{`, String.raw`\circ`, '_{', '^{'];
    const found = LATEX.filter((t) => corrText.includes(t));
    if (found.length) flag(it, 'correction-markup', `owner correction still contains ${found.join(' ')} — run it through sanitizeCorrection`);
    else if (corrText.length > 2000) flag(it, 'correction-bloated', `${corrText.length} chars of correction text — likely an unsanitised derivation`);
  }

  // 6. the label names one shape and the description names its ANTONYM.
  // Only a true opposite counts, and only when asserted rather than negated.
  const labelShape = assertedShapes(label);
  const descShape = assertedShapes(detail);
  const clash = [];
  for (const l of labelShape) {
    for (const d of descShape) {
      if (sameShape(l, d)) continue;
      if ((CONTRADICTS[l] ?? []).includes(d)) clash.push(`${l} vs ${d}`);
    }
  }
  if (clash.length) {
    flag(it, 'label-vs-description', `label says "${labelShape.join('/')}", description asserts "${descShape.join('/')}" (${clash.join(', ')})`);
  }
}

const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;

const report = { ranAt: new Date().toISOString(), itemsAudited: payload.items.length, byKind, findings };
fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n', 'utf8');

if (JSON_OUT) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }
console.log(`prompts audited : ${payload.items.length}`);
console.log(`findings        : ${findings.length}   ${JSON.stringify(byKind)}`);
for (const f of findings.slice(0, 25)) console.log(`   [${f.kind}] ${f.craft} "${f.label}" — ${f.detail}`);
if (findings.length > 25) console.log(`   … and ${findings.length - 25} more`);
console.log(`-> ${path.relative(REPO, OUT).split(path.sep).join('/')}`);
