#!/usr/bin/env node
/**
 * qc_ladder.mjs — SET QC for measured ladders.
 *
 * THE RULE THIS TOOL ENFORCES
 * ---------------------------
 * A graduated family of craft options — 0.1 / 0.3 / 0.5 / 0.6 cm topstitch, a
 * run of gorge angles, a run of lapel widths — must be QC'd as a SET for
 * monotonicity, NEVER per image. A per-image QC pass is meaningless for a
 * ladder: every rung can look like a plausible, well-made photograph while the
 * SET misrepresents the measurements the customer is paying for. Nothing in the
 * three-skill pipeline can see that, because every score in garment-image-qc is
 * a fidelity score against ONE blueprint.
 *
 * WHY (measured fact, not theory — failure-log.md, "[MEASURED LADDERS]")
 * ---------------------------------------------------------------------
 * Measured 2026-07-28, at full-garment framing:
 *   collar ladder  0.1 -> 0.3 -> 0.5 -> 0.6 cm  measured  0.312  0.404  0.316  0.476
 *                                               (the 0.5 cm rung INVERTED, and sits
 *                                                within noise of the 0.1 cm rung)
 *   cuff   ladder  0.1 -> 0.3 -> 0.5 -> 0.6 cm  measured  0.233  0.353  0.555  0.362
 *                                               (the 0.6 cm rung COLLAPSED below 0.5)
 * Exact cm values, ratio anchors, comparative-neighbour language and explicit
 * FORBIDDEN lines ALL failed. At full-garment crop 1 mm is ~1% of frame width —
 * below what the image model resolves. Evidence:
 *   public/images/reports/qa-stitch-ladder-2026-07-28.json
 *
 * THE ABSOLUTE PROHIBITION
 * ------------------------
 *   NEVER annotate different numbers onto near-identical photos — that
 *   mis-sells a measured option.
 *
 * When a ladder FAILS there are exactly two honest remedies:
 *   1. RE-SHOOT AT EXTREME MACRO. ~3 cm of the finished edge fills the frame,
 *      so 1 mm becomes ~3% of frame width and 5 mm ~17%. Identical cloth,
 *      identical crop scale and an identical in-frame scale reference (one
 *      button) on EVERY rung, or the rungs are not comparable.
 *   2. FLAG FOR REAL PHOTOGRAPHY, or recommend MERGING the options — if the
 *      supplier library does not document the difference, the catalog may be
 *      selling a granularity that does not exist.
 * Never fake the difference. Never label your way out of it.
 *
 * WHAT THIS TOOL MEASURES, AND WHAT IT REFUSES TO
 * -----------------------------------------------
 * Measurement is OPERATOR-SUPPLIED by default (`--measure=ingest`). The tool
 * ingests measured ratios in the shape of qa-stitch-ladder-2026-07-28.json (or a
 * flat/rich per-option map) and does the parsing, family partitioning,
 * monotonicity, separation and verdict logic on them. That logic is the point of
 * this tool and it is exact.
 *
 * `--measure=auto` runs an EXPERIMENTAL, deterministic, documented edge-normal
 * measurement (see measureEdgeOffset below) that always emits a confidence with
 * its four components broken out, and emits NO NUMBER AT ALL below the
 * confidence gate. It is uncalibrated — there is no per-image ground truth in
 * this repo to calibrate it against — so it is deliberately ASYMMETRIC:
 *
 *      an uncalibrated instrument may BLOCK a ladder, but may never APPROVE one.
 *
 * i.e. auto mode can return FAIL (the safe direction) and INCONCLUSIVE, but can
 * never return PASS unless a human passes --trust-auto.
 *
 * A note on what does NOT work, measured on the real shipped ladder 2026-07-30:
 * whole-image perceptual distance is useless as a discriminability signal here.
 * Mean-abs-difference on 64x64 greyscale over the six shipped collar-stitch
 * images ran 0.093-0.164 for EVERY pair — and `stitch-05-top` vs `stitch-none`
 * (0.107) sits between `stitch-01-top` vs `stitch-03-top` (0.118) and
 * `stitch-05-top` vs `stitch-06-top` (0.093). The distance is dominated by pose,
 * crop and model, not by the feature. So this tool records perceptual distance
 * as CONTEXT only and never lets it touch a verdict. Only exact-identity
 * (SHA-1 / dHash Hamming 0) is treated as proof, because that alone is proof.
 *
 * USAGE
 *   node tools/qc_ladder.mjs --list
 *       Inventory every graduated family in the catalog that needs SET QC.
 *
 *   node tools/qc_ladder.mjs --field=decoration_stitching_on_collar \
 *                            --measurements=public/images/reports/qa-stitch-ladder-2026-07-28.json \
 *                            --ladder=ladder_collar
 *       Join the catalog family to operator-supplied measurements and grade it.
 *
 *   node tools/qc_ladder.mjs --measurements=<file> --ladder=ladder_cuff
 *       Grade measurements alone, with no catalog join (rungs come from `targets`).
 *
 *   A measurement file SHOULD say which family it measured, so it can never be
 *   applied to another one:
 *       { "scope": { "product": "sport-coat", "field": "chest-dart" },
 *         "values": { "cd-minus-2": 0.25, ... } }
 *   Without a scope the file is joined only when the run resolves exactly one
 *   ladder. See joinPolicyFor().
 *
 *   node tools/qc_ladder.mjs --options=a,b,c --product=shirt --measure=auto \
 *                            --roi=0.30,0.35,0.40,0.30
 *       Experimental automatic measurement over an explicit fractional ROI.
 *
 *   node tools/qc_ladder.mjs --field=<id>                 # preflight, no measurement
 *   node tools/qc_ladder.mjs ... --json                   # report JSON to stdout
 *   node tools/qc_ladder.mjs ... --apply                  # write the report file
 *   node tools/qc_ladder.mjs --self-test                  # prove the verdict logic
 *
 * OPTIONS
 *   --field=<fieldId>          catalog field to resolve (may match several products)
 *   --options=a,b,c            explicit option ids instead of / in addition to a field
 *   --product=<productId>      restrict to one product
 *   --family=<substring>       restrict to one ladder family inside a field
 *                              (one field can hold several: a TOP ladder and an
 *                              AMF ladder both run 0.1/0.3/0.5 cm)
 *   --measurements=<path>      measured values to ingest (implies --measure=ingest)
 *   --ladder=<key>             which block inside a qa-stitch-ladder-shaped file
 *   --measure=ingest|auto|none default: ingest if --measurements given, else none
 *   --direction=asc|desc       expected measured direction vs declared (default asc)
 *   --min-sep=<n>              minimum adjacent separation, ratio units (default 0.05)
 *   --min-span-fidelity=<n>    advisory compression floor (default 0.5)
 *   --max-span-fidelity=<n>    advisory EXAGGERATION ceiling (default 2.0). The
 *                              band is deliberately reciprocal: a ladder must be
 *                              within a factor of two of the truth in EITHER
 *                              direction. Showing more difference than the
 *                              measurements contain mis-sells the rungs exactly
 *                              as badly as showing less, and is harder to spot
 *                              because the result looks convincing.
 *   --min-confidence=<n>       auto-measurement gate (default 0.6)
 *   --roi=x,y,w,h              fractional ROI for auto measurement
 *   --bands=<n>                auto-measurement sample bands (default 8)
 *   --trust-auto               allow an auto-measured ladder to reach PASS
 *   --strict-fidelity          make ladder compression a FAIL rather than advisory
 *   --out=<path>               report path override
 *   --apply                    write the report (default is a dry run)
 *   --json                     emit the report JSON on stdout
 *
 * Exit 0 = every evaluated ladder PASSED. Exit 1 = any FAIL / INCONCLUSIVE, or
 * nothing was evaluated. Failing closed is deliberate: "we could not tell" must
 * never read the same as "it is fine".
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}
const args = parseArgs();

const REPO = path.resolve(args.repo || path.join(HERE, '..'));
const OPTIONS_DIR = path.join(REPO, 'data-store', 'options');
const PUBLIC = path.join(REPO, 'public');
const REPORTS = path.join(PUBLIC, 'images', 'reports');

const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const num = (v, d) => (v === undefined || v === true || Number.isNaN(Number(v)) ? d : Number(v));

const PROHIBITION =
  'NEVER annotate different numbers onto near-identical photos — that mis-sells a measured option.';
const REMEDIES = [
  'RE-SHOOT AT EXTREME MACRO: ~3 cm of the finished edge fills the frame (1 mm becomes ~3% of frame width, 5 mm ~17%), with identical cloth, identical crop scale and an identical in-frame scale reference on every rung.',
  'FLAG FOR REAL PHOTOGRAPHY, or recommend MERGING the options if the supplier library does not document the difference the catalog is selling.',
];

// ---------------------------------------------------------------------------
// Thresholds. Every one of these is a decision, so every one is justified here
// and echoed into the report — a threshold nobody can re-derive is a magic
// number, and magic numbers are how a gate quietly stops meaning anything.
// ---------------------------------------------------------------------------
const THRESHOLDS = {
  minSeparation: num(args['min-sep'], 0.05),
  minSpanFidelity: num(args['min-span-fidelity'], 0.5),
  // The reciprocal of minSpanFidelity, deliberately: the honest band is "within a
  // factor of two of the truth, in EITHER direction". See EXAGGERATED_LADDER.
  maxSpanFidelity: num(args['max-span-fidelity'], 2.0),
  minConfidence: num(args['min-confidence'], 0.6),
  bands: Math.max(2, Math.round(num(args.bands, 8))),
};

const SEPARATION_JUSTIFICATION = [
  'minSeparation = 0.05 ratio units, a DISCRIMINABILITY floor rather than a statistical one:',
  'a difference the customer cannot see does not justify selling two options.',
  'Derivation: the only empirical noise estimate this project owns is the 2026-07-28 report’s own',
  'statement that 16.9 px vs 17.3 px — a ratio delta of ~0.004 — is "within noise, visually identical"',
  'at this framing. 0.05 is ~12x that observed noise floor.',
  'Sanity check that the floor is NOT set punitively: a 4-rung ladder needs 3 x 0.05 = 0.15 of total',
  'span to clear it, and the FAILED 2026-07-28 collar ladder already spanned 0.164 (0.312 -> 0.476).',
  'So that ladder could have cleared the separation floor had it been monotonic — the floor is not',
  'what fails it; the inversion is. The floor only catches rungs that genuinely collapse together.',
  'Separation is tested over ALL PAIRS, not just adjacent ones. In a strictly rising series the two',
  'are equivalent, but a NON-monotonic series can put two distant rungs on top of each other while',
  'every adjacent step looks well separated — which is precisely the 2026-07-28 headline finding',
  '(the 0.5 cm rung at 0.316 sits 0.004 from the 0.1 cm rung at 0.312, "visually identical").',
];

// ---------------------------------------------------------------------------
// 1. LABEL PARSING — the measured value comes from the LABEL, never from the
//    option id and never from the filename.
//
//    THE PARSING RULE, stated explicitly because this is exactly where the
//    project has been bitten before:
//
//    (a) Parse the LABEL ONLY. Option ids and supplier filenames drop the
//        decimal point: 0.6 cm becomes `06`/`stitch-06-top`, and 6.5 cm becomes
//        `65` in `square-in-65cm.jpg` while 5.0 cm becomes `5` in
//        `small-square-in-5cm.jpg`. That collision ("Square 6.5 cm" -> 65 but
//        "Small Square 5.0 cm" -> 5, failure-log 2026-07-28) is unrecoverable
//        without knowing the convention per file. The LABEL carries an
//        unambiguous decimal number next to an explicit unit, so it is the only
//        source this tool will read a measurement from.
//    (b) A number counts ONLY when immediately followed by a unit token
//        (cm | mm | ° | deg | degree(s)). "Machine", "3 Button", "YZ021" carry
//        bare digits and must never be read as measurements.
//    (c) Decimal comma is accepted and normalised ("0,6 cm" -> 0.6).
//    (d) cm/mm canonicalise to MILLIMETRES (integer-friendly, so 0.1 cm -> 1 mm
//        and float comparison noise disappears). Degrees stay degrees.
//    (e) TWO OR MORE unit-qualified numbers in one label is AMBIGUOUS. The tool
//        refuses to guess which one is the ladder axis and blocks the verdict.
//        Never invent missing tailoring detail.
//    (f) A label with no unit-qualified number is not a rung. "None" / "No
//        Stitching" is recognised as a CATEGORICAL absence and excluded with a
//        note — an option meaning "this feature is not applied" is not the
//        bottom rung of a measured scale, and folding it in would fabricate a
//        0.0 rung nobody sells.
//    (g) SIGN IS PART OF THE MEASUREMENT. `chest-dart` sells "-2 cm", "-3 cm",
//        "+2 cm" and "+3 cm" on sport-coat, suit-2pc and suit-3pc. A regex with
//        no sign group reads all four as 20/30 mm, so "-2 cm" and "+2 cm" become
//        the SAME declared value and the tool fabricates a COLLAPSED_DECLARATION
//        critical against a family that is perfectly well formed. Suppression
//        taken OUT of the chest is not suppression put IN; the sign is the
//        option.
//
//        But `+`/`-` is not always a sign. "Double (0.15 + 0.6 cm)" and
//        "0.1 + 0.7 cm Double Topstitch" use `+` as a BINARY OPERATOR joining
//        two stitch rows, and "Round Hem +0.6 cm" uses it as a unary sign. Both
//        are real labels in this catalog. The rule that separates them, and the
//        reason it is written down:
//
//          - glued to the preceding word (no space, e.g. "Cut-2 cm")  -> hyphen
//          - preceded, skipping spaces, by a DIGIT ("0.15 + 0.6 cm")  -> operator
//          - otherwise (string start, or after a letter/bracket)      -> SIGN
//
//        Verified against all 35 signed labels in the live catalog.
// ---------------------------------------------------------------------------
const MEASURE_TOKEN = /([+-]?)\s*(\d+(?:[.,]\d+)?)\s*(cm|mm|°|degrees?|deg)(?![a-z0-9])/gi;
const NONE_LABEL = /^(none|no\b.*|without\b.*|n\/a)$/i;

/**
 * Decide whether a captured `+`/`-` is a unary SIGN (returns -1 or +1) or merely
 * punctuation/arithmetic that must be ignored (returns +1). See rule (g) above.
 */
