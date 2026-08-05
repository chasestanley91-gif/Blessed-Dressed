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

---

## COLLISION TRIAGE — 208 rows split by cause, because the two halves need opposite responses

`tools/collision_triage.mjs` (new) answers the question `image_collisions.mjs` could not: **why** two
options show the same picture. It resolves each colliding option to its blueprint and compares those
blueprints by path and by bytes.

```
  SOURCE-LIMITED       19 families  142 rows   needs DRAWINGS or a merge ruling
  GENERATION-LIMITED    5 families   66 rows   RECOVERABLE by re-running
```

### GENERATION-LIMITED — 66 rows, 22 options, the source is already adequate

| rows | options | image | blueprints |
|---:|---:|---|---:|
| 24 | 8 | `lp-slanted-flap-55.webp` | 2 distinct |
| 15 | 5 | `cp-welt-23.webp` | 3 distinct |
| 9 | 3 | `lapel-shawl-0a.webp` | 3 distinct |
| 9 | 3 | `lp-jetted-4.webp` | 2 distinct |
| 9 | 3 | `lp-patch.webp` | 3 distinct |

These options have **genuinely different drawings** and still ship one photograph. Nothing needs to
be sourced — the material to tell them apart exists and was not used. At roughly two attempts per
option this is about 22 credits for 66 customer-facing rows, which is the best-value work remaining
in the whole project.

The jeans pair is the proven precedent: `jeans-arc` and `jeans-square` rendered the *same* side-seam
pocket and scored 15-24, yet their sheets differ measurably — drop 1.31 against 1.00 waistband
depths, run angle 3.8 against 5.7 degrees, and one carries a terminal 34-degree hook the other lacks.
The cause turned out to be catalog prose describing the wrong geometry, which is a free fix. **Check
the description before spending a credit on any option in this list.**

### SOURCE-LIMITED — 142 rows, and regenerating cannot help

The worst are one drawing behind many options:

| rows | options | image |
|---:|---:|---|
| 30 | **10** | `lapel-peak-101.webp` |
| 24 | 8 | `jacket/lining/half-lining.jpg` |
| 12 | 4 | `lapel-notch-50.webp`, `cp-welt-curved-23.webp`, `lp-slanted-flap-40.webp`, `0711__Match_fabric.webp` |
| 9 | 3 | `jacket/ticket-pocket/jetted.jpg` |

Plus the byte-identical families already documented — collar-stand buttons (3 filenames, one file),
and the AMF stitching pairs.

**QC actively drives these together.** It scores fidelity *to the blueprint*, so the more faithfully
each option is rendered against a shared drawing, the more identical the two photographs become.
Spending credits here produces images that must still match. These need drawings from the supplier,
or a merge/reprice ruling — both of which are the user's call, and neither is taken here.

### Why this split matters more than the raw 208

The headline number treats every collision as one problem. It is two problems with opposite
remedies, and the cheap half is only a quarter of the rows. Without the split, an obvious reading of
"208 blocking rows" is to start regenerating — which would spend credits on 142 rows that cannot
move, while the 66 that can move sit untouched.

### Reading the generation-limited 66 properly — the differences are not subtle

Listing what actually collides makes the case stronger than the counts do. These are not near-misses
on a millimetre; they are **different constructions sharing one photograph**:

| family | colliding options | their sheets |
|---|---|---|
| `cp-welt-23` | `cp-jetted` · `cp-trapezoid` · `cp-welt-23/25/27` | Besom · **Trapezoid** · Normal |
| `lp-patch` | `lp-patch` · `lp-patch-flap` · `lp-patch-rounded` | Patch · **Patch with flap** · **Curved patch** |
| `lp-jetted-4` | `lp-jetted-4` · `lp-straight-jetted` · `lp-jetted-btn-tab` | Besom · Besom · **Besom with tab and button** |
| `lapel-shawl-0a` | `lapel-shawl-0005` · `-0a` · `-0e` | three distinct shawl sheets |

A trapezoid chest pocket and a jetted chest pocket are not a fine distinction. Neither is a patch
pocket with a flap versus one without, nor a besom with a button tab versus a plain one. Each has its
own supplier drawing. One photograph is currently doing all of that work.

**One correction to my own tool's output.** `collision_triage.mjs` classifies per family, and
`lp-slanted-flap-55` is **mixed** — it contains both kinds at once:

```
  lp-slanted-flap-55, -65          share 02A1__Regular_slanted      <- cm ladder, SOURCE-limited
  lp-straight-jetted-40 … -65      share 0201__Regular              <- cm ladder, SOURCE-limited
  slanted-flap  vs  straight-jetted   TWO DIFFERENT SHEETS          <- GENERATION-limited
```

So within each sub-group the options differ only by a centimetre on one shared drawing and cannot be
separated; but the two sub-groups are different constructions with different drawings and should
never have collided. The family is correctly flagged as recoverable, but only the between-group
distinction is recoverable — re-running will not separate `-55` from `-65`.

The tool reports at family granularity and cannot see that. Stated here rather than left to be
discovered when someone regenerates six straight-jetted options and gets six identical images.

### Pair-level detail — 27 of 47 pairs are actually separable

`collision_triage.mjs` now enumerates every PAIR of colliding options rather than reporting per
family, because the family label was misleading on its own:

```
  27 of 47 option pairs can be separated by re-running
  20 share one drawing and will stay identical however often they are regenerated
```

The 20 that cannot move:

| stuck pairs | why |
|---|---|
| `lp-straight-jetted-40/45/50/55/60/65` — all **15** pairs | six options, one sheet `0201__Regular` |
| `cp-welt-23/25/27` — 3 pairs | three options, one sheet `0101__Normal` |
| `lp-slanted-flap-55` vs `-65` | one sheet `02A1__Regular_slanted` |
| `lp-jetted-4` vs `lp-straight-jetted` | one sheet `0231__Besom` |

That last one deserves a second look from someone who knows the product line: **"Straight Jetted
Pocket 4 cm" and "Straight Jetted Pocket" share a drawing and differ only by a centimetre figure in
one of the two names.** They may be the same option listed twice.

**What this changes in practice.** The naive reading of "5 recoverable families, 22 options" is to
regenerate all 22. Doing so would spend roughly 11 credits on six straight-jetted options that must
come back identical, three chest welts likewise, and a slanted-flap pair — and then the regenerated
images would collide exactly as before. The work that actually pays is the 27 separable pairs, which
are the *between-construction* distinctions: jetted versus trapezoid versus welt, patch versus
patch-with-flap versus curved patch, plain besom versus besom-with-tab-and-button.

### The recoverable 66 have never actually been through the pipeline

Checked before spending a credit on them, and it changes the expected outcome. **Every option in the
generation-limited families carries no pipeline record at all** — `cp-jetted`, `cp-trapezoid`,
`cp-welt-23`, `lp-patch`, `lp-patch-flap`, `lp-patch-rounded`, `lp-jetted-4`, `lp-jetted-btn-tab`,
`lapel-shawl-0a`, `lapel-shawl-0e` are all `legacy-shipped-unverified`.

They were generated before any of this existed:

- `BLUEPRINT_LOCK` and the "colour is notation, not cloth" clause
- the `BLUEPRINT_CONFLICT` gate that runs before a credit is spent
- raking light for depth · patterned cloth for grain · matched framing for ladders ·
  absence-proof framing · the counting convention lifted from filenames
- QC of any kind

So these are **not** hard cases that resisted a good pipeline. They are artefacts of the era before
one. Regenerating them is not "retry and hope" — it is running them through the machinery for the
first time.

**Their descriptions are already good**, which is the other half of the encouragement. Unlike the
jeans pair, the prose here is specific and genuinely distinguishing: *"two thin parallel strips of
cloth flanking a neat slit — with no welt standing above the opening"* (jetted), *"wider at the top
than the bottom, tapering as it descends"* (trapezoid), *"a continuous curved lower edge and gently
rounded corners"* (rounded patch). No contradiction to fix first.

**Two exceptions worth fixing before regenerating:**

