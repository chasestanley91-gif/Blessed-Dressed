# NEEDS-SOURCE — craft options that cannot be generated, and exactly what to supply

_Generated 2026-07-30. Machine-readable companion:
`public/images/reports/needs-source-register-2026-07-30.json`._

**Nothing here is a blocker you can fix with more effort.** These are options where the
authoritative drawing does not exist, or exists but provably depicts something else. The project
rule is that tech packs are law and missing tailoring detail is never invented — so these options
are held, not guessed.

Every claim below was verified against the filesystem on 2026-07-30, not carried forward from a
prior report.

| # | category | scope | what unblocks it |
|---|---|---|---|
| A | No illustration at all | **91 drawings** (162 option rows, 31 fields) | supplier line drawings |
| B | AMF stitching has no authentic artwork | **6 options** | genuine AMF/pick-stitch drawings |
| C | Collar stitching filenames misdescribe contents | **5 files** | a human decision to rename |
| D | `loops-5` has no blueprint | **1 option** | a 5-loop belt-loop drawing |

---

## A — 91 drawings needed (162 rows, 31 fields)

These in-scope options have `illustration: null`. The 162 rows collapse to 91 distinct identities
once cross-product duplicates are removed (keyed `part | field | option | label`), so **91 drawings
unblock all 162 rows.**

Largest clusters:

| field | drawings needed | rows | examples |
|---|---|---|---|
| `waistband-width` | 10 | 15 | 3.5 cm · 3.8 cm · 4.0 cm |
| `waistband-style` | 8 | 12 | Extended Tab · Elasticated Insert · Double Waistband |
| `leg-shape` | 8 | 12 | Tapered · Straight Cut · Wide Leg |
| `waistband-canvas` | 8 | 12 | Fused (Standard) · Full Canvas · Half Canvas |
| `lapel-width` | 6 | 6 | Narrow 6 cm · Standard 7.5 cm · Wide 9 cm |
| `center-seam` | 4 | 6 | Open Seam · Flat-Fell Seam |
| `hem-style` | 4 | 6 | Fringe Edge · Unfinished (Raw Edge) |
| `buttonhole-type-vest` | 4 | 4 | Machine Stitched · Handmade Round |
| `pocket-depth` | 3 | 9 | Shallow (20 cm) · Standard (23 cm) · Deep (26 cm) |
| `center-crease` | 3 | 9 | Pressed (Standard) · No Crease · Fused (Permanent) |

Full per-field breakdown in the JSON under `categories.A_no_illustration_at_all.byField`.

**A note on the dimensional families.** Several of these (`waistband-width` at 3.5/3.8/4.0 cm,
`pocket-depth` at 20/23/26 cm, `lapel-width` at 6/7.5/9 cm) carry their measurement in the label.
It is tempting to generate them from the label alone without a drawing. Resist that for the
millimetre-scale ones: the measured stitch ladder proved that sub-centimetre differences do not
render distinguishably at normal framing (0.312 → 0.404 → 0.316 → 0.476 button-diameters — the
0.5 cm rung inverted against 0.1 cm). The centimetre-scale families here (`leg-shape`,
`lapel-width` at 6 vs 9 cm, `pocket-depth` at 20 vs 26 cm) are plausibly photographable and are
the better candidates if you want to proceed without supplier drawings — but that is a policy
decision, and it weakens "the drawing is law" from a guarantee to a convention.

---

## B — AMF stitching: no authentic artwork exists (6 options)

The catalog sells AMF (hand-picked) stitching as distinct from machine TOP stitching. **There is
no AMF drawing anywhere in the repo.**

Verified by md5 on 2026-07-30, `public/images/decoration_stitching_on_cuff/`:

```
9a634c7a8120  machine-01cm-amf-stitching.jpg   ┐ byte-identical
9a634c7a8120  machine-01cm-top-stitching.jpg   ┘
550a2d999842  machine-03cm-amf-stitching.jpg   ┐ byte-identical
550a2d999842  machine-03cm-top-stitching.jpg   ┘
e0700432aa6a  machine-05cm-amf-stitching.jpg   ┐ byte-identical
e0700432aa6a  machine-05cm-top-stitching.jpg   ┘
```

Every `-amf` file is a copy of its same-cm `-top` file.

**Required:** supplier drawings showing genuine AMF/pick stitching — visibly hand-worked, with the
irregular pick spacing that distinguishes it from a machine top-stitch — at 0.1 / 0.3 / 0.5 / 0.6 cm.

**Until then these must not be generated.** An "AMF" photo rendered from a TOP drawing would be a
fabricated distinction sold to a customer who is paying for hand work.