function signOf(text, matchIndex, signChar) {
  if (signChar !== '-' && signChar !== '+') return 1;
  let i = matchIndex - 1;
  // Glued to the preceding token: a hyphen inside a compound, never a minus.
  if (i >= 0 && !/[\s([/,]/.test(text[i])) return 1;
  while (i >= 0 && /\s/.test(text[i])) i -= 1;
  // A digit on the left makes this an operator between two numbers, not a sign.
  if (i >= 0 && /\d/.test(text[i])) return 1;
  return signChar === '-' ? -1 : 1;
}

function canonUnit(raw) {
  const u = String(raw).toLowerCase();
  if (u === 'cm') return { unit: 'mm', factor: 10 };
  if (u === 'mm') return { unit: 'mm', factor: 1 };
  return { unit: 'deg', factor: 1 };
}

function parseMeasuredLabel(label) {
  const text = String(label ?? '');
  const hits = [...text.matchAll(MEASURE_TOKEN)];

  if (hits.length === 0) {
    return {
      kind: NONE_LABEL.test(text.trim()) ? 'categorical-none' : 'unmeasured',
      declared: null,
      unit: null,
      rawNumber: null,
      family: familyKey(text),
    };
  }
  if (hits.length > 1) {
    return {
      kind: 'ambiguous',
      declared: null,
      unit: null,
      rawNumber: null,
      family: familyKey(text),
      ambiguousTokens: hits.map((h) => h[0].trim()),
    };
  }

  const [full, signText, numText, unitText] = hits[0];
  const { unit, factor } = canonUnit(unitText);
  const sign = signOf(text, hits[0].index, signText);
  const magnitude = parseFloat(numText.replace(',', '.'));
  const value = sign * magnitude * factor;
  return {
    kind: 'measured',
    declared: Math.round(value * 1000) / 1000 + 0, // canonical mm or deg; +0 normalises -0
    unit,
    sign,
    // The ingest join key. Signed, because a measurement file describing
    // `chest-dart` must be able to distinguish the -2 cm rung from the +2 cm one.
    rawNumber: String(sign * magnitude),
    displayed: full.trim(),
    family: familyKey(text.replace(full, ' ')),
  };
}

// The family key is the label with its measured token removed. This is what
// splits ONE catalog field into the SEVERAL ladders it actually contains:
// `decoration_stitching_on_collar` holds a TOP ladder (0.1/0.3/0.5/0.6) AND an
// AMF ladder (0.1/0.3/0.5). Grading them as one series would show two options
// at 0.1 and be non-monotonic by construction — a false FAIL that would hide
// the real one. The 2026-07-28 QA graded `ladder_collar` (TOP only) for exactly
// this reason.
function familyKey(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(MEASURE_TOKEN, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// 2. CATALOG — read directly, like publish_approved.mjs, so this tool has no
//    dependency on the skills directory.
// ---------------------------------------------------------------------------
function loadCatalog() {
  const products = [];
  if (!fs.existsSync(OPTIONS_DIR)) return products;
  for (const file of fs.readdirSync(OPTIONS_DIR).filter((f) => f.endsWith('.json'))) {
    const productId = file.replace(/\.json$/, '');
    const json = readJson(path.join(OPTIONS_DIR, file));
    const rows = [];
    for (const section of json.sections || []) {
      for (const field of section.fields || []) {
        for (const option of field.options || []) {
          rows.push({
            productId,
            sectionId: section.id,
            fieldId: field.id,
            optionId: option.id,
            label: option.label,
            image: option.image ?? null,
            techpackIllustration: option.techpackIllustration ?? null,
          });
        }
      }
    }
    products.push({ productId, rows });
  }
  return products;
}

// The shipped photo for a rung. The catalog serves a .webp derivative; the PNG
// master beside it is the artifact QC actually graded (see optimize_assets.mjs),
// so measurement prefers the master and records which file it used.
function resolveShipped(imageRef) {
  if (typeof imageRef !== 'string' || !imageRef.startsWith('/')) return null;
  const isGenerated = /\/images\/generated\//i.test(imageRef);
  const candidates = isGenerated ? [imageRef.replace(/\.webp$/i, '.png'), imageRef] : [imageRef];
  for (const c of candidates) {
    const abs = path.join(PUBLIC, c.replace(/^\//, ''));
    if (fs.existsSync(abs)) return { web: c, abs, isGenerated };
  }
  return null;
}

// ---------------------------------------------------------------------------
// 3. LADDER RESOLUTION — group catalog rows into (product, field, family) sets.
// ---------------------------------------------------------------------------
function resolveLadders({ field, optionIds, product }) {
  const ladders = new Map();
  for (const { productId, rows } of loadCatalog()) {
    if (product && product !== productId) continue;
    for (const row of rows) {
      const byField = field && row.fieldId === field;
      const byOption = optionIds && optionIds.includes(row.optionId);
      if (!byField && !byOption) continue;

      const parsed = parseMeasuredLabel(row.label);
      const key = `${productId}::${row.fieldId}::${parsed.family}`;
      if (!ladders.has(key)) {
        ladders.set(key, {
          id: key,
          product: productId,
          section: row.sectionId,
          field: row.fieldId,
          family: parsed.family || '(unnamed)',
          rungs: [],
          excluded: [],
        });
      }
      const lad = ladders.get(key);
      const shipped = resolveShipped(row.image);
      const entry = {
        option: row.optionId,
        label: row.label,
        declared: parsed.declared,
        unit: parsed.unit,
        rawNumber: parsed.rawNumber,
        displayed: parsed.displayed ?? null,
        image: row.image,
        shipped: shipped ? shipped.web : null,
        shippedAbs: shipped ? shipped.abs : null,
        shippedIsPhoto: shipped ? shipped.isGenerated : false,
      };
      if (parsed.kind === 'measured') lad.rungs.push(entry);
      else lad.excluded.push({ ...entry, reason: parsed.kind, ambiguousTokens: parsed.ambiguousTokens ?? null });
    }
  }
  // Keep only groups that are actually graduated families.
  return [...ladders.values()]
    .filter((l) => l.rungs.length >= 2 || l.excluded.some((e) => e.reason === 'ambiguous'))
    .map((l) => {
      l.rungs.sort((a, b) => a.declared - b.declared);
      return l;
    });
}

// ---------------------------------------------------------------------------
// 4. MEASUREMENT INGEST
//
//    Accepts three shapes, all operator-supplied:
//      (a) qa-stitch-ladder shape, selected with --ladder=<key>:
//            { ladder_collar: { ratios_measured: {"0.1":0.312,...}, targets:{...} } }
//      (b) flat:  { "<optionId or declared number>": 0.312, ... }
//      (c) rich:  { "<key>": { value, sigma, samples, unit, note } }
//
//    Join order per rung: option id first, then the label's ORIGINAL numeric
//    text ("0.1"), normalised through parseFloat on both sides so "0.10", "0.1"
//    and ".1" all agree. Matching on the pre-conversion number is deliberate —
//    a measurement file written alongside a cm-labelled ladder keys on "0.5",
//    not on the canonical 5 mm.
// ---------------------------------------------------------------------------
function loadMeasurements(file, ladderKey) {
  const abs = path.isAbsolute(file) ? file : path.join(REPO, file);
  if (!fs.existsSync(abs)) throw new Error(`measurements file not found: ${file}`);
  const raw = readJson(abs);

  let block = raw;
  if (ladderKey) {
    if (!(ladderKey in raw)) {
      const keys = Object.keys(raw).filter((k) => /ladder/i.test(k));
      throw new Error(`--ladder=${ladderKey} not found in ${file}. Available: ${keys.join(', ') || '(none)'}`);
    }
    block = raw[ladderKey];
  }

  const values = block.ratios_measured || block.measured || block.values || block;
  const targets = block.targets || null;

  const map = new Map();
  let numericKeys = 0;
  let namedKeys = 0;
  for (const [k, v] of Object.entries(values)) {
    if (v === null || typeof v === 'boolean') continue;
    const rec = typeof v === 'object' ? v : { value: v };
    if (typeof rec.value !== 'number' || !Number.isFinite(rec.value)) continue;
    const isNumeric = k.trim() !== '' && Number.isFinite(Number(k));
    if (isNumeric) numericKeys += 1;
    else namedKeys += 1;
    const nk = isNumeric ? String(parseFloat(k)) : String(k);
    map.set(nk, {
      value: rec.value,
      sigma: typeof rec.sigma === 'number' ? rec.sigma : null,
      samples: typeof rec.samples === 'number' ? rec.samples : null,
      note: rec.note ?? null,
    });
  }
  return {
    file: rel(abs),
    ladderKey: ladderKey || null,
    map,
    targets,
    method: block.method || raw.method || null,
    // How the file identifies its rungs. A declared-value-keyed file cannot say
    // WHICH family it measured — see the broadcast hazard note below.
    keying: numericKeys && namedKeys ? 'mixed' : numericKeys ? 'declared' : 'option',
    // What the file CLAIMS it measured, if anything. The block wins over the
    // root so one file can carry several scoped ladders.
    scope: readScope(block) || readScope(raw),
  };
}

// A measurement file may declare the family it belongs to, either as
// `{ scope: { product, field, family } }` or as bare product/field/family keys.
// Any subset is accepted; only the fields present are checked.
function readScope(node) {
  if (!node || typeof node !== 'object') return null;
  const src = node.scope && typeof node.scope === 'object' ? node.scope : node;
  const pick = (k) => (typeof src[k] === 'string' && src[k].trim() ? src[k].trim() : null);
  const scope = { product: pick('product'), field: pick('field'), family: pick('family') };
  return scope.product || scope.field || scope.family ? scope : null;
}

// ---------------------------------------------------------------------------
// THE JOIN-POLICY DECISION, isolated as a PURE function so --self-test can prove
// it. This is the gate that stands between "a measurement" and "a number that
// looks like a measurement".
//
// THE OPTION-ID BROADCAST HAZARD (the sibling of the declared-key hazard below,
// and the more dangerous of the two because nothing about it looked suspicious).
//
// The declared-key guard withheld numeric joins when a run resolved several
// families, but option-id joins were exempt — `byOption` applied unconditionally.
// Option ids are NOT unique across this catalog: 789 of them recur, and
// `cd-minus-2` exists identically under sport-coat, suit-2pc AND suit-3pc. So
//   node tools/qc_ladder.mjs --options=cd-minus-2,cd-plus-2 --measurements=f.json
// resolved THREE ladders and handed all three the same numbers. Two of those
// three verdicts were computed from measurements that were never taken — and
// because no error was raised, they could reach PASS. A ladder that passes on
// fabricated numbers is strictly worse than one that fails, because it ships.
//
// So the rule is now keying-independent: a measurement file is applied to a
// ladder only when it is UNAMBIGUOUSLY BOUND to it, which means either
//   (a) the file DECLARES its scope and this ladder matches it, or
//   (b) the run resolved exactly one ladder, so there is nothing to confuse it with.
// Otherwise the numbers are withheld and the verdict cannot exceed INCONCLUSIVE.
// Disambiguate with --product / --field / --family, or add a scope to the file.
function joinPolicyFor(ladder, scope, ladderCount) {
  if (scope) {
    const mismatched = [];
    if (scope.product && ladder.product && scope.product !== ladder.product) {
      mismatched.push(`product "${scope.product}" != "${ladder.product}"`);
    }
    if (scope.field && ladder.field && scope.field !== ladder.field) {
      mismatched.push(`field "${scope.field}" != "${ladder.field}"`);
    }
    if (scope.family && ladder.family && !String(ladder.family).includes(scope.family.toLowerCase())) {
      mismatched.push(`family "${scope.family}" not found in "${ladder.family}"`);
    }
    if (mismatched.length) return { allow: false, boundBy: 'scope-mismatch', mismatched };
    return { allow: true, boundBy: 'declared-scope', mismatched: [] };
  }
  if (ladderCount === 1) return { allow: true, boundBy: 'sole-resolved-ladder', mismatched: [] };
  return { allow: false, boundBy: 'unbound-and-ambiguous', mismatched: [] };
}

// THE DECLARED-KEY BROADCAST HAZARD — found by running this tool on real data,
// 2026-07-30, exactly as the failure log demands ("verify the fix's OUTPUT, not
// just that it runs").
//
// A file keyed by declared value alone — which is what
// qa-stitch-ladder-2026-07-28.json is — cannot say WHICH family it measured.
// `decoration_stitching_on_collar` holds a TOP ladder AND an AMF ladder, both
// with rungs at 0.1 / 0.3 / 0.5. Joining on the number alone silently handed the
// AMF options the TOP options' measurements: three fabricated numbers and a
// confident FAIL verdict against measurements that were never taken. A
// fabricated number that agrees with your expectations is the most dangerous
// kind, because nothing about the output looks wrong.
//
// So a declared-keyed file is applied ONLY when the run resolves exactly one
// family. Otherwise the numeric join is withheld, the rungs stay honestly
// unmeasured, and the ladder is blocked with AMBIGUOUS_MEASUREMENT_JOIN.
// Disambiguate with --family=<substring>.
function attachIngested(ladder, ingest, ladderCount) {
  const policy = joinPolicyFor(ladder, ingest.scope, ladderCount);
  ladder.joinPolicy = { ...policy, file: ingest.file, ladderKey: ingest.ladderKey, keying: ingest.keying };

  if (!policy.allow) {
    ladder.ambiguousJoin = {
      file: ingest.file,
      ladderKey: ingest.ladderKey,
      keying: ingest.keying,
      boundBy: policy.boundBy,
      mismatched: policy.mismatched,
    };
  }

  const withheld =
    policy.boundBy === 'scope-mismatch'
      ? `${ingest.file} declares that it measured a DIFFERENT family (${policy.mismatched.join('; ')}). Applying it here would attribute one family's measurements to another.`
      : `${ingest.file} does not declare which family it measured and this run resolved ${ladderCount} ladders — joining would hand this rung another family's numbers. Re-run with --product/--field/--family, or add a "scope" to the file.`;

  for (const r of ladder.rungs) {
    const byOption = policy.allow ? ingest.map.get(r.option) : undefined;
    const byDeclared =
      policy.allow && ingest.keying !== 'option' && r.rawNumber
        ? ingest.map.get(String(parseFloat(r.rawNumber)))
        : undefined;
    const hit = byOption ?? byDeclared;
    r.measurementJoin = byOption ? 'option-id' : byDeclared ? 'declared-value' : null;
    if (hit) {
      r.measured = hit.value;
      r.sigma = hit.sigma;
      r.samples = hit.samples;
      r.measurementNote = hit.note;
      r.measurementSource = 'operator-supplied';
      r.confidence = null;
    } else {
      r.measured = null;
      r.measurementSource = 'operator-supplied';
      r.unmeasuredReason = policy.allow
        ? `no entry in ${ingest.file} for option "${r.option}" or declared "${r.rawNumber}"`
        : withheld;
    }
  }
}

// Build a ladder purely from a measurement file (no catalog join) so the verdict
// logic can be exercised on a data file on its own — this is the path the
// acceptance test takes.
function ladderFromMeasurements(ingest) {
  const declaredKeys = ingest.targets ? Object.keys(ingest.targets) : [...ingest.map.keys()];
  const rungs = declaredKeys
    .map((k) => {
      const declared = parseFloat(k);
      const hit = ingest.map.get(String(declared));
      return {
        option: `(declared ${k})`,
        label: `${k} (from ${ingest.file})`,
        declared,
        unit: 'declared',
        rawNumber: String(declared),
        displayed: String(k),
        image: null,
        shipped: null,
        shippedAbs: null,
        shippedIsPhoto: false,
        measured: hit ? hit.value : null,
        sigma: hit ? hit.sigma : null,
        samples: hit ? hit.samples : null,
        measurementSource: 'operator-supplied',
        unmeasuredReason: hit ? null : `no measured value for declared "${k}"`,
      };
    })
    .filter((r) => Number.isFinite(r.declared))
    .sort((a, b) => a.declared - b.declared);

  return {
    id: `measurements::${ingest.file}::${ingest.ladderKey || 'root'}`,
    product: null,
    section: null,
    field: null,
    family: ingest.ladderKey || 'root',
    rungs,
    excluded: [],
    catalogJoined: false,
  };
}

// ---------------------------------------------------------------------------
// 5. EXPERIMENTAL AUTOMATIC MEASUREMENT
//
//    ROUTINE: edge-normal intensity profile ("stitch-groove finder").
//    Deterministic, no randomness, no learned model.
//
//    1. Crop the fractional ROI at native resolution, greyscale, raw bytes.
//    2. Sobel gx/gy. Build a 36-bin histogram of gradient ORIENTATION mod 180,
//       weighted by magnitude, over pixels above the 90th-percentile magnitude.
//       The modal bin phi is the direction of the dominant edge NORMAL.
//       -> component c1 = orientation coherence (mass within phi +/- 10 deg).
//    3. Split the ROI into N bands along the edge (the axis perpendicular to
//       phi). Per band, project every pixel onto the unit normal and accumulate
//       two 1-px-binned profiles: mean intensity, and mean gradient magnitude.
//       This is a rotation-free Radon slice — no resampling, so no interpolation
//       artefacts that could invent or erase a 1-px feature.
//    4. The FINISHED EDGE is the argmax of the gradient profile.
//       -> component c2 = edge contrast (peak / robust noise of that profile).
//    5. The STITCH ROW is the deepest local MINIMUM of the DETRENDED intensity
//       profile, searched on both sides of the edge, at least minGapPx away and
//       within searchPx. A topstitch on pressed cloth reads as a narrow darker
//       groove, so it is a negative residual against the local mean.
//       -> component c3 = stitch prominence (depth / robust noise).
//    6. offsetPx = |stitch - edge|, taken as the MEDIAN across bands.
//       -> component c4 = band agreement (1 - coefficient of variation).
//    7. confidence = geometric mean(c1..c4). Below --min-confidence the routine
//       returns value: null. It does not return a low-confidence number, because
//       a number with a caveat attached gets copied into a spreadsheet without
//       the caveat.
//
//    HONEST LIMITATIONS, stated in the output every time:
//    - The value is FRAME-RELATIVE (offsetPx / ROI width). It is only comparable
//      between rungs if the rungs share framing and scale. This tool cannot
//      verify that, so cross-rung comparison of auto values is an assumption the
//      operator is making, not a fact the tool established.
//    - The c1..c4 mapping constants are heuristic and UNCALIBRATED. There is no
//      per-image ground truth in this repo to fit them to.
//    - Therefore auto measurements may BLOCK but may never APPROVE (--trust-auto
//      overrides, and says so in the report).
// ---------------------------------------------------------------------------
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function robustSigma(arr) {
  const finite = arr.filter(Number.isFinite);
  if (finite.length < 3) return 0;
  const sorted = [...finite].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  const dev = sorted.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
  return 1.4826 * dev[Math.floor(dev.length / 2)];
}
const median = (arr) => {
  const s = arr.filter(Number.isFinite).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};

function sobel(g, w, h) {
  const gx = new Float32Array(w * h);
  const gy = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const a = g[i - w - 1], b = g[i - w], c = g[i - w + 1];
      const d = g[i - 1], f = g[i + 1];
      const p = g[i + w - 1], q = g[i + w], r = g[i + w + 1];
      gx[i] = c + 2 * f + r - (a + 2 * d + p);
      gy[i] = p + 2 * q + r - (a + 2 * b + c);
    }
  }
  return { gx, gy };
}

function bandProfile(g, gx, gy, w, h, nx, ny, bandIndex, bandCount) {
  // Along-edge axis is the normal rotated 90deg.
  const tx = -ny, ty = nx;
  let tMin = Infinity, tMax = -Infinity;
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    const t = x * tx + y * ty;
    if (t < tMin) tMin = t;
    if (t > tMax) tMax = t;
  }
  const lo = tMin + ((tMax - tMin) * bandIndex) / bandCount;
  const hi = tMin + ((tMax - tMin) * (bandIndex + 1)) / bandCount;

  let sMin = Infinity, sMax = -Infinity;
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    const s = x * nx + y * ny;
    if (s < sMin) sMin = s;
    if (s > sMax) sMax = s;
  }
  const bins = Math.max(8, Math.ceil(sMax - sMin) + 1);
  const inten = new Float64Array(bins);
  const grad = new Float64Array(bins);
  const count = new Float64Array(bins);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const t = x * tx + y * ty;
      if (t < lo || t >= hi) continue;
      const bin = Math.round(x * nx + y * ny - sMin);
      if (bin < 0 || bin >= bins) continue;
      const i = y * w + x;
      inten[bin] += g[i];
      grad[bin] += Math.hypot(gx[i], gy[i]);
      count[bin] += 1;
    }
  }
  const I = new Array(bins).fill(NaN);
  const G = new Array(bins).fill(NaN);
  for (let b = 0; b < bins; b++) {
    if (count[b] >= 3) {
      I[b] = inten[b] / count[b];
      G[b] = grad[b] / count[b];
    }
  }
  return { I, G, origin: sMin };
}