1. **`lp-jetted-btn-tab` has a five-word stub description** — "Jetted pocket with button tab." — while
   its sibling `lp-jetted-4` has a full paragraph. That asymmetry is a plausible cause of the two
   colliding: the prompt has almost nothing to distinguish the tab version.
2. **`lapel-shawl-0a` / `-0e` are described only qualitatively** — "particular proportions and roll
   line", "moderately wide", "narrower, tighter roll". No measurable geometry, so nothing separates
   them in the prompt even though their drawings differ.

**This very likely generalises to the wider legacy population.** 857 rows are
`legacy-shipped-unverified`, and the sampled defect rate among them was 25% wrong / 37.5% indistinct.
If those images predate the pipeline in the same way, the honest expectation is that a substantial
share are recoverable simply by running them through it — which reframes that backlog from "857
images to re-shoot" to "857 images that have never been attempted properly".

---

## The prose-contradiction class is now CONFIRMED CAUSAL, not just correlated

Until now the claim "catalog prose that contradicts its drawing produces wrong renders" was an
inference from co-occurrence. The jeans pair was run as a controlled test of it: the descriptions
were corrected at source, nothing else in the pipeline was touched, and the pair was re-measured
against the same blueprints using the same landmark (belt-loop pitch).

| | before the prose fix | after | drawn target |
|---|---|---|---|
| `jeans-square` inboard travel | 0 — one unbroken near-vertical line at the side seam | **0.71 pitches** | 0.75 |
| `jeans-arc` inboard travel | 0 — same side-seam line | **0.78 pitches** | 0.78 |
| inner end reaching the pressed crease | neither | **both** (486 vs crease 485–493; 389 vs 387–393) | yes |
| `BLUEPRINT_CONFLICT` | — | false for both | — |

95% and 100% of the drawn value, from renders that previously produced a pocket on the wrong seam.
Four independent features now separate the pair: the square ends **flat** against the crease while
the arc **hooks down** ~76° over its last stretch; square is three straight segments through a
zero-radius corner, arc is one continuous sweep; square carries a heavy topstitched band, arc a fine
double-line slash; travel 0.71 vs 0.78.

**`jeans-arc`'s own description had literally instructed the defect** — it said the mouth ran *"down
to the side seam"*. The generator obeyed. The description is an INPUT to the prompt, not documentation
of it, and this is the measurement that proves it.

Residual defects are second-order and unrelated to the geometry under test: the arc's sweep is ~1.4×
steeper than drawn, its side belt loop renders as a hollow wire outline, and the square render places
a hip welt on the near front thigh panel where none exists.

### Sixth instance: `lapel-shawl-0a` / `lapel-shawl-0e`

Measured from `090A` and `090E`, normalised to the neckband width present in both. No centimetres are
claimed — neither sheet carries a dimension callout.

- The catalog called 0E *"narrower … reduced width across the chest"*. **Across the chest (20–50% of
  the drop — the exact region that sentence names) 0E measures 17.6% WIDER**, range 8.6–26.5%.
- Below 55% the relationship reverses, but only to −4.1%. **No single wider/narrower statement
  describes this pair**, which is why width was never a usable discriminator — and the prose staked
  the whole distinction on it.
- The two differences that are real and large went **unmentioned by both entries**:
  - **Foot.** 0A's front edges converge to a sharp acute point with a fine tail running on below the
    meeting. 0E's sweep down in convex arcs and close in one smooth rounded bowl. Unmistakable at a
    glance.
  - **Taper.** 0A varies **36%** in width down its own length; 0E varies **12%** — near parallel-sided.

Both descriptions were rewritten from the drawings. This pair is *generation-limited*, so it is
genuinely recoverable — but note it would have been regenerated straight into the same collision had
the prose not been read first.

### `lp-jetted-btn-tab` — a five-word stub

Carried `"Jetted pocket with button tab."` while its sibling `lp-jetted-4` had a full paragraph, and
the two ship the same photograph. Rewritten from `02M1__Besom_with_tab_and_button`, which draws the
tab descending from the **centre** of the mouth to a small rounded terminal, roughly as deep as the
jets. Position and proportion are now stated, because "with a button tab" is not enough for the
generator to place anything.

**Sequencing rule, now evidence-backed: read the description before spending a credit on any option
in the recoverable list.** Six of the pairs examined so far had prose that would have re-created the
defect at full price.

---

## Catalog-wide description audit — `tools/description_audit.mjs`

The prose-contradiction class was being found one option at a time. It is now scanned mechanically,
because the description is an input to the prompt and a sentence in the catalog is an instruction to
the camera. Every pattern the tool looks for is derived from a defect that actually happened here.

**2658 descriptions scanned. 241 rows across 125 distinct option ids carry a hazard that would
actively mis-render.** (A further ~2100 are flagged NO_GEOMETRY/STUB — those are the not-yet-authored
backlog, not defects.)

| hazard | rows | what it is |
|---|---|---|
| `EXCLUDED_SHAPE` | 84 | names the shape the option is *not*, or what it turns into |
| `UNLABELLED_FIGURE` | 74 | a measurement in the prose that the label does not carry |
| `OCCLUDER` | 59 | an accessory that would sit on top of the showcased feature |
| `DUPLICATE_PROSE` | 85 rows / **14 distinct texts over 40 ids** | identical text cannot render differently |
| `CLOSURE_ASSERTED` | 10 | asserts buttoned/open, which is the drawing's call |

**Honest scoping of `OCCLUDER`.** 33 of the 59 are neckties on collar options, but most mention the
tie *descriptively* — "works equally well open-necked or with any standard tie knot" — rather than
instructing one. They are risk candidates, not confirmed defects. What makes the risk real rather
than theoretical is that a necktie already covered the band, spread and top button across 216
clusters.

### The occluder's actual source was the styling code, not the prose

`garment-image-director/scripts/lib/camera.mjs` had a carefully argued **NO-TIE default** for shirt
collars, with the reasoning written out in full — a four-in-hand covers the spread, the stand height,
the band seam and the top button, so a tie is worn *only* where it is required to demonstrate the
option (tab, wing). That comment records three independent QC agents catching the defect.

**It was never carried across to waistcoats.** `vest-front`, `vest-bottom` and `vest-lapel` were
styled `'over a crisp white dress shirt and tie'` — and a four-in-hand hangs straight down the
waistcoat opening, over the neckline apex, the top button, the lapel break and the front edge. Those
are exactly the features that separate one vest-front option from another; `v-neckline` versus
`u-neckline` is decided at the apex the tie would cover, and `u-neckline` is one of the options whose
prose was also found wrong.

Fixed, with the collar branch's reasoning cited at the site. This is the project's signature defect in
its purest form: **not bad reasoning about garments, but sound reasoning that stopped at a boundary.**

### `tools/set_description.mjs`

Blind string replacement across the catalog is unsafe and this was proven, not assumed. Sibling
options carry byte-identical prose — `lp-slanted-flap-55`/`-65` did, as did `lp-straight-jetted-40`/
`lp-straight-jetted` — so replacing "the old text" with the 5.5 cm version silently rewrote the 6.5 cm
option too. 18 replacements landed where 3 were intended. A JSON round-trip is *also* unsafe: measured,
`shirt`/`trousers`/`vest` re-serialise losslessly but `sport-coat`/`suit-2pc`/`suit-3pc` differ by
4–10 KB, and those three hold every jacket option. The tool edits by option id, in place, and verifies
every file still parses.

### Ten descriptions rewritten in the recoverable set

All ten hazards cleared, verified by re-running the audit (10 scanned, 0 hazards). Two of them were my
own prose from the same session — the audit caught `"rather than a parallel band"` in the shawl
descriptions I had just written while applying that very rule.

`lp-straight-jetted` was the worst: its prose was copied verbatim from the *flap* option and asserted
"covered by a flat, rectangular flap", but its blueprint is `0231__Besom` — no flap exists on it.

---

## Shape contamination — three mutually-exclusive families that had no rule

`spec.mjs` already had an `EXCLUSIVE_SHAPE_FAMILIES` mechanism, written for exactly this problem and
documented with the case that motivated it: a description names a sibling to contrast against
("unlike a NOTCH lapel"), `scanList` reads the whole text, and the option ends up tagged with a shape
it does not have — telling the image model to render two incompatible geometries at once.

