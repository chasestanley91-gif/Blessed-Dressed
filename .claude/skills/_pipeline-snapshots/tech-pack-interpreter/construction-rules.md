# Construction rules — trace before rendering

A tech-pack illustration is a manufacturing blueprint, not a mood board or a
style reference. Before any prompt or photograph exists, this skill's job is
to read that blueprint the way a pattern cutter would: identify every line,
decide what it means, and record only what's actually there — nothing
assumed from tailoring convention, nothing "improved."

## Rule 1 — trace before rendering: not every line is a seam

When you (or `extract_spec.mjs`'s deterministic parser) look at an
illustration, distinguish:

- **Structural seams** — where panels join; these define the garment's
  actual construction.
- **Decorative/topstitching** — visible stitch lines that don't join panels
  (pick stitch, edge stitch, bar tacks) — recorded as `flags`, e.g.
  `'pick / AMF edge stitch'`, `'top stitch'`.
- **Fold lines** — where fabric is pressed/rolled, not cut (a lapel roll
  line, a pleat fold) — these usually surface as `shapes`
  (`'single forward pleat'`) rather than a seam.
- **Construction guides / annotations** — measurement callouts, dimension
  lines, arrows, tick marks, red/coloured guide marks, text labels. **These
  are manufacturing documentation, not features of the cloth.** They must
  never be reproduced in the generated photo — that's a universal negative
  constraint garment-image-director carries forward on every option (see its
  `negative-constraints.md`).

Misreading an annotation line as a seam, or a fold line as a seam, produces a
spec with a construction feature that doesn't actually exist on the garment.

## Rule 2 — preserve relative geometry, don't substitute "fashion proportions"

The illustration determines feature spacing, angle, width, height, position,
count, and symmetry. `extractMeasures()` and the `SHAPES`/`FLAGS` tables in
`scripts/lib/spec.mjs` exist specifically so these values come from the
catalog's own text (label/description/hint/filename) rather than from
whatever an image model's training data considers a "normal" lapel width or
collar spread. If a value isn't present in the source text, it isn't invented
downstream either — `measured.dimensions`/`angles` stay empty rather than
being filled with a plausible-sounding guess.

## Rule 3 — count everything

Buttons, buttonholes, hooks, belt loops, pleats — every countable feature
gets an exact count in `measured.counts`, never a generic quantity. This is
mechanical, not judgment: `extractMeasures()` parses `"N buttons"` /
`"N buttonholes"` from text, and the waistband-family extractors
(`extractHardware()`, `classifyAdjuster()`) do the same for hooks and loops.
If the source text names a count, the spec carries it as an exact token
(`'6-loop'`, `'2-hook'`) that `computeForbidden()` turns into an explicit
"any count other than exactly N" constraint downstream.

## Rule 4 — front/back lock

Covered in full in `orientation-rules.md`. In short: a feature that exists on
one face of the garment must never appear on another. This is enforced by
recording `view.orientation` for every spec and letting
`computeForbidden()` add the standing "opposite face" constraint
automatically — no per-part hardcoding needed.

## Rule 5 — option isolation

Each craft option in the catalog is addressed uniquely
(`productId > sectionId > fieldId > optionId`, see `spec.addr`) and gets its
own spec. Never let one option's waistband/pocket/collar/closure/stitching
leak into another's — even two options that look superficially similar
(two peak lapels at different angles, two waistband widths a centimeter
apart) are different manufacturing specs. `computeForbidden()` adds a
standing "features borrowed from a neighboring craft option" constraint to
every spec for exactly this reason.

## Absence is a real construction state, not a null value

"No Pocket", "Ventless", "Clean lapel" describe the deliberate absence of a
feature — `isAbsence()` detects this from the option label, and the resulting
spec is marked `absence: true`. This must **never** be treated as "nothing to
extract" and skipped; it flows through the exact same pipeline, just with the
positive-geometry extraction step producing an empty result and
`computeForbidden()` adding "any `<feature>` rendered anywhere in frame" as a
hard constraint. Rendering the absent feature is a failure, not a safe
default.

## When convention conflicts with the drawing, the drawing wins

If tailoring convention, manufacturer convention, or general fashion
knowledge suggests a garment "should" have a feature the illustration doesn't
show — or shouldn't have one it does show — the illustration is still
authoritative. This skill's whole purpose is to prevent exactly the failure
mode where an image model (or a human skimming the tech pack) quietly
"corrects" an unusual but intentional design back to something generic.
