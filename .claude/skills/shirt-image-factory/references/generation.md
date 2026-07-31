# Stage 4: Generating with the Higgsfield MCP

## Model choice (verified 2026-07-02 — re-verify at every batch start)

| Priority | Model | Settings | Cost/image | Use for |
|---|---|---|---|---|
| Default | `gpt_image_2` (OpenAI) | quality `low`, resolution `1k` | **0.5 credits** | All catalog option tiles — verified sharp enough for fabric/stitch detail at tile size |
| Escalation | `nano_banana_pro` (Google) | resolution `2k` | 2 credits | Hero/zoom shots, and the 4th attempt when gpt_image_2 fails geometry three times |

Both accept a reference image with role `image` — the blueprint is ALWAYS attached.
`gpt_image_2` quality `medium` costs 2 credits (same as nano 2k) — if you need that tier,
compare both models rather than defaulting.

Aspect ratios differ: `gpt_image_2` has NO 4:5 — use `3:4` for garment detail crops
(closest to the house 4:5) and `1:1` for button/macro tiles. `nano_banana_pro` supports
`4:5`. A one-notch ratio mismatch across the catalog is acceptable; site tiles crop with
CSS.

Do NOT use `marketing_studio_image` / `ms_image` (ad tools that restyle composition) or
`soul_2` (people-first editorial) for catalog geometry work.

Catalog lesson, learned the hard way: when searching the model catalog, use SHORT queries
(`models_explore search "gpt"`). Long multi-word queries AND the terms together and return
empty — which once produced a false "GPT Image 2 doesn't exist" conclusion. Confirm a
model's absence with `action: "list"` paging before claiming it.

```
models_explore { action: "get", model_id: "gpt_image_2" }
```

Record model id + settings in each option's `qa.json` so results are reproducible.

## House style per garment (match existing accepted photos)

Before generating for a garment/category, open one ACCEPTED photo from it and match the
photographic style. Current house styles: vest/jacket/trousers options are ON-MODEL
(chin-down crop, deep navy garment, white shirt, soft window light, editorial). Shirt
craft options: detail-dominant crop per the detail-type notes in
`blueprint-and-prompts.md`. Interior/construction details (linings, piping, canvas):
garment on wooden hanger/valet, detail facing camera. Buttons/hardware: macro on folded
suiting. Consistency across the catalog matters as much as per-image quality.

## The call sequence (per option)

1. **Upload the illustration** (remote MCP cannot read local files):
   - `media_upload { files: [{filename: "<slug>.jpg"}] }` — batch several options per call.
   - PUT the bytes: `python scripts/hf_upload.py "<local path>" "<upload_url>" image/jpeg`
   - `media_confirm { type: "image", media_ids: [...] }`
   - Cache `media_id` in `spec.json`; reuse for retries (media persists across calls).

2. **Preflight cost once per model+settings combo** (`get_cost: true`), log it, use it for
   batch budget math.

3. **Generate**:
   ```
   generate_image { params: {
     model: "gpt_image_2", quality: "low", resolution: "1k",
     aspect_ratio: "3:4",            // 1:1 for buttons/macro
     prompt: "<assembled from blueprint-and-prompts.md>",
     medias: [{ value: "<media_id>", role: "image" }]
   } }
   ```
   If the tool returns a `recovery_tool`, call it immediately.

4. **Fetch the result**: poll `job_display` with the job id until `completed`, download
   `results.rawUrl` to `photo-attempt<N>.png` (rename to `photo.png` only after QA
   passes; remakes of an existing approved photo are saved as `<id>-v2.png` — NEVER
   overwrite the current photo without the user's approval). Save the exact prompt to
   `prompt.txt` before QA so failed prompts are also on record.

## Retry ladder (cost-aware)

1. Attempts 1–3: `gpt_image_2` low/1k with corrective lines appended per
   `qa-and-retry.md` (1.5 credits total worst case).
2. Attempt 4: one `nano_banana_pro` 2k attempt with all corrections (2 credits) — a
   different model sometimes breaks a stuck failure mode.
3. Still failing → status `needs-human`, keep best attempt, log, move on.

## Cost discipline

- `balance {}` before every batch; abort and ask the user if projected spend
  (per-image cost × pending × 1.5 retry allowance) exceeds what they approved.
- One generation per attempt — no multi-candidate batches.
- The Higgsfield web app shows an "Unlimited" toggle on some plans; the MCP API is what
  this pipeline uses and `get_cost` is its source of truth (0.5/image as of 2026-07-02).
  If get_cost ever reports 0, great — still log it.
- Log every spend event (option, attempt, credits) in `reports/failure-log.md`.
