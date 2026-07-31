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
