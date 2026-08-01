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
