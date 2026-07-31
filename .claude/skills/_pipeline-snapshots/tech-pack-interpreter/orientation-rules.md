# Orientation rules — front, back, side, detail, interior

A flat tech-pack illustration compresses a lot of information, but it never
tells you outright which face of the garment it shows. Get this wrong and
every downstream stage inherits the error silently — a back-vent illustration
interpreted as a front view produces a photo with the vent in the wrong place,
and it will still pass a naive geometry check because the *shapes* were
reproduced correctly, just on the wrong face.

Orientation is the one field in the garment spec that **cannot** be extracted
deterministically from text the way dimensions or shapes can (see
`feature-extraction.md`). It requires actually looking at the illustration.
`extract_spec.mjs` enforces this mechanically: it refuses to write `spec.json`
without `--orientation`, and refuses to accept an orientation from anything
but a human/agent who has read the image.

## Two sources, cross-checked

1. **Naming hints** — the catalog's `sectionId`/`fieldId` often (not always)
   telegraph the view: `back-vents`, `back-structure`, `back-fit`, `back-pocket`
   suggest a rear view; `front-style`, `front-pockets`, `canvas-front` suggest a
   front view; `suit-lining`/`interior` suggest the garment opened up. Treat
   these as a **hypothesis**, never a conclusion — a field named `back-vents`
   can still carry an illustration drawn from a rear three-quarter angle rather
   than a flat back view, and some fields (`cuffs`, `lapel`) carry no
   orientation hint in their name at all.
2. **Visual inspection (authoritative)** — `Read` the illustration file
   (`spec.illustrationDisk`, or fetch the remote URL if that's all that
   exists) and look for these cues:
   - **Front**: lapels/collar open toward the viewer, front button stance and
     buttonholes visible, front pockets and fly visible, chest pockets visible.
   - **Back**: yoke, back vents, back darts/seam, rear pockets, back
     waistband strap/adjuster visible; no front closure visible.
   - **Side / profile**: garment drawn from the shoulder-to-hem silhouette
     edge-on; used for shape/taper illustrations (leg line, lapel roll depth).
   - **Three-quarter**: a rotated view showing part of two faces at once
     (common for vents and shoulder construction) — record the dominant face.
   - **Detail / macro**: a single feature isolated and enlarged with no full
     garment silhouette around it (a buttonhole, a stitch, a hardware
     close-up) — orientation here describes which face the detail sits on,
     not a full-garment view.
   - **Interior**: the garment shown opened/turned inside out to reveal
     lining, facing, interior pockets, or a canvas cross-section.

If the naming hint and the visual inspection disagree, **the visual
inspection wins** — the illustration is the source of truth, not the field
name (same Supreme Rule the whole pipeline runs on; see `construction-rules.md`).

## Wearer's perspective vs. viewer's perspective

Keep these two coordinate systems separate and say explicitly which one you're
using:

- **Construction facts** (recorded in `spec.json`, e.g. "adjuster on the
  outseam", "hooks oriented vertically") are always in the **wearer's**
  perspective — the wearer's left is the garment's left, regardless of which
  side of the frame it appears on in a front-view illustration (where the
  wearer's left appears on the *viewer's right*).
- **Photography framing** (crop, camera angle, composition) is planned in the
  **viewer's** perspective by garment-image-director, since that's what a
  camera actually sees. That skill is responsible for the conversion; this
  skill only ever records wearer-perspective facts.

Getting this backwards is exactly how a "side adjuster on the right" ends up
mirrored in the generated photo while still reading as "technically present."

## Orientation values

Use exactly these enum values in `--orientation` (matches
`schemas/garment-spec.schema.json`):

`front` · `back` · `side-left` · `side-right` · `three-quarter-front` ·
`three-quarter-back` · `detail` · `interior`

## Front/back lock feeds the forbidden list

Once orientation is set, `extract_spec.mjs` (via `computeForbidden()`)
automatically adds a standing constraint: *"a feature that belongs on the
opposite face of the garment from what this illustration shows."* This is
the mechanical version of the user-facing rule "back pockets must never
appear on the front" — it doesn't need per-part hardcoding because it's
derived from the orientation you just confirmed.

## Absence options still need an orientation

An option like "Ventless" or "No Back Detail" has no positive feature to
photograph, but the photo is still taken from a specific face of the garment
(a clean back, not a clean anything). Determine orientation for absence
options the same way — usually easier, since there's only a silhouette to
read, no construction detail to parse.
