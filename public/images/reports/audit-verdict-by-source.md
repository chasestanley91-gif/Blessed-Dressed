# The bad drawings are concentrated in ONE directory

_Interim result, 4 of 8 audit batches (77 blueprints inspected by eye)._

## Verdicts by source directory

| source directory | match | mismatch | ambiguous | usable |
|---|---|---|---|---|
| **`/images/jacket/`** | **0** | **36** | 2 | **0%** |
| `/images/blueprints/remote/` | 7 | 0 | 2 | 78% |
| `/images/blueprints/supplier/` | 3 | 0 | 1 | 75% |
| `/images/blueprints/factory/` | 2 | 4 | 2 | 25% |
| `/images/back/` | 4 | 0 | 0 | 100% |
| `/images/collar_splicing/` | 2 | 0 | 0 | 100% |
| `/images/brand_label_position/` | 2 | 0 | 0 | 100% |
| others (cuff_pleat, sleeve_tab, options, …) | 4 | 2 | 2 | mixed |

Running total: **26 match · 42 mismatch · 9 ambiguous**.

## What this means

`/images/jacket/` is not a supplier drawing library. It is a set of tiles
sliced out of a handful of unrelated vendor sheets — a button product
catalogue, an exterior pocket-style chart, a lapel style/width chart, an
edge-topstitch chart — plus some Chinese hand-sewing spec text and some blank
frames. **Not one of the 38 audited drawings from it depicts its own label.**

Concrete examples:
- chest-dart "+2 cm" -> a button page, "N304/FK3132BK HORN BUTTON"
- hem "Large Curved Bottom" -> a single button, "BK219/FK763274"
- back-vent "Side Vents + Inner Belt" -> lapel-width chart "7.5cm", with a
  stray website "Search" box still in frame
- inner-ticket-pocket "Left" -> Chinese spec text (手工封胸袋 / 手工捉袖山头里)
- mp3-pocket and pen-pocket are swapped: mp3-pocket shows the pen-pocket grid,
  pen-pocket shows lapel-gorge crops with no pocket at all
- inner-pocket-closure "I-Bartack" and "X-Bartack" are the SAME image mirrored,
  so they differ by side, not by bartack type

By contrast the genuine supplier libraries — `/images/blueprints/supplier/`,
`/images/blueprints/remote/` — are 75-78% usable, and several per-field
directories are 100%.

## Blast radius

**483 catalog rows** carry a drawing under `/images/jacket/`, spread evenly
across the three jacket products (161 each — the same shared jacket parts).
Worst-affected fields: button-config 42 · ticket-pocket 33 · contrast-position
27 · facing-style 24 · perfume-pad 24 · pen-pocket 21.

## Why no automated gate caught it

`blueprint_triage.mjs` scores whiteness, edge density and saturation — it
answers "is this a drawing?", which for these tiles is genuinely YES. Subject
match is a visual judgement. And QC cannot catch it downstream either, because
QC scores fidelity to the reference: a faithful render of the wrong drawing
scores HIGHER.

## The fix, and what it is not

It is not more generation. Generating from these references produces confident,
well-scored photographs of the wrong feature.

It is re-pointing: the Baoxiniao craft dictionary captured today (650 fields /
13,795 English labels across BB jacket, BC shirt, BD trousers, BM vest) lets an
option be matched to a genuine supplier drawing BY NAME. That work costs no
image credits.
