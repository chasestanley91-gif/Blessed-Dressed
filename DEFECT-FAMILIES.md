# DEFECT FAMILIES — decision document

_Generated 2026-07-30, re-assessed 2026-07-31 after the supplier re-point. Machine-readable
companions: `public/images/reports/defect-family-evidence-2026-07-30.json` (original evidence),
`public/images/reports/repoint-supplier-log.json` (what was re-pointed),
`public/images/reports/repoint-supplier-proposal.json` (what still needs a ruling)._

---

## RE-ASSESSMENT, 2026-07-31 — read this first, it supersedes several recommendations below

The re-point predicted in the warning below has now been carried out. **237 of the 474 glyph-backed
options now sit on genuine supplier technical drawings**, promoted into the tracked tree at
`public/images/blueprints/supplier/` by `tools/repoint_supplier_blueprints.mjs`. Catalog integrity
held exactly: 2,862 options before and after.

The premise behind the `MERGE_CANDIDATE` recommendations was that *the supplier does not document
these distinctions*. Having now looked at the drawings on contact sheets
(`public/images/reports/contact-sheets/`), that premise splits cleanly in two.

### Where the premise was WRONG — do not merge these

| family | what the supplier actually documents |
|---|---|
| **lower pocket slant** | Four distinct drawings: `0201 Regular` (horizontal), `02A1 Regular slanted`, `02B1 Very slanted`, `02C1 Extreme slanted`. The slant grades are unmistakably different pictures. |
| **lower pocket body** | `02J1 Patch`, `02K0 Curved patch`, `02L2 Patch with flap`, `0231 Besom`, `02M1 Besom with tab and button` — each its own drawing. |
| **chest pocket** | `0101 Normal` (straight welt), `0102 Arc` (curved welt), `0103 Ship shape` (boat), `00J2 Trapezoid`, `0110 Besom`, `0150 Patch` — six genuinely distinct shapes. |
| **lapel buttonhole position** | A complete set: `0541` left, `0543` both, `0545` left-double, `0549` three-left/two-right, `054Y` three-left/one-right. Every configuration the catalog sells is drawn. |
| **cuff button count** | Every count from 1 to 6, in flat and kissing layouts. |

**`cuff-button-number` deserves singling out.** `cb-none` ("None") and `cb-1` ("1 Button") were both
illustrated by `two-buttons.svg` — the catalog was showing customers *two* buttons for an option
meaning *no* buttons. That is now fixed from the supplier's own drawings, and it was never a merge
question at all.

### Where the premise HOLDS — these still need your ruling

Re-pointing does not resolve these, and no amount of further searching will, because the supplier
library genuinely does not contain the distinction:

| family | rows | why it is still unresolved |
|---|---|---|
| **peak gorge-angle ladder** | 11 | The supplier has exactly one `0002__Peak.jpeg`. All eleven options from 99° to 120° now point at a *real peak lapel drawing* instead of a navy rectangle — a strict improvement — but one drawing still cannot separate 101° from 102°. |
| **notch gorge-angle ladder** | 4 | One `0001__Notch.jpeg` behind 50°/55°/65°/73°. |
| **flap-depth ladders** | 18 | `Slanted Flap` and `Straight Jetted Flap` each run 4.0→6.5 cm off one drawing per shape. The supplier documents the *shape*, never the depth rung. |
| **welt-depth ladders** | 9 | Chest welts at 2.3/2.5/2.7/2.9 cm; lower welts at 1.0/1.2/1.5 cm against a single `0267 2.5CM welt`. Pointing a 1.0 cm option at a drawing captioned 2.5 cm would assert a measurement the drawing contradicts, so it was NOT done. |
| **lapel-width ladder** | 51 | 17 widths, 4.5→12.5 cm. There is no lapel-width category in the supplier library at all. |
| **"Large Slanted" vs "Slanted"** | 18 | The catalog sells both as separate families, each with its own 4.0–6.5 cm ladder, but no label says what "Large" varies. The supplier documents slant *grade*, not size. **This one needs a supplier answer, not a photograph.** |
| **AMF stitching** | 6 | md5-proved: every `-amf` file is byte-identical to its `-top` sibling. No authentic AMF artwork exists anywhere in the tree. |
| **Fake buttonholes** | 6 | `lbh-fake-round`, `lbh-fake-square`. The supplier documents no fake buttonhole. |
| **"Double-Color Straight A / B"** | 6 | Supplier `055S` and `055T` are BOTH captioned "Double color straight". Nothing distinguishes A from B, so neither was assigned — a coin toss here would be indistinguishable from evidence. |

### The measured limit still stands

For the ladders above, re-pointing changes nothing about the physics already measured on
2026-07-28: at full-garment framing the collar stitch ladder came back **0.312 → 0.404 → 0.316 →
0.476**, with the 0.5 cm rung *inverted* and sitting 0.004 from the 0.1 cm rung. The honest remedies
are unchanged — macro re-shoot where the difference is resolvable, and a merge/reprice
recommendation where it is not. **Never annotate different numbers onto near-identical photos.**

_Original 2026-07-30 assessment follows. Where it conflicts with the table above, the table wins._

---

> **Nothing has been changed.** No option has been merged, no image replaced, no catalog row
> edited. This document exists so you can decide. Every recommendation below is individually
> acceptable or rejectable.

**The finding:** 85 craft options across 14 families currently ship a photograph that belongs to a
*different* option. This is the `DISTINCT_OPTION_IMAGE_COLLISION` blocking audit finding.

---

## ⚠️ Read this before deciding anything

The original root cause was recorded as *"the catalog offers finer option granularity than the
supplier blueprint library documents."* **That is only half true, and the missing half changes what
you should do.**

**83 of the 85 colliding options are not backed by supplier tech packs at all.** They are backed by
**16 hand-authored UI icons totalling ~5 KB**, all written in one batch on 2026-05-18 17:54, drawn
in the storefront brand palette. Here is the entire "blueprint" that backs all ten peak-lapel gorge
angles:

```svg
<svg viewBox="0 0 80 100"><rect width="100%" height="100%" fill="#0B1B2E"/>
<path d="M40,8 L16,8 L6,18 L26,18 L38,28 L40,30 L42,28 L54,18 L74,18 L64,8 Z"
      fill="none" stroke="#C8BFA8" stroke-width="0.8"/>
<line x1="40" y1="30" x2="40" y2="90" stroke="#C8BFA8" stroke-width="0.5"/></svg>
```