function detrend(profile, win) {
  const out = new Array(profile.length).fill(NaN);
  for (let i = 0; i < profile.length; i++) {
    if (!Number.isFinite(profile[i])) continue;
    let s = 0, n = 0;
    for (let j = i - win; j <= i + win; j++) {
      if (j < 0 || j >= profile.length || !Number.isFinite(profile[j])) continue;
      s += profile[j];
      n += 1;
    }
    if (n >= 3) out[i] = profile[i] - s / n;
  }
  return out;
}

async function measureEdgeOffset(absPath, roi, opts) {
  const { default: sharp } = await import('sharp');
  const meta = await sharp(absPath).metadata();
  const left = Math.round(roi.x * meta.width);
  const top = Math.round(roi.y * meta.height);
  const width = Math.max(16, Math.round(roi.w * meta.width));
  const height = Math.max(16, Math.round(roi.h * meta.height));

  const raw = await sharp(absPath)
    .extract({
      left: Math.min(left, meta.width - width),
      top: Math.min(top, meta.height - height),
      width,
      height,
    })
    .greyscale()
    .raw()
    .toBuffer();

  const g = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) g[i] = raw[i];
  const { gx, gy } = sobel(g, width, height);

  // --- step 2: dominant edge normal -----------------------------------------
  const mags = [];
  for (let i = 0; i < g.length; i++) mags.push(Math.hypot(gx[i], gy[i]));
  const sortedMag = [...mags].sort((a, b) => a - b);
  const magGate = sortedMag[Math.floor(sortedMag.length * 0.9)];
  const BINS = 36;
  const hist = new Float64Array(BINS);
  let mass = 0;
  for (let i = 0; i < g.length; i++) {
    const m = mags[i];
    if (m < magGate || m === 0) continue;
    let ang = (Math.atan2(gy[i], gx[i]) * 180) / Math.PI;
    if (ang < 0) ang += 180;
    if (ang >= 180) ang -= 180;
    hist[Math.min(BINS - 1, Math.floor((ang / 180) * BINS))] += m;
    mass += m;
  }
  let modal = 0;
  for (let b = 1; b < BINS; b++) if (hist[b] > hist[modal]) modal = b;
  let near = 0;
  for (let d = -2; d <= 2; d++) near += hist[(modal + d + BINS) % BINS];
  const coherence = mass > 0 ? near / mass : 0;
  const phi = ((modal + 0.5) / BINS) * Math.PI;
  const nx = Math.cos(phi), ny = Math.sin(phi);

  // --- steps 3-6: per-band profiles -----------------------------------------
  const searchPx = Math.max(6, Math.round(opts.searchFrac * width));
  const minGapPx = 2;
  const perBand = [];
  for (let b = 0; b < opts.bands; b++) {
    const { I, G } = bandProfile(g, gx, gy, width, height, nx, ny, b, opts.bands);
    const gradNoise = robustSigma(G);
    let edge = -1;
    for (let i = 0; i < G.length; i++) if (Number.isFinite(G[i]) && (edge < 0 || G[i] > G[edge])) edge = i;
    if (edge < 0 || gradNoise <= 0) continue;
    const edgeContrast = (G[edge] - median(G)) / gradNoise;

    const resid = detrend(I, Math.max(3, Math.round(searchPx / 2)));
    const intenNoise = robustSigma(resid);
    if (!(intenNoise > 0)) continue;

    let best = null;
    for (const dir of [-1, 1]) {
      for (let d = minGapPx; d <= searchPx; d++) {
        const i = edge + dir * d;
        if (i <= 0 || i >= resid.length - 1) break;
        if (!Number.isFinite(resid[i]) || !Number.isFinite(resid[i - 1]) || !Number.isFinite(resid[i + 1])) continue;
        if (resid[i] > resid[i - 1] || resid[i] > resid[i + 1]) continue; // not a local min
        const depth = -resid[i];
        if (depth <= 0) continue;
        if (!best || depth > best.depth) best = { depth, offset: d, side: dir };
      }
    }
    if (!best) continue;
    perBand.push({
      band: b,
      offsetPx: best.offset,
      side: best.side,
      edgeContrast,
      prominence: best.depth / intenNoise,
    });
  }

  if (perBand.length < 2) {
    return {
      value: null,
      confidence: 0,
      unreliable: true,
      reason: `only ${perBand.length} of ${opts.bands} sample bands yielded a candidate stitch row`,
      components: { orientationCoherence: coherence },
      roi,
    };
  }

  const offsets = perBand.map((p) => p.offsetPx);
  const med = median(offsets);
  const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length;
  const sd = Math.sqrt(offsets.reduce((a, b) => a + (b - mean) ** 2, 0) / offsets.length);
  const cv = mean > 0 ? sd / mean : 1;

  const c1 = clamp01((coherence - 0.15) / (0.6 - 0.15));
  const c2 = clamp01((median(perBand.map((p) => p.edgeContrast)) - 3) / (12 - 3));
  const c3 = clamp01((median(perBand.map((p) => p.prominence)) - 3) / (10 - 3));
  const c4 = clamp01(1 - cv / 0.35);
  let confidence = Math.pow(c1 * c2 * c3 * c4, 0.25);

  // A guessed ROI can never produce a shippable measurement.
  if (roi.source === 'default-guess') confidence = Math.min(confidence, 0.5);

  const ok = confidence >= opts.minConfidence;
  return {
    value: ok ? Math.round((med / width) * 10000) / 10000 : null,
    offsetPx: ok ? med : null,
    roiWidthPx: width,
    confidence: Math.round(confidence * 1000) / 1000,
    unreliable: !ok,
    reason: ok ? null : `confidence ${confidence.toFixed(3)} < gate ${opts.minConfidence}`,
    components: {
      // raw measurements
      orientationCoherence: Math.round(coherence * 1000) / 1000,
      edgeContrast: Math.round(median(perBand.map((p) => p.edgeContrast)) * 100) / 100,
      stitchProminence: Math.round(median(perBand.map((p) => p.prominence)) * 100) / 100,
      bandOffsetCV: Math.round(cv * 1000) / 1000,
      bandsUsed: perBand.length,
      bandsRequested: opts.bands,
      // the four normalised terms whose geometric mean IS the confidence, so the
      // number is fully reconstructible and can be argued with rather than
      // trusted. The mapping constants below are heuristic and uncalibrated.
      scored: {
        c1_orientation: Math.round(c1 * 1000) / 1000,
        c2_edgeContrast: Math.round(c2 * 1000) / 1000,
        c3_stitchProminence: Math.round(c3 * 1000) / 1000,
        c4_bandAgreement: Math.round(c4 * 1000) / 1000,
      },
      scoredFrom: 'c1=(coherence-0.15)/0.45  c2=(edgeContrast-3)/9  c3=(prominence-3)/7  c4=1-CV/0.35, each clamped to [0,1]; confidence = (c1*c2*c3*c4)^(1/4)',
    },
    roi,
    units: 'frame-relative (offsetPx / ROI width)',
  };
}

