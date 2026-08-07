# The blueprint gate cannot see a wrong subject

_Found 2026-08-06 during the single-option validation run required before batch generation._

## What happened

The first cluster in the generatable queue — `sleeve-buttonhole-type/slbh-hands`
"By Hand", 3 catalog rows — was taken through the pipeline as the pre-batch
validation test. Its blueprint is:

    /images/jacket/sleeve-buttonhole/by-hands.jpg

Reading the file shows two jacket **fronts** captioned "Both sides" and "Each
side of…". Its sibling, `by-machine.jpg`, shows a jacket front captioned
"Right". Both are crops from a lapel-buttonhole **POSITION** diagram.

Neither depicts a sleeve buttonhole, and neither expresses hand-sewn versus
machine-sewn — which is the entire discriminator of the field they are
attached to.

## Why the existing gate passed them

`tools/blueprint_triage.mjs --all` classifies both as **LINE_DRAWING_SMALL**,
i.e. acceptable. It is not wrong: they ARE line drawings. The triage measures
whether a file is a drawing — edge density, dimensions, glyph-ness. It cannot
measure whether it is the RIGHT drawing, because subject matching is a visual
judgement, not a pixel statistic.

Catalogue-wide the triage reports: LINE_DRAWING 281 · LINE_DRAWING_SMALL 182 ·
SUSPECT 182 · NOT_A_DRAWING 11.

## Why this is the expensive kind of error

QC scores fidelity to the reference drawing. A render that faithfully
reproduces the WRONG drawing scores HIGHER, not lower. So this class of defect:

- passes blueprint triage,
- passes generation,
- passes QC,
- and ships a photograph of lapel buttonhole positions labelled "By Hand".

The project has already paid for this lesson twice (`coin-none` shipping a
photo of trousers for a jacket hip-pocket option; 83 of 85 colliding options
backed by UI glyphs rather than tech packs).

## What it implies for the queue

`tools/wave_queue.mjs` reports 162 generatable clusters → 295 rows, ~142
credits. That queue is gated on blueprint triage, which has just been shown
blind to subject mismatch. The first item in it fails on subject.

**A subject-match pass — does this drawing depict what its label claims? — must
run before credits are spent.** It requires actually looking at each drawing,
so it is a vision task per cluster, not a script. It costs no image credits.

## Status of the validation run

Stopped before `garment-image-director`. No credits were spent. No spec.json
was written for `slbh-hands`, because writing one would assert this blueprint
is a usable source for that option, and it is not.
