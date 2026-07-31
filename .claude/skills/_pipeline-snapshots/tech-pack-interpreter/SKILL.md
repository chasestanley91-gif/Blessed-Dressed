---
name: tech-pack-interpreter
description: >-
  Interpret a Blessed & Dressed craft option's tech-pack illustration into a
  structured, persisted garment specification — BEFORE any photography prompt
  or image generation happens. The catalog lives in `data-store/options/*.json`
  (shirt, suit-2pc, suit-3pc, sport-coat, trousers, vest); each option's `image`
  is its tech-pack illustration. This skill extracts dimensions, angles, exact
  counts, shapes and construction flags deterministically from the catalog
  text, determines the illustration's orientation (front/back/side/detail/
  interior) by actually reading the image, and writes the result to
  `.craft-pipeline/<productId>/<optionId>/spec.json`. Use this skill whenever
  the user wants to interpret, analyze, or extract the construction spec of a
  craft option or tech pack before generating a photo; when a generated photo
  keeps drifting from the drawing and the fix is a better upstream spec, not a
  better prompt; or when asked "what does this tech pack actually show",
  "build the garment spec for X", "what's the engineering profile of this
  option". This is stage 1 of a three-skill pipeline: tech-pack-interpreter
  (this skill, "what is it") → garment-image-director (builds the locked
  photography prompt and generates the image) → garment-image-qc (compares the
  result against the illustration and decides accept/regenerate). This skill
  ONLY interprets and persists a spec — it never builds a prompt, never calls
  an image-generation model, and never edits the catalog.
---

# Tech-Pack Interpreter — turn the drawing into a structured spec

Your job is narrow and specific: read a craft option's tech-pack illustration
and catalog metadata, and produce a structured `spec.json` that a master
pattern cutter would recognize as an accurate read of the blueprint — nothing
invented, nothing assumed from convention, nothing dropped. You do not write
photography prompts and you do not generate images; that's
**garment-image-director**'s job, working from the spec you produce.

## The iron rule

The illustration is a manufacturing blueprint, not inspiration. Every fact you
record must trace back to one of: the catalog metadata (label/description/
hint), the illustration itself, or the deterministic extraction it feeds. If
tailoring convention conflicts with the drawing, the drawing wins. See
`construction-rules.md` for the full discipline (trace before rendering,
preserve geometry, count everything, front/back lock, option isolation).

## Tools you use

- **Bundled scripts** (deterministic; run with `node`) — catalog discovery,
  spec extraction, spec persistence.
- **Read** (vision) — to actually look at the illustration and determine its
  orientation. This is the one step no script can do; see
  `orientation-rules.md`.

`<skill>` below is this skill's directory. Run scripts from anywhere inside
the target repo; they auto-discover `data-store/options` by walking up (pass
`--options=<dir>` if you're outside the repo).

## The pipeline (run every step, in order)

### 1. Scope the work
Find the option(s) you're interpreting:
```
node <skill>/scripts/select_options.mjs --product=vest --match="button stance"
node <skill>/scripts/select_options.mjs --product=trousers --section=pleats-structure
```
For catalogue-wide coverage, run the gate first:
```
node <skill>/scripts/inventory.mjs            # summary + gate (exit 1 if any hole)
node <skill>/scripts/inventory.mjs --gaps     # list anything needing attention
node <skill>/scripts/inventory.mjs --dupes    # shared-illustration data defects
```
It proves every option has a specific `part` (not a generic fallback) and
reports blueprint status (local file / remote URL / none) and which options
are in-scope for generation (`generate: true` — has a blueprint, isn't an
excluded colour/material swatch).

### 2. Preview the deterministic extraction
```
node <skill>/scripts/extract_spec.mjs --product=shirt --option=<optionId>
```
This runs the text-based extraction (see `feature-extraction.md`) and prints
the illustration path — but does **not** write anything yet, because
orientation is still unresolved.

### 3. Read the illustration and determine orientation
`Read` the illustration file the preview printed (or the remote URL if no
local file exists). Follow `orientation-rules.md`: cross-check the
section/field naming hint against what the image actually shows, and record
which face of the garment it is — the visual read always wins over the naming
hint if they disagree.

### 4. Persist the spec
```
node <skill>/scripts/extract_spec.mjs --product=shirt --option=<optionId> \
  --orientation=front --write
```
This computes the per-option `forbidden[]` list (option isolation, absence
guard, front/back lock, exact counts — see `construction-rules.md`) and
writes `spec.json` into `.craft-pipeline/<productId>/<optionId>/`, conforming
to `schemas/garment-spec.schema.json`. This file is the pipeline hand-off:
garment-image-director reads it and never recomputes the spec itself.

### 5. Hand off
Once `spec.json` exists, tell the user (or continue automatically) that
**garment-image-director** builds the locked prompt and generates the photo
from it. You're done — do not build a prompt or call an image model yourself.

## Scope modes

- **Single** — the default. One option, the full 4-step pipeline above.
- **Batch** — a whole field/section/product. Use `select_options.mjs` or
  `extract_spec.mjs ... --json` (without `--write`) to list the work, then run
  steps 3–4 per option. Never batch-guess orientation from naming hints alone
  — each illustration still needs an actual look. For large batches this can
  be parallelized (one subagent per option) since each option's extraction is
  independent; the **Workflow** tool is appropriate if the user wants that
  scale.

## Non-negotiables

1. Read the spec from the catalog; never infer measurements, angles, or names
   that aren't in the source text.
2. Orientation is never guessed from a field name alone — confirm by reading
   the illustration.
3. Absence options (`isAbsence()` → true) flow through the same pipeline; the
   "no feature" state is a real spec, not something to skip.
4. `spec.json` is the only artifact garment-image-director should trust. If
   you find yourself explaining a garment's construction to the user without
   having written this file, you've skipped the point of the skill.

## Bundled resources

- `scripts/select_options.mjs` — list/filter options with their extracted spec.
- `scripts/inventory.mjs` — catalogue-wide coverage gate + shared-illustration
  detection (`--dupes`).
- `scripts/extract_spec.mjs` — preview, then persist `spec.json` per option.
- `scripts/lib/{catalog,spec,util}.mjs` — catalog discovery, deterministic
  extraction (`extractSpec`, `computeForbidden`), pipeline-cache helpers.
- `schemas/garment-spec.schema.json` — the `spec.json` contract.
- `garment-taxonomy.md` — the `part` vocabulary and how it's classified.
- `orientation-rules.md` — front/back/side/detail/interior determination.
- `construction-rules.md` — the trace-before-rendering discipline.
- `feature-extraction.md` — how the deterministic extractor works, and how to
  extend it for new vocabulary or a new garment part.
