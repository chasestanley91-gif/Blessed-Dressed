# Error taxonomy — Critical / Major / Minor

The old pipeline graded each score-card category pass/fail at 98 with no
distinction between "this is a completely different garment feature" and
"the stitch spacing is a hair off." That flattened very different failure
modes into the same bucket. This taxonomy exists so `log_qc_result.mjs` can
tell them apart — and so a batch report can say *what kind* of problem
occurred, not just how many options failed.

Every entry in `qc-input.json`'s `errors[]` array must carry exactly one of
these three severities.

## Critical

**The generated image represents the wrong construction entirely.** The
image model substituted a different category of feature, put it on the wrong
face of the garment, or omitted/added a major structural element.

Examples:
- A back pocket rendered on the front (or vice versa) — see
  tech-pack-interpreter's front/back lock.
- A different closure family entirely (zip fly generated for a button-fly
  option, hooks generated for a buckle adjuster).
- A different lapel/collar/pocket *category* standing in for the drawn one
  (peak generated for notch, spread generated for point) — generic-category
  substitution, the single most common failure this whole pipeline exists to
  prevent.
- A major feature from the drawing missing entirely, or a major feature
  present that the drawing doesn't show.
- The wrong garment part altogether (e.g. a waistband shot when the option
  was a lapel).

**Critical errors always block PASS and always trigger correction/regeneration.**

## Major

**The correct feature exists, but its execution is materially wrong.** The
image model got the right category of feature but rendered it incorrectly.

Examples:
- Pocket angle noticeably off from the drawing.
- Button/hook/loop count wrong (any count other than the exact value in
  `spec.forbidden`'s count constraints).
- Lapel width or gorge height materially different from the drawing.
- Feature placed in the wrong location on the garment (right feature, wrong
  spot).
- The garment shown from the wrong orientation relative to what the
  illustration depicts (see tech-pack-interpreter's `orientation-rules.md`) —
  even if every individual feature is otherwise correct.
- A forbidden feature from `spec.forbidden` appeared anyway.

**Major errors always block PASS and always trigger correction/regeneration.**

## Minor

**The construction is correct; the visual execution needs polish.** The
right feature, right count, right placement, right orientation — but small
imperfections in rendering quality.

Examples:
- Slightly inaccurate stitch spacing or thread thickness.
- A small proportion discrepancy that doesn't change the feature's identity.
- Minor fabric drape/behavior issues.
- A slightly imperfect crop that still clearly shows the focal feature.

**Minor errors do not block PASS by themselves.** If every score-card
category still reaches the 98 floor despite a minor error being noted, the
option can pass with the minor issue logged for visibility.

Minor is also the **only** severity a waiver can survive: once the retry
budget is spent, an image whose findings are all Minor and whose every
category is ≥ 95 ships as `PASS_WAIVED` instead of being lost to `UNMET`. A
single Critical or Major finding removes that possibility at any score.

That makes the Minor/Major boundary load-bearing in a way it was not before,
in **both** directions:

- Do not inflate a Minor to Major to be safe — that now costs the option its
  waiver and can strand a usable image at `UNMET`.
- Do not soften a Major to Minor to get an image through — that is the one
  remaining way to defeat this gate, and it ships the wrong construction to a
  paying customer. If the wrong *category* of feature is shown, or a count,
  placement or orientation is wrong, it is Major no matter how good the photo
  looks.

If a genuinely minor issue is severe enough to pull a category below 95, the
score gate handles it on its own — it can no longer reach even the waiver
floor, so there is no need to re-label the severity to block it.

## How this feeds the gate

`log_qc_result.mjs` computes the verdict from two independent signals that
must both agree:
1. **Score card** — every one of the 9 categories (`shape`, `geometry`,
   `dimensions`, `angles`, `construction`, `placement`, `symmetry`,
   `composition`, `blueprint-match`) must score ≥ 98. See
   `approval-rubric.md`.
2. **Blocking errors** — any `critical` or `major` error fails the gate
   regardless of scores. This exists because a single confidently-scored
   category can still hide a category-substitution error if the scorer
   wasn't looking for it — the explicit error list is the adversarial check
   the score card alone can't guarantee.

Both signals are required to PASS; either one failing produces FAIL (or, once
retries are exhausted, `PASS_WAIVED` if every category is still ≥ 95 with
zero blocking errors, otherwise `UNMET`).

Note the asymmetry between the two signals under a waiver: the score card has
a documented lower floor (95) that only opens after the retry budget is
spent, while the blocking-error signal has **no** lower floor at all. There
is no attempt count and no score at which a Critical or Major finding becomes
shippable.
