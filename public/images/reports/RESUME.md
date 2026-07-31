# RESUME — save point

_Last save: **2026-07-30 (session B)**, production-readiness pass, 0 credits spent._
_Machine state: `CHECKPOINT.json` (same folder). Where work stopped: `HANDOFF.md` (repo root)._

> **This file was rewritten on 2026-07-30.** The previous version described the
> `shirt-image-factory` remake-queue workflow, which is **superseded** by the three-skill
> pipeline. That history is preserved in `CHECKPOINT.json` (`remake_queue`, `batch3`,
> `batch4`, `done_do_not_redo`) and in `PROGRESS.md`. Nothing was deleted.

## How to resume

1. **`STATE.md`** (repo root) — the only position numbers worth trusting. Generated;
   never hand-edited. A prose checkpoint claiming a batch passed is not evidence, only
   `qc.json` is.
2. **`CONTINUE.md`** (repo root) — the next concrete action, in priority order.
3. **`HANDOFF.md`** (repo root) — exactly where session B stopped and what is blocked.
4. **`failure-log.md`** (this folder) — **read before writing any prompt.** Every lesson
   there was paid for.
5. The pipeline skills, in order: `tech-pack-interpreter` → `garment-image-director` →
   `garment-image-qc`, then `tools/publish_approved.mjs` → `tools/project_state.mjs`.

Re-run `node tools/project_state.mjs` after **every** work unit.

## Standing rules

- The tech-pack illustration is law. Never improve it, never redesign it.
- `garment-image-qc` is the only authority that may approve a catalog write-back.
- Never overwrite an approved asset. Never generate from `/images/generated/` — that is
  our own output, and reading it back makes each pass a copy of a copy.
- A wrong blueprint is invisible to QC: every score measures fidelity *to the drawing*,
  so the more faithful the render, the higher it scores. The catalog label is the only
  independent cross-check, and interpret time is the only place to apply it.
- `medias` is mandatory on **every** generate call, including retries.
- Log every credit spend in `failure-log.md`.
- Keep agents **read-only** on state files.

## Position (regenerated 2026-07-30)

**12 / 1,979** in-scope options verified & shipped (0.6%). **2 blocking findings.**

| stage | count |
|---|---|
| shipped | 12 |
| legacy-shipped-unverified | 1,027 |
| not-started | 915 |
| needs-reverify | 11 |
| unmet | 5 |
| generated-awaiting-qc | 5 |
| prompt-built | 3 |
| failed-retry-due | 1 |

## Budget — the catalog DOES fit in the remaining credits

**Credits: 928.5 (verified live 2026-07-30, not the 969.5 the old ledger carried).**

The 1,979 in-scope rows collapse to **1,140 distinct option identities** — the same
craft option recurs across six products, and `project_state.mjs` already treats
cross-product reuse as correct. Re-derived cost:

| work | images | credits |
|---|---|---|
| never generated | 558 | 488 |
| in-flight fixes | 19 | 17 |
| legacy in colliding groups (provably wrong) | 251 | 220 |
| legacy clean 1:1 — QC free, regenerate only on FAIL | 60–149 | 52–130 |
| **total** | | **777–855 of 928.5** |

The earlier "3,000–4,000 credits, cannot be completed" BLOCKER counted option *rows*
rather than images and is **withdrawn**.

**Stop generating at a 100-credit reserve floor**, checkpoint, and report which clusters
remain. Never silently truncate coverage.

## Generation facts (unchanged, still verified)

- `gpt_image_2`, quality `low`, resolution `1k`, aspect `3:4`, `count: 1` =
  **0.5 credits/image** (`get_cost` verified twice). No 4:5 ratio on this model.
- Blueprint always attached: `media_upload` → `hf_put.mjs` PUT → `media_confirm`.
  Higgsfield media persist across sessions.
- Observed ~1.75 attempts per shipped image.
- To genuinely retry an UNMET option, **rename the prior `qc.json` first** (keep it as
  evidence) — `record_generation.mjs` derives the attempt number from it and will
  otherwise immediately re-exhaust the budget.

## User decisions recorded 2026-07-30 (act on these)

1. **Production first**, then the catalog runs continuously.
2. **Ambiguous families** (~408 options / 29 groups): macro-shoot what is genuinely
   photographable; recommend merge/reprice where physics says it is not. **Bring the
   per-family evidence list back to the user before merging any customer-facing option.**
3. **QC gate stays ≥98.** A 3rd attempt is allowed. After 3 attempts, an image with
   *zero* critical/major findings may ship at ≥95 as a **logged waiver** in `qc.json`.
   This closes the open question the old `CONTINUE.md` carried.
4. **Legacy:** QC everything (0 credits), regenerate only failures.

## Still owed by the user

- **Vercel env vars** — _diagnosis corrected 2026-07-30 (session C), verified live via
  `vercel env ls`._ The earlier "wrong names" finding was **wrong**. `STRIPE_SECRET_KEY`,
  `ADMIN_PASSWORD` and `ADMIN_TOKEN_SECRET` all exist under the correct names (55d old)
  but are scoped **Preview-only**, so production never receives them → checkout 503s and
  admin fails closed. The fix is to extend scope to Production, not to rename anything.
  `STRIPE_WEBHOOK_SECRET` **is** present in Production (previously listed absent — wrong).
  Genuinely absent everywhere: `NEXT_PUBLIC_SITE_URL`, `BLOB_READ_WRITE_TOKEN`,
  `RESEND_API_KEY`.
  - Dead weight, read by no code path: `Secret_key`, `Publishable_key`, `Restricted_key`,
    `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    (the app uses hosted Stripe Checkout redirect — no client-side publishable key),
    `BlessedDressed` (purpose unknown, added 2026-07-30).
  - **Open decision:** Preview Stripe creds are probably **test mode** (a stray Preview var
    is _named_ `pk_test_51TfHMd…`). Do **not** clone Preview→Production for Stripe; paste a
    fresh `sk_live_…`. Cloning a test key would make checkout silently take fake payments —
    worse than the current loud 503.
  - **Cleanup:** delete the Preview variable whose _name_ is a literal `pk_test_…` key.
- **Repo reconciliation** (see `HANDOFF.md`) — the Vercel deploy source is 7 weeks stale.
- The older standing decisions in `CHECKPOINT.json → decisions_needed_from_dustin`
  (items 2–6: per-family defect calls, `loops-5` source drawing, the 22 orphaned v2/v3
  remakes needing individual `--allow-swap` approval).
