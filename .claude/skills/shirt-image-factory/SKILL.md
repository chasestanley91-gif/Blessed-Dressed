---
name: shirt-image-factory
description: >-
  Manufacturing-grade product image pipeline for Blessed & Dressed custom garment craft
  options (shirts now; jackets and pants use the same pipeline). Converts supplier tech-pack
  illustrations into photorealistic, blueprint-accurate product photos via the Higgsfield MCP,
  QA-checks every photo against its illustration, and maps illustration + photo + prompt + QA
  report to each product code in catalog.json. Use this skill whenever the user wants product or
  example images for craft options (collar, lapel, cuff, placket, pocket, hem, yoke, back,
  sleeve, canvas, buttons, stitching, splicing, epaulet...), says "generate product images",
  "run the image factory", "process the tech packs", "make photos for the shirt options", adds
  new option illustrations, asks for catalog status, or wants option images extracted from the
  supplier spreadsheet or ordering-platform screenshots.
---

# Shirt Image Factory

Turns supplier tech-pack illustrations into luxury ecommerce product photos that a tailor
could measure against the original drawing — then maps every asset to its product code.

## Manufacturing Accuracy Charter

The supplied tech-pack illustration is the single source of truth. Treat it as an engineering
blueprint, not concept art. Every visible line, angle, radius, stitch row, seam, overlap,
button placement, placket width, collar point length, cuff geometry, pocket dimension, and
measurement annotation must be preserved exactly in the generated photograph. If the option
specifies 6 cm, that feature must hold 6 cm in correct proportion to the rest of the garment.
Never redesign, never improve, never stylize, never simplify, never reinterpret. The goal is
not an attractive approximation; it is a photorealistic photograph of a garment that could
have been manufactured directly from this blueprint. If any visible geometric relationship
differs from the blueprint, the image fails QA and must be regenerated.

## Physics you must respect (read once, apply always)

Image models render **proportions**, not measured dimensions. No model can guarantee "6.0 cm."
The pipeline gets manufacturing-grade fidelity anyway, through five compensations:

1. **Reference-image conditioning.** The illustration is ALWAYS attached as an input image to
   the generation call. Never generate from text alone — text-only generation is how collars
   grow longer "because it looks nicer."
2. **Ratios beat absolute numbers.** Convert every dimension into a relationship the model can
   see ("collar point = roughly one third of the collar's front opening edge"), while still
   stating the cm value. Models follow visible proportions far better than isolated numbers.
