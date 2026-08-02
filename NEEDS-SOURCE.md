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

---

# Added 2026-08-01 — findings from the live-catalog audit

## 1. `jacket/front-style/` — an ENTIRE FIELD with no usable drawing

Triage over the whole folder: **13 files, 13 failures.** Four are `NOT_A_DRAWING`, nine `SUSPECT`.
All are 240×200; white fraction 0.000–0.430 against the 0.75 floor a genuine small drawing clears;
saturation 1.3–45.2. They are fabric swatches and scraped page fragments.

```
sb-1  sb-2  sb-3  sb-4  sb-3-roll-2  sb-4-roll-3  sb-5
db-2x1  db-4x1  db-4x2  db-6x1  db-6x2  db-6x3
```

**Every jacket button-stance option — single- and double-breasted — has no authentic source.** This
is already causing a live defect: `sb-4` renders three buttons for a four-button option, and one file
serves `sport-coat`, `suit-2pc` and `suit-3pc`, so it is wrong on three products at once.

**The equivalent waistcoat drawings exist and are genuine** — `/images/options/vest/sb-3.jpg`,
`db-4x2.jpg` etc. are 1200×1200 line art. So the supplier draws these; the jacket set is simply
missing from this repo. **That makes it a request, not a research problem.**

## 2. The canvas field — one sheet for five different extents

`83dbc62b46ef__00C3__Single_layer.jpg` is the **only** canvas sheet in `public/images/blueprints`,
and the catalog carries five extent options: quarter / half / light-half / ultra-thin-half / full.

Worse, the sheet documents a **different distinction entirely**. Its title is "Single layer" — a
layer *count*. The options are about *extent*. And its drawn pad-stitched canvas descends to 58% of
forepart height, which is half-canvas territory, not the "top quarter" the quarter-canvas description
claims.

Needed: one drawing per extent, or a ruling that the five options collapse.

## 3. Hand-versus-machine buttonholes cannot be drawn from source

`buttonhole/hand-made.jpg` is **byte-identical** to `buttonhole/machine.jpg`. One drawing under two
filenames. This extends the known AMF finding — where every `-amf` file is byte-identical to its
`-top` sibling — to a second family.

`bh-hand` and `bh-machine` therefore cannot be told apart from any source material in this repo.

## 4. `decoration_stitching_on_placket/` holds exactly one file

`stitch-01-inner-plain` and `stitch-01-top` both point at
`machine-01cm-top-stitching-on-inner-plain-placket.jpg` because it is the only file in the directory.
There is no second drawing to point at.

## 5. Two options that cannot be photographed distinguishably at all

Recorded so no further credits are spent trying:

- **`suit-2pc/cd-minus-3`** — a ±cm chest-dart *position* adjustment. −3, −2, standard, +2 and +3
  cannot differ in a photograph; the dart looks the same wherever it sits. Its "blueprint" is also a
  screenshot of a supplier **button** catalogue page.
- **`suit-2pc/heel-none`** — an absence on the **inside back** of the hem. The shot would have to
  show the inside of the trouser leg, and even then the option is the absence of a tape a customer
  never sees.

These need a diagram, a text note, or removal from the picker — not a photograph.

## 6. The peak-lapel ladder, quantified

Previously recorded as unfinishable. Now measured: **one photograph
(`generated/jacket/lapel-peak-101.webp`) serves ten options across three products — 30 catalog
rows.** `lapel-peak-101, -102, -102-rl, -103-curved, -105, -107, -108, -110, -110-low, -115`.

`collision_triage.mjs` confirms all ten resolve to **one** blueprint file, so this is source-limited
in the strict sense: no prompt can separate them and QC actively drives them together.

## 7. Possible duplicate option, worth a catalog ruling rather than a drawing

`lp-jetted-4` ("Straight Jetted Pocket 4 cm") and `lp-straight-jetted` ("Straight Jetted Pocket")
share one drawing and differ only by a centimetre figure appearing in one of the two names. They may
be the same option listed twice.

## Shape vocabulary gaps (2026-08-01)

`lapel-fishtail` now extracts **zero** shapes. Before its description was rewritten it extracted
`notch lapel` AND `peak lapel` — both scraped from the sentence "more formal than a standard notch
and less aggressive than a peak", neither of which the option has. Zero is strictly better than two
wrong ones, and the description now carries the geometry in prose, but the SHAPES vocabulary in
`spec.mjs` has no entry for this form.

Candidates for a vocabulary entry, all currently unrepresented:
- **fishtail / cran Camps / cran parisien** — the closed horizontal junction where lapel meets collar
- **D-shawl** — currently resolves to the generic `shawl lapel`, losing the D profile entirely

