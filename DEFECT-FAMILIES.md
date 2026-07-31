# DEFECTchest-pocket/straight-welt-2-3cm.svg FAMILIES — decision document

_Generated 2026-07-30. Machine-readable companion:
`public/images/reports/defect-family-evidence-2026-07-30.json`._

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

- `` draws the welt as a single arc **stroke with no enclosed
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
