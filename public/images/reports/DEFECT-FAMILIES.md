# DEFECT-FAMILIES — DISTINCT_OPTION_IMAGE_COLLISION

**Date:** 2026-07-30 · **Status: EVIDENCE ONLY.**

> **Nothing has been changed.** No option has been merged. No image has been replaced, deleted or
> regenerated. No file in `data-store/options/` has been written. Zero credits were spent producing
> this document. It exists so you can make 14 decisions with the evidence in front of you.

Machine-readable companion: `defect-family-evidence-2026-07-30.json`
Source finding: `defect-image-collisions-2026-07-30.json`

---

## The problem in one paragraph

85 craft options across sport-coat, suit-2pc, suit-3pc and trousers currently ship a photograph that
belongs to a *different* option. They fall into 14 families. Within each family every member ships
**byte-identical** content — 13 separate 2.2 MB PNG files that all hash to `cb7b3639df75`, and so on.
This survived the recent PNG→WebP publish: all 14 families still show exactly one distinct content
hash today. **None of the 85 has ever been through `garment-image-qc`**, so there is no approval to
revoke and nothing you decide here overturns a QC verdict.

---

## Summary — the 14 families

| # | Family | Options | What actually separates them | Recommendation | Confidence | Rows removed if merged |
|---|---|---|---|---|---|---|
| 1 | **FAM-PATCH-POCKET** | 13 | Whole-shape changes: plain / rounded / teardrop outline, pleat count, flap, button, tab shape | **MACRO_SHOOT** | high | — |
| 2 | **FAM-FLAP-DEPTH-55-65** | 11 | Flap depth 4.0→6.5 cm in **5 mm** steps (+ orientation, + undefined "Large") | **MERGE_CANDIDATE** | high | 4 |
| 3 | **FAM-PEAK-GORGE-ANGLE** | 10 | Gorge angle 101°→115°, mean step **1.6°**; two pairs are **0°** apart | **MERGE_CANDIDATE** | high | 7 |
| 4 | **FAM-SLANTED-FLAP-DEPTH** | 10 | Same 4 cm values twice — once "Slanted", once "Large Slanted", **no dimension attached to "Large"** | **MERGE_CANDIDATE** | high | 4 |
| 5 | **FAM-SHAWL-VARIANT** | 6 | Shawl outline width and outer-edge curvature — **the real drawings exist and differ visibly** | **MACRO_SHOOT** | medium | — |
| 6 | **FAM-JETTED-WELT-HEIGHT** | 6 | Welt height 1.0 / 1.2 / 1.5 cm — **2–3 mm** steps (+ jetted vs welt vs button tab) | **MERGE_CANDIDATE** | high | 3 |
| 7 | **FAM-PLEATED-POCKET** | 6 | Pleat type, pleat count, flap, flap angle, button — all categorical | **MACRO_SHOOT** | medium | — |
| 8 | **FAM-NOTCH-GORGE-ANGLE** | 5 | Notch angle 50/55/65/73° — **5–10°** steps (+ tab) | **MERGE_CANDIDATE** | medium | 2 |
| 9 | **FAM-CHEST-WELT-STRAIGHT** | 5 | Welt height 2.3 / 2.5 / 2.7 cm — **2 mm** steps (+ besom, + trapezoid) | **MERGE_CANDIDATE** | high | 2 |
| 10 | **FAM-CHEST-WELT-CURVED** | 4 | Barchetta height 2.3→2.9 cm — **2 mm** steps, one axis only | **MERGE_CANDIDATE** | high | 3 |
| 11 | **FAM-TURNBACK-CUFF-DEPTH** | 3 | Gauntlet (categorical) + turn-back 3.5 vs 4.0 cm (**5 mm**) | **MERGE_CANDIDATE** | medium | 1 |
| 12 | **FAM-SEMI-PEAK-ANGLE** | 2 | Peak 99° vs 114° — **15°**, genuinely visible, but no source for either | **MERGE_CANDIDATE** | medium | 1 |
| 13 | **FAM-CUFF-TERMINAL-SHAPE** | 2 | Square vs angled cuff line — **the slant angle is nowhere stated** | **NEEDS_SOURCE** | high | — |
| 14 | **FAM-BELT-LOOP-COUNT** | 2 | 7 loops vs 5 loops — trivially photographable, **no drawing for the 5-loop layout** | **NEEDS_SOURCE** | high | — |

**Totals:** 3 families / 25 options to re-shoot · 9 families / 56 options with merge proposals ·
2 families / 4 options blocked on a missing drawing.
**If you accept every merge proposal, 27 customer-facing rows disappear** and the 85 collided options
become 58 distinct photographs.

---

## Read this before the table above