Not added unilaterally: adding a shape term changes what every matching description extracts across
2,658 rows, and the pocket/jeans/neckline families added today were only safe because the blast radius
was measured first (39 changed, 0 emptied, 0 gained). The same measurement should be run before adding
any lapel term.


## E — patch-collision members with NO drawing (added 2026-08-02)

Nine members of the f7fa88b7d6d1 collision family have `illustration: null` and their
variant geometry (tab terminal shape round/straight/angled, pleat count, water-drop
profile) is not in the owner drafting specs. Per the never-invent rule they are HELD for
the baoxiniao harvest or per-option owner specs:

- `cp-patch-angled`
- `cp-patch-multi`
- `lp-patch-flap-btn`
- `lp-patch-btn-tab-round`
- `lp-patch-btn-tab-straight`
- `lp-patch-btn-tab-angled`
- `lp-water-drop`
- `cp-inverted-pleat-flap`
- `cp-inverted-pleat-2flap`


## F. OWNER DECISION — flap-depth ladder pairs at the render resolution floor (2026-08-02)

The two hip-flap ladders (slanted 02A1, straight 0201; depths 4.0-6.5 cm in 5 mm rungs) were shot as
anchored SETS. Nine of twelve rungs certified and shipped: the sets order cleanly at coarse grain
(shallow < middling < deep). Three rungs FAILED the adjacent-pair blind-ordering gate after an
anchored round-2 retry and are HELD unshipped per ladder protocol:

| rung | vs lower sibling | vs upper sibling | held because |
|---|---|---|---|
| lp-slanted-flap-55 (att 2) | CLEAR (d/W 0.42 vs 5.0 at 0.38) | AMBIGUOUS (0.42 vs 6.0 at 0.41-0.44) | upper pair inside noise |
| lp-straight-jetted-50 (att 2) | CLEAR (0.40 vs 4.5 at 0.35) | AMBIGUOUS (0.40 vs 5.5 at 0.40) | upper pair inside noise |
| lp-straight-jetted-60 (att 2) | AMBIGUOUS (0.39 vs 5.5 at 0.40) | AMBIGUOUS (vs 6.5 at 0.41) | model saturates ~0.40 for all rungs >= 5.5 |

MEASURED FINDING: the generator resolves roughly THREE flap-depth levels (shallow ~0.35, middling
~0.38-0.40, deep ~0.41-0.44), not six. A 5 mm rung is ~3.6% of the flap width — at/below the render
noise floor, exactly the regime the project plan predicted for 2 mm-1 cm families.

OWNER OPTIONS: (1) accept the attempt-2 images with a waiver (attempt 3 + >=95 waiver path exists);
(2) reduce the catalog to fewer visually-distinct depth steps (e.g. 4.0 / 5.0 / 6.0 or shallow-classic-deep);
(3) supply per-rung supplier drawings with drawn depth differences to trace. Nothing was shipped for
these three rungs; their shipped neighbours all order correctly against each other.


## G. POLLUTED BLUEPRINT NAMESPACE — /images/jacket/ assets are not all drawings (2026-08-02)

VISION-CONFIRMED: the ticket-pocket family's referenced "drawings" are MIS-MAPPED FABRIC SWATCH
CARDS (jacquard swatches, Chinese labels, FB1662xx codes) — public/images/jacket/ticket-pocket/
jetted.jpg, welt.jpg, none.jpg all verified by eye. Also confirmed: columbia-piping/none.jpg is a
CATEGORY-PAGE SCREENSHOT GRID (it shows the real drawings as thumbnails — proof they exist
upstream at mtm.baoxiniao.co), and coin-pocket/right.jpg is a swatch grid with a NO IMAGE cell.

Mechanical census: 432 catalog rows reference 129 distinct /images/jacket/ files across 25 fields.
Heuristic classifier (white-fraction + saturation): 99 LIKELY_DRAWING / 16 SUSPECT / 14 NOT_A_DRAWING
— register at public/images/reports/jacket-asset-triage-2026-08-02.json. The classifier UNDER-flags
(swatch cards have white backgrounds), so the binding CAMPAIGN POLICY is now:

> Any option whose only illustration lives under /images/jacket/ gets a one-Read VISION CHECK of
> the file before any credit is spent. A swatch card, screenshot grid, or photo blocks generation
> and routes the option here.

