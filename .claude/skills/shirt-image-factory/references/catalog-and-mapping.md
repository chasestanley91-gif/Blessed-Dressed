# Stages 1, 6, 7: Catalog Discovery, Mapping, and Batch Runs

## Stage 1 — Discovery (never hardcode option lists)

The source of truth for shirt options is the supplier workbook (`shirt design.xlsx`), which
contains:

- **"Design Details" sheet** — ~1,116 embedded tech-pack illustrations, laid out as a
  category header row followed by one image per row for each option, in the same order as
  the map sheet.
- **"Design Options Map" sheet** — the canonical table: `category_key`, `Category Label`,
  `Required`, `Option ID`, `Option Label`, `Image Path` (ready-made slugs).
- 49 categories, ~1,140 options. "Monogram" and "Body Adjustment" sheets have their own
  images and map sheets and can be extracted the same way later.

Run the extractor to (re)build everything:

```
python scripts/extract_xlsx_assets.py "shirt-assets/source/shirt design.xlsx" --out shirt-assets
```

It writes `illustrations/<category>/<slug>.jpg` for every option, builds/merges
`catalog.json`, classifies each option's `kind`, and prints per-category counts with any
image/label mismatches. Mismatches mean the workbook layout shifted — investigate, never
guess assignments. The extractor MERGES: existing statuses/photos in catalog.json are
preserved, so re-running after the supplier adds options is safe.

For image-folder sources (jacket/pant screenshots): each screenshot may contain a grid of
many option tiles. Crop each tile to its own file first (view the screenshot, note tile
pixel boxes, crop with PIL), name by option label, place under
`illustrations/<category>/<slug>.jpg`, then add catalog entries.

## kind: structural vs swatch

- `structural` — shape/construction options (collars, cuffs, plackets, pockets, hems,
  yokes, backs, splicing, stands, pleats, tabs, epaulets, stitch patterns...). These get
  generated product photos. Roughly 250–350 options.
- `swatch` — color chips and hardware pickers (thread colors, buttonhole colors, button
  designs, linings, contrast fabrics...). The extracted illustration IS the display asset;
  no generation by default. Roughly 700–800 options. This split is what keeps the whole
  catalog affordable.

The extractor classifies by category key (contains `color`, or is a known button/lining
picker → swatch). The user can flip any entry's `kind` in catalog.json; respect their edit
on re-runs (merge keeps it).

## catalog.json — one entry per product code

```json
{
  "generated": "2026-07-01T12:00:00",
  "source": "shirt design.xlsx",
  "options": [
    {
      "product_code": "lapel-02",
      "category_key": "lapel",
      "category_label": "Lapel",
      "required": true,
      "option_id": 2,
      "option_label": "Fashion point in 5.8cm",
      "slug": "fashion-point-in-58cm",
      "kind": "structural",
      "measurements_cm": [5.8],
      "illustration": "illustrations/lapel/fashion-point-in-58cm.jpg",
      "photo": null,
      "photo_annotated": null,
      "spec": null,
      "qa": null,
      "status": "pending",
      "attempts": 0,
      "updated": "2026-07-01"
    }
  ]
}
```

`product_code` = `<category_key>-<zero-padded option_id>`. Statuses:
`pending` → `generated` (photo exists, QA passed) → `approved` (user signed off);
plus `needs-human` (3 QA fails), `skipped-swatch`. Update entries with:

```
python scripts/catalog.py set shirt-assets/catalog.json lapel-02 --status generated --photo photos/lapel/fashion-point-in-58cm/photo.png
python scripts/catalog.py status shirt-assets/catalog.json          # dashboard
python scripts/catalog.py next shirt-assets/catalog.json --limit 20 # next pending structural
```

## Stage 6 — Mapping after each success

After QA passes: rename the passing attempt to `photo.png`, ensure `prompt.txt`, `spec.json`,
`qa.json` sit beside it, update the catalog entry (status, paths, attempts). The catalog is
what the website build consumes — if it's not in catalog.json, it didn't happen.

## Stage 7 — Batch runs

1. Read the failure log; refresh model id (`models_explore get`); `balance {}`;
   preflight per-image cost (`get_cost: true`).
2. Compute: `pending structural options × cost × 1.5` (retry allowance). Present the number
   to the user with current balance and get explicit approval. Also ask when a single run
   will exceed 10 images. Never start a paid batch silently.
3. Loop `catalog.py next` order (category by category — category grouping lets corrections
   compound). For each option: stages 2–6.
4. Resume logic is free: statuses live in catalog.json, so a crashed or stopped batch
   restarts with `catalog.py next`. Never regenerate `generated`/`approved` entries unless
   the user asks for a redo.
5. End of run: print dashboard (`catalog.py status`), top failure-log lessons, credits spent
   vs projected.

## Annotated scale variant (optional stage 8, zero credits)

For any approved photo where the option has stated measurements, draw exact callouts:

```
python scripts/annotate_scale.py photos/lapel/fashion-point-in-58cm/photo.png \
  --out photos/lapel/fashion-point-in-58cm/photo-annotated.png \
  --label "5.8 cm@412,318:512,590" --style luxury
```

You (Claude) look at the photo, pick the pixel start/end of the measured feature, and the
script draws the dimension line + label deterministically. This — not AI rendering — is the
honest way to show a customer true scale. Update `photo_annotated` in the catalog.