That is a navy rectangle with a crude gold outline. It encodes **no gorge angle whatsoever**, yet
it is the reference against which ten options at 101°–115° were to be judged. Other examples,
verified on disk:

- `chest-pocket/straight-welt-2-3cm.svg` draws the welt as a single arc **stroke with no enclosed
  height** — it cannot represent any of the 2.3 / 2.5 / 2.7 / 2.9 cm rungs it backs.
- `lower-pocket/jetted-flap-6-5cm.svg` draws its mouth at `height="6"` while calling itself 6.5 cm.
- `sleeve-cuff/square-cuff.svg` draws horizontal band edges and backs `cuff-angled`, whose entire
  defining feature is a **slant**.
- `lower-pocket/bellows-pocket.svg` is a rectangle with one dashed centre line, and backs options
  requiring flaps, buttons, box pleats and multiple pleats.

**Meanwhile the genuine supplier library is on disk and unused.** `public/images/factory/kute/`
holds **8,073 kutetailor reference images across 54 jacket categories**, including exactly the
categories in question:

| supplier folder | files | covers |
|---|---|---|
| `Lapel_Lapel_Style` | 20 | Notch, Peak, Semi-notch, Semi-peak, Shawl, Fish_mouth, Arc_bottom_shawl… |
| `Pocket_Lower_Lower_pocket` | 26 | Regular, Besom, Diamond_flap, 2.5CM_welt, Regular/Very/Extreme_slanted… |
| `Pocket_Chest_Chest_pocket` | 17 | Patch, Patch_with_bttn, One_pleat_patch, Besom, Trapezoid, Arc, Ship_shape… |

This is the project's own logged lesson repeating verbatim: *"The record is not the filesystem.
Search the actual asset tree before declaring an asset missing."*

### What this means for the recommendations below

The 9 `MERGE_CANDIDATE` families were assessed on the premise that the supplier library does not
document the distinction. **For some of them that premise is now wrong.** Specifically:

- **Re-pointing will likely rescue** the chest- and lower-pocket families (`FAM-PATCH-POCKET`,
  `FAM-CHEST-WELT-*`, `FAM-JETTED-WELT-HEIGHT`, `FAM-PLEATED-POCKET`): the supplier has distinct
  drawings for Patch / Besom / Trapezoid / Arc / pleated variants.
- **Re-pointing will NOT rescue the angle ladders.** The supplier has *one* `0002__Peak.jpeg`, not
  ten gorge angles. `FAM-PEAK-GORGE-ANGLE`, `FAM-NOTCH-GORGE-ANGLE` and `FAM-SEMI-PEAK-ANGLE` are
  genuinely finer than anything documented, and the merge case for them stands.

**Recommended sequence: re-point first, then re-assess, then merge only what survives.** Merging
before re-pointing would delete real product variants that the supplier does document.

Caveat for whoever does the re-pointing: `public/images/factory/` is currently in both `.gitignore`
and `.vercelignore` (~8k files, 95 MB, held as dev-only scrape output). Any drawing promoted to be
an authoritative blueprint must be copied into the tracked tree first — the same move
`tools/localize_blueprints.mjs` already performs for remote CDN URLs.

---

## The 14 families

| family | options | recommendation | confidence | what actually differs |
|---|---|---|---|---|
| `FAM-PATCH-POCKET` | 13 | **MACRO_SHOOT** | high | whole-shape changes: plain / rounded (pignata) / teardrop, pleat count, flap, tab shape |
| `FAM-FLAP-DEPTH-55-65` | 11 | MERGE_CANDIDATE | high | jetted flap depth 4.0–6.5 cm in 0.5 cm steps |
| `FAM-PEAK-GORGE-ANGLE` | 10 | MERGE_CANDIDATE | high | 101–115°, 14° across 9 transitions (~1.5° apart) |
| `FAM-SLANTED-FLAP-DEPTH` | 10 | MERGE_CANDIDATE | high | 4 depths × 2 sizes at the same four numbers |
| `FAM-SHAWL-VARIANT` | 6 | **MACRO_SHOOT** | medium | D-profile, 0A, 0E, 0005, asymmetric — outline changes |
| `FAM-JETTED-WELT-HEIGHT` | 6 | MERGE_CANDIDATE | high | welt 1.0/1.2/1.5 cm (5 mm span) + 3 categorical |
| `FAM-PLEATED-POCKET` | 6 | **MACRO_SHOOT** | medium | inverted vs box vs multi pleat — fold direction reverses |
| `FAM-NOTCH-GORGE-ANGLE` | 5 | MERGE_CANDIDATE | medium | 50/55/65/73° + a categorical tab |
| `FAM-CHEST-WELT-STRAIGHT` | 5 | MERGE_CANDIDATE | high | welt 2.3/2.5/2.7 cm (4 mm span) + 2 categorical |
| `FAM-CHEST-WELT-CURVED` | 4 | MERGE_CANDIDATE | high | 2.3/2.5/2.7/2.9 cm — 6 mm span, no second axis |
| `FAM-TURNBACK-CUFF-DEPTH` | 3 | MERGE_CANDIDATE | medium | 3.5 vs 4.0 cm + 1 categorical (gauntlet) |
| `FAM-SEMI-PEAK-ANGLE` | 2 | MERGE_CANDIDATE | medium | 99° vs 114° — 15° apart |
| `FAM-CUFF-TERMINAL-SHAPE` | 2 | NEEDS_SOURCE | high | square vs angled cuff — the glyph draws neither |
| `FAM-BELT-LOOP-COUNT` | 2 | NEEDS_SOURCE | high | 5 loops vs 7 loops — no drawing exists |

If every merge were accepted, **27 customer-facing option rows would disappear.** That is a
commercial decision, not an engineering one — which is why none of it has been actioned.

### Why the millimetre families are recommended for merge

Not intuition — measurement. On 2026-07-28 the decoration-stitching ladder was pixel-measured
across four rungs declared at 0.1 / 0.3 / 0.5 / 0.6 cm. The measured series came back
**0.312 → 0.404 → 0.316 → 0.476**: the 0.5 cm rung *inverted* below the 0.3 cm rung and landed
within noise of 0.1 cm. Exact cm values in the prompt, ratio anchors, comparative language and
explicit forbidden-lines all failed to fix it. `tools/qc_ladder.mjs` now grades that same data
`FAIL` automatically and names the offending rung.