---

## C — Collar stitching filenames misdescribe their contents (5 files)

In `public/images/decoration_stitching_on_collar/` the filenames do not match what the drawings
depict. Anyone binding a blueprint by filename gets the wrong drawing.

Verified by md5 on 2026-07-30:

```
8e910bc6bbdd  machine-01cm-top-stitching.jpg  ┐ byte-identical duplicates
8e910bc6bbdd  machine-03cm-top-stitching.jpg  ┘
7a75c65c1f4f  machine-05cm-top-stitching.jpg  ┐ byte-identical duplicates
7a75c65c1f4f  machine-06cm-top-stitching.jpg  ┘
```

Only **4 distinct annotated drawings + 1 stray** exist for what the catalog sells as 8 rungs. The
true mapping, read from each drawing's own annotation:

| actual measurement | file that depicts it |
|---|---|
| 0.1 cm | `machine-03cm-amf-stitching.jpg` |
| 0.3 cm | `machine-01cm-top-stitching.jpg` |
| 0.5 cm | `machine-05cm-top-stitching.jpg` |
| 0.6 cm | `machine-01cm-amf-stitching.jpg` |

`machine-05cm-amf-stitching.jpg` carries **no callout** and shows a bright-red zigzag edge stitch —
it most likely belongs to the zigzag collar option, not this ladder.

**Already handled:** the 8 TOP options were bound by **annotation, not filename** (blueprint law
over filename), and the 6 AMF options were routed to needs-source.

**Required:** a human decision to rename these files on disk to match their contents. Not done
autonomously — renaming supplier assets is destructive and other tooling may reference the current
paths.

---

## D — `loops-5` (1 option)

`belt-loops / loops-5` ("5 Loops") has no blueprint and currently displays the **7-loop** photo.
This is the live `SHIPPED_IMAGE_REUSED` blocking finding.

**Required:** a supplier drawing of a 5-loop belt-loop layout.
**Until then:** do not guess a loop count — a belt-loop count is exactly the sort of detail a
customer can verify at delivery.

---

# 2026-07-31 UPDATE — three new categories, found by looking at the drawings

The 2026-07-30 register above covered options with **no** drawing. Running the first
generation waves surfaced a larger and more dangerous class: options that **have** a
drawing which is not a technical drawing at all, or is a drawing of something else.

These matter more than an absent blueprint, because an absent blueprint stops the
pipeline while a wrong one sails through it. `garment-image-qc` scores fidelity **to
the blueprint**, so the more faithfully a wrong reference is reproduced, the higher it
scores. Two false approvals have already been traced to exactly this.

| # | category | scope | what unblocks it |
|---|---|---|---|
| E | The file is not a technical drawing | **23 clusters / 31 rows** | a real drawing, or delete the option |
| F | Cannot be verified as a drawing from its pixels | **414 clusters / 633 rows** | a human ruling per directory |
| G | The drawing depicts a different part than the field claims | **15 clusters** | the correct drawing, or a field/label correction |

Machine-readable: `public/images/reports/blueprint-triage.json` (E and F) and the
per-cluster `blockedBy` field in `public/images/reports/wave-queue.json`.

---

## E — the file is not a technical drawing (23 clusters, 31 rows)

Verified from the pixels by `tools/blueprint_triage.mjs`, which measures canvas,
paper-white fraction, Sobel edge density, soft mid-grey mass and mean saturation, and
prints both populations under `--calibrate` so the thresholds can be argued with.

Confirmed examples, each opened and looked at:

| catalog path | what the file actually is |
|---|---|
| `/images/jacket/underarm-shield/*.jpg` (8 files) | crops of **button photographs** — a grey disc with a red X, a two-hole button, a partial button rim |
| `/images/jacket/inner-ticket-pocket/left-and-right.jpg` | blank frame |
| `/images/jacket/sleeve-vent/functional-mock.jpg` | blank frame |
| `/images/brand_label_position/picture-1116.jpg` | blank frame |

`perfume-pad` is the one to note: 8 clusters and 24 catalog rows, and the **highest
leverage work in the entire queue**. It was first in line to be generated.

**To unblock:** supply a real underarm-shield drawing per shape (triangle, three round
variants, three U variants), or accept that the shapes are not documented and merge them.

---

## F — cannot be verified as a drawing from its pixels (414 clusters, 633 rows)

Every genuine supplier drawing in this repo is authored at **1200×1200**. This tier is
**240×200** — UI thumbnails scraped from a configurator, not tech packs. The
distribution is sharply bimodal: 424 blueprints under 250px against 169 at 1200px, with
only 21 files anywhere in between.