**It declared only two families: lapels and hems.** Pockets, jeans pockets and waistcoat necklines
had no rule at all, so every contamination in those families passed straight through.

Found while running spec extraction on `cp-welt-23`: it emitted **both** `jetted / besom welt` **and**
`welt pocket`, while its own siblings `cp-welt-25`/`-27` emitted `welt pocket` alone. A welt pocket has
a standing welt; a besom does not. The source was a phrase I had preserved in my own rewrite an hour
earlier — "tight, precise jetted work on the welt fabric itself".

Three families added. Blast radius measured across the whole catalog rather than assumed, since this
is shared library code: **39 of 2862 shape sets changed, 0 options left with no shapes, 0 options
gained a shape.** The rule only ever drops.

| dropped | from | e.g. |
|---|---|---|
| `barchetta (boat) welt` | 15 | `cp-welt-curved-*` ("Curved Welt"), `lp-patch-rounded` ("Rounded Patch") |
| `welt pocket` | 13 | `cp-jetted`, `cp-boat-28/30`, `vest-chest-left-besom`, `vest-lower-jetted` |
| `jetted / besom welt` | 9 | `tp-welt`, `welt-pocket`, `back-both-welt` |
| `jeans arc pocket` | 1 | **`jeans-square`** |
| `jeans square pocket` | 1 | **`jeans-arc`** |

`flap pocket` was deliberately excluded from the pocket family — a flap sits over a jetted mouth, so
the two legitimately co-occur — as were `slant`/`on-seam` (orientation and placement) and
`ticket`/`watch`/`coin` (identity).

**The last two rows matter most.** `jeans-square` was tagged with `jeans arc pocket` and `jeans-arc`
with `jeans square pocket` — each carrying the other's shape. That is the collision this project spent
real effort diagnosing, and it **survived the prose rewrite**: correcting the descriptions removed the
wording but the extractor kept emitting the sibling shape. Two independent causes, one symptom, and
fixing the visible one would have left the other in place indefinitely.

**Method note.** The first blast-radius measurement reported 905 changed and 249 emptied, which would
have been an alarming regression. It was wrong: the comparison key used `opt.id`, which does not
exist on these records (the field is `optionId`), so every option collapsed to
`product/field/undefined` and unrelated rows were compared against each other. A diff is only evidence
once you have checked it is comparing the things you named — the same lesson as the 2.6° notch that
turned out to be a shadow crease.

---

## cp-trapezoid attempt 1 — the trapezoid is reversed, and three measurements were wrong first

**Result: the render tapers the wrong way.** Measured on the supplier's own red overlay, which *is*
the welt, so no thresholding guesswork is involved:

| | drawing | render |
|---|---|---|
| taper ratio (deep end / shallow end) | **1.15** | **1.69** |
| deeper at | **outboard** (toward the armhole) | **inboard** (toward centre front) |
| depth / run | 0.274 → 0.314 | 0.244 → 0.144 |

So the option's defining feature — the taper that makes it a trapezoid rather than a plain slanted
welt — is present but runs in the opposite direction, and is exaggerated to 1.69 where the drawing
draws a gentle 1.15. Both errors matter: a customer choosing this option gets a wedge pointing the
wrong way, and a more emphatic one than the tailor drew.

**Note on the description.** It says the welt is *"wider at the top than the bottom"*. The drawn welt
runs diagonally and tapers along its length, deeper at the outboard end — "top vs bottom" does not
describe that unambiguously and may be part of why the render chose the opposite end. This should be
restated in terms of the two ENDS of the run before attempt 2.

### Three wrong measurements before one right one — all the same error

This is worth recording in full, because the failure repeated three times in one grading and every
instance was the same mistake in different clothing.

1. **Raw threshold on the render** returned a welt depth of 139px inside a 140px crop window. It had
   saturated against its own box — navy-on-navy has almost no absolute contrast, so the threshold
   caught the whole jacket. Discarded.
2. **Raw threshold on the drawing** returned taper 2.31, deeper at LEFT.
3. **Local-contrast on the drawing** returned taper 1.18, deeper at RIGHT — disagreeing with (2) in
   both magnitude *and direction*, which is what forced the question rather than a choice between them.

The answer was that **both drawing measurements were reading the wrong part of the garment**. The crop
box sat at x 560–860, y 320–480; locating the red overlay showed the welt is at **x 693–921, y 513–630**.
Cropping and *looking* settled it in one glance: the top panel of the comparison was lapel edges, not a
welt at all.

**The rule this reinforces, now demonstrated four times in one session** (the 68° notch, the 2.6°
shadow crease, the `opt.id` diff that reported 905 phantom changes, and this): *a measurement is only
evidence once you have checked that it measures the thing you named.* Two measurements disagreeing is
not a reason to pick one — it is a signal that neither has been validated. And the cheapest validation
is almost always to crop the region and look at it.

### cp-trapezoid attempt 2 — direction corrected, and a tooling flaw found

Rewriting the description to name the **ends of the run** rather than "top vs bottom" flipped the
taper to the drawn direction. Attempt 1 put the depth at the inboard/centre-front end; attempt 2 puts
it at the outboard/armhole end, matching the drawing. Confirmed by tight crop and direct inspection.

**This is the second controlled confirmation of the prose mechanism**, on a different garment part and
a different kind of error from the jeans. There the description named the wrong *location*; here it
used a spatial frame ("top vs bottom") that does not describe a diagonal run at all, so the generator
had to guess which end — and guessed wrong. **Ambiguity in the prose is as damaging as error in it.**

Magnitude is NOT claimed. The local-contrast measurement returned "deeper at LEFT, taper 2.03" with
290 of 290 columns usable — a suspiciously perfect hit rate, and the cause is that the lapel edge runs
diagonally through the left of the measurement box, so the detector paired the lapel edge with the
welt edge. Fourth contaminated measurement on this one option. Direction is reported because it was
confirmed by eye; the ratio is not, because it was not.

**Tooling flaw: `record_generation.mjs` silently overwrote candidate-1.** It auto-increments the
attempt number from any prior `qc.json`, and no qc.json had been logged for attempt 1, so attempt 2
was also written as attempt 1 and replaced the file. Nothing was permanently lost — attempt 1's
`generation.json` was committed and carries its CDN result URL, so it is recoverable from git — but
the provenance chain (`qc.json(attempt N)` -> `candidate-N.png`) depends on QC being logged between
generations, and that dependency is undocumented and unenforced. **Log QC before regenerating, or pass
`--attempt` explicitly.**

### Pipeline ordering rule, learned the same way

A description change does **not** reach the prompt on its own. `spec.json` caches the description, so
`build_prompt` alone rebuilds from the stale copy — the rebuilt prompt came back byte-identical at
5007 chars and still contained the sentence I had just deleted. The order is
**`set_description` -> `extract_spec --write` -> `build_prompt --write`**. Skipping the middle step
produces a prompt that silently disagrees with the catalog.

---

> **Resume point: see `HANDOFF-2026-08-01.md`.** It carries the pipeline ordering rules, the nine
> prepared generations, the measured shawl and trapezoid figures, and the four items blocked on a
> human decision. It is standalone because `CONTINUE.md` is regenerated by `tools/project_state.mjs`
> and hand-written content there does not survive.

---

## CONTESTED: which way does a front pocket mouth run? — DO NOT ACT ON EITHER CLAIM YET

Two independent graders measured the same feature family and reached **opposite** conclusions. This is
recorded unresolved rather than settled, because acting on either would mean rewriting descriptions
that were already rewritten once on the other reading.

**Grader A (suit-2pc, 2026-08-01)** measured `jeans-square` and `jeans-arc` against their drawings and
reported the mouth running from a vertical drop **INBOARD to the pressed front crease** — travel 0.71
and 0.78 belt-loop pitches against drawn 0.75 and 0.78, with both mouths terminating on the crease
(x 486 vs crease 485–493; x 389 vs crease 387–393). It graded both renders **correct** on that basis,
and I rewrote the catalog prose to say "inboard".