A 4 mm welt-height span and a 1.5° gorge step are of the same order. Selling them as distinct
options means either photographing a difference that does not survive rendering, or shipping
near-identical photos under different names and prices.

**The prohibition that follows from this:** never annotate different numbers onto near-identical
photographs. That would manufacture the distinction rather than show it.

### The honest alternatives to merging

1. **Extreme macro re-shoot** — ~3 cm of finished edge fills the frame, so 1 mm becomes ~3% of
   frame width, with identical cloth, identical crop scale and an in-frame scale reference on every
   rung. QC'd as a **set** for monotonicity via `tools/qc_ladder.mjs`, never per image.
2. **Real photography** of the actual garments.
3. **Merge / re-price** where neither is worth it.

---

## What I need from you

1. **Approve the re-pointing pass** (my recommendation) — wire the pocket families to the real
   kutetailor drawings and re-assess. No merges yet. Non-destructive.
2. **Then**, per family, accept or reject each `MERGE_CANDIDATE`.
3. `FAM-CUFF-TERMINAL-SHAPE` and `FAM-BELT-LOOP-COUNT` need supplier drawings either way — they are
   listed in [NEEDS-SOURCE.md](NEEDS-SOURCE.md).

Until you decide, these 85 options keep their current (wrong) images and the blocking finding stays
open. That is the correct state: the alternative is guessing.

---

## FAM-MASTER-PATH-CROSS-FIELD — one master path serving two different fields

**Found:** 2026-08-01, while publishing the six options that had passed QC but never shipped.
**Status:** open. Blocks 4 approved images. **No image is wrong; the filing system is.**

Four options passed QC on their first attempt and could not be published:
`suit-2pc/coin-none`, `suit-3pc/sb-4`, `suit-3pc/db-6x2`, `suit-3pc/db-6x3`.

`publish_approved.mjs` refused each with "does not match the QC-approved candidate", and it was
right to. The approved candidate is staged correctly at `generated/<product>/<option>.png` and its
SHA-1 matches; what does not match is the file at `generated/jacket/<option>.png`, which is where
the catalog row points.

The reason is not a stale file. **The same option id lives under two different fields in the same
product**, and the master path is derived from the *part*, so both fields resolve to one filename:

| option id | field A | field B | shared master path |
|---|---|---|---|
| `sb-4` | jacket button stance | vest button stance | `generated/jacket/sb-4.png` |
| `db-6x2` | jacket button stance | vest button stance | `generated/jacket/db-6x2.png` |
| `db-6x3` | jacket button stance | vest button stance | `generated/jacket/db-6x3.png` |
| `coin-none` | trouser coin pocket | (second field) | `generated/jacket/coin-none.png` |

Publishing the vest's button-stance photo would therefore overwrite the jacket's. The SHA-1 gate
caught it. Without that gate this would have shipped silently as four wrong images, and it would
have looked like a success.

This is the same root cause the plan already names for spec ingestion — *86 option ids appear under
more than one field, `stitch-01-top` exists under Collar, Placket and Cuff* — surfacing a second
time, in the asset layer rather than the data layer. Keying on `optionId` alone is unsafe anywhere
in this pipeline.

**Fix (not applied — it changes the path convention for every shipped asset):** make the master path
field-scoped, `generated/<product>/<field>/<option>.png`, and migrate the existing masters with the
manifest rewritten in the same transaction. That is a mechanical change but it touches all 686
masters and their WebP derivatives and every `liveImage` in the catalog, so it should be done as its
own verified pass, not folded into a generation wave.

**Until then** these 4 keep their existing images and stay counted as `passed-not-shipped`. They are
not lost work — the approved photo sits in `.craft-pipeline/<product>/<option>/candidate-1.png` with
its `qc.json` beside it, and republishing is a one-command operation once the paths are field-scoped.

### The other two of the six

- `suit-2pc/coin-left` — refused for fan-out: three rows share `field+option+label` but are drawn
  against a *different* tech pack than the one this photo was made from. One photo cannot serve two
  drawings. Correct refusal; publish from each row's own pipeline folder.
- `suit-3pc/sb-5` — would replace a live photo. Needs `--allow-swap` and a human decision.

---

## FAM-SHARED-BLUEPRINT-COIN-WATCH — one drawing backing two different options

**Found:** 2026-08-01, during the retry wave. **Verified by md5, not by eye.**

```
coin-both   public/images/blueprints/remote/7f475092fe8b__3532.jpg
watch-both  public/images/blueprints/factory/88f95280e442__3532__Left_right.jpg
both        md5 87658726bf98f5322cbc719704c23291 · 61437 bytes · BYTE-IDENTICAL
```

Two filenames, two folders, one file. It backs `trousers/coin-both` (a coin pocket) and
`suit-2pc/watch-both` (a watch pocket) — two different craft options a customer chooses between —
with the marker in the same position on both pocket bags in each case.

**Why this cannot be fixed by generating harder.** QC scores fidelity *to the blueprint*. If two
options share one blueprint, then the more faithfully each is rendered, the more identical the two
photographs become. The pipeline's own quality gate drives them together. This is the same structural
trap already recorded for the glyph-backed options in Stage A, arriving from a different direction.

**What it needs:** either a genuine supplier drawing that distinguishes a coin pocket from a watch
pocket, or a ruling that they are the same construction under two names and should be merged/repriced.
Both are listed in [NEEDS-SOURCE.md](NEEDS-SOURCE.md). **Nothing merged unilaterally.**

Note this is distinct from the AMF case, where every `-amf` file was byte-identical to its `-top`
sibling. Here the two options are on *different products* and are plausibly genuinely different
constructions — the drawing simply does not document the difference.

## SPEC-VERSUS-DRAWING: `suit-2pc/jeans-square`

`spec.json`'s description calls for a pocket "reinforced with **rivets** and topstitching" and
`spec.measured.flags` carries `"top stitch"`. The drawing shows neither — it is plain line work with
no hardware and no topstitch dashes.

Attempt 1 followed the prose and rendered two metal dome rivets. QC removed them on the drawing's
authority and attempt 2 is correctly clean. **But the spec still says rivets**, so every future
rebuild of this prompt will re-inject them. The prose needs correcting at source, or the drawing needs
replacing with one that does show the hardware. Until then this option will oscillate.

