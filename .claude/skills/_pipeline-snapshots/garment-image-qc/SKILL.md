---
name: garment-image-qc
description: >-
  Compare a generated Blessed & Dressed craft-option photo against its
  tech-pack illustration, classify any discrepancies by severity, decide
  accept/regenerate, and persist the verdict — the approval gate before a
  generated image can ever overwrite the catalog. Reads
  `.craft-pipeline/<productId>/<optionId>/{spec.json,prompt.json,
  generation.json}` (written by tech-pack-interpreter and
  garment-image-director), walks the per-option checklist, scores 9
  categories 0-100 (every category must reach 98, or 95 as a logged waiver
  once the retry budget is spent with zero Critical/Major findings),
  classifies any discrepancy as Critical/Major/Minor, and writes `qc.json` —
  the audit trail that proves verification actually happened. Use this skill whenever the
  user wants to verify, check, approve, or QC a generated craft photo against
  its illustration; after garment-image-director produces a candidate image;
  or when asked "does this photo match the tech pack", "is this ready to
  ship", "why does the generated image look wrong". This is stage 3 of a
  three-skill pipeline: tech-pack-interpreter (spec) → garment-image-director
  (prompt + generation) → garment-image-qc (this skill, "is it right, and
  what happens next"). This skill is the ONLY one of the three with authority
  to approve a write-back into the catalog — it never interprets a tech pack
  and never builds a prompt or calls the image model itself.
---

# Garment Image QC — the approval gate

Your job: decide, with evidence, whether a generated candidate image
actually matches its tech-pack illustration — and leave a record of that
decision that survives past this conversation. You do not interpret tech
packs (tech-pack-interpreter's job) and you do not build prompts or generate
images (garment-image-director's job). You are the only one of the three
skills allowed to approve a catalog write-back, and the only one whose
output (`qc.json`) is itself the deliverable, not just an intermediate
artifact.

## The supreme rule

The illustration is always correct; the generated image is always suspect.
Verification is the process — generation is one step. Approval is earned,
never assumed. See `approval-rubric.md` for the full standard.

## Tools you use

- **Bundled scripts** (deterministic): gather the comparison inputs, compute
  and persist the verdict.
- **Read** (vision) — to actually look at both images. No script can grade
  image accuracy; that's why this skill exists as agent-driven judgement
  backed by a deterministic gate, not a fully automated checker.
- **Edit** — to write the approved image path back into the catalog, only
  after a `PASS` verdict.

`<skill>` below is this skill's directory.

## The pipeline (run every step, in order)

### 1. Gather the comparison inputs
```
node <skill>/scripts/compare_prep.mjs --product=shirt --option=<optionId>
```
Returns the illustration path, the latest candidate image path, the
per-option `checklist[]`, the `scoreCard` categories, and `forbidden[]`. If
this errors, the pipeline is incomplete upstream — it tells you exactly
which artifact (spec/prompt/generation) is missing and which skill produces
it.

### 2. Read both images and compare — adversarially
`Read` the illustration and the candidate. Walk the full inspection in
`comparison-rules.md` (orientation, silhouette, feature count, placement,
angle, size, seam, pocket type/position, closure, waistband construction,
buttons, belt loops, stitching, fabric, crop, focal visibility). Actively
try to **reject** the image, not approve it — see `approval-rubric.md`.

### 3. Score and classify
Score all 9 `scoreCard` categories 0–100 (`shape`, `geometry`, `dimensions`,
`angles`, `construction`, `placement`, `symmetry`, `composition`,
`blueprint-match`). For every discrepancy found, classify it Critical /
Major / Minor per `error-taxonomy.md`.

### 4. Persist the verdict
Write a `qc-input.json` (Write tool) with your scores, errors, and — if
anything passed and should survive a retry — `lockedFeatures`:
```jsonc
{
  "scores": { "shape": 100, "geometry": 98, "dimensions": 100, "angles": 100,
              "construction": 95, "placement": 100, "symmetry": 100,
              "composition": 100, "blueprint-match": 97 },
  "errors": [ { "severity": "major", "category": "construction",
                "description": "...", "expected": "...", "actual": "...",
                "correction": "..." } ],
  "lockedFeatures": ["fabric", "camera angle"],
  "notes": "..."
}
```
Then:
```
node <skill>/scripts/log_qc_result.mjs --product=shirt --option=<optionId> --input=<path to qc-input.json>
```
This computes the verdict deterministically and writes `qc.json`. You do not
assert the verdict yourself; the script enforces the gate so it can never be
talked past. The four possible verdicts, evaluated **in this order**:

| # | Verdict | Condition | Ships? |
|---|---|---|---|
| 1 | `PASS` | every category ≥ **98** AND zero Critical/Major errors | yes |
| 2 | `PASS_WAIVED` | attempt ≥ max-attempts (never earlier than **3**) AND every category ≥ **95** AND zero Critical/Major errors | yes, **with a logged waiver** |
| 3 | `UNMET` | attempt ≥ max-attempts and neither of the above qualified | no — terminal |
| 4 | `FAIL` | anything else — a retry is still owed | no — regenerate |

The 98 gate has **not** moved. `PASS_WAIVED` only ever applies *after* the
retry budget is genuinely spent, and only to images whose findings are all
Minor — a Critical or Major error can never be waived at any score. Passing
`--max-attempts=1` cannot buy an early waiver; the waiver floor is the larger
of `--max-attempts` and the 3-attempt default.

### 5a. On PASS — write back to the catalog
`log_qc_result.mjs` already staged the approved file at
`public/images/generated/<productId>/<optionId>.<ext>` and printed the web
path. Edit the option's `sourceFile` (from `spec.json`) surgically:
- set `image` to the new local path,
- preserve the prior illustration under `techpackIllustration` (never lose
  it — it's the source of truth for any future regeneration),
- edit **only that one option**; never reformat the file or reorder other
  keys.
Re-run `compare_prep.mjs` or spot-check the catalog file to confirm the new
`image` resolves.

### 5b. On FAIL — hand back to garment-image-director
Report the `correction` block from `qc.json` (see `correction-loop.md`).
garment-image-director reads it, strengthens the prompt accordingly, and
regenerates — attempt number auto-increments, so re-run this skill's
pipeline from step 1 against the new candidate.

### 5c. On UNMET — stop, keep the existing illustration
Bounded retries are exhausted and the image did not even clear the waiver
floor. Do not regenerate again in this run. Report the option as unmet — a
finding about this option or the image model's limits, not a pipeline
failure — and leave `image` pointing at the existing illustration. The
script prints exactly why no waiver was granted (blocking errors, and/or the
categories below 95); carry that reason into your report.

### 5d. On PASS_WAIVED — it ships, but say so
Authorised by the user decision of 2026-07-30: *"QC gate stays ≥98. A 3rd
attempt is allowed. After 3 attempts an image with ZERO critical/major
findings may ship at ≥95 as a LOGGED WAIVER in qc.json."* The script stages
the approved file exactly as it does on `PASS`, so follow **5a** for the
write-back itself. Two extra obligations:
- `qc.json` carries a `waiver` object recording every category that landed
  between 95 and 98, its shortfall, the Minor findings, the attempt, and the
  granting authority. Never strip it and never hand-edit it — it is the whole
  justification for the image being in the catalog.
- Report the option to the user as **WAIVED, not as a clean PASS**, and carry
  the sub-98 categories into your batch summary. A waiver that reads like a
  pass in the report defeats the entire point of logging it.

## Non-negotiables

1. Never approve from memory of the prompt — always `Read` both the
   illustration and the candidate before scoring.
2. Never assert a verdict without running `log_qc_result.mjs` — an
   unpersisted verdict leaves no audit trail and didn't happen as far as the
   next person (or the next batch run) can tell.
3. Never write back to the catalog on anything but a script-computed `PASS`
   or `PASS_WAIVED`.
4. When in doubt, the discrepancy is real — reject. A false rejection costs
   one retry; a false approval ships a wrong image to a paying customer.
5. Never talk yourself into a waiver. `PASS_WAIVED` is computed, never
   requested — there is no input field that grants one, and downgrading a
   Critical/Major finding to Minor so an image can clear the waiver floor is
   the one way left to defeat this gate. Grade the finding on what it is.

## Bundled resources

- `scripts/compare_prep.mjs` — gather illustration + candidate + checklist +
  score-card in one call.
- `scripts/log_qc_result.mjs` — compute and persist the verdict (and, on
  PASS, stage the approved image file).
- `comparison-rules.md` — the 17-point inspection and how to use the
  gathered inputs.
- `error-taxonomy.md` — Critical/Major/Minor definitions and how they feed
  the gate.
- `correction-loop.md` — the structured regeneration format and the
  bounded-retry → `UNMET` rule.
- `approval-rubric.md` — the final acceptance standard.
