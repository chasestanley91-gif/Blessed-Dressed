# Handoff — craft-option photography, 2026-08-10

Written at a usage reset. Everything below is verified, not assumed.

---

## The headline

**The images were being made at the cheapest possible setting, and that was my
error.** I was running `gpt_image_2` at `quality: low, resolution: 1k` — 0.5
credits — to conserve credits, on a project whose stated standard is luxury
editorial photography. That is why they looked like slop. They looked like what
they cost.

Worse, the cheap setting was not even the cheap option. A bake-off on one
option (shirt triangle pocket), same drawing, same prompt:

| Model | Credits | Result |
|---|---|---|
| `soul_2` 2k | 0.12 | **Returned a line drawing.** Copied the blueprint's style. Unusable. |
| `seedream_v4_5` high (6K) | 1 | Gorgeous light. **Wrong geometry** — plain inverted triangle, not the drawn pentagon. |
| `nano_banana_2` 2k | 2 | Real cotton weave, correct shape. Big jump over the old setting. |
| `nano_banana_2` 4k | 3 | — |
| **`nano_banana_pro` 4k** | **4** | **WINNER — correct geometry AND real oxford weave, fine topstitching, natural drape.** |
| `gpt_image_2` high 2k | 7 | Clean but flat and soft; pocket small in frame. |
| `flux_2` max 2k | 6 | Good texture, correct V-point, but invented extra stitch lines inside the pocket. |

**Decision: `nano_banana_pro`, `resolution: 4k`, `aspect_ratio: 3:4`, 4 credits.**
Reference role is `"image"`. The blueprint is still always attached.

Cheapest is not best and most expensive is not best. Seedream at 1 credit makes
the prettiest picture in the set and gets the garment wrong, which for a
catalog that sells the garment is the only failure that matters.

---

## Two standing rules from the owner

**1. One attempt per option. No retry loops.** Generate once, then the owner
decides from the review page. Previous behaviour — up to three attempts with
automated re-grading — is withdrawn. It was also measured to oscillate rather
than converge, so this costs little and saves a lot.

**2. Nothing goes live without the owner's physical approval.** A QC verdict is
evidence, not consent. `publish_approved.mjs --apply` now refuses unless
`--owner-approved` is also passed.

Rule 2 had to be applied retroactively on 2026-08-10. Of 1,364 live rows serving
a generated image:

| | |
|---|---|
| Kept — owner accepted the option or the file | **576** |
| Removed — owner had **already rejected** this exact file | **263** |
| Removed — never reviewed at all | **525** |

575 of the removed rows fell back to their own tech-pack drawing, which is the
manufacturing blueprint and cannot misrepresent the option. 213 had no drawing
and are now empty — an empty slot is honest where a wrong photograph is not.

No craft option and no image file was deleted. Every generated file is still on
disk and `public/images/reports/unpublish-ledger.json` lists all 788 changes, so
any of them can be re-wired with a one-line edit. Count holds at 2,862.

This also cleared both defects `shared_image_check.mjs` was failing on — the
trouser coin pocket selling three jacket rows, and the 7-loop waistband selling
"5 Loops". **That gate now reports zero.**

---

## There are four garments — everything else is a copy

Corrected by the owner, then verified against the catalog — the arithmetic is
exact, so this is not an approximation:

| Garment | Catalog rows | **Distinct craft options** |
|---|---|---|
| Shirt | 796 | **796** (appears in one product) |
| Jacket | 1,132 | **378** (× sport-coat, suit-2pc, suit-3pc) |
| Trousers | 666 | **222** (× trousers, suit-2pc, suit-3pc) |
| Vest | 268 | **134** (× vest, suit-3pc) |
| | **2,862** | **1,530** |

222 × 3 = 666. 134 × 2 = 268. A 2-piece suit is trousers + jacket; a 3-piece
adds a vest. **suit-2pc and suit-3pc contain no craft options of their own** —
1,332 rows (46.5%) are duplicates. One photograph per option, fanned out to
every row that shares it.

The identity is **(garment, field, option)** and deliberately excludes the
label, because four shared options have drifted in wording between product
files — jacket `sleeve-head/sleeve-regular` reads "Regular" in sport-coat and
suit-3pc but `"THE STRUCTURED / ENGLISH SHOULDER "` in suit-2pc. Keying on the
label split one craft option into two queue entries that would each have been
paid for. Fixing it collapsed the queue **161 → 137** and moved 22 more into
already-done: about **96 credits**.

Three shared options also disagree on which *drawing* they point at, and in all
three cases one side is the `/images/jacket/` set (5.8% usable). The queue now
prefers the trustworthy drawing over whichever product row it read first.

Fabrics, threads and buttons are out of scope and stay as they are.

---

## Where things stand

| | |
|---|---|
| Craft options | **2,862** — unchanged, invariants hold |
| Distinct craft options | 1,530 |
| Options with a shipping verdict | 291 (253 PASS + 38 PASS_WAIVED) |
| UNMET / FAIL | 60 / 25 |
| Candidate images on disk | 734 |
| Options still open | **137 identities**, covering 178 catalog rows |
| — of those, measured rungs (never shot) | 40 |
| **Still to shoot** | **96**, across 40 groups |
| Credits | **828.9** |
| **Cost to finish** | 96 × 4 = **384**, leaving ~445 |

Verified after re-prep: `prepared 136 / dropped 1`, `shootable 96, measured rungs
excluded 40`. The one drop is `shirt/collar-rounded-stand`, which has no drawing
at all and is needs-source, not a failure.