---

## FAM-PRINTED-CALLOUTS-UNREAD — the drawings state their angles and the pipeline never reads them

**Found:** 2026-08-01, grading the regenerated shirt collars. **This is the root cause of the
angle-ladder risk the plan already flagged, and it is fixable.**

The shirt-collar tech packs print their spread angle as text on the drawing — `60.00°` on
`fashion-point-in-58cm.jpg`, `80.00°` on `square-in-65cm.jpg`, `square-in-65cm-with-button.jpg` and
`regular-collar-20.jpg`, with leader lines drawn to both collar tips.

Every one of those options has `spec.measured.angles = []`.

```
collar-fashion-point-58   angles: []   dims: ["5.8 cm"]   spread: ["narrow spread"]
collar-sq-65              angles: []   dims: ["6.5 cm"]   spread: []
collar-sq-65-btn          angles: []   dims: ["6.5 cm"]   spread: []
collar-regular-20         angles: []   dims: []           spread: ["moderate spread"]
collar-small-sq-50        angles: []   dims: ["5.0 cm"]   spread: []
```

`extract_spec.mjs` scans the **description prose**. It never looks at the drawing. So a dimension the
manufacturer printed directly onto the blueprint — the most authoritative number available — cannot
reach the prompt, and the image model is left to invent the angle.

**The measured consequence, with a clean control.** Four of the five collars were regenerated with no
angle anywhere in their prompt. The fifth, `collar-regular-20`, happened to have `"reads clearly as a
moderate 80 degrees"` inside its QC correction text:

| option | printed on drawing | number in prompt? | rendered |
|---|---|---|---|
| `collar-fashion-point-58` | 60.00° | no | **71°** |
| `collar-small-sq-50` | 80.00° | no | 84° |
| `collar-sq-65` | 80.00° | no | **89°** |
| `collar-sq-65-btn` | 80.00° | no | **70°** |
| `collar-regular-20` | 80.00° | **yes** | **81.2°** |

The one option whose prompt carried the number is the only one that landed on it. The other four
scattered across 19 degrees. `collar-sq-65` and `collar-sq-65-btn` print the *same* 80.00° and
rendered 19° apart; `collar-sq-65-btn` at 70° now collides with `collar-fashion-point-58` at 71°,
which is a different option on the same menu.

**Why this matters beyond collars.** The plan lists "the angle ladders" — ten peak-lapel options
spanning 101°–115° — as one of three things that cannot be finished. Part of that is real (one
supplier drawing backs all ten). But this finding says the *general* angle problem is not a physics
limit at all: where a drawing does print its angle, the pipeline simply is not reading it, and when
the number is supplied the model hits it to within 1.2°.

**Fix:** extract printed dimension callouts from the illustration into `spec.measured.angles` /
`.dimensions`, and emit them in the prompt. That is a `tech-pack-interpreter` change and it needs a
vision pass over each drawing rather than a text scan. **Not applied here** — it changes spec
extraction for the whole catalog and belongs in its own verified pass with a diff against the
pre-ingest baseline, exactly as Stage D specifies.

**Interim, and free:** when a QC correction is written for any option whose drawing prints a number,
put the number in the correction text. That is what made `collar-regular-20` land.

## The squared-tip family is UNMET, and honestly so

`collar-small-sq-50` and `collar-sq-65-btn` closed at `UNMET` after three attempts. Both fail on the
same thing: the label, the description and `spec.forbidden` all specify a **flat squared terminal
edge**, and all three attempts rendered a tapering point with a rounded apex.

The blueprint **cannot arbitrate**. At 232×244 px, roughly 1 px ≈ 3.5 mm, a 10 mm squared facet
occupies under 3 px and the drawn tip is a 2–3 px anti-aliased convergence. The grader declined to
claim the drawing shows either shape — correctly.

So this is a genuine source-material limit, not a generation failure: the only authority that could
settle square-versus-point is too coarse to do so, and the written record says "square" while the
image model keeps producing the point its priors favour. A higher-resolution collar drawing would
resolve it. Listed in [NEEDS-SOURCE.md](NEEDS-SOURCE.md).

---

## DISTINCT_OPTION_IMAGE_COLLISION — measured, ranked, and separated from the false alarms

**Computed 2026-08-01 by `tools/image_collisions.mjs` (new).** This finding had been carried as a
count of "14 families". It is now an exact list, hashed from the bytes the customer actually
receives rather than from filenames.

```
  SAME-FIELD    24 images   208 rows   BLOCKING: rival options on one menu, indistinguishable
  CROSS-FIELD    6 images    25 rows   different options on different menus: suspicious, not fatal
  fan-out      379 images              one option across several products: CORRECT, ignored
```

**The 379 matter as much as the 24.** The catalog deliberately fans one approved photograph across
the same option on jacket / suit-2pc / suit-3pc, and that is right. Any audit that flags shared
images without separating fan-out from collision produces 403 "defects" and is unusable. The tool
makes that distinction structurally: it only reports where two *different* option ids share bytes,
and escalates to BLOCKING only where those options sit on the *same* product+field — i.e. side by
side in one picker, where the customer is being asked to choose between two identical pictures.

### Ranked by rows affected

| rows | options | image |
|---:|---:|---|
| 30 | **10** | `generated/jacket/lapel-peak-101.webp` |
| 24 | 8 | `generated/jacket/lp-slanted-flap-55.webp` |
| 24 | 8 | `jacket/lining/half-lining.jpg` |
| 15 | 5 | `generated/jacket/cp-welt-23.webp` |
| 12 | 4 | `generated/jacket/lapel-notch-50.webp` |
| 12 | 4 | `generated/jacket/cp-welt-curved-23.webp` |
| 12 | 4 | `generated/jacket/lp-slanted-flap-40.webp` |
| 12 | 4 | `blueprints/factory/d3eb9a6df665__0711__Match_fabric.webp` |
| 9 | 3 | `generated/jacket/lapel-shawl-0a.webp`, `lp-jetted-4.webp`, `lp-patch.webp`, `jacket/ticket-pocket/jetted.jpg` |
| 6 | 2 | `generated/jacket/lapel-peak-99.webp` |
| ≤3 | 2–3 | 11 further images, mostly shirt stitching and collar-stand buttons |

