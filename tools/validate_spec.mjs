#!/usr/bin/env node
/**
 * validate_spec.mjs — the gate that stands between a specification and a
 * generation credit.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every expensive failure in this project has the same shape: the pipeline
 * continued with an incomplete or wrong specification and produced a
 * confident, well-scored photograph of the wrong thing. Nothing downstream can
 * catch it — QC scores fidelity to the reference drawing, so a faithful render
 * of a WRONG drawing scores HIGHER, not lower.
 *
 * Real examples this gate is built from:
 *   - a count regex required digits, so "Three on left, two on right" produced
 *     counts:[] and the option's entire discriminator vanished, silently;
 *   - the same broken pattern matched the letter d in prose and injected 218
 *     fabricated "d-button" counts;
 *   - 107 suit-hosted trouser options lost every shape because scope was keyed
 *     on the wrong garment;
 *   - a spec asserted both "no side adjuster" and "side adjuster";
 *   - "Left Lapel" and "Right Lapel" extract to IDENTICAL specs, so whichever
 *     is generated first is indistinguishable from the other.
 *
 * A spec that cannot be told apart from its sibling is not a specification.
 * A spec with no facts is not a specification. Both must stop the line.
 *
 * EXIT CODES
 *   0  every checked spec is generation-ready
 *   1  at least one BLOCKING failure — do not spend credits
 *
 * Usage
 *   node tools/validate_spec.mjs                     # whole catalog
 *   node tools/validate_spec.mjs --product=suit-2pc
 *   node tools/validate_spec.mjs --option=lbp-3l-2r
 *   node tools/validate_spec.mjs --queue             # only the verified queue
 *   node tools/validate_spec.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PUBLIC = path.join(REPO, 'public');
const REPORT = path.join(REPO, 'public', 'images', 'reports', 'spec-validation.json');
const SPEC_LIB = pathToFileURL(path.join(os.homedir(), '.claude/skills/tech-pack-interpreter/scripts/lib/spec.mjs')).href;

const arg = (k) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
};
const FLAG = (k) => process.argv.includes(`--${k}`);
const ONLY_PRODUCT = arg('product');
const ONLY_OPTION = arg('option');
const AS_JSON = FLAG('json');
const QUEUE_ONLY = FLAG('queue');

/** A finding that must stop generation. */
class SpecificationValidationError extends Error {
  constructor(code, addr, detail) {
    super(`${code} — ${addr}: ${detail}`);
    this.name = 'SpecificationValidationError';
    this.code = code; this.addr = addr; this.detail = detail;
  }
}

const { extractSpec } = await import(SPEC_LIB);

// ── mutually exclusive families: two members present = a contradiction ──────
const EXCLUSIVE = [
  ['double / side vents', 'single centre vent', 'ventless'],
  ['peak lapel', 'notch lapel', 'shawl lapel'],
  ['French / double cuff', 'barrel / button cuff'],
  ['tapered leg', 'wide leg', 'straight leg'],
  ['flat front', 'single pleat', 'double pleat'],
  ['curved hem', 'straight hem', 'squared hem'],
];

const SIDE_WORDS = /\b(left|right|both|each|either|center|centre|front|back|inside|outside|upper|lower)\b/i;

/**
 * Subject-match verdicts, keyed by drawing path.
 *
 * Produced by the visual audit that read 161 blueprints and classified each as
 * MATCH / MISMATCH / AMBIGUOUS against the option it is attached to. A drawing
 * absent from this map is UNAUDITED — which is not the same as correct, and is
 * treated as such wherever the drawing is the only specification.
 */
const SUBJECT_VERDICTS = new Map();
try {
  const audit = JSON.parse(fs.readFileSync(
    path.join(REPO, 'public', 'images', 'reports', 'subject-audit-consolidated.json'), 'utf8'));
  for (const r of audit.results ?? []) {
    if (r?.bp) SUBJECT_VERDICTS.set(r.bp, { v: r.v, ev: r.ev });
  }
} catch (err) {
  // Loudly, not silently. Running without the audit would quietly disable the
  // only check that catches a drawing depicting the wrong garment feature.
  console.error(`WARNING: subject-match audit unavailable (${err.message}) — drawing-subject checks are DISABLED for this run.`);
}