**Grader B (trousers, 2026-08-01)** measured the same family and reported the mouth running from the
waistband **down-and-OUTBOARD into the side seam**. It fixed that direction three ways: a straight-on
two-leg front view (`165588…`, garment centre x=603) where both mouths measurably splay outward going
down; `…3181`, where the mouth converges into the side seam between y=400 and y=600; and the
observation that the relationship is mirror-invariant, so it cannot be a left-leg/right-leg artefact.
On that premise it graded `jeans-arc`, `jeans-diamond` and `slant-51-stripe` **WRONG for inversion**.

### Why this must not be resolved by picking one

Both are careful, both quantified, both stated their landmarks. They cannot both describe the same
drawings. The live possibilities:

1. **They measured different drawings.** The suit-2pc rows and the trousers rows may point at different
   sheets for the same option name — which the collision work has already shown happens.
2. **They disagree about which vertical line is the side seam.** Grader B explicitly derived the side
   seam from surrounding features (back-pocket besom, dart, fly topstitch termination); grader A
   located centre front from the shirt placket. If either identification is wrong, "inboard" and
   "outboard" swap wholesale.
3. **One of them is simply wrong**, in the same way three of my own measurements today were wrong —
   by measuring something other than the thing named.

### What settles it, and what it costs

Compare the **actual blueprint files** the two sets of rows point at — `repo-index.json` gives the
`illustration` per row — and if they are the same file, re-measure it once with the side seam
identified independently of either grader's method. Zero credits. Until then:

- **Do not rewrite the jeans descriptions again.** They currently say "inboard", per grader A.
- **Do not regenerate** `jeans-arc`, `jeans-diamond` or `slant-51-stripe` on grader B's reading.
- The three WRONG verdicts are logged with their reasoning intact and flagged CONTESTED in the ledger.

This is the session's own rule applied to someone else's measurements: **two measurements disagreeing
is not a reason to pick one — it means neither is validated.** The cheapest validation is to go back to
the artefact and check it measures the thing it names.

### Not contested, and actionable now

The other trouser findings do not depend on the direction question at all:

- **`watch-right-welt` and `watch-right-besom` show the BACK pocket, not the watch pocket.** Both have
  a dart running from the waistband into the pocket top (back-panel construction, absent from any
  trouser front), no fly anywhere in frame, and pocket lengths of 0.73 and 0.77 of belt-loop pitch
  against the drawn watch pocket's 0.28 — matching the base drawing's *back besom* at 0.74.
- **`watch-both` is not a watch pocket at all** — a flap 6.1x the waistband depth where the family's
  watch pockets run 0.44–0.66, and with no opening of any kind. Its own sibling
  `watch-diamond-flap` renders one at 0.77, so a correctly scaled flap exists in the set.
- **`slant-20` and `slant-20-stripe` are the wrong width** — 0.403 and 0.324 of belt-loop pitch against
  a drawn 0.178, i.e. 2.3x and 1.8x, landing on the wrong rung of their own ladder.

**Legacy defect rate is now 32.4% across 37 graded**, up from 16% at 25. The trouser family is
substantially worse than shirts or waistcoats, which is worth knowing before estimating the remaining
315.

### CONTESTED — first hypothesis eliminated (zero credits)

The two graders did **not** measure different sheets. The blueprints are **byte-identical across all
three products**:

| option | suit-2pc | suit-3pc | trousers |
|---|---|---|---|
| `jeans-arc` | `a00255f5` (3135) | `a00255f5` | `a00255f5` |
| `jeans-square` | `5ba98d61` (3133) | `5ba98d61` | `5ba98d61` |
| `jeans-diamond` | `52b5f3bd` (3134) | `52b5f3bd` | `52b5f3bd` |
| `jeans-round` | `32be84ad` (3136) | `32be84ad` | `32be84ad` |

Same files, opposite conclusions. Three possibilities reduce to one question:

> **Which vertical line in `3133`–`3136` is the SIDE SEAM, and which is the pressed front crease?**

Grader A located centre front from the shirt placket in the RENDER and reasoned inward from there.
Grader B identified the side seam in the DRAWING from surrounding construction — a back-pocket besom
with a dart above it on the far panel, the waistband end, a fly topstitch terminating mid-length —
then cross-checked against a straight-on two-leg front view. **If either identification is wrong,
"inboard" and "outboard" swap wholesale and every dependent verdict flips with them.**

Grader B's evidence is the more direct: it reads the drawing itself rather than inferring from the
render, and it carries an independent control view. But that is an argument about method, not a
measurement, and this file does not record arguments as findings.

**Next step, still zero credits:** open `14975407461c__3133.jpg` and identify the side seam from the
garment's own construction — the seam running the full length of the leg with no waistband
termination, against the pressed crease which starts AT the waistband seam and runs to the hem. Those
two are distinguishable in the drawing without reference to either grader's reasoning. Everything else
follows from it.

---

## CONTESTED DIRECTION: RESOLVED — and against my own earlier fix

A third grader settled it independently, from the drawing rather than from any render:

> Sibling drawing **`3130`'s red highlight sits exactly on the full-height vertical line**, which proves
> that line is the **SIDE SEAM**, not a pressed front crease. The template is a **rear-three-quarter
> view**: front panel with the graded slant pocket mouth on the left, side seam, then back dart +
> horizontal jetted **back** pocket on the right.

That is decisive because it does not infer the seam from the photograph at all — it uses a *sibling
drawing whose graded feature IS the seam* to label the line. Two independent graders (trousers,
suit-2pc) now agree the full-height vertical is the side seam, and both note the back-pocket furniture
that only a rear-three-quarter view would contain.

**Grader A was wrong, and so is the catalog prose I wrote on its reading.** It reported the mouth
running "inboard to the pressed front crease" — but what it identified as the pressed crease is the
side seam, and the drawing is not a front view. `jeans-square` and `jeans-arc` descriptions currently
say the mouth "sweeps inboard", which now looks backwards.

**What must NOT be concluded from this:** that the jeans renders are wrong. Grader A measured *travel
of 0.71 and 0.78 belt-loop pitches against drawn 0.75 and 0.78* — those magnitudes are landmark-
normalised and stand regardless of which end is called inboard. It is the *naming* that inverted, not
necessarily the geometry. The renders may still match; the prose describing them does not.

**Next action, zero credits:** re-read `3133`–`3136` with the side seam fixed by `3130`'s highlight,
restate the jeans descriptions in terms of *"from the waistband down to terminate ON the side seam"*,
then re-measure the two renders against that frame before regenerating anything.

### What the slant cm figures actually mean

Established in the same pass, and previously unknown: **the `N cm` in "2.0 / 2.5 / 3.2 / 5.1 cm Slant
Pocket" is the horizontal offset of the mouth's TOP CORNER from the SIDE SEAM.** Measured on a
registered common frame: 58 / 64 / 92 / 184 px against a 104 px waistband depth — 0.56 / 0.62 / 0.89 /
1.77 waistband-depths. The ladder is self-validating (drawn travels 79 px and 198 px, ratio 2.51,
against labels 5.1/2.0 = 2.55).

**Anyone regenerating the slant family needs this**, or they reproduce the `quarter-top` failure —
which rendered a soft pressed fold with no bartack, no corner and no stitched mouth edge at all.

**Also established: 2.0 vs 2.5 cm differ by 6 px on a 104 px waistband — about 6% of a waistband
depth. No photograph will resolve that.** Another merge/reprice candidate, alongside `round-53`.

## Duplicate assets are far worse than the collision tool reported

`tools/image_collisions.mjs` counted 208 rows across 24 same-field collisions. The graders found
single files serving far more:

- `4660e3dc…` — **13** lower/chest-pocket options (`lp-patch`, `cp-patch`, `lp-patch-flap`,
  `lp-patch-rounded`, all three `lp-patch-btn-tab-*`, `lp-water-drop`, …)
- `c24c7c80…` — **all six shawl rows**, including `lapel-shawl-asymmetric`. One photo cannot be right
  for "Asymmetric Shawl Collar" and "Shawl 0A" at once.