**Rank 1 is the angle ladder, quantified.** One photograph is serving `lapel-peak-101`, `-102`,
`-102-rl`, `-103-curved`, `-105`, `-107`, `-108`, `-110`, `-110-low` and `-115` across three
products. The plan already listed the peak-lapel ladder as unfinishable for want of source material;
this puts a number on the customer-facing cost — 30 rows where the picker offers ten choices and one
picture.

### Which of these are source problems and which are generation problems

Reading the list against `FAM-PRINTED-CALLOUTS-UNREAD`, the 208 rows split into two different
diseases with two different cures:

- **Source-limited** — the ladders (`lapel-peak-*`, `lapel-notch-*`, `cp-welt-*`, `lp-slanted-flap-*`).
  One supplier drawing backs the whole family, so no prompt can separate them. These need drawings,
  and they are in [NEEDS-SOURCE.md](NEEDS-SOURCE.md).
- **Pipeline-limited** — the pairs that differ by a *documented, drawable* feature and simply were
  never given it: `cs-square` vs `cs-square-2btn` (two buttons on the collar stand), `bh-hand` vs
  `bh-machine`, `canvas-none-press` vs `canvas-top`, `stitch-01-inner-plain` vs `stitch-01-top`.
  These are the same shape as `collar-sq-65-btn`, which shipped an image missing the two tip buttons
  that were its entire identity — and which was *fixed* this session once the feature was named in
  the prompt. They are recoverable without new source material.

The AMF pairs (`stitch-03-amf` vs `stitch-03-top`, etc.) are already known to be source-limited:
every `-amf` file is md5-identical to its `-top` sibling, so no authentic AMF artwork exists in this
repo at all.

**Nothing merged, nothing repriced.** The merge/reprice ruling on any customer-facing option remains
the user's, and this table exists to make that ruling on evidence rather than on impression.

### Correction: I checked the "recoverable" bucket and it was partly wrong

The section above split the 208 blocking rows into *source-limited* and *pipeline-limited*, and named
four pairs as recoverable without new source material. I then verified each by md5 rather than by
filename, and two of the four were mine to retract:

| pair | claim | verified |
|---|---|---|
| `bh-hand` / `bh-machine` | recoverable | **WRONG — source-limited.** `buttonhole/hand-made.jpg` is **byte-identical** to `buttonhole/machine.jpg`. The supplier shipped one drawing under two names, so hand-versus-machine cannot be drawn from source at all. This extends the known AMF finding to the buttonhole family. |
| `stitch-01-inner-plain` / `stitch-01-top` | recoverable | **WRONG — source-limited.** `decoration_stitching_on_placket/` contains exactly ONE file. There is no second drawing to point at. |
| `cs-square` / `cs-square-2btn` | recoverable | **CONFIRMED, and it is a MIS-POINTING, not a generation gap.** |
| `canvas-none-press` / `canvas-top` | recoverable | **CONFIRMED as a mis-pointing**, but the correct target is not obvious. |

The AMF pairs re-verified as identical too, confirming the earlier md5 result:
`machine-01cm-amf-stitching.jpg`, `-03cm-`, `-05cm-` are each byte-identical to their `-top` sibling.

**Lesson worth keeping: a differently-named file is not a different drawing.** Four of these looked
recoverable purely because a plausibly-named alternate existed on disk. Hashing them took one
command and reversed half the conclusion.

### Two ready-to-apply pointer fixes — NOT applied, they change a live image

**`cs-square` "Square Collar Stand"** currently shows
`techpacks/shirt/collar_stand/square-collar-stand-with-2-buttons.jpg` — which is `cs-square-2btn`'s
drawing. The correct file exists and is genuinely different:

```
square-collar-stand.jpg               md5 f1c52febf4…   <- what cs-square should show
square-collar-stand-with-2-buttons.jpg md5 6455ac3807…  <- what it shows now, and what
                                                            cs-square-2btn correctly shows
```

A customer choosing between "Square Collar Stand" and "Square Stand (2 Buttons)" is shown the same
picture, and it is the 2-button one — so the plain option is actively mis-sold.

**`canvas-none-press` "None Pressing Craftsmanship"** shows `canvas/top-craftsmanship.jpg`, which is
`canvas-top`'s drawing. Here the correct target is *not* obvious: `canvas/` holds
`normal-craftsmanship`, `senior-craftsmanship`, `top-craftsmanship` and six files named
`picture-1…6`. None is named for "none pressing". This one needs a human to say which drawing — or
whether it belongs in NEEDS-SOURCE.

Both are left unapplied deliberately: they change what a customer sees, which is the same class of
change as the four live-photo swaps already awaiting `--allow-swap`. The evidence is here so the
ruling can be a decision rather than a guess.

---

## FAM-TROUSER-DETAIL-MISMAPPING — options pointed at drawings documenting a different distinction

**Found 2026-08-01** by the zero-cost blueprint-conflict gate during generation wave 1. Three of six
options in one batch were stopped before a prompt was built. No credits spent on any of them.

### `watch-left` — the drawing does not mark a watch pocket at all

`suit-2pc/watch-left` and `trousers/watch-left` ("Left Welt Watch Pocket") point at
`factory/2a5f7a6c70e1__3171__Left_welt.jpg`.

Two agents disagreed about this file — one generated from it, one refused — so it was settled
directly, and the sibling drawing is what proves it:

| file | shows | red mark |
|---|---|---|
| `3169__No.jpg` ("None") | trouser, hip welt, back darts | **none** |
| `3171__Left_welt.jpg` (mapped to *watch-left*) | the same trouser, hip welt, back darts | **none** |
| `3180__Regular_right.jpg` (*watch-right*) | the same trouser | **a small red mark tucked under the waistband** |

In this family the base drawing is context and **the red mark IS the option**. `3180` marks the watch
pocket; `3171` marks nothing, which is why it is visually indistinguishable from the "None" drawing.
The long welt at hip level with a tab above it is a besom **back** pocket, not a watch pocket.

So `watch-left` cannot be specified from this file. Either the supplier's left-marked sheet is
missing from the repo, or the mapping took `3171__Left_welt` on its filename — which names a *back*
left welt, not a watch pocket.

**One image was already generated from it** — `trousers/watch-left` candidate-1, produced by a
parallel agent that judged the drawing acceptable. It cost 0.5 credits and **must not be published**;
it is unverifiable against a drawing that does not mark the feature.

