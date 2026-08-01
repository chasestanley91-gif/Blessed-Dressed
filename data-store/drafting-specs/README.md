# Drafting Specifications — THE LAW of the craft-option catalog

_Recorded 2026-08-01. Authored by the brand owner in-conversation; transcribed verbatim._

## Authority ruling (user, 2026-08-01)

> **"Those descriptions should be law and illustrations and other descriptions should aid not direct."**

This inverts the previous hierarchy ("the tech-pack illustration is law") everywhere a spec exists.
The authority order is now:

1. **The drafting specification in this folder** — governs geometry, dimensions, angles,
   construction. Conflicts resolve in its favor.
2. **The tech-pack illustration** — an aid: attached to generation as a form reference,
   consulted where the spec is silent. A spec-vs-illustration conflict is followed per the
   spec and **logged**, never silently dropped.
3. **Legacy catalog descriptions** — an aid; superseded as spec text is written into the
   catalog via `tools/set_description.mjs`.

Pipeline consequences:

- QC's `blueprint-match` category is re-scoped to **spec-match** for spec-covered options.
  An image that follows the spec but departs from a defective illustration is CORRECT.
- The locked prompt restates the spec's values; the illustration is passed to the image
  model as a supporting reference, not as the geometry source of truth.
- Options not yet covered by a spec keep the old rule (illustration is law) until a spec
  arrives — the inversion applies family by family, so nothing regresses to guesswork.

## Documents

| file | scope |
|---|---|
| `jacket-lapels.md` | 26 lapel options: notch 45–73°, peak 99–120°, shawl family, fishtail |
| `jacket-geometry-system.md` | jacket blocks, roll line, lapel widths, shoulders, armhole, darts, stances, pockets, vents, sleeves |
| `shirt-collars.md` | collar types, point length / spread / stand geometry, stand heights |
| `shirt-cuffs.md` | cuff shapes, button counts, French/cocktail/convertible, heights, interlining |
| `shirt-drafting-manual.md` | master shirt block, collar/cuff/placket/dart/pleat/yoke/pocket/sleeve/hem/button formulas |
| `trouser-waistbands.md` | waistband styles + widths 3.5–5.0 cm, visual ranking |
| `trouser-pockets.md` | front pocket styles, slant decode, jeans family, watch/coin pockets, depth, topstitching |
| `inner-waistband.md` | curtain, snugtex, gripper, piping, pleated, finished-band interiors |
| `trouser-cuffs.md` | plain hem + turn-ups 3.2/3.8/4.4/5.1 cm, proportion rules |
| `trouser-pattern-engineering.md` | pocket drafting formulas, pleat geometry, darts, waistband extensions, leg shapes, block diagrams |
| `waistcoat-drafting-system.md` | vest block, necklines, vest lapels, pockets, front-edge shapes, DB layout, back belt, suppression |

Shared drafting variables (used across documents): NP/SP/BP/GP/CF/CB/CL/WL/SS,
W/H/C/S (circumferences), TR (trouser rise), PO (pocket opening), PD (pleat depth),
WB (waistband width), E (ease), L (point length), S (spread), SH (stand height),
FH (fall height), LW (lapel width), AH (armhole depth), NC/CC/WC/HC, SL, CW, AD, BL,
NW/ND, SW (scye width), KW/HW (knee/hem width).

## Rules for this folder

- Content is **verbatim** from the owner. Do not edit, paraphrase, or "improve" it.
  Corrections come only from the owner.
- Every ingest into the catalog goes through `tools/set_description.mjs`, then
  `extract_spec.mjs --write`, then `build_prompt.mjs --write` — in that order, always.
- Spec-vs-illustration conflicts are logged in `spec-conflicts.log.md` (created on first
  conflict) with option id, what the spec says, what the drawing shows, and the resolution
  (always: the spec).
