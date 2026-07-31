# Garment taxonomy — the `part` vocabulary

Every option in the catalog resolves to exactly one canonical `part` — this is
what `resolvePart()` in `scripts/lib/spec.mjs` computes from
`(productId, sectionId, fieldId, label)`, and it's the single field
garment-image-director keys its camera/composition rules off. This document
is the human-readable map of that classification so you can reason about (or
extend) it without reading the regex tables directly.

## Resolution order

1. **Structural components** are matched explicitly per product — the bulk of
   the table below.
2. Anything that doesn't match a structural rule is routed through
   `classifyFinish()`, a **universal, product-agnostic** keyword classifier
   that gives every finishing detail (thread colour, stitching, buttonholes,
   contrast, lining, labels, piping, darts, interlining, splicing, patches,
   epaulets, gussets, canvas, yokes, pleats, bias, tabs, adjustments) its own
   specific `fin-*` profile instead of a coarse fallback. A field added to the
   catalog later auto-classifies by its label — nobody needs to hardcode a
   list.
3. Only if nothing matches does an option fall through to `<garment>-detail`
   or `generic-detail`. Run `scripts/inventory.mjs` to confirm this is empty
   (the coverage gate) — in the current catalog it is.

## Structural parts by product

**Shirt** — `shirt-collar`, `shirt-collar-stand`, `shirt-collar-detail`,
`shirt-cuff`, `shirt-cuff-detail`, `shirt-pocket`, `shirt-hem`,
`shirt-front`, `shirt-back`, `shirt-placket`, `shirt-detail`.

**Jackets** (suit-2pc / suit-3pc / sport-coat — one taxonomy serves all three,
since the jacket craft set is identical across them) — `jacket-lapel`,
`jacket-lapel-bh-position`, `jacket-lapel-buttonhole`, `jacket-chest-pocket`,
`jacket-ticket-pocket`, `jacket-pocket`, `jacket-front-buttonhole`,
`jacket-front`, `jacket-sleeve-buttonhole`, `jacket-sleeve-vent`,
`jacket-sleeve`, `jacket-back-belt`, `jacket-vent`, `jacket-canvas`,
`jacket-shoulder`, `jacket-interior`, `jacket-lapel-detail`, `jacket-detail`.

**Trousers** — `trouser-front-pocket`, `trouser-small-pocket`,
`trouser-pleat`, `trouser-fly`, `trouser-canvas`, and the **waistband
engineering families** (split out because each is its own hero subject, not
context on a pair of trousers — see below): `trouser-extension-length`,
`trouser-waistband-width`, `trouser-extension`, `trouser-adjuster`,
`trouser-belt-loops`, `trouser-waistband` (fallback for band-construction
style that isn't one of the families), `trouser-back-pocket`, `trouser-back`,
`trouser-hem`, `trouser-leg`, `trouser-detail`.

**Vest / waistcoat** — `vest-canvas`, `vest-bottom`, `vest-buttonhole`,
`vest-front`, `vest-lapel`, `vest-chest-pocket`, `vest-pocket`, `vest-back`,
`vest-detail`.

**Finishing (`fin-*`, shared across every garment)** — `fin-thread-color`,
`fin-piping`, `fin-buttonhole`, `fin-button`, `fin-stitch`, `fin-cutout`,
`fin-contrast`, `fin-lining`, `fin-label`, `fin-dart`, `fin-interlining`,
`fin-splice`, `fin-patch`, `fin-epaulet`, `fin-gusset`, `fin-canvas`,
`fin-yoke`, `fin-pleat-detail`, `fin-bias`, `fin-tab`, `fin-adjust`.

## Why the waistband families are split out

`trouser-waistband` used to be one bucket for the entire waistband. It's now
five parts because each is genuinely a different photographic subject: the
band's width is a different macro than the extension tab's length, which is
different again from the hook/button hardware, the side adjuster mechanism,
or the belt-loop count. Splitting them lets each one get its own
craft-dominant composition (40–60% of frame, not the whole trouser) instead
of a generic "waistband area" shot that under-serves all five. This is the
model to follow if a future product needs the same treatment: don't force
unrelated differentiating components into one bucket just because they live
on the same garment area.

## Extending the taxonomy

A genuinely new garment part (not covered by an existing structural rule or
by `classifyFinish()`'s keyword table) needs a new branch in `resolvePart()`
(`scripts/lib/spec.mjs`) and a matching camera/composition entry in
garment-image-director's `camera-rules.md`. Run `scripts/inventory.mjs`
afterward — it fails loudly (`generic-detail`/`<garment>-detail` count > 0)
if the new field wasn't actually captured.