### `fly-stitch-curved` / `fly-stitch-straight` — the drawings document topstitch WIDTH, not fly shape

These point at `31A3__0.6cm_top_stitch.jpg` and `31A1__0.15cm_top_stitch.jpg`. In both, the fly is
drawn as the *same* curved J and is not highlighted; the red marks the **hip/side-seam pocket
topstitch**. The factory codes say what the pair actually encodes: 0.6 cm versus 0.15 cm topstitch
distance from the edge.

So a "Curved vs Straight Fly Stitch" choice is mapped onto a pair of sheets about pocket topstitch
width, and neither sheet draws a straight fly at all. Generating would have produced two confident
wrong images that QC scores as faithful, because QC scores fidelity *to the blueprint*.

### Why these were caught and the earlier ones were not

The gate that stopped them is the `BLUEPRINT_CONFLICT` check, run **after** spec extraction and
**before** prompt building — so it costs nothing and it looks at the actual pixels. It has now paid
for itself several times over. Note it is not infallible: `trousers/watch-left` passed it in one
agent and failed it in another, on the same file. Where two readings disagree, the drawing itself
decides, and the sibling drawings in the same family are usually what makes the answer obvious.

**None of these mappings were changed.** Repointing an option's illustration alters what a customer
sees, and sits with the other pending pointer fixes for a human ruling.

## FAM-BACK-DARTS-WRONG-FACE — a whole field mapped to the opposite side of the garment

**Found 2026-08-01** by the conflict gate. All three options in `Trousers-back > back-darts` —
`darts-none`, `darts-single`, `darts-double` — are backed by the factory **302 front** pleat-and-dart
series (`302L__No_pleat_no_dart`, `302M__No_pleat_single_dart`, `302Y__No_pleat_double_darts`).

Every one of those sheets is a trouser **FRONT** view: J-shaped fly topstitch curving into the
crotch, fly extension, slant side-seam pockets, front crease lines, with the red dart marks on the
front panels either side of the fly. The true back sheets (3230 / 3231 / 320B) look nothing like
them — straight centre-back seam, four belt loops, no fly.

`darts-single` is the dangerous one: the dart **count** matches (one each side), so a
fidelity-to-blueprint QC pass would score the render correct while it depicts the wrong face.

There is a second-order harm worth spelling out. Recording `orientation: front` from these sheets
makes `extract_spec`'s `computeForbidden()` add front/back-confusion negatives — so **the spec would
forbid the very back-face feature the option names**. A wrong blueprint does not merely mislead the
image model; it can turn the pipeline's own safety machinery against the option.

## Two sheets that do not encode the distinction the catalog asserts

Flagged during the same wave and **deliberately not gated**, because the evidence cut both ways:

- `back-left-patch` — `3230__Patch_with_pointed.jpg` draws pointed patch pockets on **both** sides,
  and its sibling `3231__Point_patch_with_bttn.jpg` (mapped to `back-both-patch`) is the same drawing
  **plus a button**. So the factory pair encodes button-versus-no-button, not left-versus-both.
- `back-left-welt` — `3221__Welt_with_bttn.jpg` draws **two** welts with one button, and is nearly
  indistinguishable from `320B__Right_left_besom_left_bttn.jpg` backing `back-both-welt`.

These were allowed through because the already-shipped asset for `back-left-patch`, generated from
this same sheet, correctly renders a **single** left pointed pocket — which shows the pipeline takes
the count from the label rather than the drawing. That is a real mitigation, but it is not a
guarantee, so **QC must explicitly verify pocket COUNT on both candidates**: a two-pocket result
would be identical to the `both` option and would sail through a naive fidelity check.

---

## LEGACY-LIVE-IMAGE DEFECT RATE — measured on a sample, and it inverts a priority

**Measured 2026-08-01.** 745 in-scope rows show a generated photograph that this pipeline has never
graded. Rather than commit hundreds of agent-hours to grading all of them blind, a deterministic
spread of 24 was sampled across every product and field. **The first 12 are judged.**

```
   3  OK           correctly and recognisably depicts the option
   4  INDISTINCT   right family, but nothing separates it from its menu siblings
   5  WRONG        different feature, wrong count, or wrong part of the garment
```

**~40% actively wrong. 75% not fit for a customer to choose from.** Extrapolated across 745 rows
that is on the order of 300 customer-facing images showing something other than what was ordered.

### The unambiguous ones

| option | label promises | image shows |
|---|---|---|
| `suit-2pc/sb-4` | SB **4** Buttons | **three** buttons and three buttonholes — it is an SB 3 |
| `shirt/cs-round-2btn` | Round Stand (**2 Buttons**) | **one** button, with a tie knot over the band that is the subject |
| `suit-3pc/contrast-ticket-besom` | contrast trim on the **ticket** pocket | the **chest** welt, with a pocket square in it; the ticket pocket is not in frame |
| `shirt/bias-inner-collar-stand` | a panel **cut on the bias** | a solid navy **contrast band** — the drawing's red hatching rendered as cloth |

That last one is the "colour in the drawing is notation, not cloth" failure, live in production. The
correctly-executed sibling `bias-outer-top-collar` shows what it should look like: striped fabric
with the stripes running diagonally on the affected piece. **Worth sweeping the whole `bias_cutting`
family and any other hatched-blueprint option for the same artifact.**

### This inverts the priority order

`customer_view_audit.mjs` found 645 rows still showing a technical drawing, and that read as the
bigger problem. It is not. **A drawing is honest** — the customer sees manufacturing documentation
and knows it. **A wrong photograph is not** — it is a confident, specific, false claim about what
will be manufactured. Someone ordering "SB 4 Buttons" is being shown a three-button jacket.

So the ~300 wrong live images outrank the 645 drawings, and they are cheaper to find than to fix:
grading is free.

### Duplicate reuse is worse than this sample can show

In the sport-coat chest-pocket menu alone, `cp-welt-23`, `cp-welt-25`, `cp-welt-27`, `cp-jetted` and
`cp-trapezoid` all ship the **identical file** (sha1 `60aa2e9282`); `cp-welt-curved-23/25/27/29`
share another (`ed619110ab`); four patch variants share a third (`f7fa88b7d6`). **Nine of nineteen
options in one menu are duplicates of a sibling.** The INDISTINCT rate across the full 745 is
therefore materially higher than 4-in-12.