The existing report blamed the collisions on *"the catalog offers finer option granularity than the
supplier blueprint library documents."* That is correct, but it understates the situation, and the
understatement matters for every decision below.

**83 of the 85 options are not backed by supplier blueprints at all.**

They are backed by **16 hand-authored SVG icons totalling 5,073 bytes** — navy `#0B1B2E` ground, gold
`#D4AF37` stroke (the storefront's own brand palette), all written 2026-05-18 17:54. These are UI
glyphs, not tech packs. Several cannot encode the feature they are supposed to define:

- `chest-pocket/curved-welt-2-5cm.svg` (223 B) draws the welt as **a single arc stroke with no
  enclosed height** — yet it is the sole reference for four options sold on welt height (2.3/2.5/2.7/2.9 cm).
- `sleeve-cuff/square-cuff.svg` (328 B) draws **horizontal band edges** — and backs `cuff-angled`,
  whose entire product is a slant.
- `lapel/peak-lapel.svg` (349 B) draws a horizontal peak spike with a ~140° vertex — and backs ten
  options spanning 101°–115°. It matches none of them.
- `lower-pocket/jetted-flap-6-5cm.svg` draws its pocket mouth at `height="6"` while its own text label
  reads `6.5cm`.
- `lower-pocket/bellows-pocket.svg` (333 B) is a rectangle with one dashed centre line — and backs
  options that require flaps, buttons, box pleats and multiple pleats.

**Meanwhile 63 genuine kutetailor supplier line drawings for exactly these categories sit unused on
disk.**

| Supplier folder | Drawings | Referenced by the catalog |
|---|---|---|
| `factory/kute/jacket/Lapel_Lapel_Style` | 20 | **1** |
| `factory/kute/jacket/Pocket_Lower_Lower_pocket` | 26 | **0** |
| `factory/kute/jacket/Pocket_Chest_Chest_pocket` | 17 | **0** |
| `factory/kute/jacket/Sleeve_Cuff_style` | 1 | **0** |

I opened four of them to confirm they are real. `0002__Peak.jpeg` is a genuine technical line drawing
of a jacket front with the lapel outline picked out in red — and it carries **no degree annotation**.
`0005__Shawl`, `090A__A_shawl` and `090E__E_shawl` are three visibly different shawl outlines.

This changes two things:

1. **"The tech-pack illustration is law" has been applied to a cartoon** for these 85 options. The
   house rule is right; it just has not had a real drawing to bind to here.
2. **Several families are cheaper to fix than the report implies** — the correct drawing is already on
   disk and merely needs re-pointing, before a single credit is spent.

It also explains the shape of the whole defect. kutetailor models lapel **style** and gorge **height**
as separate fields (`Lapel_Lapel_adjustment` → `Drop_Gorge_by_1.0cm`, `Drop_Gorge_by_4.0cm`), and
lower-pocket **shape** separately from size (`Regular` / `Regular_slanted` / `Very_slanted` /
`Extreme_slanted`). The catalog has flattened *style × dimension* into one long list of rows. That is
what produces a family of ten near-identical options behind one picture.

---

## How I judged "can a photograph show this?"

Grounded in the measured result in `failure-log.md`, **[MEASURED LADDERS — hard physics limit]**,
2026-07-28 — not in intuition.

| | intended | rendered (button-diameters) |
|---|---|---|
| collar ladder | 0.1 / 0.3 / 0.5 / 0.6 cm | 0.312 → 0.404 → **0.316** → 0.476 |
| cuff ladder | 0.1 / 0.3 / 0.5 / 0.6 cm | 0.233 → 0.353 → 0.555 → **0.362** |

Both ladders **inverted**. The 0.5 cm collar rung landed on the 0.1 cm value; the 0.6 cm cuff rung
collapsed onto the 0.3 cm value. Adjacent rungs that came back with the wrong sign differed by 0.088
and 0.193 button-diameters — roughly **1–2 mm of absolute rendering error**. The rendered span was
also compressed to about a third to a half of the intended span.

**Working rule for absolute dimensions** (welt height, flap depth, turn-back depth) — an estimate from
n=2 ladders, treat as order-of-magnitude:

- **below ~2 mm** of true separation → inside the render error. Unusable.
- **2–5 mm** → within 2–3× the error. Only usable as a monotonic **SET** with a blind-ordering gate.
- **above ~1 cm** → safe.

**An honest limit.** No *angular* ladder has ever been measured here. Angles are a different class:
both edges are in frame, so a reader compares them to each other rather than to an external scale.
So the angular verdicts (peak, semi-peak, notch) do **not** rest on that millimetre rule. They rest on
(a) arithmetic, where the separation is literally 0°, and (b) the fact that no drawing carries an
angle, which forces prompt-only geometry — and the failure log is explicit that prompt-only geometry
loses to the model's prior and to a contradicting reference.

---

## Decision sheet — accept or reject each merge individually

Each row is independent. Rejecting one does not affect the others. Where I think a rejection is
defensible I have said so and given the alternative.

| # | Merge proposal | Rows removed | If you reject |
|---|---|---|---|
| 3 | **Peak lapels.** Collapse 101 / 102 / 102-RL / 105 / 107 / 110 / 115 into one **Peak**; re-express *Low Peak 110°* as the supplier's gorge-drop adjustment; keep *Curved Peak 103°* and *Straight Peak 108°* as shape variants. | **7** | You need one annotated drawing per retained angle. None exists. Keep no rung closer than **7°** to its neighbour. |
| 12 | **Semi-peak.** Merge Peak 99° and Peak 114° into one **Semi-peak**. | **1** | ⚠️ The most defensible rejection on this sheet — 15° is genuinely visible. Get the two annotated drawings first, then shoot as a pair. |
| 8 | **Notch lapels.** Merge 50°+55° → **Notch**; merge 65°+73° → **Notch, high gorge** (the supplier's own distinction, drawing `0689` already on disk). | **2** | Shoot all four as one 4-rung SET, identical cloth and crop, and accept only if a reader who is not told the numbers can order them correctly. |
| 2 | **Straight jetted flap depth.** Collapse 4.0/4.5/5.0/5.5/6.0/6.5 cm to two tiers ≥1.5 cm apart. | **4** | The 2.5 cm end-to-end span is resolvable; the 5 mm steps are not. Do not ship six. |
| 4 | **Slanted flap depth.** Collapse each of *Slanted* and *Large Slanted* from four cm rungs to two. | **4** | Better still: replace the cm ladder with the supplier's slant tiers (*Regular slanted / Very slanted / Extreme slanted*), which are real, photographable and already drawn. |
| 6 | **Lower welt height.** Collapse Welt 1.0 / 1.2 / 1.5 cm to one; merge `lp-straight-jetted` into `lp-jetted-4`. | **3** | Hardest to defend rejecting — 2–3 mm steps are the closest analogue to the ladder that was measured to fail. |
| 9 | **Straight chest welt.** Collapse 2.3 / 2.5 / 2.7 cm to one, width as a spec field. Keep besom and trapezoid. | **2** | 2 mm steps and a 4 mm span — smaller than the span that already failed to order correctly. |
| 10 | **Curved chest welt.** Collapse 2.3 / 2.5 / 2.7 / 2.9 cm to one **Barchetta**. | **3** | Maximum defensible split is **two** tiers at the extremes (2.3 and 2.9), shot as a pair with a scale reference. Do not ship four. |
| 11 | **Turn-back cuff.** Merge 3.5 cm and 4.0 cm into one; keep British Turn-up separate. | **1** | Shoot the pair in one frame with the cuff buttons as the scale anchor, gated on blind ordering. Note a 2-rung ladder cannot be QC'd for monotonicity — a failure would be undetectable. |

**Nothing on this sheet is actioned until you say so.**

---

## Free fixes — no decision, no credits, no merge

These are mis-wirings where the better drawing is already on disk. They reduce the defect surface
before any photography happens.

- `lapel-peak-105` → `/images/jacket/lapel/peak-105.svg` **exists, carries a "105°" annotation, and is
  referenced by nothing.** The option uses the generic `peak-lapel.svg` instead.
- `lapel-notch-tab-basic` → `/images/jacket/lapel/notch-tab.svg` exists; the option uses `notch-lapel.svg`.
- `cp-jetted` → `Pocket_Chest_Chest_pocket/0110__Besom.jpeg` exists; the option currently points at a
  **straight-welt** drawing, which contradicts its defining feature (a besom has no welt).
- `cp-trapezoid` → `Pocket_Chest_Chest_pocket/00J2__Trapezoid.jpeg` exists; same problem.
- `lapel-shawl-0005 / -0a / -0e` → `0005__Shawl.jpeg` / `090A__A_shawl.jpeg` / `090E__E_shawl.png`.
  The catalog ids encode the supplier's own style codes.

**Two blueprint/label conflicts worth flagging separately.** `lp-slanted-flap-55`, `lp-slanted-flap-65`,
`lp-large-slanted-55` and `lp-large-slanted-65` are pointed at `jetted-flap-*.svg` — drawings of a
**straight horizontal** flap — while their 4.0/4.5/5.0/6.0 siblings correctly use `slanted-flap.svg`.
Four *slanted* options are backed by a *straight* drawing. It looks like a filename-number match that
ignored orientation. And `lp-straight-jetted` carries the flap description ("covered by a flat,
rectangular flap") while sitting on the flapless drawing — its label, description and blueprint all
disagree. These are the class of defect the `BLUEPRINT_CONFLICT` gate exists to catch, and they should
be fixed before anything in these families is shot.

---

## The 14 families in detail

### 1 · FAM-PATCH-POCKET — 13 options — **MACRO_SHOOT** (high)

`cp-patch` · `cp-patch-angled` · `cp-patch-multi` · `cp-inverted-pleat-2flap` · `cp-inverted-pleat-flap` ·
`lp-patch` · `lp-patch-rounded` · `lp-patch-flap` · `lp-patch-flap-btn` · `lp-patch-btn-tab-round` ·
`lp-patch-btn-tab-straight` · `lp-patch-btn-tab-angled` · `lp-water-drop`
Blueprints: 2 (`chest-pocket/patch-pocket.svg` 238 B, `lower-pocket/patch-pocket.svg` 237 B) — both plain rectangles.

**Differentiator.** Every member differs by a whole-shape or whole-part change: plain patch vs
rounded-corner patch (*tasca a pignata*) vs teardrop outline; pleat count 0 / 1 inverted / 1 box /
multi; flap absent vs present; flap plain vs flap + button; button tab terminated round vs straight vs
angled; one variant with two flanking flaps. **Nothing here is separated by millimetres.** The tightest
pair is the three tab terminations — but a tab is ~20–25 mm wide and the terminal shape occupies the
whole of it, so at macro the difference is ~100% of the feature.

**Why macro works.** This is the case the failure log says succeeds: the 2026-07-27
`cs-left-sq-rt-rnd` lesson shows deliberately different terminal shapes render correctly once each
gets its own simile and the sibling shapes are forbidden by name. The measured-ladder limit does not
apply to any member.

**Before shooting.** Re-point off the glyphs onto the kutetailor drawings that exist —
`02J1__Patch`, `02K0__Curved_patch`, `02L2__Patch_with_flap`, `0150__Patch`. Shoot chest and lower as
two separate SETs.
**Still needs a mapping decision:** the three button-tab terminations and the water-drop outline have
no obvious supplier counterpart. `02J0__Patch_with_Ship_shape` is *not* obviously a teardrop — I did
not assume it.

---

### 2 · FAM-FLAP-DEPTH-55-65 — 11 options — **MERGE_CANDIDATE** (high)

`lp-slanted-flap-55/-65` · `lp-large-slanted-55/-65` · `lp-straight-jetted-40/-45/-50/-55/-60/-65` · `lp-rl-flat-55`
Blueprints: 2 (`jetted-flap-5-5cm.svg` 326 B, `jetted-flap-6-5cm.svg` 488 B).

**Differentiator.** Six members form one ladder — Straight Jetted Flap **4.0 / 4.5 / 5.0 / 5.5 / 6.0 /
6.5 cm**, a 2.5 cm span in **5 mm** steps (12.5% of the 4.0 cm rung). The rest mix in orientation,
a "Large" qualifier with no dimension, and one RL house cut.

**Evidence.** All six Straight Jetted Flap descriptions are **byte-identical** to one another — the
catalog carries no prose distinguishing 4.0 from 6.5, only the number in the label. A 5 mm step is
2.5–5× the measured render error and sits in the band that produced rank inversions. Flap depth is an
*absolute* dimension needing an in-frame scale; the ladder that already failed at least had a button
to measure against. The supplier has **no cm depth ladder** for lower pockets at all.

**What survives.** The 2.5 cm end-to-end span *is* resolvable (~1.7–2.3 button-diameters), so two
tiers can be photographed apart. Six cannot.

---

### 3 · FAM-PEAK-GORGE-ANGLE — 10 options — **MERGE_CANDIDATE** (high)

`lapel-peak-101` · `-102` · `-102-rl` · `-103-curved` · `-105` · `-107` · `-108` · `-110` · `-110-low` · `-115`
Blueprint: 1 (`lapel/peak-lapel.svg`, 349 B) — backs 30 options in total.

**Differentiator.** 101 / 102 / 102-RL / 103-curved / 105 / 107 / 108 / 110 / 110-low / 115 — a **14°
spread across 9 transitions, mean 1.6° per step**. Assuming a 6 cm peak tip length (typical bespoke
range 4–7 cm; stated so you can check it), 1° ≈ 1.05 mm of tip displacement, so the mean step moves
the tip **~1.7 mm** and the full span ~14.7 mm.

**Four independent reasons.**

1. **Arithmetic, not estimate.** `lapel-peak-102` and `lapel-peak-102-rl` are **0° apart**. So are
   `lapel-peak-110` and `lapel-peak-110-low`. Two options at zero separation cannot be photographed
   apart under any framing.
2. **~1.7 mm is inside the measured render error** (1–2 mm) from the ladder that inverted its own rungs.
3. **The drawing carries no angle.** `peak-lapel.svg` draws a horizontal spike with a ~140° vertex,
   matching none of the ten values. Geometry would be prompt-only — and the log records square collars
   scoring 20–35 when the prompt and the reference disagreed.
4. **The supplier does not sell ten peak angles.** `Lapel_Lapel_Style` holds **one** peak drawing
   (`0002__Peak.jpeg`, verified visually — real line art, no degree annotation) plus `0004__Semi-peak`,
   `00JC__E_peak`, `001J__Round_peak`. Gorge height is modelled separately as an *adjustment*
   (`Drop_Gorge_by_1.0cm` / `_4.0cm`) — which is exactly what `lapel-peak-110-low` is.

The catalog says it itself: `lapel-peak-102-rl`'s own description calls its difference *"marginally
more open or closed"* and *"visible to connoisseurs."*

**Proposal.** Collapse the seven pure-angle rows into one **Peak**. Keep *Curved Peak 103°* and
*Straight Peak 108°* — a curved vs straight lapel **edge** is a shape change, not an angle. Re-express
*Low Peak 110°* as the gorge-drop modifier the supplier already uses. Sell the angle, if the factory
really accepts it, as a numeric field on the retained option.
*The strict-supplier alternative collapses all ten to one, removing 9 rows.*
This supports the standing recommendation already recorded in `CHECKPOINT.json`.

---

### 4 · FAM-SLANTED-FLAP-DEPTH — 10 options — **MERGE_CANDIDATE** (high)

`lp-slanted-flap-40/-45/-50/-60` · `lp-large-slanted-40/-45/-50/-60` · `lp-slanted-jetted` · `lp-large-slanted-jetted`
Blueprint: 1 (`lower-pocket/slanted-flap.svg`, 318 B).

**Differentiator.** Four Slanted rungs and four Large Slanted rungs **at the same four cm values** —
so eight options form four pairs (40/40, 45/45, 50/50, 60/60) whose only stated difference is the word
**"Large"**, defined in the catalog as *"cut at a steeper angle **or** with a noticeably wider and
deeper flap."* An either/or with no number.

**This is a specification defect, not a photography problem.** You cannot photograph a difference the
specification does not state. Separately, the 5 mm cm-steps sit in the measured inversion band.

**What survives.** `lp-slanted-jetted` and `lp-large-slanted-jetted` are flapless — a flap covers the
mouth, a besom has none. Categorical, keep them.

**Better than merging.** kutetailor models slant as three named tiers — `02A1__Regular_slanted`,
`02B1__Very_slanted`, `02C1__Extreme_slanted`, with matching besom variants — a real, photographable,
already-drawn axis. That is almost certainly what "Large" is reaching for. *Inference, not fact —
needs one confirmation.*

---

### 5 · FAM-SHAWL-VARIANT — 6 options — **MACRO_SHOOT** (medium)

`lapel-shawl` · `lapel-shawl-d` · `lapel-shawl-0a` · `lapel-shawl-0e` · `lapel-shawl-0005` · `lapel-shawl-asymmetric`
Blueprint: 1 (`lapel/shawl-lapel.svg`, 275 B).

**The catalog text is misleading here — the drawings are the evidence.** `lapel-shawl-0005` describes
its difference as *"micro-differences … visible to the educated eye,"* which sounds sub-photographic.
It is not. The option ids encode kutetailor style codes, and I opened all three:

- `0005__Shawl` — slim, straight-edged, tapering to a low sharp break.
- `090A__A_shawl` — wider, with a gentle convex swell at the lower edge.
- `090E__E_shawl` — broadest, markedly bowed outer edge, rounded shield profile.

These are **whole-outline differences on the order of 20–40% of lapel width** — visible at half-body
framing, let alone macro. `lapel-shawl-asymmetric` is grossly categorical (left and right lapels differ).

**Why medium, not high.** Three of the six have no confirmed mapping. `lapel-shawl` may simply be a
duplicate of `lapel-shawl-0005` — confirm before shooting both. For `lapel-shawl-d` the candidates are
`00F2__Arc_bottom_shawl` and `00H4__Upper_narrow_shawl`; **I will not guess between them.** No supplier
counterpart was found for the asymmetric collar — it may not be orderable.

---

### 6 · FAM-JETTED-WELT-HEIGHT — 6 options — **MERGE_CANDIDATE** (high)

`lp-jetted-4` · `lp-straight-jetted` · `lp-welt-10` · `lp-welt-12` · `lp-welt-15` · `lp-jetted-btn-tab`
Blueprint: 1 (`lower-pocket/jetted-no-flap.svg`, 236 B).

**Differentiator.** Three members are a welt-height ladder — **1.0 / 1.2 / 1.5 cm**, a 5 mm span in
**2–3 mm** steps. Their entire descriptions are three words each: *"Slim single welt — refined." /
"Standard single welt." / "Wide single welt."* The other three are categorical: double-jetted (two
jets) vs single welt (one strip) vs jetted with a button tab.

**This is the closest analogue in the catalog to the ladder that was measured to fail** — same
magnitude, same measurement class. Worse in one respect: the stitch ladder had a button in frame as a
scale anchor; a lower welt pocket has no adjacent constant-size feature at all. The supplier documents
exactly **one** lower-pocket welt width (`0267__2.5CM_welt`).

**Also.** `lp-straight-jetted` carries the *flap* description while sitting on the flapless drawing,
and is near-duplicated by `lp-jetted-4`. `lp-jetted-btn-tab` has a real drawing waiting:
`02M1__Besom_with_tab_and_button`.

---

### 7 · FAM-PLEATED-POCKET — 6 options — **MACRO_SHOOT** (medium)

`lp-inverted-flap` · `lp-inverted-flap-btn` · `lp-inverted-angled-flap-btn` · `lp-box-pleat-flap` ·
`lp-angled-box-pleat` · `lp-multi-pleat`
Blueprint: 1 (`lower-pocket/bellows-pocket.svg`, 333 B).

**Differentiator.** Pleat type (inverted vs box vs multi), flap present/absent, flap square vs angled,
button present/absent. Every axis is discrete, countable or topological. The subtlest is inverted vs
box pleat — the folds meet at the centre on the face, or turn outward — but on a 2–3 cm pleat that is a
whole-feature reversal, readable at macro provided the pocket is shot slightly expanded so the pleat
reads as depth rather than a line.

**Why medium, not high.** The shared blueprint is a rectangle with **one dashed centre line**: no flap,
no button, no multi-pleat. Four of the six need geometry the drawing does not contain, so it would come
from the label. That is reading the catalog rather than inventing tailoring — but it is thinner ground
than family 1. Re-pointing to `02K4__Patch_with_one_pleat`, `02K5__Patch_single_pleat_with_diamond_flap`
and `02L4__Patch_with_pleat_Diamond_flap_bttn` would raise this to high. Note the supplier says
*diamond* flap where the catalog says *basic* / *angled* — worth reconciling.

---

### 8 · FAM-NOTCH-GORGE-ANGLE — 5 options — **MERGE_CANDIDATE** (medium)

`lapel-notch-50` · `-55` · `-65` · `-73` · `lapel-notch-tab-basic`
Blueprint: 1 (`lapel/notch-lapel.svg`, 350 B).

**Differentiator.** Four angle rungs — 50 / 55 / 65 / 73° — with gaps of **5, 10 and 8°**, three to six
times the peak family's spacing. At a 6 cm notch edge that is 5.2–10.5 mm of tip displacement. Plus
`lapel-notch-tab-basic`, a fabric bridge across the V (categorical).

**This is the most defensible angular ladder in the catalog, and it is ranked MERGE for a *source*
reason, not a physics one.** The supplier carries three notch drawings — `0001__Notch`,
`0003__Semi-notch`, `0689__Notch_with_high_gorge` — and `0689` is already wired to a different option
(`lapel-notch-68`). Four rungs map onto two available drawings, and the supplier's own distinction is
standard gorge vs high gorge — precisely the 50/55 vs 65/73 split, and nothing finer. Unlike the peak
family the descriptions do carry a real progression (65 *"places the break point closer to the
shoulder"*; 73 has *"maximum visible collar space above the notch"*) — that is a gorge **height**
change, not only an angle.

**If you reject the merge:** shoot all four as one 4-rung SET, identical cloth, crop, scale and viewing
angle, and accept only on a blind-ordering test. That is the failure log's prescription for ladders.

---

### 9 · FAM-CHEST-WELT-STRAIGHT — 5 options — **MERGE_CANDIDATE** (high)

`cp-welt-23` · `cp-welt-25` · `cp-welt-27` · `cp-jetted` · `cp-trapezoid`
Blueprints: 2 (`straight-welt-2-3cm.svg` 300 B, `straight-welt-2-5cm.svg` 380 B).

**Differentiator.** Three welt-height rungs — **2.3 / 2.5 / 2.7 cm**, a 4 mm span in **2 mm** steps
(8% of the welt height) — plus two categorical members. The prose confirms how fine this is: 2.3 is
*"the narrowest conventional English welt"*, 2.7 *"a deliberately wider reading … the additional
millimetres."* The catalog is selling millimetres. 2 mm steps are at or below the measured render
error, and the 4 mm span is *smaller* than the 5 mm span that already failed to order correctly.

**Keep separate:** `cp-jetted` (a besom has **no welt at all**) and `cp-trapezoid` (wider at top than
bottom). Both currently point at a plain rectangular-welt drawing that **contradicts them on their
defining feature** — and both have real supplier drawings waiting (`0110__Besom`, `00J2__Trapezoid`).

---

### 10 · FAM-CHEST-WELT-CURVED — 4 options — **MERGE_CANDIDATE** (high)

`cp-welt-curved-23` · `-25` · `-27` · `-29`
Blueprint: 1 (`chest-pocket/curved-welt-2-5cm.svg`, 223 B).

**The purest ladder in the set.** One axis, four rungs, uniform **2 mm** steps, 6 mm total span. Every
member is the same barchetta shape at a slightly different height.

**Decisive:** the shared blueprint draws the welt as **a single quadratic arc stroke with no enclosed
height.** The drawing does not depict a welt height at all — there is literally nothing in the
reference to reproduce for any rung, let alone to tell four of them apart. The supplier documents the
barchetta as a *shape* (`0102__Arc`, `019N__Italian_curved_breast_pocket`, `0103__Ship_shape`), never
as a height ladder.

Shipping four photographs annotated 2.3 / 2.5 / 2.7 / 2.9 cm that a customer cannot rank is exactly
what the failure log forbids: *"NEVER annotate different numbers onto near-identical photos; that
mis-sells a measured option."*

**If you reject:** the maximum defensible split is **two** tiers at the extremes (2.3 and 2.9, 6 mm
apart), shot as a pair with a scale reference and gated on blind ordering. Do not ship four.

---

### 11 · FAM-TURNBACK-CUFF-DEPTH — 3 options — **MERGE_CANDIDATE** (medium)

`cuff-british` · `cuff-turnback-35` · `cuff-turnback-40`
Blueprint: 1 (`sleeve-cuff/turnback-cuff.svg`, 418 B).

**Differentiator.** British Turn-up (gauntlet) is a **separate folded-back band** wrapping the wrist —
categorically different construction, keeps its own photograph, not in question. Turn-back 3.5 vs
4.0 cm is the same construction **5 mm** apart — about **0.33 jacket-button diameters**, on the exact
metric where per-rung errors of 0.09–0.19 button-diameters were measured. Signal-to-noise ≈ 2:1.

**The structural argument.** A two-rung ladder **cannot be QC'd for monotonicity.** With three or more
rungs you can detect an inversion; with two, a failure is undetectable — you would ship two photographs
and have no way to prove they differ correctly. No supplier drawing exists to fall back on:
`Sleeve_Cuff_style` contains exactly one file, `0618__Western_hem.png`.

**Why medium.** 5 mm at 14% relative is the best case among the absolute ladders here. If you want to
try, shoot the pair in one frame with the cuff buttons visible as the scale anchor and gate on blind
ordering.

---

### 12 · FAM-SEMI-PEAK-ANGLE — 2 options — **MERGE_CANDIDATE** (medium)

`lapel-peak-99` · `lapel-peak-114`
Blueprint: 1 (`lapel/semi-peak.svg`, 274 B).

**Honest caveat: on physics alone this would be MACRO_SHOOT.** 15° apart is ~15.7 mm of tip
displacement — roughly a full button diameter, ten times the peak family's mean step — and it is the
one angular pair whose descriptions are genuinely not interchangeable (*"barely crosses the
horizontal"* vs *"almost graphic, billboard-like"*).

It is ranked MERGE for **source**, not resolution. kutetailor carries **one** semi-peak drawing
(`0004__Semi-peak.jpeg`) and no angle annotation anywhere, so neither 99° nor 114° has anything to be
faithful to; shooting them apart means choosing the two angles ourselves. It also belongs to the same
decision as family 3 — these are two more rungs of the same 99–115° pseudo-ladder, split across two
glyphs. Deciding them separately would be incoherent.

**If you want to keep an angle ladder anywhere in the catalog, this is the pair worth keeping.**
Obtain the two annotated drawings first.

---

### 13 · FAM-CUFF-TERMINAL-SHAPE — 2 options — **NEEDS_SOURCE** (high)

`cuff-angled` · `cuff-square`
Blueprint: 1 (`sleeve-cuff/square-cuff.svg`, 328 B).

**Differentiator.** Square Cuff terminates in a perpendicular cut. Angled Vent Cuff is *"cut with a
slight diagonal slant — typically dropping at the outer edge."* The **direction** is stated; the
**angle is not stated anywhere.** A 5° slant across a ~7 cm cuff face is a ~6 mm drop; 10° is ~12 mm.
The catalog does not say which — and that is the difference between invisible and obvious.

**Decisive:** the shared blueprint draws a plain rectangular band with **perfectly horizontal edges** —
it depicts the *square* cuff. The angled option is backed by a drawing of its own opposite. This is the
same pattern as the 2026-07-27 `collar-sq-65-btn` false approval, where a wrong blueprint was invisible
to QC because every score measures fidelity *to* the blueprint. No supplier artwork exists to fall back
on. Shooting it today would mean choosing the slant angle ourselves — inventing tailoring detail — and
QC would grade the render against a square-cuff drawing and could only penalise the very slant that
defines the option.

**This is not a merge candidate.** A slanted cuff line and a square cuff line are genuinely different
products; merging them would delete a real option. It is blocked purely on source.

**Exactly what is needed:** a kutetailor jacket sleeve-cuff line drawing for the **angled / vent cuff**,
carrying the slant angle or the outer-edge drop as an annotation.
`/images/factory/kute/jacket/Sleeve_Cuff_style` currently holds only `0618__Western_hem.png`.

---

### 14 · FAM-BELT-LOOP-COUNT — 2 options — **NEEDS_SOURCE** (high)

`loops-standard` (Standard, 7 Loops) · `loops-5` (5 Loops)
Blueprints: `factory/kute/trousers/Waist_Belt_loop/3330__Regular.jpeg` and **`null`**.

**Differentiator.** 7 loops vs 5 — a 29% count difference around a waistband. **This is the most
photographable differentiator in all 14 families.** It needs no macro at all; a normal waistband frame
shows it and a customer can literally count.

**So why is it blocked?** What is missing is **placement**, not count. Five loops are not seven with two
removed — the factory decides where they sit relative to the fly, side seams and centre back. Choosing
that ourselves is inventing tailoring detail. `loops-5` has a four-word description, no placement
information, and is the **only option among the 85 with a `null` blueprint**.

**Decisive search result:** `/images/factory/kute/trousers/Waist_Belt_loop` contains nine drawings —
`3329__No`, `3330__Regular`, `3331__Double`, `3332__2.0cm`, `333E__X-style_on_front`,
`3618__Only_one_in_right`, `361N`, `3683`, `3684` — and **none is a 5-loop layout.** The manufacturer's
own belt-loop taxonomy has no 5-loop entry. It is worth asking whether `loops-5` is orderable at all.

This is also the one collision the *old* filename-based rule caught: `loops-5` simply points at
`loops-standard`'s photo. A plain wiring defect, not a granularity problem.

**Exactly what is needed:** a kutetailor `Waist_Belt_loop` drawing for the 5-loop layout — the sibling
of `3330__Regular.jpeg` — showing loop **positions**.
**Faster alternative, your call:** if the factory confirms 5-loop is orderable and any conventional
layout is acceptable, this becomes a straightforward MACRO_SHOOT, since the loop count is the whole
stated differentiator. That is a one-line answer from the supplier, not a drawing.

---

## What I did not decide

- **Nothing was merged, repriced, re-pointed, deleted or regenerated.** Every recommendation above is a
  proposal awaiting your yes or no.
- **I did not guess a single blueprint mapping.** Where two supplier drawings could plausibly back one
  option (`lapel-shawl-d`, the water-drop patch, the box-pleat variants), I listed the candidates and
  stopped.
- **I did not assume the "Large" qualifier means the supplier's slant tiers.** It is the best available
  reading, and it is labelled an inference.
- **I did not treat cross-product reuse as a defect.** Every one of these 85 is one craft option offered
  on three products; that fan-out is correct by design and is not counted here.

## Suggested order of work, once you have decided

1. Apply the **free fixes** — re-point the mis-wired blueprints. No credits, no merges, and it removes
   several options from the collision outright.
2. Fix the **two blueprint/label conflicts** (the four slanted-flap options on straight drawings, and
   `lp-straight-jetted`) before anything in those families is photographed.
3. Ask the supplier for the **two blocking drawings** (angled cuff, 5-loop layout) and the **"Large"
   definition** — three questions, and they unblock families 4, 13 and 14.
4. Apply whichever merges you accept.
5. Shoot the survivors as **SETs, QC'd for monotonicity as a set, never per image** — the failure log's
   standing instruction for anything graduated.

At ~0.5 credits per image (the rate in the spend table for `gpt_image_2` low/1k), the 58 surviving
options are a small spend against the verified 928.5 balance. The expensive thing here was never the
photography; it was the option list.