// ---------------------------------------------------------------------------
// 6. IMAGE IDENTITY (context + the one hard proof)
// ---------------------------------------------------------------------------
const sha1File = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');

async function imageSignatures(rungs) {
  const withImages = rungs.filter((r) => r.shippedAbs);
  if (withImages.length < 2) return { sha1: new Map(), dhash: new Map(), mad: [] };
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    return { sha1: new Map(withImages.map((r) => [r.option, sha1File(r.shippedAbs)])), dhash: new Map(), mad: [] };
  }
  const sha1 = new Map();
  const dhash = new Map();
  const thumbs = new Map();
  for (const r of withImages) {
    sha1.set(r.option, sha1File(r.shippedAbs));
    const d = await sharp(r.shippedAbs).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
    let bits = '';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += d[y * 9 + x] > d[y * 9 + x + 1] ? '1' : '0';
    dhash.set(r.option, bits);
    thumbs.set(r.option, await sharp(r.shippedAbs).greyscale().resize(64, 64, { fit: 'fill' }).raw().toBuffer());
  }
  const mad = [];
  const ids = [...thumbs.keys()];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = thumbs.get(ids[i]), b = thumbs.get(ids[j]);
      let s = 0;
      for (let k = 0; k < a.length; k++) s += Math.abs(a[k] - b[k]);
      mad.push({ a: ids[i], b: ids[j], meanAbsDiff: Math.round((s / a.length / 255) * 10000) / 10000 });
    }
  }
  return { sha1, dhash, mad };
}