### Two options cannot be photographed distinguishably at all

- `suit-2pc/cd-minus-3` — a ±cm chest-dart *position* adjustment has no visual signature. -3, -2,
  standard, +2 and +3 cannot differ in a photograph.
- `suit-2pc/heel-none` — an absence, on the **inside back** hem, which the shot does not even show.

These need a diagram or text, not a photograph. Recorded rather than retried.

### Three of twelve blueprints are not drawings

`jacket/front-style/sb-3-roll-2.jpg` and `jacket/front-style/sb-4.jpg` are plain fabric swatches;
`jacket/chest-dart/minus-3.jpg` is a screenshot of a supplier **button** catalogue page. These were
judged against the label instead, so the defect counts above remain about the live images. This is
the same `jacket/front-style/` folder already found to hold swatches for `sb-3` and `db-4x2` — the
folder is systematically mis-populated.

### The full 24-row sample — and a correction to the rate I published from the first 12

The second half of the sample came back **6 OK, 5 INDISTINCT, 1 WRONG**, which moves the headline
materially. Combined over all 24:

```
   9  OK           37.5%
   9  INDISTINCT   37.5%
   6  WRONG        25.0%
   -------------------------
  15  not fit for a customer to choose from   62.5%
```

**I previously recorded "~40% actively wrong" from the first 12 rows. The correct figure is 25%.**
The first batch happened to draw the worse half. Extrapolated across 745 ungraded live rows that is
roughly **185 actively wrong** and **465 not fit for choosing** — still a large number, and still
enough to invert the priority against the 645 drawing-only rows, but a quarter rather than two
fifths. Recorded here rather than left standing, because a headline defect rate is exactly the kind
of number that gets quoted later without its provenance.

Sampling caveat worth stating: 24 of 745 is a ~5% sample, so the true rate has real spread around
25% — this is an order-of-magnitude finding, not a precise one.

### New from the second batch

- **`suit-3pc/lbh-no1-tc-arc` — WRONG, and starkly.** The option is a hand-worked lapel buttonhole in
  three thread colours. The live photo has **no lapel buttonhole at all** — the whole lapel face was
  cropped and enlarged to confirm. It depicts the "None" option.
- **The shoulder-pad drawing backs FOUR options per product, not two.**
  `9fd6de75414f__060K__Regular.jpg` serves `pad-01`, `pad-03`, `pad-05-soft` and `pad-05-structured`
  — **12 catalog records** on one picture. My earlier note treated this as a soft/structured pair;
  it is twice that.
- **The notch-angle family is degenerate.** `lapel-notch-50`, `-55` and `-65` ship effectively the
  same image, independent of any single verdict. That is the same disease as the peak ladder.
- **`slant-20` disagrees with its own drawing.** The blueprint depicts a near-horizontal high-set
  besom welt; the render shows a steeply angled side pocket. So it is both unmeasurable *and*
  geometrically wrong — a case where the shared-family assumption ("these differ only by cm") is
  itself false.

### What the two batches agree on

Both halves independently found the same three structural causes, which is the useful result:

1. **Counts are unreliable** where a count is the whole option (`sb-4` → 3 buttons,
   `cs-round-2btn` → 1 button, `lbh-no1-tc-arc` → no buttonhole).
2. **One drawing backing many options** guarantees indistinguishable photographs — shoulder pads
   (4 per product), notch angles, peak angles, chest-pocket welts, slant widths.
3. **Annotation rendered as cloth** — red hatching becoming a contrast panel (`bias-inner-collar-stand`),
   and red welt marks becoming tonal sheen rather than real contrast (`vest-contrast-specify-seam`).

---

## COUNT AUDIT — targeted sweep of every option whose label asserts a number

**2026-08-01.** The 24-row sample found that counts fail where a count IS the option, so all 24
options in the catalog whose label asserts a countable quantity or a side were swept directly. This
is the most objective check available: no missing dimension callouts, no viewer-versus-wearer
ambiguity, no ratio normalisation. A grader either counts four buttons or does not.

**First 12 (pockets, cuff buttons, sides): 10 MATCH, 2 MISMATCH.**

### This CORRECTS an over-broad claim of mine

I wrote earlier that "counts are unreliable — the generator got it wrong twice out of two". That was
drawn from two failures (`sb-4`, `cs-round-2btn`) and does not survive the wider sweep. **All five
cuff-button counts are correct** — `cb-1`, `cb-2`, `cb-3`, `cb-5`, `cb-6`, each verified with the
cuff hem in frame below the lowest button so the stack is closed. So is `back-both-patch` (two),
`back-both-besom-right-btn` (two, button on the correct side) and `back-both-welt`.

The accurate statement is narrower: **front-placket and small-hardware counts fail; cuff-button
ladders do not.** Worth keeping, because it says where to look.

### The two real failures

**`trousers/watch-both` — the worst image found so far.** The label promises watch pockets on both
sides. The render contains **zero identifiable watch pockets**. Each side instead shows a hanging
tongue of cloth running from below the waistband to past mid-thigh — roughly 22 cm at garment scale,
about three times a real watch pocket — with finished edges but **no welt, no slit, no opening
anywhere**. The frame, resolution and both sides are all perfectly adequate, so this is not a
framing excuse: a customer cannot identify a watch pocket at all, let alone two.

**`suit-2pc/back-both-besom-tab`** promises both besoms with tab & button. Both pockets are fully in
frame, so the count is real and not a crop artefact: the wearer's left besom carries a pointed
stitched tab with a four-hole button, and the wearer's right welt is **completely bare**. The option
delivers half the feature it names.

### An absence option done RIGHT, worth keeping as the reference

`suit-2pc/back-besom-no-right` — "Left Besom Only (No Right)" — **MATCHES**, and the reason is
instructive after so many absence options failing. The right seat panel is genuinely in shot, from
the centre-back seam out to the hip edge with background visible past it, and the mirrored position
where a right besom would sit is lit, unobstructed and plain. **The absence is proven rather than
merely assumed.** That is the standard the other absence options (`heel-none`,
`vest-extra-no-seal-stitch`, `flat-front`) fail to meet: they are framed so the missing thing was
never going to be visible either way.

### Method note worth reusing