- `0afb0647…` — `cp-jetted` + `cp-trapezoid` + `cp-welt-23/25/27`
- `e18953…` (11 lapel options), `d159c25f…` (11), `d1ca0f96…` (10)

Several are **mutually exclusive by construction**. This needs a repo-wide hash audit rather than
option-by-option review — `image_collisions.mjs` should be re-run and its scope questioned, since it
evidently under-counts.

## Live defect: manufacturing markup inside a customer-facing photograph

`lbh-milanese-20` has the tech pack's **red circled ①②③ annotation baked into the shipped image**.
Accurate as a depiction of the drawing, and the colour-segment proportions match to within a few
percent — but circled numerals are manufacturing documentation, not garment. The prompt's
ANNOTATIONS-ARE-NOT-THE-GARMENT clause exists precisely for this and did not reach this legacy image.

## The lapel buttonholes are the best work in the catalog

Eight options, each with a **unique file**, each reproducing its drawing's measurable signature:
`lbh-pinpoint` L/W 5.77 vs 5.63 · `lbh-lumi` sagitta/L **+0.150 vs +0.151** · `lbh-milanese-curved`
**−0.131 vs −0.131**. The two arc options carry *opposite curvature signs* in both drawing and photo,
so they are genuinely discriminable. This is what the rest of the catalog should look like.

One trap caught mid-flight, exactly per this project's own discipline: on `lbh-017-hand` an automated
mask returned eye/bar = 2.6 by latching onto lapel shading around the eye; hand-measuring the stitch
envelope off a 4× grid gave 1.73 against the drawing's 1.60. **The automated number would have
produced a spurious rejection.**

### `image_collisions.mjs` under-reports, and the cause is structural

Verified: the tool partitions results into `sameFieldCollisions` (24 entries, largest group **10**
options) and `crossFieldCollisions` (6 entries, largest **7**). A grader hashing the actually-served
`.webp` files found one file (`4660e3dc...`) serving **13** options spanning BOTH `chest-pocket` and
`lower-pocket`.

**It partitions by field and never unions across the partition.** A group that straddles two fields is
split into a same-field fragment plus a cross-field fragment and is never seen whole, so the true
blast radius of any one duplicated file is systematically under-stated.

My own earlier summary compounded it: I reported the **208 same-field rows** as though it were the
total, when cross-field collisions were sitting in a separate bucket the whole time. The stated
figure was not wrong, but the framing was - it was a partition, presented as a census.

**Fix:** group by file hash FIRST, across the entire in-scope catalog, and only then describe whether
a group is same-field, cross-field or mixed. Field is an attribute of a collision, not a way to
partition the search. Until that lands, treat every collision figure in this file as a floor.

### RETRACTION — my diagnosis of `image_collisions.mjs` was wrong

The previous section claimed the tool under-reports because it "partitions by field and never unions
across the partition". **That is not the cause, and I asserted it without measuring it.**

I built `tools/asset_duplicates.mjs` to group by file hash first — precisely the fix I had proposed —
and it found **10 groups, 46 options, 138 rows, and ZERO cross-field groups**, with a largest group of
10 options: the same as the tool I had criticised. The prediction failed.

The real difference is **scope filtering**. Checking the grader's specific example:

| option | inScope | sha1 |
|---|---|---|
| `lp-patch` | **Y** | `f7fa88b7` |
| `cp-patch` | **n** | `f7fa88b7` |
| `lp-patch-flap` | **Y** | `f7fa88b7` |
| `lp-patch-rounded` | **Y** | `f7fa88b7` |
| `lp-water-drop` | **n** | `f7fa88b7` |

The grader hashed every file on disk and counted all 13 options sharing it. Both `image_collisions.mjs`
and my new tool count only `inScope` rows, which drops `cp-patch` and `lp-water-drop` — and with them
the cross-field spread. The two counts answer **different questions**, and the in-scope count is
arguably the right one: an out-of-scope option carries no photography obligation.

So `image_collisions.mjs` is not defective in the way I described, my "208 rows presented as a census"
self-criticism was also misplaced, and the corrective commit that preceded this one is wrong on its
central claim.

**Third time today I have asserted a diagnosis without measuring it** — after the 68° notch and the
`opt.id` diff. What caught it this time was building the tool to test the hypothesis rather than
acting on the hypothesis directly. That is the cheap version of the same discipline: *when you think
you know why something is wrong, measure the why before you write it down.*

### What IS real, and unchanged

The collisions themselves. Within `lower-pocket` alone, `lp-patch`, `lp-patch-flap` and
`lp-patch-rounded` — three options that must look visibly different — ship one identical photograph.
`cp-welt-23/25/27` + `cp-jetted` + `cp-trapezoid` share another. Ten peak-lapel options share a third.
**46 in-scope options across 138 rows are showing customers a photograph that belongs to a sibling.**

`tools/asset_duplicates.mjs` is kept: hash-first grouping is a clearer way to see blast radius even
though it did not find what I expected, and it reports fan-out separately (256 files where one option
recurs across products — legitimate, and the thing that makes the catalog affordable).

### A THIRD indistinguishable pair, and a drawing that may itself be misfiled

From the waistcoat hem-shape grading (2026-08-01):

**`vest-bottom-small` cannot be graded at all.** Normalised to button pitch and to the centre-front
notch, `vest-bottom-small.jpg` and `vest-bottom-regular.jpg` describe the SAME point: depth below the
notch **0.437 vs 0.423** pitch, half-angle **45.0° vs 43.7°**, peak at 0.5 vs 0.4 pitch from CF. A 3%
spread is inside reading error, so the drawing does not define what "small" means.

Third unresolvable pair, after `round-53`/`large-round-53` and slant `2.0`/`2.5` — and unlike those
two, here **the shipped photos also read backwards against the labels**: Small measures 0.565 pitch
deep against Regular's 0.373, so the "small" point is the deeper one.

**`vest-bottom-point`'s drawing may be the wrong artifact, not the photo.** Its hem traces as a single
monotonic arc — 40 px sag across 1200 px, no notch, no tip, within 3 px of `vest-bottom-straight.jpg` —
while the photo shows a sharp double point. But the drawing is a **double-breasted 8-button figure** in
a hem family whose other four members are all single-breasted, and across all eight vest drawings its
nearest neighbour is **`db-8x4.jpg`** (mean absolute difference 15.6, against 27–32 for the round and
pointed hem drawings). **Verify the source illustration before spending a credit regenerating.**

This is the second time today the *drawing* rather than the render was the suspect artifact — the first
being the `jacket/front-style/` field, 13 files with 13 triage failures. Worth checking a drawing's
provenance whenever a photo contradicts it on a feature the photo had no reason to invent.

**Method note the grader recorded against itself:** an earlier reading that Small's point was much
deeper came from measuring down from the *image crop edge*, which is not a garment landmark. It was
discarded rather than reported — the same discipline that caught four bad measurements elsewhere today.

---

## The collar-stitching family is ungradeable at source — and a rule that did NOT transfer

Twelve shirt options graded 2026-08-01: **1 WRONG, 1 OK, 10 UNSURE** — and the UNSURE verdicts are
almost entirely **source-data defects, not photo quality**. This is the first family where the
drawings, not the renders, are the binding problem.

### Duplicate drawings — seven options covered by three files

| | |
|---|---|
| `machine-01cm-top` ≡ `machine-03cm-top` | **byte-identical**, md5 `8e910bc6…`, 8241 bytes each |
| `machine-05cm-top` ≡ `machine-06cm-top` | **byte-identical**, md5 `7a75c65c…`, 8227 bytes each |
| `rolled-stand-collar` ≈ `one-piece-collar-in-75cm-with-tab` | mean abs diff **1.64/255**; the only differing pixels are 1px shifts on the CF seam |
| … ≈ `one-piece-collar-in-8cm-with-tab` | 2.93/255 |

### Printed callouts contradict their own labels in 4 of 7 stitching drawings

| row label | drawing prints |
|---|---|
| 0.1 cm Top | **0.3cm** |
| 0.6 cm Top | **0.5cm** |
| 0.1 cm AMF | **0.6cm** |
| 0.3 cm AMF | **0.1cm** |
| 0.5 cm AMF | **nothing at all** |