function validateOne(entry) {
  const { addr, opt, spec } = entry;
  const findings = [];
  const blocking = (code, detail) => findings.push({ level: 'BLOCK', code, detail });
  const warn = (code, detail) => findings.push({ level: 'WARN', code, detail });

  const counts = spec.counts ?? [];
  const shapes = spec.shapes ?? [];
  const flags = spec.flags ?? [];
  const dims = spec.dimensions ?? [];
  const angles = spec.angles ?? [];
  const spread = spec.spread ?? [];
  const sides = spec.sides ?? [];
  const attributes = spec.attributes ?? [];
  const supplierCodes = spec.supplierCodes ?? [];
  // styleName is deliberately NOT counted. It is the option's own label, so
  // counting it would make every option look specified and permanently blind
  // this gate to real parser gaps.
  const factCount = counts.length + shapes.length + flags.length + dims.length
    + angles.length + spread.length + sides.length + attributes.length + supplierCodes.length;

  // 1 — illustration must exist on disk and be deploy-included.
  const illus = opt.illustration ?? opt.image;
  if (!illus) blocking('NO_ILLUSTRATION', 'option has no illustration or image path');
  else if (illus.startsWith('/')) {
    const disk = path.join(PUBLIC, decodeURIComponent(illus.replace(/^\//, '')).split('?')[0]);
    if (!fs.existsSync(disk)) blocking('ILLUSTRATION_MISSING', `${illus} does not exist on disk`);
    else {
      try { fs.readFileSync(disk, { flag: 'r' }); } catch { blocking('ILLUSTRATION_UNREADABLE', illus); }
    }
  }

  // 1b — the drawing must actually depict THIS option.
  //
  // The subject-match audit read 161 drawings and found 58 that show something
  // else entirely: /images/jacket/sleeve-buttonhole/by-hands.jpg is a lapel
  // buttonhole POSITION diagram with no sleeve, no cuff and nothing expressing
  // hand-vs-machine. Generating from it produces a confident, high-scoring
  // photograph of the wrong garment feature — QC grades fidelity to the
  // reference, so a faithful render of a WRONG reference scores HIGHER.
  // This is the only check that can catch that class of failure.
  const verdict = illus ? SUBJECT_VERDICTS.get(illus) : undefined;
  if (verdict?.v === 'MISMATCH') {
    blocking('ILLUSTRATION_SUBJECT_MISMATCH', `audited drawing does not depict this option — ${verdict.ev ?? ''}`.trim());
  } else if (verdict?.v === 'AMBIGUOUS') {
    warn('ILLUSTRATION_SUBJECT_AMBIGUOUS', `audit could not confirm the drawing depicts this option — ${verdict.ev ?? ''}`.trim());
  }

  // 2 — the parser must have produced SOMETHING. An absence option ("None") is
  // legitimately factless; anything else is either a parser gap or an option
  // that is NAMED rather than described.
  if (!spec.absence && factCount === 0) {
    if (spec.styleName) {
      // "Journey of Life", "Brave Winds, Break Waves" — the supplier's
      // decorative pattern names. No parser can extract geometry from these
      // words, and inventing it is precisely what this pipeline must never do.
      // The drawing is the entire specification, so it has to be a drawing
      // somebody has actually confirmed. An unaudited one is not evidence.
      if (verdict?.v === 'MATCH') {
        warn('DRAWING_IS_SOLE_SPEC', `named style with no textual facts; generation must copy the verified drawing "${illus}" exactly`);
      } else {
        blocking('DRAWING_IS_SOLE_SPEC', `named style "${spec.styleName}" states no construction facts, so the drawing is the only specification — but it is ${verdict ? verdict.v : 'UNAUDITED'}. Verify the drawing before spending a credit.`);
      }
    } else {
      blocking('NO_FACTS_EXTRACTED', 'parser produced zero dimensions, angles, counts, shapes, flags, spread or attributes');
    }
  }

  // 3 — every count must be a resolved number token. "d-button" got through here.
  for (const c of counts) {
    if (!/^\d+-/.test(c)) blocking('UNRESOLVED_COUNT', `count token "${c}" is not number-prefixed`);
  }

  // 4 — if the text names a side, the spec must carry it. Losing the side is
  // invisible downstream: a mirror-flipped render scores 100% against a flat
  // drawing.
  const text = `${opt.label ?? ''} ${opt.description ?? ''}`;
  if (SIDE_WORDS.test(text)) {
    const sideCaptured = (spec.sides ?? []).length > 0
      || counts.some((c) => /-on-/.test(c))
      || shapes.some((s) => SIDE_WORDS.test(s))
      || flags.some((f) => SIDE_WORDS.test(f));
    if (!sideCaptured) warn('SIDE_NOT_CAPTURED', `text names a side (${(text.match(SIDE_WORDS) ?? [])[0]}) but no spec value records it`);
  }

  // 5 — no contradictory members of a mutually exclusive family.
  for (const family of EXCLUSIVE) {
    const present = family.filter((f) => shapes.includes(f));
    if (present.length > 1) blocking('CONFLICTING_SHAPES', `mutually exclusive: ${present.join(' + ')}`);
  }

  // 6 — an absence option must not assert the feature it denies.
  if (spec.absence && (shapes.length || flags.length || counts.length)) {
    warn('ABSENCE_ASSERTS_FEATURE', `absence option still carries ${JSON.stringify({ shapes, flags, counts })}`);
  }

  // 7 — no duplicates within a list.
  for (const [name, list] of Object.entries({ counts, shapes, flags, dims, angles })) {
    const dupes = list.filter((v, i) => list.indexOf(v) !== i);
    if (dupes.length) blocking('DUPLICATE_PROPERTY', `${name} repeats ${[...new Set(dupes)].join(', ')}`);
  }

  return { addr, label: opt.label, findings, factCount, absence: !!spec.absence, inScope: !!spec.generate };
}

// ── walk the catalog ───────────────────────────────────────────────────────
const entries = [];
for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
  const product = file.replace(/\.json$/, '');
  if (ONLY_PRODUCT && product !== ONLY_PRODUCT) continue;
  const cfg = JSON.parse(fs.readFileSync(path.join(OPTIONS_DIR, file), 'utf8'));
  for (const s of cfg.sections ?? []) {
    for (const f of s.fields ?? []) {
      for (const o of f.options ?? []) {
        if (ONLY_OPTION && o.id !== ONLY_OPTION) continue;
        const illus = o.illustration ?? o.image;
        const diskOk = illus && illus.startsWith('/')
          ? fs.existsSync(path.join(PUBLIC, decodeURIComponent(illus.replace(/^\//, '')).split('?')[0]))
          : false;
        let spec;
        try {
          spec = extractSpec({
            productId: product, sectionId: s.id, sectionLabel: s.label,
            fieldId: f.id, fieldLabel: f.label, hint: f.hint,
            label: o.label, description: o.description,
            image: illus, imageExists: diskOk,
          });
        } catch (e) {
          entries.push({ addr: `${product}|${f.id}|${o.id}`, opt: o, spec: null, throwErr: e.message, field: f.id, product });
          continue;
        }
        entries.push({ addr: `${product}|${f.id}|${o.id}`, opt: o, spec, field: f.id, product });
      }
    }
  }
}

const results = [];
for (const e of entries) {
  if (e.spec === null) {
    results.push({ addr: e.addr, label: e.opt.label, findings: [{ level: 'BLOCK', code: 'PARSER_THREW', detail: e.throwErr }], factCount: 0, inScope: true });
    continue;
  }
  results.push({ ...validateOne(e), field: e.field, product: e.product });
}

// 8 — sibling collision: two DIFFERENT options in the same product+field whose
// entire measured signature is identical. Whichever is photographed first, the
// other is indistinguishable — the catalog's whole job is telling them apart.
const byField = new Map();
for (const e of entries) {
  if (!e.spec || !e.spec.generate) continue;
  const key = `${e.product}|${e.field}`;
  if (!byField.has(key)) byField.set(key, []);
  byField.get(key).push(e);
}
let collisions = 0;
for (const [key, group] of byField) {
  const sig = new Map();
  for (const e of group) {
    const s = JSON.stringify([
      (e.spec.dimensions ?? []).slice().sort(), (e.spec.angles ?? []).slice().sort(),
      (e.spec.counts ?? []).slice().sort(), (e.spec.shapes ?? []).slice().sort(),
      (e.spec.flags ?? []).slice().sort(), (e.spec.spread ?? []).slice().sort(),
      (e.spec.sides ?? []).slice().sort(),
      (e.spec.attributes ?? []).map((a) => `${a.feature}.${a.attribute}=${a.value}`).sort(),
      (e.spec.supplierCodes ?? []).slice().sort(),
      // The option's own name is part of its identity. Two siblings that share
      // every measured fact are still different options if the catalog names
      // them differently -- and the drawing is what tells them apart.
      e.spec.styleName ?? '',
    ]);
    if (!sig.has(s)) sig.set(s, []);
    sig.get(s).push(e.opt.id);
  }
  for (const [, ids] of sig) {
    if (ids.length < 2) continue;
    collisions += ids.length;
    for (const id of ids) {
      const r = results.find((x) => x.addr === `${key.split('|')[0]}|${key.split('|')[1]}|${id}`);
      if (r) r.findings.push({ level: 'BLOCK', code: 'SIBLING_COLLISION', detail: `identical measured signature to ${ids.filter((i) => i !== id).join(', ')} in the same field` });
    }
  }
}

// ── report ────────────────────────────────────────────────────────────────
const blocked = results.filter((r) => r.findings.some((f) => f.level === 'BLOCK'));
const warned = results.filter((r) => !r.findings.some((f) => f.level === 'BLOCK') && r.findings.length);
const clean = results.filter((r) => !r.findings.length);

const byCode = {};
for (const r of results) for (const f of r.findings) byCode[f.code] = (byCode[f.code] ?? 0) + 1;

// Scope matters for the headline. Fabric, button and thread-colour swatches are
// excluded from photography by the owner's standing instruction, and an option
// with no blueprint cannot be generated regardless — neither is a parser defect,
// and counting them makes the real number unreadable.
const inScope = results.filter((r) => r.inScope);
const inScopeBlocked = inScope.filter((r) => r.findings.some((f) => f.level === 'BLOCK'));
const inScopeClean = inScope.filter((r) => !r.findings.length);
const inScopeWarned = inScope.filter((r) => !r.findings.some((f) => f.level === 'BLOCK') && r.findings.length);
const scopeByCode = {};
for (const r of inScope) for (const f of r.findings) scopeByCode[f.code] = (scopeByCode[f.code] ?? 0) + 1;

if (AS_JSON) {
  console.log(JSON.stringify({ checked: results.length, blocked: blocked.length, warned: warned.length, clean: clean.length, byCode, inScope: { checked: inScope.length, blocked: inScopeBlocked.length, warned: inScopeWarned.length, clean: inScopeClean.length, byCode: scopeByCode }, results }, null, 1));
} else {
  console.log(`SPEC VALIDATION — ${results.length} options checked (whole catalog)`);
  console.log(`  generation-ready : ${clean.length}`);
  console.log(`  warnings only    : ${warned.length}`);
  console.log(`  BLOCKED          : ${blocked.length}`);
  console.log('');
  console.log(`IN SCOPE FOR PHOTOGRAPHY — ${inScope.length} options`);
  console.log(`  generation-ready : ${inScopeClean.length}`);
  console.log(`  warnings only    : ${inScopeWarned.length}`);
  console.log(`  BLOCKED          : ${inScopeBlocked.length}`);
  console.log('  in-scope findings:');
  for (const [code, n] of Object.entries(scopeByCode).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${String(n).padStart(5)}  ${code}`);
  }
  console.log('');
  console.log('findings by code:');
  for (const [code, n] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(n).padStart(5)}  ${code}`);
  }
  if (blocked.length) {
    console.log('');
    console.log('first blocked options:');
    for (const r of blocked.slice(0, 8)) {
      console.log(`   ${r.addr}  "${r.label}"`);
      for (const f of r.findings.filter((x) => x.level === 'BLOCK').slice(0, 2)) console.log(`      ${f.code}: ${f.detail}`);
    }
  }
}

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(REPORT, JSON.stringify({
  generatedAt: new Date().toISOString(),
  checked: results.length, blocked: blocked.length, warned: warned.length, clean: clean.length,
  byCode, siblingCollisionOptions: collisions,
  blockedOptions: blocked,
}, null, 2) + '\n', 'utf8');
if (!AS_JSON) console.log(`\n-> ${path.relative(REPO, REPORT).split(path.sep).join('/')}`);

process.exit(blocked.length ? 1 : 0);
