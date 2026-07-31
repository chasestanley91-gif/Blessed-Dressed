# Craft-Option Catalog — Progress Dashboard

_Maintained by the autonomous catalog build (goal: PROJECT-GOAL.md at repo root). Last update: 2026-07-26._

## Current checkpoint (2026-07-26 session)

**Work stream:** Remake queue from Dustin's 2026-07-25 review export
(`public/images/review-remake-queue.json`, 86 items: 64 shirt + 22 jacket).

| State | Count | Notes |
|---|---|---|
| QA PASS, awaiting Dustin's gallery Accept | 8 | collar_splicing v2s (QA report: `reports/qa-splice-v2-2026-07-26.json`) |
| v3 retries generated, QA in progress | 2 | splice-4cm-from-point (placket correction), splice-lower-cuff (phantom-seam correction) |
| cuff_splicing first attempts generated, QA in progress | 4 | csplice-upper-cuff / -lower-cuff / -cuff-edge / -strip-mid |
| Queued next | 9 | shirt `back` category (all blueprints verified present in `public/images/back/`) |
| Queued after | 61 | remaining shirt cats (decoration stitching, collar_stand, bias_cutting, front, ...) + jacket (22) |

Per-option specs/prompts/attempts live in `shirt-assets/photos/shirt/<option-id>/`
(skill working layout, recreated 2026-07-26). Batch job map: `shirt-assets/photos/shirt/_batch-2026-07-26.json`.
Back-category note: back blueprints draw craft features (pleats/darts) as RED lines on a
full shirt-back tech pack — same red-marker convention as splicing, but red = construction
line, not contrast fabric; spec drafting must disambiguate per option vs siblings.

## Budget

- Higgsfield balance 2026-07-26: **993 credits** (plan: plus)
- Projected for remaining 76 remakes: 76 × 0.5 cr × 1.5 retry allowance ≈ **57 credits**
- Spend log: `failure-log.md` (this folder)

## Key state files (single sources of truth)

| Thing | Path |
|---|---|
| Remake queue (Dustin's explicit remake requests) | `public/images/review-remake-queue.json` |
| Review gallery (Dustin's accept/remake UI) | `public/images/review.html` (rebuild: `node scripts/build_review.mjs` from skill) |
| Salvaged decisions export (truncated — full decisions.json still owed by Dustin) | `public/images/review-decisions-2026-07-25-salvaged.json` |
| Mapping audit | `public/images/reports/mapping-audit-2026-07-25.json` |
| Failure log + spend | `public/images/reports/failure-log.md` |
| Operating manual | `.claude/skills/shirt-image-factory/` |
| Catalog data | `data-store/options/{shirt,sport-coat,suit-2pc,suit-3pc,trousers,vest}.json` |

## Standing decisions still owed by Dustin (do NOT act without them)

1. Swap the 4 vest v2s into the site (`public/images/generated/vest/*-v2.png`)
2. Confirm the 2 shirt cuff-splicing discards (site-data edit)
3. Full `decisions.json` download from the 2026-07-25 review (chat paste truncated at 50k —
   accepted_keys and per-image verdicts missing; bad-tech-pack list cut off mid `lapel-bh-style`)
4. Duplicate-file cleanup approval

## Safety rules in force

- Blueprint law; per-feature pass/fail QA (no fake percentages); 3 strikes → needs-human.
- Never overwrite an approved/production image — new versions are `-v2`, `-v3`; swaps only with
  Dustin's explicit OK (gallery Accept is the approval gate).
- Budget guard: show numbers before any batch > 10 images or near balance.
- Read `failure-log.md` before generating; append lessons + spend after.

## Done earlier (do not redo)

- Trousers: 35/35 generated & wired (`_HANDOFF_trouser_regen.md`, COMPLETE)
- Shirt collar styles (60): re-done via nano_banana i2i, wired
- Vest: 4 v2 remakes generated, awaiting swap decision
- Jacket/suit details batch committed 64a4d0a