// ---------------------------------------------------------------------------
// 7. VERDICT — computed MECHANICALLY from the rungs and the accumulated errors.
//    It is never asserted. This function is pure so --self-test can prove it.
// ---------------------------------------------------------------------------
function computeLadder(ladder, opts) {
  const errors = [];
  const add = (severity, code, detail, rungs = null) => errors.push({ severity, code, detail, rungs });

  // Structural: duplicate declared values inside one family.
  const seen = new Map();
  for (const r of ladder.rungs) {
    if (seen.has(r.declared)) {
      add('critical', 'COLLAPSED_DECLARATION',
        `options "${seen.get(r.declared)}" and "${r.option}" both declare ${r.declared} — two options in one family cannot sell the same measurement`,
        [seen.get(r.declared), r.option]);
    } else seen.set(r.declared, r.option);
  }
  for (const e of ladder.excluded || []) {
    if (e.reason === 'ambiguous') {
      add('critical', 'AMBIGUOUS_LABEL',
        `"${e.label}" carries more than one unit-qualified number (${(e.ambiguousTokens || []).join(', ')}) — the tool refuses to guess which is the ladder axis`,
        [e.option]);
    }
  }

  const units = new Set(ladder.rungs.map((r) => r.unit));
  if (units.size > 1) {
    add('critical', 'MIXED_UNITS', `family mixes units (${[...units].join(', ')}) — the rungs are not on one scale`);
  }

  // Identity: the one perceptual signal that is proof rather than context.
  // Reported as CLUSTERS, not pairs — five rungs sharing one file is ONE defect,
  // and emitting its ten pairwise combinations is how a real finding gets buried
  // (the same mistake SHIPPED_IMAGE_REUSED made at 312 hits, 311 of them noise).
  for (const group of ladder.identicalGroups || []) {
    add('critical', 'IDENTICAL_RUNG_IMAGE',
      `${group.options.length} rungs ship the SAME picture (${group.how}): ${group.options.join(', ')} — declared ${group.declared.join(' / ')} — the ladder cannot show a difference it does not contain`,
      group.options);
  }

  const measured = ladder.rungs.filter((r) => typeof r.measured === 'number' && Number.isFinite(r.measured));
  const unmeasured = ladder.rungs.filter((r) => !(typeof r.measured === 'number' && Number.isFinite(r.measured)));
  for (const r of unmeasured) {
    add('blocking-unknown', 'UNMEASURED_RUNG',
      r.unmeasuredReason || 'no measured value available for this rung', [r.option]);
  }

  // Monotonicity + separation, over the measured rungs sorted by declared value.
  const sign = opts.direction === 'desc' ? -1 : 1;
  const series = [...measured].sort((a, b) => a.declared - b.declared);
  const steps = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1], cur = series[i];
    const delta = cur.measured - prev.measured;
    const oriented = delta * sign;
    const step = {
      from: prev.option, to: cur.option,
      declaredFrom: prev.declared, declaredTo: cur.declared,
      measuredFrom: prev.measured, measuredTo: cur.measured,
      delta: Math.round(delta * 10000) / 10000,
      orientedDelta: Math.round(oriented * 10000) / 10000,
      monotonic: oriented > 0,
      separated: Math.abs(delta) >= opts.minSeparation,
    };
    steps.push(step);
    if (!step.monotonic) {
      add('critical', 'NON_MONOTONIC',
        `rung "${cur.option}" (declared ${cur.declared}) measured ${cur.measured}, which is ${oriented === 0 ? 'identical to' : 'on the wrong side of'} "${prev.option}" (declared ${prev.declared}, measured ${prev.measured}) — the series ${oriented === 0 ? 'COLLAPSED' : 'INVERTED'} here`,
        [prev.option, cur.option]);
    } else if (!step.separated) {
      add('critical', 'INSUFFICIENT_SEPARATION',
        `adjacent rungs "${prev.option}" (${prev.measured}) and "${cur.option}" (${cur.measured}) differ by ${Math.abs(step.delta)}, below the ${opts.minSeparation} discriminability floor — the customer cannot see the difference being sold`,
        [prev.option, cur.option]);
    }
  }

  // ALL-PAIRS collapse. Separation cannot be an adjacent-only test: the headline
  // finding of the 2026-07-28 report is that the 0.5 cm rung "measures 0.316,
  // within noise of 0.1cm (17.3px vs 16.9px, visually identical)" — a
  // NON-ADJACENT pair. Two rungs two steps apart that photograph identically
  // mis-sell each other exactly as badly as neighbours do, and an adjacent-only
  // check reports `separated: true` while that is happening.
  const collapsedPairs = [];
  for (let i = 0; i < series.length; i++) {
    for (let j = i + 1; j < series.length; j++) {
      const a = series[i], b = series[j];
      const d = Math.abs(b.measured - a.measured);
      if (d >= opts.minSeparation) continue;
      collapsedPairs.push({ a: a.option, b: b.option, delta: Math.round(d * 10000) / 10000 });
      if (j !== i + 1) {
        add('critical', 'PAIRWISE_COLLAPSE',
          `non-adjacent rungs "${a.option}" (declared ${a.declared}, measured ${a.measured}) and "${b.option}" (declared ${b.declared}, measured ${b.measured}) differ by only ${Math.round(d * 10000) / 10000} — two DISTINCT options photograph the same and mis-sell each other`,
          [a.option, b.option]);
      }
    }
  }
  ladder.collapsedPairs = collapsedPairs;
  if (series.length < 2) {
    add('blocking-unknown', 'TOO_FEW_MEASURED_RUNGS',
      `${series.length} measured rung(s) — a ladder needs at least 2 to be tested as a set`);
  }

  // Advisory: ladder compression. Reported ALWAYS because "whole ladder
  // compressed" is what the 2026-07-28 report was describing, but advisory by
  // default because the measurement's normalisation constant is unknown, so a
  // span ratio can be depressed by a constant offset rather than by the render.
  let spanFidelity = null;
  let spanFidelityNote = null;
  if (series.length >= 2) {
    const lo = series[0];
    const hi = series[series.length - 1];
    const dSpan = hi.declared - lo.declared;
    const mSpan = hi.measured - lo.measured;

    // A span RATIO only means anything on a scale that runs from an origin in one
    // direction. `chest-dart` runs -3, -2, +2, +3 cm: its declared ratio is
    // 30/-30 = -1, and dividing two sign-crossing ratios yields a confident,
    // meaningless number. A signed or zero-crossing family is still graded for
    // monotonicity and separation — it simply has no compression ratio to report.
    const positiveScale = series.every((r) => r.declared > 0) && series.every((r) => r.measured > 0);
    if (!positiveScale) {
      spanFidelityNote =
        'not computed: this family crosses zero or carries signed rungs, so a span RATIO has no meaning. Monotonicity and separation are still enforced.';
    } else {
      const dRatio = hi.declared / lo.declared;
      const mRatio = hi.measured / lo.measured;
      spanFidelity = Math.round((mRatio / dRatio) * 1000) / 1000;
      const detail = `declared span ${lo.declared}->${hi.declared} is ${dRatio.toFixed(2)}x but measured span ${lo.measured}->${hi.measured} is ${mRatio.toFixed(2)}x (fidelity ${spanFidelity})`;
      const severity = opts.strictFidelity ? 'critical' : 'advisory';
      const caveat = opts.strictFidelity ? '' : ' [advisory: the normalisation constant is unknown]';

      if (spanFidelity < opts.minSpanFidelity) {
        add(severity, 'COMPRESSED_LADDER',
          `${detail} — the ladder is COMPRESSED: it shows the customer less difference than they are paying for${caveat}`);
      } else if (spanFidelity > opts.maxSpanFidelity) {
        // The missing half of the test. A ladder can misrepresent its measurements
        // by EXAGGERATING them just as easily as by compressing them, and the
        // exaggerated case is the one that looks great in review — the rungs are
        // monotonic, well separated and obviously distinct. A 0.1->0.6 cm topstitch
        // rendered as though it ran 0.1->3.0 cm passes every other check in this
        // tool while selling a difference six times larger than the one that
        // exists. With no upper bound it passed SILENTLY.
        add(severity, 'EXAGGERATED_LADDER',
          `${detail} — the ladder is EXAGGERATED: it shows the customer MORE difference than the measurements contain, which mis-sells the rungs exactly as badly as compressing them${caveat}`);
      }
    }
    ladder.declaredSpan = Math.round(dSpan * 1000) / 1000;
    ladder.measuredSpan = Math.round(mSpan * 10000) / 10000;
  }
  ladder.spanFidelityNote = spanFidelityNote;

  // Auto-measurement asymmetry: uncalibrated instruments may block, never approve.
  if (ladder.ambiguousJoin) {
    if (ladder.ambiguousJoin.boundBy === 'scope-mismatch') {
      add('blocking-unknown', 'MEASUREMENT_SCOPE_MISMATCH',
        `${ladder.ambiguousJoin.file} declares that it measured a different family (${(ladder.ambiguousJoin.mismatched || []).join('; ')}) — the join was REFUSED. A measurement belongs to the family it was taken from and to no other.`);
    } else {
      add('blocking-unknown', 'AMBIGUOUS_MEASUREMENT_JOIN',
        `${ladder.ambiguousJoin.file} (keyed by ${ladder.ambiguousJoin.keying}) does not declare which family it measured, and this run resolved more than one — the join was WITHHELD rather than broadcast, because handing this family another family's numbers would fabricate a measurement. Option ids are NOT unique across this catalog (789 recur), so an option-id join is exposed to this exactly as a declared-value join is. Re-run with --product/--field/--family, or add a "scope" to the file.`);
    }
  }

  const usedAuto = ladder.rungs.some((r) => r.measurementSource === 'auto-experimental');
  if (usedAuto && !opts.trustAuto) {
    add('blocking-unknown', 'AUTO_MEASUREMENT_UNCALIBRATED',
      'measurement came from the EXPERIMENTAL automatic routine, whose confidence mapping has no ground truth in this repo to calibrate against — it may block a ladder but may not approve one. Pass --trust-auto only if a human has validated the routine on this family.');
  }

  const critical = errors.filter((e) => e.severity === 'critical');
  const unknown = errors.filter((e) => e.severity === 'blocking-unknown');
  const verdict = critical.length ? 'FAIL' : unknown.length ? 'INCONCLUSIVE' : 'PASS';

  const firstBreak = steps.find((s) => !s.monotonic) || steps.find((s) => !s.separated) || null;
  const problem =
    verdict === 'PASS'
      ? null
      : critical.length
        ? critical.map((e) => e.detail).join(' | ')
        : unknown.map((e) => e.detail).join(' | ');

  return {
    ...ladder,
    monotonic: steps.length > 0 && steps.every((s) => s.monotonic),
    // all-pairs, not adjacent-only
    separated: series.length > 1 && collapsedPairs.length === 0,
    spanFidelity,
    steps,
    firstBreak: firstBreak ? { from: firstBreak.from, to: firstBreak.to, reason: firstBreak.monotonic ? 'collapsed' : 'inverted-or-collapsed' } : null,
    errors,
    verdict,
    problem,
  };
}