3. **QA is a trained-eye visual comparison**, feature by feature, against the blueprint — with
   pass/fail and a written reason per feature. Do not invent precision percentages ("collar
   99.8%") — that is fake accuracy. A feature either visibly matches or it does not.
4. **True dimensions reach the customer via the annotated variant.** `scripts/annotate_scale.py`
   draws exact measurement callouts (from the option label / tech pack) onto the approved photo
   deterministically. That is the honest "real scale" system — not hoping the AI rendered 6 cm.
5. **Generation costs credits.** Preflight cost, guard batches, never burn the user's balance
   silently. Rules in `references/catalog-and-mapping.md`.

## The pipeline (7 stages)

| # | Stage | What happens | Read first |
|---|-------|--------------|------------|
| 1 | Discover | Build/refresh `catalog.json` from the supplier xlsx or image folders. Never hardcode option lists. | `references/catalog-and-mapping.md` |
| 2 | Read blueprint | Open the option's illustration with vision. Extract geometry: shapes, counts, angles, stitch rows, button positions, stated cm values. | `references/blueprint-and-prompts.md` |
| 3 | Build spec | Convert geometry into an engineering spec block: measurements + ratio table + locked-feature list. | `references/blueprint-and-prompts.md` |
| 4 | Generate | Upload illustration to Higgsfield, call `generate_image` with the spec-document prompt + reference image. | `references/generation.md` |
| 5 | QA + retry | Compare photo vs blueprint feature-by-feature. Fail → corrective retry (max 3), log failure → correction. | `references/qa-and-retry.md` |
| 6 | Map | Save photo, prompt, spec, QA report into the option folder; update `catalog.json`. | `references/catalog-and-mapping.md` |
| 7 | Batch | Loop stages 2–6 across pending options with budget guard and resume. | `references/catalog-and-mapping.md` |

For a single option, run stages 2–6. For "do them all," run stage 7 (which asks for budget
approval first). Stage 1 runs once, then only when the source data changes.

## Non-negotiable rules

- **Blueprint law.** The illustration overrides your aesthetic judgment, the model's
  aesthetic judgment, and any generic idea of what a collar "should" look like.
- **Discovery, not lists.** Options come from `catalog.json` (built by
  `scripts/extract_xlsx_assets.py`). If an option isn't there, refresh the catalog — don't
  improvise entries.
- **Structural vs swatch.** Only `kind: "structural"` options get generated photos. `swatch`
  entries (thread colors, button designs, lining colors — ~700 of ~1,140 options) keep their
  extracted illustration as the display image. Generating 700 photos of thread spools wastes
  hundreds of dollars and adds nothing. The user can promote any swatch to structural in
  catalog.json if they want a photo for it.
- **Budget guard.** Before any run that will generate more than 10 images, or whose projected
  cost (get_cost × options × 1.5 retry allowance) exceeds the current `balance`, STOP and get
  explicit user approval with the numbers in front of them.
- **Never overwrite an approved photo.** New attempts become `photo-v2.png`, `photo-v3.png`.
- **3 strikes.** After 3 failed QA attempts, set status `needs-human`, log why, move to the
  next option. Do not loop forever on one collar.
- **Every attempt is recorded** in the option's `qa.json` and the shared
  `reports/failure-log.md` — corrections learned on one option get pre-applied to the next
  option in the same category (read the failure log before generating).

## Working layout (inside the project root)

```
shirt-assets/
├── source/                      # the supplier xlsx lives here
├── illustrations/<category>/<slug>.jpg     # extracted tech packs (blueprint originals)
├── photos/<category>/<slug>/
│   ├── photo.png                # approved product photo
│   ├── photo-annotated.png      # + measurement callouts (optional, deterministic)
│   ├── prompt.txt               # exact prompt used
│   ├── spec.json                # geometry spec + ratios
│   └── qa.json                  # per-feature verdicts, attempts, model + settings
├── catalog.json                 # product-code map: option → all assets + status
└── reports/failure-log.md       # failure → correction memory across runs
```

## Quick recipes

- **"Set up / refresh the catalog"** →
  `python scripts/extract_xlsx_assets.py "<xlsx path>" --out shirt-assets` then
  `python scripts/catalog.py status shirt-assets/catalog.json`
- **"Generate the photo for <option>"** → stages 2–6 for that `category/slug`.
- **"Run the batch for <category>"** → stage 7 scoped to the category (budget guard applies).
- **"What's left?"** → `python scripts/catalog.py next shirt-assets/catalog.json --limit 20`
- **"Audit the repository / show the dashboard"** → `python scripts/audit.py <site_root> <shirt_assets>`
  rebuilds `inventory.json` (single source of truth: totals, queues, duplicates, id
  conflicts, measurement coverage, credits) and `dashboard.html`. Run before every sprint
  and before quoting any project numbers.
- **"Add measurements to the photo"** → `scripts/annotate_scale.py` (usage at top of file);
  you pick pixel coordinates by looking at the photo, the script draws exact callouts.
- **"Review / accept / remake the images"** → `node scripts/build_review.mjs <site_root>`
  (THE canonical builder — role-based schema; the old build_review.py is a stub) builds
  `public/images/review.html`: cards keyed garment|fieldId|id, each image tagged with its
  role (techpack / builder / generated / ai / real / candidate) plus mapping flags, with
  four card verdicts — Accept, Remake (regenerate photo), Discard (drop the option
  from the lineup; needs user-approved data edit), Bad pack (the illustration itself is
  wrong and needs re-sourcing — do NOT regenerate from it) — and per-image keep/wrong
  verdicts. The user reviews in their browser and exports decisions (Copy decisions →
  paste to Claude, or Download decisions.json; format 3). Then
  `python scripts/apply_review.py <site_root> <decisions.json> [--out p]` (accepts
  formats 3, 2 and legacy — older formats fan out across field-scoped cards) writes
  `review-remake-queue.json` — the remake batch feeds stages 2–6, with the user's note
  appended to each retry prompt as a correction line. Human acceptance in the gallery is
  the `approved` gate; never mass-regenerate accepted options. Options with no usable
  blueprint or label/illustration conflicts are listed in
  `public/images/techpacks/needs-source.json` — never generate for those until resolved.

## Scope notes

- Shirts are the built-out catalog. Jacket and pant option screenshots
  (`Jacket options/`, `Pant Options/` folders) follow the identical pipeline once their
  illustrations are cropped and cataloged — same charter, same stages.
- Fabric choice for photos defaults to premium white poplin so geometry reads cleanly;
  fabric-specific weave physics are in `references/blueprint-and-prompts.md`.
