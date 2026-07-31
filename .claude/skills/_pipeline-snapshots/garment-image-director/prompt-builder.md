# The locked prompt template

`scripts/lib/prompt.mjs` is the **single source of truth**. This file
documents what it produces so a human can reason about (or extend) it. Never
hand-write a prompt that diverges from the script — run `build_prompt.mjs`
instead.

## Why a fixed template

The failure mode this skill exists to kill: when the prompt is loose, the
image model fills missing geometry from its training data — 90° collars
drift to generic spreads, 5 cm square points round off, peak lapels change
width. The fix is to (a) start from tech-pack-interpreter's **already
extracted, already persisted** spec — never recompute it here — (b) restate
every value literally in the prompt, and (c) attach the tech-pack
illustration as a hard reference so the model traces rather than invents.

## The ten blocks (in order)

1. **Genre** — `Ultra-photorealistic luxury menswear product photography.`
2. **Composition** — the craft-documentation framing statement (and, for the
   waistband engineering families, the `craftLock()` PRIMARY CRAFT / HARDWARE
   LOCK / SINGLE STATE / FLATNESS blocks — see `camera-rules.md`).
3. **Subject** — `A premium <garment noun> featuring a precise <exact label> (<field label>).`
4. **Geometry** — restates **every** extracted dimension, angle, button
   count, shape and flag verbatim: `Exact specification — <shapes> shape;
   measuring exactly <dims>; at <angles>; <counts>; <spread>; <flags> —
   matching the illustration precisely.` This is the line that locks the
   numbers. If tech-pack-interpreter's extraction found a value, it appears
   here; `validate_prompt.mjs` fails the run if any token is missing.
5. **VIEW** — states the orientation tech-pack-interpreter recorded
   (`spec.orientation`) and forbids substituting a different face of the
   garment. New in the three-skill split — the old single-skill pipeline had
   no explicit orientation lock.
6. **BLUEPRINT LOCK** — the non-negotiable instruction that the attached
   illustration is an engineering blueprint to reproduce within <2%
   deviation; *do not redesign/reinterpret/substitute/stylise/improve*; *if
   convention conflicts with the drawing, the drawing wins*; *accuracy over
   aesthetics*.
7. **Presentation** — how it's worn/framed, from `camera-rules.md`: model,
   accessories, tie/jacket/cufflink rules.
8. **Focus** — the focal construction details for that garment part + the
   crop.
9. **Photography** — Savile Row / Italian aesthetic, natural daylight
   studio, Phase One IQ4, 150MP, shallow DoF, editorial quality, bespoke
   finishing (see `photography-rules.md`).
10. **Negative** (`Avoid:` + `FORBIDDEN FOR THIS OPTION`) — the universal
    photography negatives plus this exact option's per-option forbidden
    list. See `negative-constraints.md` — this is two blocks working
    together, not one.

The constants `BLUEPRINT_LOCK`, `PHOTO_BLOCK` and `NEGATIVE` are exported
from `lib/prompt.mjs`; `validate_prompt.mjs` asserts the lock block, the
negative block, and the VIEW line are all present, and that every
block-4 token is echoed, before any credit is spent.

## Required tokens

`buildPrompt()` returns `requiredTokens` — the union of the spec's
dimensions, angles, button counts, shapes and flags. The pre-flight gate
fails unless the assembled prompt contains each one (case-insensitive). This
guarantees nothing is dropped between tech-pack-interpreter's extraction and
generation.

## Extending it

- New garment part → tech-pack-interpreter adds a `resolvePart()` branch
  (its `garment-taxonomy.md`), and this skill adds a matching `STYLE` entry
  in `lib/camera.mjs` (documented in `camera-rules.md`). The template itself
  rarely changes.
- New shape/flag vocabulary → tech-pack-interpreter's `SHAPES`/`FLAGS` tables
  — not this skill.
- Re-run the three canonical test cases (small-square-50-btn, peak lapel,
  French cuff) after any change to `lib/prompt.mjs` or `lib/camera.mjs`, and
  confirm the prompts still restate every value and still carry a VIEW line.
