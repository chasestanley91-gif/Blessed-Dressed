# Pipeline skill snapshots

The three skills that produce every craft photograph —
`tech-pack-interpreter` → `garment-image-director` → `garment-image-qc` — live in
the operator's personal skills directory (`~/.claude/skills/`), **outside this
repository**. That means the logic that decides what the catalog's images depict
has been unversioned: a change to it left no diff, no history and no way to tell
which build produced which image.

These are byte copies, taken 2026-07-31, so that at minimum the state of the
pipeline at each catalog milestone is recoverable and reviewable alongside the
images it produced.

**They are a record, not the runtime.** The scripts still execute from
`~/.claude/skills/`. Refresh these copies whenever the skills change, and treat a
divergence between the two as a question to answer rather than noise.

## Fixes captured in this snapshot (2026-07-31)

1. **`tech-pack-interpreter/scripts/lib/spec.mjs` — a suit is not one garment.**
   `garmentNoun` and `resolvePart` were keyed on `productId`, so every trouser and
   waistcoat option filed under `suit-2pc` / `suit-3pc` was described to the image
   model as *"a premium navy bespoke suit jacket"* and classified as
   `jacket-detail` — while a trouser or waistcoat drawing was attached as the
   geometry reference. The prompt contradicted its own reference image on the most
   basic fact in it. **578 catalog rows** were affected. Both now key on the
   section prefix (`Trousers-*`, `Vest-*`), which is what the catalog itself uses
   to say which garment a field belongs to.

2. **`garment-image-director/scripts/lib/prompt.mjs` — colour in a drawing is
   notation, not cloth.** The existing clause listed "red or coloured guide marks"
   among the annotations, and the model still traced them as garment colour:
   `lbp-both` came back with two fire-engine-red lapel buttonholes that read as
   applied plastic tags. Naming the marks was not enough; the prompt had to say
   what they *mean*. The added clause states that highlighted regions mark
   position and shaded regions mark extent, and that both must render in the
   garment's own cloth. Verified to fix it in one retry, and independently
   observed by three separate generation agents.