// ---------------------------------------------------------------------------
// 8. SELF-TEST — the acceptance test, embedded so it can never rot.
//    The known-FAIL 2026-07-28 collar and cuff data MUST come back FAIL.
// ---------------------------------------------------------------------------
function selfTest() {
  const opts = { direction: 'asc', minSeparation: 0.05, minSpanFidelity: 0.5, maxSpanFidelity: 2.0, strictFidelity: false, trustAuto: false };
  const build = (name, ratios) => ({
    id: name, product: null, section: null, field: null, family: name, excluded: [],
    rungs: Object.entries(ratios).map(([d, v]) => ({
      option: `${name}-${d}`, label: `${d} cm`, declared: parseFloat(d) * 10, unit: 'mm',
      rawNumber: d, measured: v, measurementSource: 'operator-supplied',
    })).sort((a, b) => a.declared - b.declared),
  });

  const cases = [
    // THE ACCEPTANCE TEST. The real 2026-07-28 collar data MUST come back FAIL.
    // It must also name the NON-ADJACENT collapse the report leads with — the
    // 0.5 cm rung "measures 0.316, within noise of 0.1cm ... visually identical"
    // — which an adjacent-only separation check cannot see, and which is the
    // precise condition the prohibition exists for.
    { name: 'collar ladder 2026-07-28 (known FAIL)', ladder: build('collar', { '0.1': 0.312, '0.3': 0.404, '0.5': 0.316, '0.6': 0.476 }), expect: 'FAIL', expectCodes: ['NON_MONOTONIC', 'PAIRWISE_COLLAPSE'] },
    { name: 'cuff ladder 2026-07-28 (known FAIL)', ladder: build('cuff', { '0.1': 0.233, '0.3': 0.353, '0.5': 0.555, '0.6': 0.362 }), expect: 'FAIL', expectCodes: ['NON_MONOTONIC'] },
    { name: 'synthetic clean monotonic ladder', ladder: build('clean', { '0.1': 0.10, '0.3': 0.30, '0.5': 0.50, '0.6': 0.60 }), expect: 'PASS' },
    { name: 'synthetic monotonic but collapsed rungs', ladder: build('tight', { '0.1': 0.300, '0.3': 0.310, '0.5': 0.320, '0.6': 0.330 }), expect: 'FAIL', expectCodes: ['INSUFFICIENT_SEPARATION'] },
    { name: 'synthetic fully inverted ladder', ladder: build('inverted', { '0.1': 0.60, '0.3': 0.50, '0.5': 0.30, '0.6': 0.10 }), expect: 'FAIL', expectCodes: ['NON_MONOTONIC'] },
    { name: 'declared-key broadcast is withheld, not fabricated', ladder: { id: 'amb', product: 'shirt', family: 'machine amf stitching', excluded: [], ambiguousJoin: { file: 'x.json', keying: 'declared', boundBy: 'unbound-and-ambiguous', mismatched: [] }, rungs: [{ option: 'a', declared: 1, unit: 'mm', measured: null, measurementSource: 'operator-supplied', unmeasuredReason: 'withheld' }, { option: 'b', declared: 3, unit: 'mm', measured: null, measurementSource: 'operator-supplied', unmeasuredReason: 'withheld' }] }, expect: 'INCONCLUSIVE', expectCodes: ['AMBIGUOUS_MEASUREMENT_JOIN'] },

    // ---- REGRESSION: an OVER-EXPANDED ladder used to pass silently -----------
    // Monotonic, well separated, every rung distinct — and selling six times the
    // difference the measurements contain. Only the upper fidelity bound sees it.
    { name: 'over-expanded ladder is caught (was silent)', ladder: build('exaggerated', { '0.1': 0.10, '0.3': 0.90, '0.5': 1.80, '0.6': 3.00 }), expect: 'FAIL', expectCodes: ['EXAGGERATED_LADDER'], strict: true },
    { name: 'over-expanded ladder is advisory by default, not fatal', ladder: build('exaggerated', { '0.1': 0.10, '0.3': 0.90, '0.5': 1.80, '0.6': 3.00 }), expect: 'PASS', expectCodes: ['EXAGGERATED_LADDER'] },

    // ---- REGRESSION: a signed family is no longer given a meaningless ratio ---
    // chest-dart runs -3/-2/+2/+3 cm. Its declared ratio is 30/-30 = -1.
    {
      name: 'signed family reports no span ratio rather than a meaningless one',
      ladder: {
        id: 'cd', product: 'sport-coat', field: 'chest-dart', family: 'chest dart', excluded: [],
        rungs: [
          { option: 'cd-minus-3', declared: -30, unit: 'mm', measured: 0.10, measurementSource: 'operator-supplied' },
          { option: 'cd-minus-2', declared: -20, unit: 'mm', measured: 0.25, measurementSource: 'operator-supplied' },
          { option: 'cd-plus-2', declared: 20, unit: 'mm', measured: 0.45, measurementSource: 'operator-supplied' },
          { option: 'cd-plus-3', declared: 30, unit: 'mm', measured: 0.62, measurementSource: 'operator-supplied' },
        ],
      },
      expect: 'PASS',
      check: (r) => r.spanFidelity === null && typeof r.spanFidelityNote === 'string',
      checkName: 'spanFidelity withheld with a note',
    },
  ];

  // ---- LABEL PARSING, including the sign group ------------------------------
  // Every string below is a REAL label from data-store/options.
  const parseCases = [
    { label: '-2 cm', declared: -20, why: 'chest-dart: suppression taken OUT is not suppression put IN' },
    { label: '+2 cm', declared: 20, why: 'the sibling of the above; these two must not collide' },
    { label: '-3 cm', declared: -30 },
    { label: '+0.1 cm (Both Sides)', declared: 1, why: 'shoulder-pad, sign followed by a parenthetical' },
    { label: 'Round Hem +0.6 cm', declared: 6, why: 'unary sign after a word' },
    { label: 'Double (0.15 + 0.6 cm)', declared: 6, why: 'the + is a BINARY OPERATOR between two stitch rows, not a sign' },
    { label: '0.1 + 0.7 cm Double Topstitch', declared: 7, why: 'same: a digit on the left makes it an operator' },
    { label: '0.1 cm', declared: 1 },
    { label: '90°', declared: 90 },
    { label: '0,6 cm', declared: 6, why: 'decimal comma' },
    { label: 'Machine', declared: null, kind: 'unmeasured', why: 'bare word, no measurement' },
    { label: '3 Button', declared: null, kind: 'unmeasured', why: 'bare digit with no unit is never a measurement' },
    { label: 'None', declared: null, kind: 'categorical-none', why: 'absence is not the bottom rung of a scale' },
    { label: 'Square 6.5 cm and 5 cm', declared: null, kind: 'ambiguous', why: 'two unit-qualified numbers: refuse to guess the axis' },
  ];

  // ---- JOIN POLICY: the option-id broadcast hazard --------------------------
  const sportCoat = { product: 'sport-coat', field: 'chest-dart', family: 'chest dart' };
  const suit2 = { product: 'suit-2pc', field: 'chest-dart', family: 'chest dart' };
  const policyCases = [
    { name: 'unscoped file + one resolved ladder joins', ladder: sportCoat, scope: null, count: 1, allow: true },
    { name: 'unscoped file + three resolved ladders is WITHHELD (the broadcast bug)', ladder: sportCoat, scope: null, count: 3, allow: false },
    { name: 'scoped file joins the family it names, even among many', ladder: sportCoat, scope: { product: 'sport-coat', field: 'chest-dart', family: null }, count: 3, allow: true },
    { name: 'scoped file is REFUSED on a family it does not name', ladder: suit2, scope: { product: 'sport-coat', field: 'chest-dart', family: null }, count: 3, allow: false },
    { name: 'scope mismatch is reported as a mismatch, not as ambiguity', ladder: suit2, scope: { product: 'sport-coat', field: null, family: null }, count: 1, allow: false, boundBy: 'scope-mismatch' },
  ];

  let failures = 0;
  console.log('qc_ladder --self-test — proving the verdict logic against known ground truth\n');

  console.log('  LABEL PARSING (the measured value, and its sign)');
  for (const c of parseCases) {
    const p = parseMeasuredLabel(c.label);
    const wantKind = c.kind || 'measured';
    const ok = p.kind === wantKind && (wantKind !== 'measured' || p.declared === c.declared);
    if (!ok) failures += 1;
    console.log(`    ${ok ? 'ok  ' : 'FAIL'}  "${c.label}" -> ${p.kind}${p.kind === 'measured' ? ` ${p.declared} ${p.unit}` : ''}${ok ? '' : `   EXPECTED ${wantKind} ${c.declared ?? ''}`}`);
    if (c.why) console.log(`            ${c.why}`);
  }

  console.log('\n  MEASUREMENT JOIN POLICY (a measurement belongs to the family it came from)');
  for (const c of policyCases) {
    const r = joinPolicyFor(c.ladder, c.scope, c.count);
    const ok = r.allow === c.allow && (!c.boundBy || r.boundBy === c.boundBy);
    if (!ok) failures += 1;
    console.log(`    ${ok ? 'ok  ' : 'FAIL'}  ${c.name}`);
    console.log(`            allow=${r.allow} boundBy=${r.boundBy}${ok ? '' : `   EXPECTED allow=${c.allow}${c.boundBy ? ` boundBy=${c.boundBy}` : ''}`}`);
  }

  console.log('\n  SET VERDICTS');
  for (const c of cases) {
    const useOpts = c.strict ? { ...opts, strictFidelity: true } : opts;
    const r = computeLadder(JSON.parse(JSON.stringify(c.ladder)), useOpts);
    const codes = r.errors.map((e) => e.code);
    const want = c.expectCodes || [];
    const extra = c.check ? c.check(r) : true;
    const ok = r.verdict === c.expect && want.every((w) => codes.includes(w)) && extra;
    if (!ok) failures += 1;
    console.log(`    ${ok ? 'ok  ' : 'FAIL'}  ${c.name}`);
    console.log(`            expected ${c.expect}${want.length ? ` + ${want.join(' + ')}` : ''}${c.checkName ? ` + ${c.checkName}` : ''}, got ${r.verdict} [${codes.join(', ') || 'no errors'}]${c.check && !extra ? '  <- extra check FAILED' : ''}`);
  }
  console.log(`\n${failures ? `${failures} self-test case(s) FAILED — the verdict logic is wrong.` : 'All self-test cases passed.'}`);
  return failures === 0;
}

