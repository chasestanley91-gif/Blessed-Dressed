# Reconciliation Audit — 2026-08-11

_The complete pre-generation audit required by PROJECT-GOAL-V4 §16. Numbers are
derived from `data-store/image-decision-ledger.json` (the canonical merged
decision ledger) and `data-store/generation-queue.json`; regenerate both with
`node tools/build_decision_ledger.mjs --write && node tools/generation_queue.mjs`._

## The one-line answer

Every decision from BOTH histories is merged, bound to an exact craft, and
enacted; the catalog serves exactly what the owner approved; 444 untrusted
"illustrations" are gone; the remaining work is 260 generations (253 of them
failure-aware retries) and 145 owner decisions.

## §16 numbers

| Question | Answer |
|---|---|
| Total catalog crafts | **2,862** (unchanged — nothing deleted) |
| Crafts with a verified-MATCH illustration | **395** |
| Crafts with a drawing not yet craft-verified | **1,631** (usable; flagged `drawing-unverified`) |
| Crafts missing an illustration | **790** (mostly excluded swatch rows; 80 in scope) |
| Illustrations flagged AMBIGUOUS, kept for investigation | **82** |
| Approved from July source (accepted rows + kept files) | **678 keys + 887 files** |
| Approved from admin portal | **211** (of 297 decisions) |
| Unique merged approvals (crafts with owner photo approval) | **1,765** |
| Duplicate/conflicting decisions (same image, opposite verdicts) | **0** |
| Rejected images on record | **1,438 July file-rejects + 86 admin rejects** |
| Unresolved decision references | **0** |
| Image gaps needing fresh generation (state B) | **7** |
| Images requiring failure-aware regeneration (state C) | **253** |
| Candidates awaiting admin approval (state D) | **145** crafts (603-item review queue) |
| Crafts already complete (state E) | **837** |
| Excluded from generation by design (state X: swatch/thread/button/ladder) | **1,540** |

## What was reconciled

1. **Both decision histories merged** into `data-store/image-decision-ledger.json`:
   the 2026-07-30 review export, the admin portal's decisions (291 legacy +
   the append-only full-identity log), the unpublish/restore history, and 376
   machine QC verdicts (marked `machine: true`, never counted as approval).
2. **Every decision binds to a full craft address** (`product|section|field|option`).
   The 11 decisions on ambiguous `product/option` keys (the `coin-left` family)
   bind through the pipeline spec of the candidate the owner actually judged.
3. **The catalog now serves the exact approved bytes**: 171 approvals were
   already exact; 35 were live with the wrong attempt or another product's file
   and were re-published from the approved candidate; 5 staged legacy images
   the owner approved were rewired to their originals.
4. **81 owner rejection reasons folded into retry prompts**; 5 more are
   preserved in `apply-owner-approvals-log.json` until their prompts exist.
5. **444 untrusted illustration slots cleared** (264 never-audited
   `/images/jacket/`, 173 audited MISMATCH, 7 jacket AMBIGUOUS) — and
   `catalog_invariants.mjs` check 8 now makes that class of fallback
   structurally impossible. All invariants pass.

## Standing protections (new since this audit)

- Admin decisions append to `data-store/image-review-decisions-log.json` with
  craft address + image sha1; undo writes a revocation, never an erasure.
- The applier refuses a ledger older than the decision files, refuses byte
  changes under a path other crafts display, and excludes owner-rejected
  crafts from fan-out.
- Approval is craft-specific everywhere: bytes approved for a sibling craft
  neither protect nor claim another craft's slot.

## What generation may now proceed on

State B (7) + state C (253) = **260 crafts**, gated per wave by
`tools/description_audit.mjs`, generated through the three-skill pipeline with
each C craft's rejection context (`rejectionContext` in
`data-store/generation-queue.json`) folded into its unique prompt. Nothing
generated ships without explicit owner approval at `/admin/image-review`.
