# Generation Runbook — how to continue the photography run

**Status 2026-08-08.** The pipeline is proven end to end, six photographs are
approved and published, and the work list is built. **549 photographs remain,
covering 1,216 catalog rows.**

Session result: 9 images generated, 6 approved, 3 rejected and re-shot.
Spend 4.5 credits, balance ~693. Every rejection produced a durable fix in the
prompt builder rather than a hand-edited one-off, so the next option in each
class starts from the corrected prompt.

A wrong image was found already LIVE: `lbp-3l-2r` was serving the render with
four buttonholes on both lapels. It has been replaced with the verified 3/2
image and confirmed byte-for-byte.

---

## What is proven

`suit-2pc / lbp-3l-2r` — "Three Left / Two Right" — went through the complete
loop and passed:

| | result |
|---|---|
| attempt 1 | **FAIL** — four buttonholes on *both* lapels |
| attempt 2 | **PASS** — three on the wearer's left, two on the right |

Attempt 1 made two errors at once: it overshot the count *and* symmetrised the
two sides. Both were fixed by the COUNT LOCK, which is now generated
automatically for every count-bearing option.

Spend so far: 2 images, 1.0 credit. Balance ≈ 696.5.

---

## The bottleneck, stated plainly

Every generation needs its tech-pack drawing attached as the reference — that
rule is the first line of the failure log and it is not negotiable, because a
text-only render invents geometry.

Attaching a drawing means uploading it, and the upload is a signed URL roughly
1,500 characters long that has to pass through the assistant's context by hand.
The Higgsfield connection is OAuth-only: there is no API key on this machine, so
no script can do the upload loop unattended. The repository is private, so
`media_import_url` cannot reach the drawings either.

**Consequence:** roughly 12 images per working session, not 554. This is a
throughput limit of the tooling, not of the pipeline. Everything else — spec
extraction, prompt locking, the pre-flight gate, recording, QC — is automated
and free.

### How to remove it

Any one of these turns the run into a single unattended job:

1. **A Higgsfield API key** in the environment. Then `tools/prep_batch.mjs` can
   be extended to upload, generate, poll and record in one pass.
2. **Make `public/images/` publicly reachable** (a public mirror repo, or an
   S3/R2 bucket). Then `media_import_url` replaces the upload entirely and the
   loop needs no signed URLs.
3. **Run the loop in a session per batch**, following the steps below.

Option 2 is the cheapest and is recommended.

---

## The loop

```bash
# 1. Re-validate. Nothing is generated from a blocked spec.
node tools/validate_spec.mjs

# 2. Rebuild the work list (dedups to part-level identities; skips PASSed work).
node tools/build_generation_queue.mjs          # everything ready
node tools/build_generation_queue.mjs --queue  # only audit-cleared clusters

# 3. Prepare the next batch: persists spec.json, builds the locked prompt,
#    runs the pre-flight gate, drops anything that fails it.
node tools/prep_batch.mjs --n=12
#    -> public/images/reports/batch-payload.json
```

Then, per batch:

4. `media_upload` with the 12 filenames → PUT each file → `media_confirm`.
5. `generate_image_batch` with the 12 prompts, each with its `mediaId` as the
   `image` reference.
6. `jobs_wait`, then **`record_generation.mjs` immediately** — the credit is
   spent at generate, but the artifact only becomes durable at record.
7. QC each image: crop the feature and enlarge 3–4×, then count. Never count
   from the full frame; at that scale three and four are indistinguishable.
8. `log_qc_result.mjs` writes the verdict. A PASS makes the option disappear
   from the next work list automatically.

---

## Rules that must not be relaxed

- **The drawing is always attached.** Never generate from text alone.
- **Record immediately after generate.** An interruption between the two
  destroys paid work.
- **One photograph per identity**, fanned out to every product row that shares
  it. Jacket options are shared across suit-2pc, suit-3pc and sport-coat; the
  same holds for trousers and vest. Generating per row pays ~1.7× for nothing.
- **Never delete a craft option.** The count reads 2,862 at every checkpoint.
- **Compare a retry against the previous verdict before re-shooting.**
  Corrections were measured to oscillate rather than converge — four of five
  re-shoots lost locked features. Prefer `PASS_WAIVED` to a third attempt.
- **Do not generate a blocked option.** 374 in-scope rows are blocked, and each
  one is a credit that would buy a confident photograph of the wrong thing.

---

## What is blocked and why

| count | reason |
|---|---|
| 133 | the drawing is proven to show the wrong thing |
| 146 | a named style whose only specification is a drawing nobody has checked |
| 116 | one drawing serving two genuinely different options |

These need a decision or a better drawing, not a credit.

---

## The API key question — ANSWERED 2026-08-10

**The Higgsfield API bills separately from the web subscription. The Plus
credits do not carry over.**

Tested directly. Credentials were created at cloud.higgsfield.ai and every
generation request came back:

```
HTTP 403  {"detail":"not_enough_credits"}
```

while the web account showed **990.5 credits** before and after. Note the error:
403 `not_enough_credits`, not 401 unauthorized — **the key authenticates fine**.
The API-side account simply has a zero balance of its own.

The probe cost nothing; every request was rejected before any work was done.

### What this means

| route | cost | throughput |
|---|---|---|
| Through the assistant (today) | uses the 990.5 credits already paid for | ~12–20 images per session |
| Higgsfield API | needs a SECOND, separately funded balance | all 209 unattended |

The remaining 209 photographs need roughly **136 credits** at the measured rate
of ~0.65 per shipped image. The account already holds 990.5. So funding the API
would mean paying a second time for capacity that is already owned — unless
cloud.higgsfield.ai offers a way to link the existing subscription, which their
public documentation does not mention either way.

**Recommendation: do not fund the API account yet.** Ask Higgsfield support
(support@higgsfield.ai) whether a Plus subscription can be used from the API. If
it can, throughput is solved for free. If it cannot, the choice is between
paying twice and continuing through the assistant across several sessions.

Credentials live at `~/.higgsfield-credentials`, outside the repository, and are
already wired into `tools/run_generation.mjs`. Nothing else needs setting up —
the moment that balance is non-zero, `--probe` then `--apply` runs the lot.
