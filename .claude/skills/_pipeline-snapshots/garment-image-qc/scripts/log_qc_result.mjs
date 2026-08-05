#!/usr/bin/env node
// log_qc_result.mjs — persist a QC verdict. This is the fix for the one gap
// that mattered most in the old single-skill pipeline: verification happened
// entirely in the agent's head, with no audit trail and no proof it was ever
// actually run consistently. Every call to this script writes qc.json, so a
// batch run leaves a real record instead of a chat transcript nobody re-reads.
//
// The PASS/PASS_WAIVED/FAIL/UNMET verdict is computed HERE, deterministically,
// from the scores and errors you supply — not trusted from an agent-asserted
// verdict string. That closes the other old gap: "bounded retries" and "≥98 in
// every category" were sentences in a markdown file before; now they're
// enforced by code every single time.
//
// PASS_WAIVED (user decision, 2026-07-30): the ≥98-in-every-category gate STAYS.
// But once the retry budget is genuinely exhausted, an image carrying ZERO
// critical/major findings and scoring ≥95 in every category may ship as an
// explicitly LOGGED WAIVER rather than being lost to UNMET. The waiver is
// mechanically derived here — there is deliberately no input flag that lets a
// caller request or assert one — and it writes a `waiver` object into qc.json
// recording exactly which categories were let through, by how much, and why.
//
// The agent still does the actual visual comparison (Read both images, walk
// the checklist — see comparison-rules.md) since no script can grade image
// accuracy. This script only turns that judgement into a persisted, gated
// decision.
//
// Usage:
//   node log_qc_result.mjs --product=shirt --option=<id> --input=<path to qc-input.json>
//   node log_qc_result.mjs --product=shirt --option=<id> --input=<path> --max-attempts=3
//
// qc-input.json shape:
//   {
//     "scores": { "shape": 100, "geometry": 98, "dimensions": 100, "angles": 100,
//                 "construction": 95, "placement": 100, "symmetry": 100,
//                 "composition": 100, "blueprint-match": 97 },
//     "errors": [
//       { "severity": "critical|major|minor", "category": "...",
//         "description": "...", "expected": "...", "actual": "...",
//         "correction": "..." }
//     ],
//     "lockedFeatures": ["fabric", "camera angle", "lighting"],
//     "notes": "free text"
//   }
//
// Verdicts, evaluated in this order:
//   PASS        every category >= SCORE_MIN (98), zero critical/major errors
//   PASS_WAIVED budget spent (attempt >= max(maxAttempts, DEFAULT_MAX_ATTEMPTS)),
//               every category >= WAIVER_MIN (95), zero critical/major errors
//               -> ships, with a `waiver` object recording the shortfall
//   UNMET       budget spent and neither of the above qualified — terminal
//   FAIL        otherwise; a retry is owed, `correction` block written
//
// Exit 0 always (the verdict is data, not a shell failure) unless the input
// is malformed or required flags are missing.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, resolveRepoRoot, pipelineDir, ensureDir, writeJson, readJson } from './lib/util.mjs';

const SCORE_CATEGORIES = [
  'shape', 'geometry', 'dimensions', 'angles', 'construction',
  'placement', 'symmetry', 'composition', 'blueprint-match',
];
const SCORE_MIN = 98;
// Floor for a post-exhaustion minor-only waiver. Never used before the retry
// budget is spent, and never on its own — zero critical/major errors is an
// independent, non-negotiable condition. See the PASS_WAIVED note in the header.
const WAIVER_MIN = 95;
const DEFAULT_MAX_ATTEMPTS = 3;

const args = parseArgs();
for (const req of ['product', 'option', 'input']) {
  if (!args[req]) {
    console.error(`ERROR: --${req} is required.`);
    process.exit(1);
  }
}
if (!fs.existsSync(args.input)) {
  console.error(`ERROR: input file not found: ${args.input}`);
  process.exit(1);
}

let payload;
try {
  payload = readJson(args.input);
} catch (e) {
  console.error(`ERROR: could not parse ${args.input} as JSON: ${e.message}`);
  process.exit(1);
}

const scores = payload.scores || {};
const errors = Array.isArray(payload.errors) ? payload.errors : [];
const maxAttempts = Number(args['max-attempts']) || DEFAULT_MAX_ATTEMPTS;

// ---- validate scores cover every category ----------------------------
const missingCategories = SCORE_CATEGORIES.filter((c) => typeof scores[c] !== 'number');
if (missingCategories.length) {
  console.error(`ERROR: qc-input.json is missing scores for: ${missingCategories.join(', ')}`);
  console.error(`All ${SCORE_CATEGORIES.length} categories are required: ${SCORE_CATEGORIES.join(', ')}`);
  process.exit(1);
}