### The rule that did not transfer, and was tested rather than assumed

Earlier grading established that shirt-collar **angle** callouts genuinely describe drawn geometry
(`french-in-8cm` prints 145°, measures 151°). The obvious move is to extend that trust to the stitch
offsets. **It does not hold.** Measured drawn offset of the red stitch line from the collar edge, right
leaf, all normalised to 192×192:

| printed | 0.1 cm | 0.3 cm | 0.5 cm | 0.6 cm |
|---|---|---|---|---|
| drawn offset | 4 px | 4 px | 5 px | 4 px |

No proportionality. **These drawings do not encode their dimension to scale**, so the offset — the only
thing separating seven of these options — is unmeasurable from either artefact. The grader tested the
transfer instead of assuming it, which is the same discipline that caught four bad measurements
elsewhere today.

### Two drawings that appear mis-filed, worth escalating on their own

- **`button-down-collar-with-78cm-stand.jpg` draws no button-down.** At 16× raw-pixel zoom neither leaf
  carries a button; the only button is a throat button on the band. The convention is verified inside
  the family — `point-in-7cm-with-button.jpg` draws a distinct circle on *each* leaf at identical scale
  — so the absence is real, not a resolution artefact. A file named `button-down-collar` that draws no
  button-down is a source defect. Also: **7.8 cm is not a plausible collar-stand height** (real stands
  run 3–4.5 cm), so that figure looks like a point length mis-filed as a stand.
- **`one-piece-collar-in-75cm-with-tab.jpg` draws no tab and no collar leaves.** Its own length-siblings
  (`-85cm`, `-9cm`) are visibly different artwork with a different viewpoint.

### Photo-side defects logged separately

- `collar-point-85-btn` — a button on the **left** point and a bare **right** point. Not a real garment,
  whichever way the drawing is read.
- `stitch-03-amf` — renders the drawings' **red annotation colour as actual red thread**, while all seven
  siblings are tonal. Thread colour is a separate option group, so a customer reads this as a
  thread-colour choice rather than a stitch-offset one. Second instance today of annotation literalised
  into a product image, after `lbh-milanese-20`'s circled ①②③.
- Neckties conceal the collar band in `collar-point-85-btn` and `collar-button-down-78`.

**Consequence for planning:** these seven stitching options cannot be separated by any photograph until
the supplier provides drawings that encode the offset. That is a **fifth** merge/reprice candidate group,
and the largest — bigger than `round-53`, the slant pair, and `vest-bottom-small` combined.

---

## Two whole waistcoat fields are unshot — collar bands and canvas grades

Twelve suit-3pc options graded 2026-08-01: **8 OK, 4 WRONG**. The four failures fall into two clusters,
and in both the *entire discriminating feature of the option* is missing from the photograph.

### The collar-band options have never been photographed with a collar band

`lapel-collar-stand` and `shawl-collar-stand` are defined by a standing band across the back neck, and
the drawings encode it cleanly enough to test numerically. Sampling the **centre column x=600**:

| drawing | ink runs at x=600 | reading |
|---|---|---|
| `lapel-collar-stand` | **two** — y44–51, then y111 onward | band, 59 px gap |
| `shawl-collar-stand` | **two** — y70–78, then y109 onward | band, 30 px gap |
| `notch-lapel-vest` | one, from y75 | no band |
| `peak-lapel-vest` | one, from y69 | no band |
| `shawl-lapel-vest` | one, from y68 | no band |

A clean binary across five drawings, with the measured runs confirmed by cropping to be the band edges
named. **Both photographs show no band at all** — the shirt collar sits free around the entire neck and
the waistcoat's top edge stops at the shoulder, matching their no-band siblings exactly.

**This is not a crop.** The neck and shirt collar are fully in frame at exactly the height a band would
occupy. Two customer-facing options are showing the picture of a different option.

### The canvas grades have collapsed into one construction

`vest-canvas-half` and `vest-canvas-uncon` both ship photographs of **full hand-canvassed
construction** — dense diamond pad-stitching on floating linen with raw edges.

- **half** — the drawing terminates the chest canvas *above* the welt pocket, with a separately
  labelled material below carrying its own leader line. The photo runs identical canvas continuously
  past the pocket to the frame edge. Canvas that never terminates is full canvas.
- **uncon** — measured ink density over one identical column (x640–860, verified by overlay to sit on
  the interlining zone rather than the outline) puts it **lowest** of the three through the chest:
  **0.11–0.25** against half's 0.34–0.45 and full's 0.40–0.53. The drawing gives this option the least
  interlining of the set; the photo gives it a pad-stitched chest piece over full-length floating
  canvas.

**That makes three of the four canvas options wrong the same way** — `vest-canvas-single` already
failed for showing hand pad-stitching on a fused option. Pad-stitching is the signature of canvassing,
so a generator that reaches for it by default will fail every non-canvassed grade in the field.

Both are medium confidence *for a stated reason*: the drawings' Chinese hatch-legend callouts are
illegible at source resolution, so the fills cannot be decoded by name. The verdicts rest only on
legend-free structural facts — presence or absence of the material boundary, and relative ink density.

### Method notes worth keeping

- The red-blob buttonhole detector was **validated against controls in its own batch** — returning
  exactly 0 on `vest-lapel-bh-none`, 1 on `-left`, 2 on `-left-two` — before any count was trusted.
- An automated neck scan was **discarded mid-way** after checking it was picking up chin shadow and
  beard rather than vest fabric. The band findings rest on the drawing-side column measurement plus
  direct high-zoom inspection instead.
- On `vest-lapel-bh-left-two` the normalised buttonhole spacings (drawing 0.030 of canvas height, photo
  0.056) were explicitly **not** treated as evidence, because the two framings differ in scale with no
  shared landmark spanning both.
- All five neckline photos were confirmed to be **waistcoats** — topstitched armhole with a shirt sleeve
  behind — despite living under `/images/generated/jacket/`.

---

## Two buttonhole options ship a bare lapel — and two near-miss measurements caught in flight

Twelve sport-coat options graded 2026-08-01: **9 OK, 3 WRONG**.

### `lbh-no1-dc-straight` and `lbh-no1-tc-arc` have no buttonhole at all

Both shipped photographs are a **clean navy notch lapel** — which is precisely what the *sibling*
option `lbh-none` ("Clean lapel, no buttonhole") calls for. Verified three independent ways: full-frame
inspection, a 950 px zoom on the whole lapel panel, and a saturated-pixel scan whose only components
resolve to skin, background and collar — nothing on the lapel face. The same scan isolates
`lbh-rome-18`'s buttonhole cleanly as a 6354 px component, so the method detects one when present.

**Both files are unique on disk, so both are regenerable.** What a replacement for `lbh-no1-tc-arc`
must show is unusually well specified by its drawing and worth recording: an arch-up arc (signed
sagitta/chord **+0.153** over a 707 px run), keyhole eye at the **right**, closed bar at left, and a
three-zone scheme where **the outer two zones match** (green) separated by a single contrasting pink
band at **0.36–0.53** of the run. That flanked-band signature is the option's whole identity.

### The lapel-buttonhole family is otherwise the best work in the catalog

Nine of twelve reproduce their drawing's measurable signature closely — `lbh-rome-18`'s colour
transitions land at 0.54/0.71 against a drawn 0.54/0.72; `lbh-undivided`'s heart-head flare begins at
0.69 against 0.70 drawn with the flare ratio within 10%; `lbh-glory-rays` has exactly five star points
in both. Every one has a unique file.

### Two measurements that would have produced wrong verdicts, caught by checking extent

Both are the session's recurring lesson in a new form — **a measurement taken over the wrong *span*
rather than the wrong *object***:

1. **`lbh-arc-double`** — the first pass captured only 514 px of a 716 px run, because the pink half
   renders faintly and fell below threshold. That put the drawn colour boundary at **0.60**, implying a
   12% error against the photo's 0.48. Re-measured over the validated full extent the drawn boundary is
   **0.47** — near-exact agreement, not an error.