Handedness was established independently rather than assumed — on `loops-one-right` the grader fixed
the wearer's side two ways at once (the fly J-topstitch lying viewer-right of the fold edge, giving
standard left-over-right; and the waistband extension anchored viewer-right with its buttoned tip
travelling viewer-left). That is the discipline the unresolved coin-pocket side question needs.

### Count audit part 2 (buttons) — a systematic family failure

**12 more options: 5 MATCH, 5 MISMATCH, 2 UNCOUNTABLE.** Combined across both halves of the sweep:

```
  24 count-claiming options
  15  MATCH
   7  MISMATCH
   2  UNCOUNTABLE  (a necktie or a crop prevents the check)
```

**FAM-SHIRT-PLACKET-SHORT.** The shirt front-button family fails in one consistent way: every render
places its topmost button on the **collar stand** and then under-delivers the placket count.

| option | promises | placket buttons rendered |
|---|---:|---:|
| `shirt/btn-7` | 7 | **6** |
| `shirt/btn-8` | 8 | **7** |
| `shirt/btn-9` | 9 | **7** |

`btn-8` and `btn-9` render the same count, so two options a customer must choose between are
effectively identical.

The obvious counter-explanation — that the label might be counting the collar-stand button — was
ruled out against the source: **all four tech packs draw a collar-stand mark PLUS exactly the
labelled number of placket buttons.** The illustrations are correct; only the photographs are wrong.

Compounding it, three of these images are cropped through the placket: on `btn-8` the button pitch
is about 155px and the frame ends about 80px above where an eighth would fall, so the promised count
**could not fit in frame regardless of what was rendered**.

**One bad render, three products.** `sport-coat/sb-4`, `suit-2pc/sb-4` and `suit-3pc/sb-4` are all
served by the single file `/images/generated/jacket/sb-4.webp` (md5 `e47bc06a…`) — the one already
proven to show three buttons for a four-button option. Fixing it once fixes three rows; leaving it
mis-sells on three products.

**`shirt/cs-round-2btn` is UNCOUNTABLE for a styling reason that is already a written rule.** A
knotted necktie covers the lower collar stand where the second button would sit, so the promised
pair can neither be seen nor ruled out. `photography-rules.md` already says a necktie is worn only
where the tie is required to demonstrate the option — tab and wing collars. A collar-stand option
must never be shot with one.

### A blind spot in my own collision tool, found by this sweep

`tools/image_collisions.mjs` hashes bytes. `btn-7`, `btn-8` and `btn-9` are three **different** files
(`157e98f1…`, `fb75592d…`, `efdb69c7…`) that render the **same count**. The tool cannot see that, and
would report them as three healthy distinct images.

So the 208 same-field collisions it reports are a **floor, not a ceiling**: they are the cases where
the identical file was reused. Options that were generated separately and merely came out
indistinguishable — which the 24-row sample suggests is the larger population, at 37.5% INDISTINCT —
are invisible to it and can only be found by looking. Worth stating plainly next to that 208, so the
number is not read as the full extent of the problem.

---

## FAM-FRONT-STYLE-FOLDER — an entire field with no usable source material

**Verified 2026-08-01 by running triage over the whole folder.** `public/images/jacket/front-style/`
holds 13 files. **Every one fails.**

```
NOT_A_DRAWING   sb-1  sb-3  db-4x1  db-6x1
SUSPECT         sb-2  sb-4  sb-3-roll-2  sb-4-roll-3  sb-5
                db-2x1  db-4x2  db-6x2  db-6x3
                        13 of 13 unusable
```

All are 240x200. White fraction runs 0.000-0.430 — nowhere near the 0.75 floor a genuine small
drawing clears — and saturation runs 1.3 to 45.2. These are fabric swatches and scraped page
fragments, not tech packs.

**Consequence.** Every jacket front-style option — the entire button-stance field, single- and
double-breasted — has no authentic drawing behind it. `sport-coat/sb-4` cannot be regenerated
correctly because there is nothing correct to generate from, and its current render (3 buttons for a
4-button option) is live on **three products** from a single shared file.

Note the vest equivalents at `/images/options/vest/` ARE genuine 1200x1200 line art. So the drawings
exist for waistcoat button stances and are missing only for jackets. Added to
[NEEDS-SOURCE.md](NEEDS-SOURCE.md).

## The jeans pair — usable source, unused. This is NOT a source limitation.

`jeans-arc` and `jeans-square` are indistinguishable, and both rendered the geometry of a **third,
neighbouring option** (`Sideseam`, sheet 3130) — which each option's own `spec.forbidden` explicitly
prohibits as "geometry borrowed from a neighboring craft option on the same field". Scores 15-24
across shape, geometry, angles and blueprint-match.

What makes this different from the ladder families is that **the source material is adequate**. The
two sheets differ measurably, traced from the red guide pixels directly rather than eyeballed:

| | 3135 (arc) | 3133 (square) |
|---|---|---|
| vertical drop | 1.31 waistband depths | 1.00 |
| run angle below horizontal | 3.8° | 5.7° |
| mouth vertical extent | 0.433 belt-loop pitches | 0.312 |
| terminal down-turn | **yes, ~34°** | none |
| mouth rendering | open double-line channel | single stroke |

Both renders instead show a long near-vertical side pocket with **zero inboard travel** — the mouth
never crosses the front panel at all, finishing 0.79-0.94 belt-loop pitches short of the crease where
the drawing terminates it exactly on the crease line.

So this is a generation failure against usable drawings, and it is recoverable — unlike the peak
lapels or the AMF pairs. Worth separating in any triage of what needs new source versus what needs
re-running.

An inversion worth recording: in both renders the sheet's **un-highlighted context feature** (a
right-hip welt) is reproduced crisply, while the **red-marked craft option** is replaced by generic
geometry. The model rendered everything except the thing the drawing was marking.

## `quarter-canvas` — the sheet documents a different distinction entirely

Sheet `00C3` is titled **"Single layer"** — a layer-COUNT distinction. The option is **"Quarter
Canvas"** — an EXTENT distinction, described as canvas covering "roughly the top quarter of the front
panel". The drawn pad-stitched canvas descends to 58% of forepart height, which is half-canvas
territory.

Worse, `00C3` is the **only** canvas sheet in `public/images/blueprints`, while the catalog carries
five distinct extent options (quarter / half / light-half / ultra-thin-half / full). One sheet cannot
distinguish five extents, and it is not even drawing extent.
