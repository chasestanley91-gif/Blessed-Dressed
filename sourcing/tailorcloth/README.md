# TAILORCLOTH — production partner packet

Supplier: **Tailorcloth S.C.**, Krakow, Poland (with Spanish operations)
Contact: **Michał Wojciechowski** — michal@tailorcloth.com · +48 698 692 402 · +34 684 053 938
Offering: Made-to-Measure shirts (MOQ 1) and Ready-to-Wear suits, shirts & knitwear (MOQ 1), private label, B2B only.

## Thread

| Date | Direction | Note |
|---|---|---|
| 2026-08-31 | out | Production partnership inquiry sent to office@tailorcloth.com |
| 2026-09-01 | in | Michał replies: asks business stage + monthly volume, mentions a required "starting pack", offers a video call |
| 2026-09-01 | out | This packet — capability documents, volumes, sample-garment request, full price sheet request |

## What was sent

| File | Contents |
|---|---|
| `Blessed-and-Dressed_Craft-Options-Catalogue.xlsx` | All 2,862 craft options across the 6 garment types, one tab each, with specification codes, variant groups, house defaults, and illustration/photo coverage flags |
| `Blessed-and-Dressed_Sample-Order-Form.xlsx` | Worked example order packet (BD-2026-0417): order header, body measurements, finished-garment measurements, and the 83-line craft specification |
| `Blessed-and-Dressed_Craft-Illustrations-Sample.pdf` | 48-drawing sample of the technical illustration library, 4 pages |
| `Sample-Suit_Double-Breasted-S120.jpg` | Reference suit — catalogue item r1 |
| `Sample-Shirt_Power-Blue-Birdseye.jpg` | Reference shirt — catalogue item r2 |

## Catalogue coverage at time of sending

| Garment | Option groups | Options | Illustrated |
|---|---|---|---|
| Shirt | 9 | 796 | 783 |
| Sport Coat | 10 | 377 | 181 |
| Suit (2-piece) | 18 | 600 | 353 |
| Suit (3-piece) | 26 | 733 | 468 |
| Trousers | 8 | 222 | 171 |
| Vest | 8 | 134 | 116 |
| **Total** | **79** | **2,862** | **2,072** |

## Volumes quoted to them

- Balance of 2026: **100 shirts, 75 suits**
- 2027: **300 shirts, 250 suits**

## Open asks

- [ ] Full wholesale price sheet — all five garment types, by construction level, incl. half- and full-canvas
- [ ] Lead times and minimum order requirements
- [ ] What the "starting pack" includes and what it costs
- [ ] Which of our catalogue options they cannot produce; which of their constructions we do not yet list
- [ ] Route to order one sample shirt and one sample suit
- [ ] Video call — availability offered, U.S. Central time

## Regenerating

Everything here except the two JPEGs is generated from `data-store/options/*.json` and
`src/components/MeasuringGuide.tsx`. The counts above move as the option catalogue grows, so
regenerate rather than editing by hand. From the repo root:

```sh
node   sourcing/tailorcloth/scripts/extract.mjs              # -> scripts/.data (gitignored)
python3 sourcing/tailorcloth/scripts/build-workbooks.py       # -> both .xlsx
python3 sourcing/tailorcloth/scripts/build-illustration-sheet.py   # -> the .pdf
```

Requires `openpyxl` and `pillow`. The workbooks carry `fullCalcOnLoad`, so the Overview totals
compute when the file is opened — openpyxl writes formulas without cached values, and
LibreOffice is not available in the container to bake them in.

The two sample JPEGs are converted from catalogue items `r1` and `r2` in
`data-store/products.json`.