// ---- tolerant reading of an error's prose ------------------------------
// The documented key is `description`, but agents in the field have written
// `detail`, `error`, `finding` and `summary` instead — measured 2026-07-30 over
// the real .craft-pipeline corpus: 40 of 126 error entries (32%) use something
// other than `description`. Reading only `description` silently produced
// "Regenerate to fix: undefined" in correction blocks and would have written a
// waiver whose findings were all null — an audit record that proves nothing.
// Severity and category are already normalised, so only the prose needs this.
const DESCRIPTION_KEYS = [
  'description', 'detail', 'error', 'finding', 'summary',
  'assessment', 'impact', 'feature', 'checklist', 'checklistItem',
];
function describeError(e) {
  for (const k of DESCRIPTION_KEYS) {
    if (typeof e[k] === 'string' && e[k].trim()) return e[k].trim();
  }
  // Never lose a finding to an unrecognised key — serialise what was written.
  const rest = Object.fromEntries(
    Object.entries(e).filter(([k]) => k !== 'severity' && k !== 'category')
  );
  return Object.keys(rest).length
    ? JSON.stringify(rest)
    : `(no description supplied for ${e.category || 'uncategorised'} finding)`;
}
const expectedOf = (e) => e.expected || null;
const actualOf = (e) => e.actual || e.observed || null;

// ---- validate error severities ----------------------------------------
const VALID_SEVERITY = new Set(['critical', 'major', 'minor']);
for (const e of errors) {
  if (!VALID_SEVERITY.has(e.severity)) {
    console.error(`ERROR: invalid error severity "${e.severity}" — must be one of critical|major|minor.`);
    process.exit(1);
  }
}

// ---- the gate: EVERY category must reach SCORE_MIN, no blocking errors ---
const belowMin = SCORE_CATEGORIES.filter((c) => scores[c] < SCORE_MIN);
const belowWaiverMin = SCORE_CATEGORIES.filter((c) => scores[c] < WAIVER_MIN);
const blockingErrors = errors.filter((e) => e.severity === 'critical' || e.severity === 'major');
const scoreCardPasses = belowMin.length === 0;
const noBlockingErrors = blockingErrors.length === 0;
const rawPass = scoreCardPasses && noBlockingErrors;

const root = args.root || resolveRepoRoot();
const dir = pipelineDir(root, args.product, args.option);
const genPath = path.join(dir, 'generation.json');
const attempt = fs.existsSync(genPath) ? (readJson(genPath).attempt || 1) : 1;

const retriesExhausted = attempt >= maxAttempts;
// A waiver is only ever reachable AFTER the full retry budget is spent, and only
// for minor-only findings. Both conditions are structural — neither can be
// supplied, overridden or asserted through qc-input.json.
//
// The floor on `attempt` is deliberately the LARGER of the caller's
// --max-attempts and DEFAULT_MAX_ATTEMPTS: the decision grants the waiver only
// "after 3 attempts", so passing --max-attempts=1 must not be able to
// manufacture an early waiver. Lowering the budget can still shorten the retry
// loop (-> UNMET sooner), it just cannot buy a cheaper approval. Raising it
// (--max-attempts=5) correctly pushes the waiver out to attempt 5.
const waiverAttemptFloor = Math.max(maxAttempts, DEFAULT_MAX_ATTEMPTS);
const budgetGenuinelySpent = attempt >= waiverAttemptFloor;
const waiverQualifies = budgetGenuinelySpent && belowWaiverMin.length === 0 && noBlockingErrors;

let verdict;
let correction = null;
let waiver = null;
if (rawPass) {
  verdict = 'PASS';
} else if (waiverQualifies) {
  // Retry budget spent, zero critical/major findings, and every category still
  // at or above WAIVER_MIN. Ships — but only with the shortfall written down.
  verdict = 'PASS_WAIVED';
  waiver = {
    granted: true,
    reason:
      `minor-only at attempt ${attempt} of ${maxAttempts}: retry budget exhausted with zero ` +
      `critical/major findings and every category >= ${WAIVER_MIN}`,
    waiverMin: WAIVER_MIN,
    scoreMin: SCORE_MIN,
    belowScoreMin: belowMin.map((c) => ({
      category: c,
      score: scores[c],
      shortfall: SCORE_MIN - scores[c],
    })),
    minorErrors: errors
      .filter((e) => e.severity === 'minor')
      .map((e) => ({
        category: e.category || null,
        description: describeError(e),
        expected: expectedOf(e),
        actual: actualOf(e),
      })),
    attempt,
    maxAttempts,
    waiverAttemptFloor,
    authority:
      'user decision 2026-07-30: QC gate stays >=98; a 3rd attempt is allowed; after 3 attempts ' +
      'an image with ZERO critical/major findings may ship at >=95 as a LOGGED WAIVER in qc.json',
    grantedAt: new Date().toISOString(),
  };
} else if (retriesExhausted) {
  // Bounded retries exhausted and the waiver floor was not met — never ship a
  // wrong image. Keep the existing illustration; this is a finding to report,
  // not a silent failure.
  verdict = 'UNMET';
} else {
  verdict = 'FAIL';
  correction = {
    errors: blockingErrors.length
      ? blockingErrors.map((e) => ({
          severity: e.severity,
          category: e.category || null,
          error: describeError(e),
          expected: expectedOf(e),
          actual: actualOf(e),
          correction: e.correction || `Regenerate to fix: ${describeError(e)}`,
        }))
      : belowMin.map((c) => ({
          severity: 'minor',
          category: c,
          error: `score-card category "${c}" scored ${scores[c]} (< ${SCORE_MIN})`,
          expected: `>= ${SCORE_MIN}`,
          actual: String(scores[c]),
          correction: `Strengthen the geometry/coverage wording or reference weight for "${c}" and regenerate.`,
        })),
    lockedFeatures: payload.lockedFeatures || [],
    forbiddenChanges: [
      'do not alter any checklist item this attempt already passed',
      'do not change the camera crop, composition, or accessories unless the error is itself a composition error',
      'do not change the garment part, orientation, or any other option\'s geometry',
    ],
  };
}