2. **`lbh-milanese-25`** — the first photo pass returned sagitta **+0.110** because the mask latched onto
   only the saturated pink portion and missed the pale left third. The corrected full-run figure is
   **−0.111**. A **sign flip**, which would have failed a correct image for arcing the wrong way.

The fix in both cases was to check the extracted component's bounding box against the visually confirmed
run before trusting the number. Worth adding to the standing discipline: *validate the span, not just
the target.*

### Red-markup literalisation checked and NOT found here

Given `stitch-03-amf` and `lbh-milanese-20` both baked drawing annotation into product images, this
grader checked specifically. Across this supplier set the drawn thread is variously green, gold, violet,
blue and pink, so coloured thread here is a **genuine sample colour, not the highlight convention**, and
the circled ①②③ markers are separate high-chroma components well clear of the stitch run in every case.
The concern is real but does not generalise to this family.

---

## RETRACTION: the founding measurement lesson of this project was itself mis-measured

This project's most-cited rule — *"a number in a label is not a measurement of the drawing"* — originated
in `lapel-notch-68`, where the label's 68° was said to be contradicted by a drawing measuring **39.8°**.
Four generations were spent on that reading.

**The 39.8° was measuring the wrong feature.** Re-measured at 9× on a fine grid:

| | `lapel-notch-45` | `lapel-notch-68` |
|---|---|---|
| notch vertex | (812, 331) | (833, 321) |
| collar tip | (849, 304) | (856, 298) |
| lapel tip | (856, 345) | (880, 350) |
| **notch chord opening** | **53.8°** | **76.7°** |
| gorge seam inclination | 35.4° | **38.4°** |

The 39.8° reproduces as the **gorge seam inclination** (38.4° here), a different feature entirely.

**And the labels are correct.** The two notch openings differ by **22.9°** against a label difference of
**23°**, and both sit at exactly **label + 8.8°** — a constant offset attributable to the chord method
(measuring tip-to-tip rather than along the seams). The drawings share one template, confirmed by
collar-top y = 47/43 and bottom-point y = 1154/1153, so the comparison is clean.

### What this changes, and what it does not

**Changed:** the specific claim that `lapel-notch-68`'s label contradicts its drawing is **withdrawn**.
The label names the notch opening and the drawing agrees with it. Any plan to "correct" that option
toward 39.8° would have made it wrong.

**Not changed:** the *lesson* drawn from it was right, and is if anything better supported now — the
failure was always **measuring the wrong feature and naming it as though it were the right one**. That
is the same error as the 139 px depth in a 140 px box, the two drawing measurements that read lapel
edges instead of a welt, and the `opt.id` diff that compared unrelated rows. It is now confirmed to
have been the error in the founding case too.

The corrected form of the rule: **before concluding a label contradicts a drawing, verify you measured
the feature the label names.** The original phrasing generalised from a case that did not support it.

### The same trap caught a second time in the same option

The grader's own first read of the `lapel-notch-68` photo gave a "narrow ~20° slit" — which is the
documented shadow-core-inside-the-fold trap, recorded earlier in this file from an identical 2.6°
reading. A gaussian-smoothed gradient edge map resolved the true V at **63–69°**, matching the drawing.
An automated wedge-width fit returned *negative* openings (−0.6°) and was discarded as invalid.

Three independent methods, two of them wrong, one validated by agreeing with an independent
measurement of the drawing. That is the discipline working.

### Minor, logged for the record

- `quarter-canvas`: the label says "Quarter Canvas" but the illustration is titled **`Single_layer`**
  and carries no quarter/half/full callout, so **no extent claim is recoverable from it**. Label and
  drawing describe different attributes.
- `lapel-notch-68`: label says "Curved Gorge" but the drawn gorge seam is **straight** (≤1 px deviation
  over 111 px). The drawing governs, so the photo is not required to show a curve.
- The cuff-button drawings are **schematic, not to scale**: `cb-3`'s three holes span 97% of the drawn
  sleeve width where a real 3-button cuff spans ~33%. No button diameter is recoverable from them.
  Counts are gradeable; sizes are not.

---

## The retry queue splits 7/7 — and the second half must not be regenerated

The 14 `failed-retry-due` options were read individually rather than re-run as a batch. They divide
cleanly, and the division is the finding.

### 7 correctable — single-option geometry errors, all on attempt 1

| option | what went wrong |
|---|---|
| `suit-2pc/welt-pocket` | welt rendered **90° from the drawing** — the reference marks a tall narrow *vertical* rectangle |
| `trousers/coin-both` | **aspect ratio inverted** — drawn markers are 151×126 and 148×125, i.e. ~1.2:1 landscape; render came back portrait. Patch/bag depth ratio 0.42 against a drawn 0.20 |
| `suit-2pc/quarter-top` | mouth rendered **near-horizontal**; a three-way zoom of the drawings confirms it is slanted |
| `suit-2pc/jeans-square` | the drawn mouth is an **open path**; the render closed it into a quadrilateral panel and read as a stitched-on patch |
| `shirt/collar-hexagon-stand` | the defining **stepped hexagonal leaf outline is entirely absent** |
| `suit-2pc/pocket-stitch-015` | framing — a 0.15 cm hairline topstitch spans **roughly one pixel** in a wide hip shot |
| `suit-2pc/pleat-no-single-dart` | darts **not distinguishable from the pressed leg creases** |

All seven have corrections applied and pass the pre-flight gate. These are worth credits.

### 7 saturated — a measured generator limit, not a prompt defect

These are all on **attempt 2** and all fail the same way. The clearest statement is
`lp-straight-jetted-60`'s:

> Round 2 remains ambiguous against BOTH neighbours (0.39 vs 5.5 at 0.40 and 6.5 at 0.41) — **the model
> saturates near d/W 0.40 for every rung at or above** that value.