The verdict is deliberately `SUSPECT`, not `NOT_A_DRAWING`. At 240px the pixels genuinely
cannot settle it, and saying otherwise would be the same overreach in the other
direction. A 24-file sample, one per directory, found the tier badly mixed:

**Not drawings** — horn-button product photos under `chest-dart`; photographs of fabric
bolts under `facing-style`; thread colour cards under `half-lining-craft`; fabric print
swatches under `coin-pocket` and `lower-pocket-bartack`; a fabric label reading "Blue grey
jacquard FB166167" under `ticket-pocket`.

**Genuine drawings, filed under the WRONG field** — `columbia-piping/columbia-and-piping.jpg`
is a LOWER POCKET drawing captioned "Regular Slanted Flap in 4.5cm";
`external-decoration/none.jpg` is a sheet of LAPEL drawings;
`contrast-position/chest-pocket.jpg` is a canvas/chest-piece drawing;
`back-vent-style/side-belt.jpg` is a collar/lapel drawing.

**Genuine drawings, correctly filed** — `canvas/half-canvas.jpg`, `mp3-pocket/left.jpg`,
`sleeve-head/natural.jpg`.

**To unblock:** rule per directory, not per option — the contamination is directory-shaped.
`node tools/blueprint_contact_sheet.mjs <garment/Category>` builds a numbered, captioned
grid for any supplier category so the comparison can actually be made.

---

## G — the drawing depicts a different part than the field claims (15 clusters)

Each of these was refused by a generation agent that opened the drawing and compared it
against the field before spending a credit. None was generated.

| option(s) | field says | the drawing shows |
|---|---|---|
| `darts-none`, `darts-single`, `darts-double` (×3 products) | back darts | a trouser **FRONT** — fly J-stitch, belt loops, slant side pockets, red marks on the front panel. Sourced from the supplier's `Style_Pleat_style_Pleat_style` category, which is front pleats. The same `302L` drawing also backs `flat-front`, which is the correct use. |
| `fly-stitch-straight` (×2 products) | fly stitching | red marks lie along both **side pocket openings**; the fly is completely unmarked. The file is from the `31Ax` *pocket*-stitching series. |
| `hem-cuff-32` "3.2 cm Cuff Turn-Up" | a turn-up | a red marker line above a plain hem edge — **no turn-up band, no fold edge, no second construction line**. Verified at 8× magnification. |
| `hem-single-turnup` "4.4 cm Cuff Turn-Up" | a turn-up | identical evidence |
| `vest-chest-both-besom-flap` "Besom with Flap" | a flap | a plain welt rectangle, shape-identical to its non-flap sibling (62×31px vs 60×27px — stroke weight only). **No flap drawn.** |
| `vest-lower-slant-flap` "Slant Besom with Flap" | a flap | the slant is drawn; the flap is not |
| `back-left-welt` "Left Welt with Button" | one left welt | **both** welt pockets, each with a button. Its sibling `back-left-jetted` correctly draws one, so the supplier does draw single-sided options as single — the two-pocket drawing here is meaningful, not shorthand. |

**To unblock:** either the correct drawing, or a correction to the field/label. Note the
last row cuts both ways — if the drawing is right, the label is wrong and the option is
mis-sold.

---

## Also worth a ruling, though not blocked on source

- **Six hem options share one base drawing.** `hem-76` (7.6), `hem-machine-plain` (7.0),
  `hem-blind` (6.4), `hem-single-turnup` (4.4), `hem-cuff-32` (3.2),
  `hem-fixed-topstitch` (2.5) are the same silhouette with a red marker at yFrac
  0.878–0.910. **7.6 and 7.0 are pixel-identical.** They cannot yield visually
  distinguishable photographs.
- **`ext-curved` and `ext-pointed` look swapped.** `ext-curved` is labelled "Square, Hook
  & Button" and drawn square; `ext-pointed` is labelled "Round" and drawn round. Label and
  drawing agree in both cases, so generation followed them — but the ids are misleading.
- **A hard model limit, measured.** `gpt_image_2` has a prior on cuff depth that three
  escalating instructions could not move: a quantified "one fifth of the hem width" ratio
  plus "err on the side of too shallow" took the band from 0.336 → 0.284 → 0.270 against a
  0.212 target, then plateaued. If the 4.4 / 5.1 cm cuff pair matters commercially it needs
  a different mechanism — an in-frame scale reference, or accepting that sub-centimetre
  depth is below what this model resolves.