// ---------------------------------------------------------------------------
// 9. LIST — inventory every graduated family that needs SET QC.
// ---------------------------------------------------------------------------
function listLadders(productFilter) {
  const families = new Map();
  for (const { productId, rows } of loadCatalog()) {
    if (productFilter && productFilter !== productId) continue;
    for (const row of rows) {
      const p = parseMeasuredLabel(row.label);
      if (p.kind !== 'measured') continue;
      const key = `${productId}::${row.fieldId}::${p.family}`;
      if (!families.has(key)) families.set(key, { product: productId, field: row.fieldId, family: p.family || '(unnamed)', unit: p.unit, values: [] });
      families.get(key).values.push(p.declared);
    }
  }
  return [...families.values()]
    .filter((f) => new Set(f.values).size >= 2)
    .map((f) => ({ ...f, rungs: new Set(f.values).size, values: [...new Set(f.values)].sort((a, b) => a - b) }))
    .sort((a, b) => b.rungs - a.rungs || a.product.localeCompare(b.product) || a.field.localeCompare(b.field));
}

// ---------------------------------------------------------------------------
// 10. MAIN
// ---------------------------------------------------------------------------
async function main() {
  if (args['self-test']) process.exit(selfTest() ? 0 : 1);

  if (args.list) {
    const rows = listLadders(args.product);
    if (args.json) {
      console.log(JSON.stringify({ report: 'measured-ladder inventory', at: new Date().toISOString(), count: rows.length, ladders: rows }, null, 2));
      process.exit(0);
    }
    console.log(`qc_ladder --list — ${rows.length} graduated famil${rows.length === 1 ? 'y' : 'ies'} that must be QC'd as a SET\n`);
    for (const r of rows) {
      console.log(`  ${String(r.rungs).padStart(2)} rungs  ${r.product}/${r.field}`);
      console.log(`            family "${r.family}"  values ${r.values.join(', ')} ${r.unit}`);
    }
    console.log(`\n${PROHIBITION}`);
    process.exit(0);
  }

  const optionIds = typeof args.options === 'string' ? args.options.split(',').map((s) => s.trim()).filter(Boolean) : null;
  const field = typeof args.field === 'string' ? args.field : null;

  let ingest = null;
  if (typeof args.measurements === 'string') {
    ingest = loadMeasurements(args.measurements, typeof args.ladder === 'string' ? args.ladder : null);
  }
  const mode = typeof args.measure === 'string' ? args.measure : ingest ? 'ingest' : 'none';
  if (!['ingest', 'auto', 'none'].includes(mode)) {
    console.error(`--measure must be one of ingest|auto|none (got "${mode}")`);
    process.exit(1);
  }
  if (mode === 'ingest' && !ingest) {
    console.error('--measure=ingest requires --measurements=<path>');
    process.exit(1);
  }

  // Resolve the ladders.
  let ladders = [];
  if (field || optionIds) {
    ladders = resolveLadders({ field, optionIds, product: typeof args.product === 'string' ? args.product : null });
    if (typeof args.family === 'string') {
      const needle = args.family.toLowerCase();
      ladders = ladders.filter((l) => l.family.includes(needle));
    }
    for (const l of ladders) l.catalogJoined = true;
  } else if (ingest) {
    ladders = [ladderFromMeasurements(ingest)];
  }

  if (ladders.length === 0) {
    console.error('Nothing to grade. Pass --field=<fieldId>, --options=a,b,c, or --measurements=<file>. Use --list to see candidate ladders.');
    process.exit(1);
  }

  // Attach measurements + image identity.
  const roiArg = typeof args.roi === 'string' ? args.roi.split(',').map(Number) : null;
  const roi = roiArg && roiArg.length === 4 && roiArg.every(Number.isFinite)
    ? { x: roiArg[0], y: roiArg[1], w: roiArg[2], h: roiArg[3], source: 'explicit' }
    : { x: 0.25, y: 0.25, w: 0.5, h: 0.5, source: 'default-guess' };

  for (const ladder of ladders) {
    if (ladder.catalogJoined) {
      const sig = await imageSignatures(ladder.rungs);
      ladder.perceptualContext = {
        note: 'CONTEXT ONLY — never a verdict input. Measured on the real shipped collar ladder 2026-07-30, whole-image mean-abs-difference ran 0.093-0.164 for EVERY pair including a rung vs the "None" option, so it is dominated by pose/crop/model and carries no signal about the feature.',
        pairwiseMeanAbsDiff: sig.mad,
      };
      // Cluster by signature so one shared file is one finding, not n-choose-2.
      // SHA-1 first (byte-identity is proof); dHash only groups rungs that SHA-1
      // did not already cluster, so a byte-identical set is never double-reported.
      const rungOf = new Map(ladder.rungs.map((r) => [r.option, r]));
      const groups = [];
      const claimed = new Set();
      for (const [how, table] of [['byte-identical (SHA-1)', sig.sha1], ['pixel-identical (dHash Hamming 0)', sig.dhash]]) {
        const buckets = new Map();
        for (const [option, key] of table) {
          if (claimed.has(option) || !key) continue;
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(option);
        }
        for (const options of buckets.values()) {
          if (options.length < 2) continue;
          for (const o of options) claimed.add(o);
          groups.push({
            how,
            options,
            declared: options.map((o) => rungOf.get(o)?.declared ?? null),
            file: rungOf.get(options[0])?.shipped ?? null,
          });
        }
      }
      ladder.identicalGroups = groups;
    }

    if (mode === 'ingest') {
      // A measurement file may only be joined when it is unambiguously bound to
      // this ladder — by a declared scope, or by being the only ladder resolved.
      // See joinPolicyFor() and the option-id broadcast hazard above.
      if (ladder.catalogJoined) attachIngested(ladder, ingest, ladders.length);
    } else if (mode === 'auto') {
      for (const r of ladder.rungs) {
        r.measurementSource = 'auto-experimental';
        if (!r.shippedAbs) {
          r.measured = null;
          r.unmeasuredReason = `no shipped photo for this rung (catalog image: ${r.image ?? 'none'})`;
          continue;
        }
        if (!r.shippedIsPhoto) {
          r.measured = null;
          r.unmeasuredReason = `catalog still shows the tech-pack drawing (${r.shipped}), not a photograph — nothing to measure`;
          continue;
        }
        const m = await measureEdgeOffset(r.shippedAbs, roi, {
          bands: THRESHOLDS.bands,
          searchFrac: 0.12,
          minConfidence: THRESHOLDS.minConfidence,
        });
        r.measured = m.value;
        r.confidence = m.confidence;
        r.autoMeasurement = m;
        if (m.value === null) r.unmeasuredReason = `automatic measurement not reliable: ${m.reason}`;
      }
    } else {
      for (const r of ladder.rungs) {
        r.measured = null;
        r.measurementSource = 'none';
        r.unmeasuredReason = 'no measurement supplied (--measure=none preflight); pass --measurements=<file> or --measure=auto';
      }
    }
  }

  const opts = {
    direction: args.direction === 'desc' ? 'desc' : 'asc',
    minSeparation: THRESHOLDS.minSeparation,
    minSpanFidelity: THRESHOLDS.minSpanFidelity,
    maxSpanFidelity: THRESHOLDS.maxSpanFidelity,
    strictFidelity: !!args['strict-fidelity'],
    trustAuto: !!args['trust-auto'],
  };
  const graded = ladders.map((l) => computeLadder(l, opts));

  // --- report ---------------------------------------------------------------
  const today = new Date().toISOString().slice(0, 10);
  const slug = (field || (optionIds ? 'options' : ingest ? (ingest.ladderKey || 'measurements') : 'ladder'))
    .replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const reportPath = typeof args.out === 'string'
    ? (path.isAbsolute(args.out) ? args.out : path.join(REPO, args.out))
    : path.join(REPORTS, `qa-ladder-${slug}-${today}.json`);

  const report = {
    report: 'Ladder SET QC — monotonicity of a graduated craft-option family',
    tool: 'tools/qc_ladder.mjs',
    date: today,
    generatedAt: new Date().toISOString(),
    rule: "A graduated family must be QC'd as a SET for monotonicity, never per image. A per-image QC pass is meaningless for a ladder — each image can look plausible while the SET misrepresents the measurements being sold.",
    prohibition: PROHIBITION,
    honestRemedies: REMEDIES,
    verdictIsMechanical: 'verdict = FAIL if any critical error; INCONCLUSIVE if any blocking-unknown; otherwise PASS. It is computed from the rungs and errors, never asserted.',
    measurement: {
      mode,
      source: mode === 'ingest' ? 'OPERATOR-SUPPLIED' : mode === 'auto' ? 'AUTOMATIC (EXPERIMENTAL, UNCALIBRATED)' : 'NONE (preflight only)',
      file: ingest ? ingest.file : null,
      ladderKey: ingest ? ingest.ladderKey : null,
      keying: ingest ? ingest.keying : null,
      scope: ingest ? ingest.scope : null,
      joinRule:
        'A measurement is applied to a ladder ONLY when it is unambiguously bound to it: either the file declares a scope this ladder matches, or the run resolved exactly one ladder. Option ids are not unique across this catalog (789 recur), so an option-id join is exposed to cross-family broadcast exactly as a declared-value join is, and is gated identically.',
      method: ingest ? ingest.method : mode === 'auto' ? 'edge-normal intensity profile; see measureEdgeOffset() in tools/qc_ladder.mjs' : null,
      limitations:
        mode === 'auto'
          ? [
              'Values are FRAME-RELATIVE (offsetPx / ROI width) and are only comparable between rungs if the rungs share framing and scale. This tool cannot verify that.',
              'The confidence mapping constants are heuristic and have no ground truth in this repo to calibrate against.',
              'Therefore an auto-measured ladder may reach FAIL or INCONCLUSIVE but never PASS without --trust-auto.',
              'No number is emitted below the confidence gate. A low-confidence value is reported as null, not as a caveated figure.',
            ]
          : mode === 'ingest'
            ? ['Measurement is OPERATOR-SUPPLIED. This tool did not measure the images; it graded the numbers it was given. Its guarantee covers the parsing, family partition, monotonicity, separation and verdict — not the provenance of the measurements.']
            : ['No measurement was performed. Only declaration-level and image-identity checks ran; the verdict cannot exceed INCONCLUSIVE.'],
    },
    thresholds: { ...THRESHOLDS, direction: opts.direction, strictFidelity: opts.strictFidelity, trustAuto: opts.trustAuto },
    separationJustification: SEPARATION_JUSTIFICATION,
    labelParsingRule: [
      'The measured value is read from the LABEL only — never the option id, never the filename.',
      'Ids and supplier filenames drop the decimal point (0.6 cm -> "06"/stitch-06-top; "Square 6.5 cm" -> square-in-65cm but "Small Square 5.0 cm" -> small-square-in-5cm), which is unrecoverable without knowing the convention per file.',
      'A number counts only when immediately followed by a unit token (cm | mm | ° | deg | degree(s)). Bare digits are ignored.',
      'cm and mm canonicalise to MILLIMETRES; degrees stay degrees. Decimal commas are normalised.',
      'SIGN IS PART OF THE MEASUREMENT: chest-dart sells -2/-3/+2/+3 cm, and reading those as unsigned magnitudes makes "-2 cm" and "+2 cm" the SAME declared value, fabricating a COLLAPSED_DECLARATION against a well-formed family.',
      'A +/- is a SIGN only when it is not glued to the preceding word (a hyphen) and is not preceded by a digit (a binary operator, as in "Double (0.15 + 0.6 cm)" and "0.1 + 0.7 cm Double Topstitch" — both real labels).',
      'A span RATIO is reported only for a family whose declared and measured values are all strictly positive. A signed or zero-crossing family (chest-dart: -3 -> +3) has no meaningful compression ratio, so none is reported; monotonicity and separation still apply.',
      'Two or more unit-qualified numbers in one label is AMBIGUOUS — the tool refuses to guess and blocks the verdict.',
      '"None" is a CATEGORICAL absence, not the bottom rung of a measured scale; it is excluded with a note rather than folded in as 0.',
      'One catalog field is partitioned into families by the label with its measured token removed, so a TOP ladder and an AMF ladder in the same field are graded separately.',
    ],
    ladders: graded.map((l) => ({
      id: l.id,
      product: l.product,
      section: l.section,
      field: l.field,
      family: l.family,
      catalogJoined: !!l.catalogJoined,
      rungs: l.rungs.map((r) => ({
        option: r.option,
        label: r.label,
        declared: r.declared,
        unit: r.unit,
        measured: r.measured,
        measurementSource: r.measurementSource,
        measurementJoin: r.measurementJoin ?? null,
        confidence: r.confidence ?? null,
        sigma: r.sigma ?? null,
        samples: r.samples ?? null,
        shipped: r.shipped,
        shippedIsPhoto: r.shippedIsPhoto,
        unmeasuredReason: r.unmeasuredReason ?? null,
        autoMeasurement: r.autoMeasurement ?? null,
      })),
      excludedOptions: (l.excluded || []).map((e) => ({ option: e.option, label: e.label, reason: e.reason })),
      identicalGroups: l.identicalGroups || [],
      perceptualContext: l.perceptualContext ?? null,
      ambiguousJoin: l.ambiguousJoin ?? null,
      steps: l.steps,
      monotonic: l.monotonic,
      separated: l.separated,
      separationIsAllPairs: true,
      collapsedPairs: l.collapsedPairs || [],
      declaredSpan: l.declaredSpan ?? null,
      measuredSpan: l.measuredSpan ?? null,
      spanFidelity: l.spanFidelity,
      spanFidelityNote: l.spanFidelityNote ?? null,
      joinPolicy: l.joinPolicy ?? null,
      firstBreak: l.firstBreak,
      errors: l.errors,
      verdict: l.verdict,
      problem: l.problem,
    })),
    summary: {
      ladders: graded.length,
      pass: graded.filter((l) => l.verdict === 'PASS').length,
      fail: graded.filter((l) => l.verdict === 'FAIL').length,
      inconclusive: graded.filter((l) => l.verdict === 'INCONCLUSIVE').length,
    },
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`qc_ladder — ${graded.length} ladder(s) graded as SETS  |  measurement: ${report.measurement.source}\n`);
    for (const l of graded) {
      const head = l.catalogJoined ? `${l.product}/${l.field}  family "${l.family}"` : `${l.family}  (from ${ingest ? ingest.file : 'measurements'})`;
      console.log(`  ${l.verdict.padEnd(12)} ${head}`);
      for (const r of l.rungs) {
        const m = typeof r.measured === 'number'
          ? r.measured.toFixed(3) + (r.confidence != null ? `  (conf ${r.confidence})` : '')
          : '   —    unmeasured';
        console.log(`               declared ${String(r.declared).padStart(6)} ${r.unit === 'declared' ? '' : r.unit}  measured ${m}   ${r.option}`);
      }
      for (const e of l.excluded || []) console.log(`               excluded: ${e.option} "${e.label}" (${e.reason})`);
      if (l.steps && l.steps.length) {
        console.log(`               monotonic: ${l.monotonic}   separated(all pairs): ${l.separated}   spanFidelity: ${l.spanFidelity ?? 'n/a'}`);
      }
      // Collapse identical repeats — an UNMEASURED_RUNG explanation that is the
      // same sentence for every rung is one finding, not four.
      const seenErr = new Map();
      for (const e of l.errors) {
        const k = `${e.severity}|${e.code}|${e.detail}`;
        seenErr.set(k, (seenErr.get(k) || 0) + 1);
      }
      for (const [k, n] of seenErr) {
        const [severity, code, detail] = k.split('|');
        console.log(`               [${severity}] ${code}${n > 1 ? ` (x${n})` : ''}: ${detail}`);
      }
      console.log('');
    }
    console.log(`summary: ${report.summary.pass} PASS, ${report.summary.fail} FAIL, ${report.summary.inconclusive} INCONCLUSIVE`);
    if (report.summary.fail || report.summary.inconclusive) {
      console.log(`\n${PROHIBITION}`);
      console.log('Honest remedies:');
      for (const r of REMEDIES) console.log(`  - ${r}`);
    }
  }

  if (args.apply) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
    if (!args.json) console.log(`\nwrote ${rel(reportPath)}`);
  } else if (!args.json) {
    console.log(`\nDry run. Re-run with --apply to write ${rel(reportPath)}`);
  }

  process.exit(report.summary.pass === graded.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