That is a *measurement of the generator*, not of the garment. The flap-depth ladder compresses toward a
ceiling, so 5.0 / 5.5 / 6.0 / 6.5 cm all land within 0.01–0.02 of each other however the prompt is
phrased. `lp-slanted-flap-55` reports the same shape: round 2 cleared the lower boundary decisively
(0.42 vs the 5.0 sibling's 0.38) but is **ambiguous against the 6.0 sibling** (0.42 vs 0.41–0.44).

| option | failure |
|---|---|
| `suit-2pc/lp-straight-jetted-50` | cleared the lower boundary, ambiguous against the shipped 5.5 |
| `suit-2pc/lp-straight-jetted-60` | ambiguous against **both** neighbours; saturation stated explicitly |
| `suit-2pc/lp-slanted-flap-55` | cleared 5.0, ambiguous against 6.0 |
| `trousers/jeans-diamond` | MATCHED PAIR GATE — indistinguishable from its arc sibling |
| `trousers/jeans-arc` | MATCHED PAIR GATE — same pair, other side |
| `trousers/watch-right-welt` | MATCHED PAIR GATE — indistinguishable from the besom sibling |
| `trousers/watch-right-besom` | MATCHED PAIR GATE — same pair, other side |

**This is exactly the case the plan reserved a ruling for:** *"where it still fails, the answer is a
merge/reprice recommendation, not annotating false numbers onto identical photos."* Three attempts have
now been spent establishing that the top of the flap-depth ladder is not photographable at this
generator's resolution. A fourth would buy another measurement of the same ceiling.

Note the contrast with the jeans pair that *was* recovered: `jeans-arc` vs `jeans-square` separated
cleanly once their prose was corrected (inboard travel 0 → 0.71 and 0.78 against drawn 0.75 and 0.78).
`jeans-arc` vs `jeans-**diamond**` is a different pair and does not separate — so "the jeans pockets
were fixed" is true of one pair and false of another. Worth stating precisely, because the earlier
success invites over-generalising.

**Recommendation to the owner, not a decision taken:** merge or reprice the flap-depth rungs at and
above 5.0 cm, and the two matched pairs. Each retains its own catalog row and price today while showing
a photograph a customer cannot tell from its neighbour's.

---

## The 8 UNMET options triaged by CAUSE — only two are worth another credit

`UNMET` means the retry budget ran out without reaching the bar. Treated as one bucket it looks like
eight failures of the same kind. Read individually, they have five distinct causes, and the cause
decides the remedy. Only two are worth spending on.

### 1 — Genuinely has an attempt left (1 option)

**`shirt/stitch-01-inner-plain`** — stopped at **attempt 2 of a hard cap of 2**, while this project's
confirmed budget is **three**. It is a full attempt short, exactly the case the plan flagged. The fault
is specific and unambiguous: the placket is topstitched on **both** edges where the option is a single
inner row, resolved at 8× tone-mapped magnification as two parallel runs of stitch perforations
flanking the button line. Worth one more generation.

### 2 — Specific untried correction (1 option)

**`suit-3pc/coin-left`** — the coin pocket is stitched closed on all four sides, reading as a sealed
patch. The drawing's outline is a **U: bottom edge and two vertical sides only, open at the top.** The
correction is concrete and has not been tried in that form — *stitch only the bottom and the two sides;
leave the top as an open, lightly relaxed mouth with a whisper of pocketing visible inside.* Scores are
otherwise strong (placement 97, symmetry 96, angles 96). Worth one generation.

### 3 — Model-prior saturation (1 option) — do NOT respend

**`suit-2pc/hem-single-turnup`** — eight of nine categories at 95–99, blocked solely on `dimensions`
93. The band measures **27% of hem opening width against the blueprint's 21%**, and QC's own note is
decisive:

> Model prior appears fixed at a deep cuff and did not respond to three progressively more explicit and
> quantified depth instructions, **including an explicit one-fifth ratio**.

Three escalating instructions produced no movement. This is the same failure shape as the flap-depth
ladder saturating at d/W 0.40. A fourth attempt with the same approach buys another measurement of the
same prior.

### 4 — Source/blueprint limit (2 options) — needs a drawing, not a credit

- **`shirt/collar-small-sq-50`** — the tips must be a flat terminal facet with two corners; they render
  as a converging vertex with a 6–8 px radius. QC states the limit rather than resolving it: at
  **232×244 the blueprint is roughly 1 px = 3.5 mm**, which cannot specify a square tip. Half the named
  defect *was* fixed (leaf length), so the pipeline is working; the drawing simply does not carry the
  information.
- **`sport-coat/quarter-canvas`** — attempt **4**, two majors on the canvas termination line. Compounded
  by a documented source mismatch: the illustration is titled **`Single_layer`** and carries no
  quarter/half/full callout at all, so the label and the drawing describe **different attributes**. No
  extent claim is recoverable from this sheet.

### 5 — Regression whack-a-mole and semantics (3 options)

- **`shirt/collar-sq-65-btn`** — *"The named defect is fixed outright, and verified by pixel diff rather
  than impression. A NEW DEFECT APPEARED IN THE SAME PASS: the spread dropped to 70° where its own
  blueprint prints 80.00."* Fixing the tip broke the spread. Worth attempting once more **only with the
  previously-correct spread added to `lockedFeatures`**, which is precisely what that field exists for.
- **`suit-2pc/back-left-patch`** — the render shows **two** pointed patch pockets and *the drawing also
  draws two*, but the option is "**Left** Pointed Patch Pocket". Everything about the pocket's own shape
  locks (point angle, depth ratio, lateral position). This is not a rendering failure — it is the same
  **left/right semantics question already open on the coin pocket**: does a sheet drawing both sides mean
  "both" or is it showing placement for a single-side option? **Owner ruling, not a credit.**
- **`suit-3pc/vest-chest-both-besom`** — *"Count is right; both previous faults persist and a new
  compositional one has appeared."* Also already logged as a live-image WRONG for cropping one of two
  besoms out of frame.

### Summary

| remedy | options |
|---|---|
| **generate again** (2) | `stitch-01-inner-plain`, `coin-left` |
| **generate with locked features** (1) | `collar-sq-65-btn` |
| **needs a better drawing** (2) | `collar-small-sq-50`, `quarter-canvas` |
| **owner ruling on left/right semantics** (1) | `back-left-patch` |
| **saturated — stop spending** (2) | `hem-single-turnup`, `vest-chest-both-besom` |

Treating all eight as "retry exhausted, move on" would have written off two options that are one
generation from shipping. Treating all eight as "try harder" would have burned credits on a fixed model
prior and on two drawings that do not contain the answer.

---

## Retry wave: 7 corrected options generated and graded — the corrections worked

3.5 credits. All 7 generated; 6 graded before the session limit stopped the seventh
(`trousers/coin-both`, image on disk, grading owed).

**Five of six had their specific named fault fixed, and all six went from carrying criticals to
carrying none.** That is the headline: before this wave every one of these options was depicting the
wrong thing. Now they depict the right thing with dimensional imperfections.

| option | prior fault | fixed | min score | crit / major |
|---|---|---|---|---|
| `pleat-no-single-dart` | darts read as leg creases | **yes** | **93** | 0 / **0** |
| `quarter-top` | mouth near-horizontal, should slant | **yes** | **93** | 0 / 1 |
| `welt-pocket` | welt rotated 90° from the drawing | **yes** | 82 | 0 / 2 |
| `jeans-square` | open mouth closed into a panel | **yes** | 80 | 0 / 1 |
| `collar-hexagon-stand` | stepped hexagonal outline absent | **yes** | 74 | 0 / 3 |
| `pocket-stitch-015` | hairline spanned ~1 px | **no** | 10 | 2 / 4 |

`pleat-no-single-dart` came back with **zero critical and zero major findings** — only minors, at min 93.
It is the closest thing in the queue to shippable and needs a 95 on two categories, not a re-shoot.

### `collar-hexagon-stand` — the fault fixed, a *different* axis exposed

The defining stepped hexagonal outline is now present on both leaves and measurable: tip → straight run
inboard → sharp apex vertex → steep descent, with the apex a genuine vertex (rounding cuts 0.014 S off
the ideal corner against 0.016 S in the drawing). Notch position inside the leaf's own frame lands at
(0.343, 0.372) against (0.367, 0.380) drawn — within 7% and 2%.

What is wrong is **attitude, not shape**: the whole leaf sits 9–10° steeper than drawn, confirmed three
independent ways (outer-edge upper segment 45° drawn vs 54° rendered; lower segment 68.6° vs 79–82°;
tip-to-notch run 14.6° vs 23.5°, the last fitted over 146 and 166 columns with residual sd 0.27 and
0.51 px). The grader separated those two things explicitly, which is what makes the next correction
cheap: keep the outline, change only the set of the leaf.

Also worth keeping: the render is **more symmetric than its own drawing** (L/R notch offsets differ by
0.5% against the drawing's 19%), and `spec.json` explicitly requires mirrored leaves — so here the
drawing must *not* be copied literally.

### `pocket-stitch-015` — the framing fix worked and the feature vanished

The macro correction did what it was told: waistband depth went **146 px → 242 px**. And the render
then dropped the topstitch **entirely** — a perpendicular cross-section averaged over 650 samples along
a rectified mouth line (fit rms 0.53 px, 305 inliers) contains exactly one feature, and it is not a
stitch. The photograph is now indistinguishable from its `pocket-stitch-none` sibling in the same field.

Two further defects appeared in the same pass:

- **A mannequin.** A smooth seamless cream torso with a hard shoulder edge, no weave, no seams, no body
  — while the prompt says *"worn on a male model"* and lists *"mannequin"* as an explicit negative.
- **The cloth actively hides the feature.** Along-line FFT gives a weave cell of **4.1–4.5 px**, about
  **0.07 cm** at this frame's scale — an open basket/hopsack. The option's subject is a **0.15 cm**
  hairline. A weave whose cell is half the width of the feature cannot show it.

**New rule, and it generalises beyond this option:** for any sub-millimetre feature the *cloth* is a
harder constraint than the framing. Specify a fine, flat, tightly-woven worsted — not merely a closer
camera. Zooming in on hopsack magnifies the weave along with the stitch and nets nothing.

This is the third distinct mechanism by which a "fix one thing" correction has broken something else
(after `collar-sq-65-btn`'s spread dropping to 70° when its tip was fixed, and `vest-chest-both-besom`
acquiring a new compositional fault). The remedy is already built and under-used: **put what currently
works into `lockedFeatures` before correcting anything else.**