BLOCKED pending harvest (vision-confirmed junk blueprints):
- tp-none, tp-jetted, tp-welt, tp-card-italian, tp-card-formal, tp-rl-card, tp-flap-40/45/50/55/60 (11)
- itp-none, itp-left, itp-right, itp-both (4, same folder family — spot-check on harvest)
- cp-none (columbia-piping/none.jpg is a screenshot grid)
- jacket-section coin-pocket identity (coin-pocket/*.jpg swatch grids) — trouser-section coin rows
  are already verified from real 353x drawings and unaffected

These join the harvest want-list; the 0d2d49e supplier-mapping restoration should be re-checked
against this register when credentials arrive.


## H. OWNER QUESTION — lp-jetted-4: what does the "4 cm" denote? (2026-08-02)

lp-jetted-4 ("Straight Jetted Pocket 4 cm") and lp-straight-jetted ("Straight Jetted Pocket")
share drawing 0231 and construction-identical descriptions (flapless double-jet hip pocket).
No authority explains the 4 cm: the owner drafting spec gives jetted OPENING 13-15cm and jet
width 0.8-1.2cm — neither is 4cm. Cannot photograph a distinction that no source defines;
lp-straight-jetted shipped, lp-jetted-4 HELD pending the owner's definition (or merge/retire).


### G (extension, 2026-08-02): jacket pocket-bartack + inner-pocket-closure also polluted

Vision-confirmed: /images/jacket/pocket-bartack/d-bartack.jpg and x-bartack.jpg are LINING SWATCH
GRIDS (paisley/printed linings, FB26xxxx codes). Blocks the jacket bartack family: bartack-none,
bartack-d, bartack-i, bartack-x, bartack-1 (5) and inner-pocket-closure ipc-d/i/x (3, same folder
family). The TROUSER-side knot family (knot-i/d/dash, bartack-standard, back-seam-no-bartack) uses
the real /images/blueprints/ namespaces and remains generable.

## I. Git pack warning (2026-08-02) — owner FYI, no action taken
git prints "unknown object type 0 at offset ... pack-2230b4e3..." during some operations.
"git fsck --connectivity-only" shows HEAD history fully reachable (only normal dangling blobs), and commits continue to succeed.
The bad region appears to hold only unreachable objects. Recommended when convenient: back up the .git folder, then run "git repack -ad" to rewrite packs.
Not attempted autonomously mid-campaign.

## J. Terminal UNMET options (2026-08-02) — owner decision needed, 8 options
These exhausted the 3-attempt budget without reaching either the >=98 pass bar or the >=95 minor-only
waiver bar. The pipeline treats UNMET as terminal, so they will not be retried automatically. They are
NOT unpublished — each keeps serving whatever image it had, because a flawed photo still beats none.

  shirt/collar-small-sq-50
  shirt/collar-sq-65-btn
  shirt/stitch-01-inner-plain
  sport-coat/quarter-canvas
  suit-2pc/back-left-patch
  suit-2pc/hem-single-turnup   (NOTE: the suit-3pc twin of this option shipped successfully today
                                against the same drawing — this record simply ran out of attempts
                                first. Cheapest fix of the eight.)
  suit-3pc/vest-chest-both-besom
  suit-3pc/coin-left           (also the known divergent-blueprint case — two coin rows, two drawings)

Owner options for each: (a) authorise a budget reset so the pipeline may try again with fresh
corrections, (b) accept a sibling record's image where the drawing and label genuinely match
(hem-single-turnup is the clear candidate), or (c) leave as-is and revisit after the baoxiniao harvest
supplies better drawings.

## K. The two BLOCKING findings are gated on missing drawings, not on effort (2026-08-02)

I checked every option in both blocking findings against the index. The result is unambiguous and it
changes how the FACTORY_USER / FACTORY_PASS request should be prioritised.

DISTINCT_OPTION_IMAGE_COLLISION — 8 groups, 38 option slots. Of those 38, **37 have no illustration at
all** (illustration: null, blueprint: none). They are all already inside category A above. The eight
groups are legacy photos, each wired to many distinct options, and they cannot be separated because
there is nothing to photograph the separate options FROM:

  f7fa88b7d6d1  9 options — chest/lower patch + inverted-pleat pockets   0 drawings
  d3e9123ef264  6 options — slanted flap / straight jetted rungs         3 drawings (all 3 owner-held, category F)
  277a61bd89f8  6 options — large slanted family                         0 drawings
  bd8b61e8d40d  6 options — inverted / box pleat flap family             0 drawings
  8559bce7d538  4 options — jetted-4 + welt 10/12/15                     1 drawing (lp-jetted-4, category H)
  a673d2f8828c  3 options — british / turnback cuffs                     0 drawings
  55116eb64714  2 options — angled / square cuffs                        0 drawings
  0634a8c204cd  2 options — loops-standard + loops-5                     1 drawing (loops-standard only)

SHIPPED_IMAGE_REUSED — 1 finding: loops-5 displays the loops-standard photo. Category D already records
that this needs a 5-loop drawing. Generating loops-standard again does NOT clear it, because loops-5
would still be pointing at that same file; the finding only clears when loops-5 gets its own image, and
a belt-loop COUNT is precisely the kind of detail a customer verifies at delivery, so it must not be
guessed.

**Bottom line: no amount of further autonomous work clears either blocking finding.** Both are waiting
on supplier drawings. That makes the mtm.baoxiniao.co credentials the single highest-value thing you
can hand over — they would unblock these 2 blocking findings, the ~25 options behind the polluted
/images/jacket/ namespace (category G), and the original 91-drawing want list (category A), all at once.

---

## L. WRONG-queue holds — 6 options whose reference cannot support a re-shoot (2026-08-02)

Thirty options whose live photo was graded WRONG were re-read against their references
before re-shooting. Twenty-four proceeded (five of them rescued by the drafting specs,
logged in `data-store/drafting-specs/spec-conflicts.log.md`). These six did not, and
are held rather than shot, because shooting them would reproduce the same WRONG verdict
at real credit cost.

### L1. Waistcoat canvas construction — 3 options, no authority and no separation
`suit-3pc|vest / vest-canvas-half`, `vest-canvas-single`, `vest-canvas-uncon`

- The drafting-spec library contains **no waistcoat canvas content at all** — the ruling's
  first authority is simply absent for this field.
- `vest-canvas-half` and `vest-canvas-single` are **different files with near-identical
  geometry**: same ink bounding box (≈208–994 × 45–1156), same zone boundaries, same
  pocket, same callout placement. The only measurable difference is that the chest hatch
  is 25–30 % lighter in `single`. Canvas half-vs-full is normally read from *coverage
  extent*, and these drawings do not differ in extent — so two photographs shot from them
  could not be told apart, which is the whole test this catalog has to pass.
- `vest-canvas-uncon` ("Unconstructed Chest") **contradicts its own label**: the drawing
  shows a fully interlined, canvassed front with a discrete chest-piece shape and a taped
  front edge. Nothing in it indicates the absence of canvas.
- Compounding this, all three are interior-construction options: a photograph of a finished
  waistcoat front cannot show what is inside it. These need a cutaway or interior view, and
  a decision on what each of the five levels (full / half / uncon / single / fused) actually
  looks like in the factory's construction.
- **Owner input needed**: the construction definition for each of the five canvas levels, or
  confirmation that this field is not photographable and should be excluded.

### L2. `suit-3pc|vest / vest-contrast-specify-seam` — a placeholder, not a geometry
Label "Specify Seam" in field `contrast-pocket-vest`. This is a customer-specifies option
with no determinate geometry — there is no single seam to photograph. The reference marks
the two pocket mouths. **Recommend excluding it** alongside the other `None`/placeholder
options, unless the owner intends a specific default seam.

### L3. Lapel buttonholes — a 56-option family referenced by photographs
`sport-coat|suit-2pc|suit-3pc / lbh-no1-dc-straight`, `lbh-no1-tc-arc`

Both were in the WRONG queue; both are held, and the reason generalises to the whole
`lapel-bh-style` field, which carries **56 options** across three products:

- Their references are **high-magnification colour photographs of real embroidery**, not
  line drawings. For hand-worked decorative buttonholes ("Rose Shaped Round", "Musical
  Note", "Dragon Horn", "Angel of Happiness") a macro photograph is arguably the *correct*
  manufacturing reference — but it is exactly what `blueprint_triage` classifies
  `NOT_A_DRAWING`, and what `wave_queue` refuses. The family needs one policy decision, not
  56 individual overrides.
- **Both register paths are stale.** The paths on file
  (`…e346a69313a8__055R__No.1_Double_color_straight.jpg`,
  `…a1cc16870a6b__055Y__No.1_Tri-color_arc.jpg`) do not exist; the real files were found only
  by hash prefix under longer supplier names. The whole family likely needs a blueprint
  repoint before anything is shot.
- `lbh-no1-tc-arc` additionally **contradicts its label**: it is "Triple-Color Arc", but
  colour sampling along the buttonhole returns green → pink → **green** — only two distinct
  threads. Shot faithfully, a three-colour option would ship as a two-colour photograph.
- Several options in this family are separated from their siblings **only by thread colour
  count** (Double-Color vs Triple-Color at the same shape). The mission excludes thread
  colours; the straight-vs-arc axis is genuine geometry. The owner should rule on where the
  line falls before 56 × 3 rows are worked.
- **Owner input needed**: (a) may photograph-type references be used for this family;
  (b) repoint the stale supplier paths; (c) are colour-count-only variants in or out of scope.
