---
name: garment-image-director
description: >-
  Build the locked photography prompt and generate the photorealistic image
  for a Blessed & Dressed craft option, from the structured garment spec
  tech-pack-interpreter already produced. Reads `.craft-pipeline/<productId>/
  <optionId>/spec.json`, assembles a prompt that restates every extracted
  dimension/angle/count/shape/flag, attaches the tech-pack illustration as a
  hard geometry reference via the Higgsfield image MCP, validates before
  spending credits, generates, and records the result. Use this skill whenever
  the user wants to generate, render, or photograph a craft option that
  already has (or can get) a garment spec; when regenerating after
  garment-image-qc rejected a prior attempt; or when asked "build the prompt
  for X", "generate the photo now", "render the peak lapel option". This is
  stage 2 of a three-skill pipeline: tech-pack-interpreter (produces
  spec.json) → garment-image-director (this skill, "build it and shoot it") →
  garment-image-qc (compares the result against the illustration and decides
  accept/regenerate). This skill NEVER interprets a tech pack from scratch
  (it requires spec.json to already exist) and NEVER decides whether a
  generated image is accurate enough to ship — that approval authority
  belongs entirely to garment-image-qc.
---

# Garment Image Director — build the prompt, shoot the photo

Your job starts where tech-pack-interpreter's ends: a persisted `spec.json`
exists, and you turn it into a locked prompt and a generated candidate image.
You never re-interpret the tech pack (if `spec.json` doesn't exist, stop and
say so — tech-pack-interpreter runs first) and you never decide whether the
result is accurate enough to ship — that's garment-image-qc's job, working
from the `generation.json` you produce.

## The iron rule

**Extract → lock → reference → validate → generate.** The prompt must
restate every value from `spec.json` literally — nothing paraphrased,
nothing dropped — and the illustration is always attached as a hard
reference. If you find yourself typing a prompt by hand instead of running
`build_prompt.mjs`, stop; that's exactly the failure mode (loose prompt →
image model fills gaps from training priors) this whole pipeline exists to
prevent.

## Tools you use

- **Bundled scripts** (deterministic): prompt building, pre-flight
  validation, the illustration upload PUT, generation-result recording.
- **Higgsfield image MCP** (tools prefixed with its server id — load via
  ToolSearch, e.g. `query: "Higgsfield generate_image media_upload
  media_confirm models_explore show_generations"`): `media_upload`,
  `media_confirm`, `models_explore`, `generate_image`, `show_generations`,
  `job_display`, `balance`.

`<skill>` below is this skill's directory.

## The pipeline (run every step, in order)

### 1. Locate the spec
```
node <skill>/scripts/build_prompt.mjs --product=shirt --option=<optionId>
```
If this errors "no spec found", stop — hand off to tech-pack-interpreter
first. Do not fall back to inventing a spec yourself.

### 2. Build the locked prompt
The same command above returns `{ addr, label, illustration, requiredTokens,
checklist, scoreCard, profile, prompt }`. Add `--write` to also persist it as
`prompt.json` in the pipeline cache, and `--json` for machine-readable
output. Do **not** rewrite this prompt freehand — it's the proven template
(`prompt-builder.md`).

### 3. Pre-flight validation gate — BEFORE any credit is spent
```
node <skill>/scripts/validate_prompt.mjs --product=shirt --option=<optionId>
```
Fails (exit 1) unless: a usable blueprint exists, the BLUEPRINT LOCK, VIEW
and negative blocks are present, and every required token is echoed. If it
fails, stop and fix upstream (usually means `spec.json` needs re-extraction —
back to tech-pack-interpreter) rather than patching the prompt by hand.

### 4. Attach the illustration as the geometry reference
The spec's `illustrationExists` (local file) / `illustrationRemote` (CDN URL)
tells you which branch applies:

- **Remote URL** — pass it **directly** as the reference; no upload needed
  (Higgsfield accepts an https URL): `medias: [{ value: "<url>", role: "<reference role>" }]`.
- **Local file** — upload it:
  1. `media_upload({ filename: "<basename>.jpg", content_type: "image/jpeg" })` →
     presigned `upload_url` (+ `media_id`).
  2. PUT the bytes (the one non-MCP step):
     ```
     node <skill>/scripts/hf_put.mjs --url="<upload_url>" --file="<illustrationDisk>"
     ```
  3. `media_confirm({ media_id: "<id>", type: "image" })` → the media
     **UUID** to use as the reference value.