const record = {
  addr: `${args.product} > ${args.option}`,
  productId: args.product,
  optionId: args.option,
  attempt,
  maxAttempts,
  scores,
  scoreMin: SCORE_MIN,
  waiverMin: WAIVER_MIN,
  belowMinCategories: belowMin,
  belowWaiverMinCategories: belowWaiverMin,
  errors,
  verdict,
  waiver,
  correction,
  // ALWAYS record what the image got RIGHT, at the top level, whatever the
  // verdict. Until now lockedFeatures lived only inside `correction`, and
  // `correction` is false whenever no retry is owed — so on UNMET (and on PASS)
  // the list was silently dropped and survived only in the raw qc-input.json.
  //
  // That is backwards. An UNMET option is exactly the one someone will revisit
  // later, after a better drawing arrives or a merge ruling lands, and the first
  // thing they need is what already works so they do not spend a credit
  // rediscovering it. Measured on trousers/coin-both: seven measured-correct
  // features — including that the option's whole identity, the count of two, is
  // right, and that the U-shaped open-top mouth its coin-left sibling is MISSING
  // is present here — would have been lost at the moment the verdict was written.
  lockedFeatures: payload.lockedFeatures || [],
  notes: payload.notes || '',
  checkedAt: new Date().toISOString(),
};
const qcPath = writeJson(path.join(dir, 'qc.json'), record);
console.log(`Wrote ${qcPath}`);
console.log(`VERDICT: ${verdict}`);

// ---- announce a waiver loudly — a waiver must never be silent -----------
if (verdict === 'PASS_WAIVED') {
  console.log('*** WAIVER GRANTED — this image ships BELOW the 98 gate ***');
  console.log(`  Retry budget exhausted at attempt ${attempt}/${maxAttempts}, zero critical/major findings.`);
  console.log(`  Waiver floor ${WAIVER_MIN} met in every category; the following fell short of ${SCORE_MIN}:`);
  for (const c of belowMin) {
    console.log(`    - ${c}: ${scores[c]} (${SCORE_MIN - scores[c]} below the ${SCORE_MIN} gate)`);
  }
  const minorCount = errors.filter((e) => e.severity === 'minor').length;
  console.log(`  Minor findings logged: ${minorCount}${minorCount ? ' (see qc.json -> waiver.minorErrors)' : ''}`);
  console.log(`  Authority: ${waiver.authority}`);
  console.log('  Recorded in qc.json -> waiver. Report this option as WAIVED, not as a clean PASS.');
}

// ---- on PASS or PASS_WAIVED, stage the approved image for write-back ----
if (verdict === 'PASS' || verdict === 'PASS_WAIVED') {
  const genRecord = readJson(genPath);
  const ext = path.extname(genRecord.candidatePath) || '.jpg';
  const approvedDir = path.join(root, 'public', 'images', 'generated', args.product);
  ensureDir(approvedDir);
  const approvedPath = path.join(approvedDir, `${args.option}${ext}`);
  fs.copyFileSync(genRecord.candidatePath, approvedPath);
  const webPath = `/images/generated/${args.product}/${args.option}${ext}`;
  console.log(`Approved image staged at: ${approvedPath}`);
  console.log(`Web path for catalog write-back: ${webPath}`);
  console.log('Next: edit the option\'s sourceFile surgically — set `image` to this path, ' +
    'preserve the prior illustration under `techpackIllustration`.');
} else if (verdict === 'UNMET') {
  const why = [];
  if (blockingErrors.length) {
    why.push(`${blockingErrors.length} blocking (critical/major) error(s)`);
  }
  if (belowWaiverMin.length) {
    why.push(`below the ${WAIVER_MIN} waiver floor: ` +
      belowWaiverMin.map((c) => `${c}=${scores[c]}`).join(', '));
  }
  if (!budgetGenuinelySpent) {
    why.push(`waiver needs attempt >= ${waiverAttemptFloor}, this is attempt ${attempt}`);
  }
  console.log(`Bounded retries exhausted (attempt ${attempt}/${maxAttempts}). ` +
    'Keep the existing illustration as `image`; report this option as unmet — a finding, not a failure.');
  console.log(`No waiver: ${why.join('; ')}.`);
} else {
  console.log(`Attempt ${attempt}/${maxAttempts}. Regenerate via garment-image-director, ` +
    'reading the `correction` block in qc.json first.');
}

console.log(JSON.stringify(record, null, 2));
