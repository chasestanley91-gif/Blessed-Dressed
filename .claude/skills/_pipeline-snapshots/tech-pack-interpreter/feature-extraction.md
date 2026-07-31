# Feature extraction — how `extractSpec()` actually works

`scripts/lib/spec.mjs` is the single source of truth for turning catalog text
into structured facts. Nothing here is inferred by a language model — the
same input always yields the same output. This document explains what it
does so you can extend it correctly instead of hand-writing a one-off parse.

## Input

Each option arrives as a flat record from `catalog.mjs`'s `iterateOptions()`:
`productId`, `sectionId`, `fieldId`, `fieldLabel`, `label`, `description`,
`hint`, `image` (the illustration path/URL). `extractSpec()` builds a
lowercased search string from `label + description + hint + illustration
filename` (with hyphens/underscores turned to spaces) and runs every
extractor below against it.

## What gets extracted, and how

- **`part`** — `resolvePart()` classifies the option into a canonical garment
  part using `(productId, sectionId, fieldId, label)` — see
  `garment-taxonomy.md` for the full vocabulary.
- **`dimensions` / `angles` / `counts`** — `extractMeasures()` regex-parses
  literal numbers: `"5.0 cm"` → `dimensions`, `"115°"` / `"115 degrees"` →
  `angles`, `"2 buttons"` / `"1 buttonhole"` → `counts`. Buttonholes are
  matched before plain buttons so `"buttonhole"` is never miscounted as a
  button.
- **`shapes`** — `scanList()` against the `SHAPES` table: an ordered list of
  `[canonical name, regex, product scope]` entries, most-specific-first (e.g.
  `'double cutaway'` before `'cutaway'`) so a more specific term always wins
  when both would match. Scoped by product so unrelated vocabulary can't leak
  across garments (a trouser `'flat front'` will never tag a vest's
  `'flat bottom'`).
- **`flags`** — `scanList()` against the `FLAGS` table: binary construction
  facts that aren't shapes (hidden button fastening, cufflink closure,
  contrast fabric, side adjuster, belt loops, zip vs. button fly, and so on).
- **Waistband engineering-family augmentation** — for the five
  `trouser-*` waistband parts (see `garment-taxonomy.md`), three additional
  extractors run: `classifyExtensionShape()` (tab corner/point profile),
  `extractHardware()` (exact hook/button counts and orientation),
  `classifyAdjuster()` (side-adjuster mechanism type). These are kept
  separate from the global `SHAPES`/`FLAGS` tables specifically so generic
  words like "round" or "double" in an unrelated trouser description can
  never mis-tag a non-waistband option.
- **`excluded`** — `classifyExcluded()` flags pure colour/material swatches
  (button choice, thread colour, fabric/lining colour) as out of scope for
  photo generation, while explicitly preserving their *geometric* cousins
  (button stance/count, contrast placement, lining coverage/shape,
  interlining) as in scope. See the exact keyword rules in the function
  itself before assuming a field is or isn't a swatch.
- **`absence`** — `isAbsence()` detects options whose label denotes the
  deliberate absence of a feature (`"No…"`, `"None"`, `"Ventless"`,
  `"Clean…"`, `"Unlined"`), while excluding false positives like
  `"Flat Front"` (a real feature, not an absence) via a small allow-list
  checked first.

## Extending it — new vocabulary or a new garment part

1. **New shape or flag term**: add an entry to `SHAPES` or `FLAGS` in
   `scripts/lib/spec.mjs`. Put more specific terms before more general ones —
   the first regex match wins.
2. **New structural garment part**: add a branch to `resolvePart()` for the
   relevant product, and document it in `garment-taxonomy.md`. Give it a
   matching camera/composition entry in garment-image-director's
   `camera-rules.md` — a part with no composition rule falls back to a
   generic macro shot, which usually under-serves it.
3. **New finishing-detail keyword**: extend `classifyFinish()` — this one
   change makes every current and future field matching that keyword
   auto-classify correctly, catalogue-wide, with no per-option work.
4. **Verify coverage**: run `scripts/inventory.mjs` after any change. It
   fails (exit 1) if any option resolves to `generic-detail` or
   `<garment>-detail` — the sign that a new field shape wasn't actually
   captured by your change. `--gaps` lists exactly which options need
   attention.

## What this stage does *not* do

It does not decide orientation (that needs vision — see
`orientation-rules.md`), it does not build a photography prompt or pick a
camera angle (garment-image-director's job), and it does not compare a
generated image against the illustration (garment-image-qc's job). Keeping
this boundary sharp is what lets each of the three skills be reasoned about,
tested, and extended independently.

## Mutually-exclusive shape families (added 2026-07-28)

`scanList` reads the option's whole text — label + description + hint + file
stem. Descriptions frequently name a **sibling option to contrast against it**
("avoids the rumpled droop of a ROUND hem", "unlike a NOTCH lapel"). Those
contrast mentions were being tagged as if the option *had* that shape,
producing a self-contradictory spec — `["curved hem", "straight hem"]` for
Straight Hem, `["peak lapel", "notch lapel"]` for Notch 65° — which then told
the image model to render two incompatible geometries at once.

`resolveExclusiveShapes()` (in `lib/spec.mjs`) resolves this **after** the
scan. Within a family whose members cannot co-exist:

- if the option's **label** names one or more members → keep only those, drop
  the rest (they came from prose);
- if the label names **none** → keep everything. We cannot disambiguate
  deterministically, and silently picking one would be inventing. These
  surface as genuinely ambiguous options that need the drawing to settle
  (e.g. "Italian Fishtail Lapel", whose label names neither notch nor peak).

Genuinely dual options are handled correctly for free: "Peak + Removable
Shawl" names both members in its label, so both survive.

Families are declared in `EXCLUSIVE_SHAPE_FAMILIES`; add a family when two
tokens in the SHAPES table describe states one garment cannot hold at once.
Measured against the live Blessed & Dressed catalog this took contradictory
specs from 24 options down to 12, and the 12 remaining are correct-dual or
genuinely undecidable-from-label rather than defects.

## Sibling-shape negatives (TERMINAL_SHAPE_FAMILIES)

A positive description does not beat a strong model prior. "Square 6.5 cm"
collars rendered with sharp acute points twice, with the correct shape stated in
the prompt and the drawing attached — because "dress shirt collar" means
"pointed" in the model's training distribution.

`computeForbidden()` therefore walks `TERMINAL_SHAPE_FAMILIES`. Each family is a
set of mutually exclusive terminal shapes for one garment part; each group
carries a `forbid` string naming the shapes an option in THAT group is not. When
exactly one group matches the option's `shapes`, its own `forbid` string is
emitted.

Two rules when extending this:

1. **Emit the matched group's `forbid`, never the other groups'.** Each `forbid`
   is written from the perspective of "if you ARE this group". Emitting another
   group's string forbids the option's own shape — it reads plausibly and
   silently sabotages the option.
2. **Bail out when the match is ambiguous** (`mine.length !== 1`). Over-tagging is
   common — `rounded point` also matches the bare `point` pattern — and a wrong
   negative is far more damaging than a missing one.

After any change here, print the generated negatives for several real options and
read them. A green `node --check` proves nothing about whether the text is right.