### 5. Resolve the model + reference role (once per session)
Resolve at runtime — do not hardcode:
```
models_explore({ action: "search", query: "gpt image", type: "image", input: "image" })
```
Pick a GPT/OpenAI image model that accepts a reference image, then:
```
models_explore({ action: "get", model_id: "<that model>" })
```
Note its `medias[].roles` (the reference/image role) and its quality
parameter (the low/economy tier — measured ~0.5 credits/gen at low/1k).

### 6. Pre-flight the cost, then generate
Always preflight (free) and keep `count: 1`:
```
generate_image({ params: {
  model: "<gpt image model>",
  prompt: "<the validated prompt>",
  medias: [{ value: "<media UUID or URL>", role: "<reference role>" }],
  count: 1,
  aspect_ratio: "3:4",   // pick a ratio the model supports; NOT 4:5 for gpt_image_2
  quality: "low",
  resolution: "1k",
  get_cost: true          // ← preflight first
}})
```
Confirm the cost, check `balance`, then submit the same call without
`get_cost`. Retrieve the async result with `show_generations` (or
`job_display` with the job id) — don't poll in a loop.

### 7. Record the result
```
node <skill>/scripts/record_generation.mjs --product=shirt --option=<optionId> \
  --model="<model id>" --job-id="<job id>" --result-url="<result url>"
```
Downloads the candidate image into the pipeline cache
(`.craft-pipeline/<productId>/<optionId>/candidate-<attempt>.<ext>`),
auto-increments the attempt number from any prior `qc.json`, and writes
`generation.json`. This is the hand-off artifact — garment-image-qc reads
it, not a chat message describing what happened.

### 8. Hand off
Tell the user (or continue automatically) that **garment-image-qc** now
compares the candidate against the illustration. You're done — do not judge
accuracy yourself, and do not write the result back into the catalog; that
only happens after QC approves.

## Regenerating after a rejection

If a prior `qc.json` exists with `verdict: "FAIL"`, read its `correction`
block (structured ERROR/EXPECTED/ACTUAL/CORRECTION/LOCKED-FEATURES/
FORBIDDEN-CHANGES — see garment-image-qc's `correction-loop.md`) before
re-running steps 5–7. Strengthen the specific geometry wording or reference
weight the correction calls for; do not regenerate with an unchanged prompt
and hope for a different result. `record_generation.mjs` auto-increments the
attempt number so the retry history stays in `generation.json`/`qc.json`
across attempts.

## Scope modes & spend safety

- **Single** is the default and safest.
- **Batch** — because every generation spends credits, print each option's
  locked prompt + preflight cost + running total, and do not generate until
  the user explicitly confirms. Check `balance` first and respect any
  per-run credit budget. Large batches may be orchestrated with the
  **Workflow** tool — one agent per option through steps 1–7 — but only
  after the user confirms the spend, and only if the Higgsfield MCP is
  reachable from subagents; otherwise run sequentially in the main loop.
  Never silently cap a batch — report exactly which options were done,
  skipped, or failed pre-flight.

## Non-negotiables

1. Never generate from a prompt that failed `validate_prompt.mjs`.
2. Never re-derive a spec yourself — if `spec.json` is missing or stale,
   that's tech-pack-interpreter's job, not this skill's.
3. Never approve or ship a result — `record_generation.mjs` only records
   that a candidate exists; garment-image-qc decides if it's accurate.

## Bundled resources

- `scripts/build_prompt.mjs` — assemble the locked prompt from `spec.json`.
- `scripts/validate_prompt.mjs` — the pre-flight gate (single option, or
  `--all` across the pipeline cache).
- `scripts/hf_put.mjs` — PUT a local illustration to a Higgsfield presigned URL.
- `scripts/record_generation.mjs` — download the result + write `generation.json`.
- `scripts/lib/{camera,prompt,util}.mjs` — camera/composition rules, prompt
  assembly (`buildPrompt`, `specFromRecord`), pipeline-cache helpers.
- `camera-rules.md` — part → presentation/framing map.
- `photography-rules.md` — studio/lighting/composition standard.
- `prompt-builder.md` — the ten-block prompt template, explained.
- `negative-constraints.md` — the universal + per-option negative system.