Everything already shipped was made at the old cheap setting. Replacing all 291
would cost ~1,164 credits — more than the balance. That is the next budget
decision, and it is the owner's.

---

## Resume in three commands

```bash
cd blessed-dressed
node tools/build_generation_queue.mjs        # rebuild the worklist
node tools/prep_batch.mjs --n=200 --compact  # ~4 min; writes batch-payload.json
node tools/batch_slice.mjs --list            # 96 shootable, 40 rungs excluded
```

Then per group: `node tools/batch_slice.mjs --group="<part>::<field>" --skip-rungs`
gives locked prompts and blueprint URLs. Generate with `nano_banana_pro` / 4k,
`record_generation.mjs` **immediately** (the credit is spent at generate; the
artifact only becomes durable at record), then `log_qc_result.mjs`.

Publish and rebuild the owner's page:
```bash
node tools/publish_approved.mjs --apply
node tools/build_review_queue.mjs --write     # every candidate, any verdict
node tools/catalog_invariants.mjs             # must print 2862
node tools/shared_image_check.mjs             # must print 0 defects
```

---

## Three things settled today that should not be re-litigated

### 1. Measured ladders are spec-only. 40 options excluded.

Graduated series (collar band 3.0/3.2/3.4 cm, cuff width 5/6/6.5/7/8 cm,
extension 5/5.5/6 cm, stitch offsets 0.1/0.3/0.5 cm) cannot be rendered. The
fix prescribed in July — extreme macro, identical crop, a steel rule in frame,
graded as a set — was finally run properly today on the 7-rung extension ladder.
**Every rung failed**, minimum scores 20 to 70. The "15 cm" rung rendered an
extension measuring about 4 cm *against its own ruler*.

And the ruler made it worse: without a scale reference a wrong dimension is
invisible; with one the error becomes measurable by the customer, in frame, in
our own catalog. Their tech-pack drawing already carries the dimension and is
the correct reference. `tools/batch_slice.mjs --skip-rungs` excludes them.

### 2. Option ids are not option identities — this shipped a wrong image.

382 options share an option id with a *different* option in the same product
(in shirt alone, 68 ids: `stitch-01-top` names a collar, a placket AND a cuff
option). The pipeline stores work at `.craft-pipeline/<product>/<optionId>/`, so
those overwrite each other and one PASS marks all three done.

`tools/shared_image_check.mjs` is the new standing gate and currently exits 1 on
exactly two files — see `WRONG-LIVE-IMAGES.md`. **Both need an owner decision.**
Neither can be fixed by generating: the jacket coin-pocket "drawing" is a fabric
swatch catalogue page, and "5 Loops" has no drawing at all.

The collision also *destroys provenance*: a metadata-based audit reported 15
defects that were false and missed both real ones. Verify against what the
customer is served, and open the image.

### 3. Grading is honest and the bar is very high.

Spot-checked by eye against the workers' verdicts and they were right every
time — including rejecting a beautiful extension photo whose measurement was
wrong. But options like the triangle pocket scored `composition: 91` (pocket
only 6% of frame) and fell to UNMET despite being perfectly usable. **The review
page carries every candidate regardless of verdict**, so the owner sees these
and can accept them. Do not discard UNMET candidates.

Note: `PASS_WAIVED` requires `attempt >= max(maxAttempts, 3)`. Running with
`--max-attempts=2` makes a waiver unreachable and sends every near-miss to
UNMET. Under the new one-attempt rule the verdict is advisory anyway — the owner
decides.

---

## Open, needing the owner

1. **Two wrong images live now** — `WRONG-LIVE-IMAGES.md`. Recommendation: unwire
   both; an empty slot is honest, a wrong photograph mis-sells. Six rows. Not
   done, because it edits live catalog data.
2. **Replace the 291 old cheap images?** ~1,164 credits, more than the balance.
3. **40 measured options** — confirm they stay spec-only with the drawing shown.
4. **Supplier drawings needed** from Baoxiniao: jacket coin pocket (left), 5-loop
   waistband, and the 39 options whose only "drawing" is a website screenshot.
5. **Rotate the Higgsfield API key** — it was pasted in chat. Also still open from
   earlier: repo visibility, the KuteTailor token file, robots.txt on `/images/`.

## The reference library will not substitute for generation

The owner asked whether the reference images already on disk could be used
directly — real supplier photographs beat any render, and cost nothing.
`tools/scan_reference_photos.mjs` classified all of them. The answer is no:

| | |
|---|---|
| Scanned | **18,534** |
| Technical flats (line art on white) | **17,366** — 93.7% |
| **Real photographs** | **134** — 0.7% |
| Unsure | 1,034 |
| Unreadable | 3 |

The supplier library is a *pattern library*, not a photo library. Those 17,366
flats are exactly the tech-pack drawings the pipeline already uses as blueprints
— they are the input, not the output.

The 134 photographs are clustered in a few field codes rather than spread across
the catalog, so they cannot cover the 120 open options:

```
16 / 34    factory-screenshots/hero-library     (47% — marketing shots)
15 / 152   factory-screenshots/shirt/REQMA
14 / 154   factory-screenshots/vest/REQMA
 9 / 105   factory-screenshots/vest/KBACZ
 5 / 44    factory-screenshots/suit-jacket/GTELV
```

**Worth doing anyway** (free, and real cloth always beats a render): open those
134 plus the 1,034 unsure, discard anything carrying supplier branding or a
watermark, and check each actually shows the option it is filed under. Whatever
survives is a free, genuine catalog image and removes that option from the
generation bill. Full list in `public/images/reports/reference-photo-scan.json`.
The scan cannot judge branding or subject — that needs eyes.
