# Subject-match audit — final verdict

_161 blueprints inspected by eye, 8 parallel batches, 2026-08-06. Zero image credits spent._

## Headline

| verdict | count | share |
|---|---|---|
| MATCH — the drawing depicts its label | **84** | 52% |
| MISMATCH — it depicts something else | **58** | 36% |
| AMBIGUOUS — right area, discriminator unreadable | **19** | 12% |

**More than a third of the generation queue was pointed at the wrong drawing.**

## The failure is concentrated, not random

| source directory | inspected | usable |
|---|---|---|
| **`/images/jacket/`** | 45 | **7%** |
| `/images/techpacks/shirt/` | 21 | 43% |
| `/images/blueprints/supplier/` | 5 | 60% |
| `/images/blueprints/factory/` | 25 | 64% |
| `/images/blueprints/remote/` | 14 | 71% |
| `first_button_distance`, `placket_button_position`, `back`, `hem`, `contrast_color_position`, `brand_label_position`, `collar_stand` | 26 | **100%** |

`/images/jacket/` is not a drawing library. It is tiles sliced out of a handful
of unrelated vendor sheets — a button product catalogue, a pocket-style chart,
a lapel style/width chart, an edge-topstitch chart — plus Chinese hand-sewing
spec text and blank frames. **483 catalog rows** depend on it (161 each across
sport-coat / suit-2pc / suit-3pc — the same shared jacket parts).

## Whole FIELDS were mapped to the wrong sheet

Not stray files — entire fields:

- **back-vent** — all three options ("Center Vent", "No Vent", "Side Vents")
  are crops of ONE lapel measurement chart, captioned 4.5/5/5.5/6/6.5 cm.
- **sleeve-buttonhole** — "By Hand" / "By Machine" are crops of a lapel
  buttonhole POSITION diagram ("Both sides" / "Each side" / "Right").
- **mp3-pocket ↔ pen-pocket** — swapped with each other.
- **inner-ticket-pocket** — the "illustrations" are Chinese spec text
  (手工封胸袋 / 手工捉袖山头里).
- **fabric_label_position** — byte-identical copies of brand_label_position,
  one of which is a text card reading "不订 / No Button".
- **one-piece collar "with Tab"** ×3 — none of the three drawings has a tab.
- **inner-pocket-closure** — `i-bartack` and `x-bartack` are the same image
  MIRRORED, so they differ by side, not by bartack type.

## Why no automated gate caught it

`blueprint_triage.mjs` scores whiteness, edge density and saturation. It
answers *"is this a drawing?"* — and for these tiles the honest answer is yes.
It rated the whole set **"LINE_DRAWING_SMALL … USABLE as a generation
reference."**

QC cannot catch it downstream either: QC scores fidelity to the reference, so
a faithful render of the WRONG drawing scores **higher**. The defect passes
triage, passes generation, passes QC, and ships.

## Free repairs — the correct file is already on disk

- `small-round-hem.jpg` and `small-round-hem-with-pentagon-gusset.jpg` exist,
  unreferenced, while both "Small Round Hem" options point at files
  byte-identical to the regular versions. One repoint each.
- `/images/jacket/shoulder-head/regular.jpg` is a UI **screenshot** — navy
  selection border and blue checkmark baked in. Subject correct, asset dirty.
- brand-label "Position 1" points at a Chinese "No Button" text card;
  "Position 5" points at a blank image.
- `buttonhole/hand-made.jpg` and `machine.jpg` are byte-identical (md5
  `568e2a13…`). Hand-vs-machine needs real macro photography; no drawing can
  express it.

## What is safe to generate

`tools/apply_subject_audit.mjs` intersects the queue with these verdicts:

    VERIFIED    88 clusters -> 120 rows   ~77 credits
    rejected    80 clusters -> 182 rows   (59 mismatch, 21 ambiguous)

**88 clusters are cleared to generate for ~77 credits** — roughly half the
original 142-credit estimate, and every one of them backed by a drawing a human
confirmed depicts its label.

## The real bottleneck

It was never a shortage of photographs. It is that a third of the catalog
points at the wrong drawing, and nothing automated could see it. The repair is
re-pointing, not generation — and the Baoxiniao craft dictionary captured today
(650 fields / 13,795 English labels across BB jacket, BC shirt, BD trousers,
BM vest) makes that possible BY NAME, at zero credit cost.
