# Comparison rules — how to actually do the visual check

`compare_prep.mjs` hands you everything you need in one call: the
illustration path, the candidate image path, the per-option `checklist[]`
(derived from the spec — garment-image-director's `buildChecklist()`), the
9-category `scoreCard`, and the `forbidden[]` list. This document is how to
use them.

## The 17-point inspection

Walk these in order. Most map directly to a `scoreCard` category — noted in
parens.

1. **Orientation** — does the candidate show the same face of the garment
   the illustration does? (`blueprint-match`, `composition`)
2. **Outer silhouette** — does the overall garment shape match?
   (`shape`)
3. **Feature count** — every countable element (buttons, buttonholes,
   hooks, loops, pleats) exactly matches the spec's `measured.counts`.
   (`dimensions`, `construction`)
4. **Feature placement** — each feature sits in the same location on the
   garment as drawn. (`placement`)
5. **Feature angle** — angles (lapel points, extension-tab corners, pocket
   welts) match `measured.angles`. (`angles`)
6. **Feature size** — proportions and relative sizing match. (`dimensions`)
7. **Seam placement** — structural seams read in the same positions.
   (`construction`, `placement`)
8. **Pocket type** — jetted/flap/patch/welt/barchetta etc. matches the
   drawn shape exactly, not just "a pocket." (`shape`, `construction`)
9. **Pocket position** — on the correct panel, correct height. (`placement`)
10. **Closure type** — zip/button/hook, single/double, matches exactly.
    (`construction`)
11. **Waistband construction** — for waistband-family options, the specific
    engineering family (width/extension/hardware/adjuster/loops) reads as
    the dominant subject, not a generic waistband. (`blueprint-match`)
12. **Button count** — see feature count above; called out separately
    because it's the single most common miscounted element.
13. **Belt-loop count** — as above.
14. **Stitching** — stitch type (pick/AMF/topstitch/hand-worked) and
    placement match. (`construction`)
15. **Fabric behavior** — realistic drape, weight, and texture for the
    stated fabric; not a flat/CGI/illustration look. (`shape`, `symmetry`)
16. **Crop** — matches the camera-rules.md framing for this part (tight
    enough that the feature is legible, wide enough its position on the
    garment is clear). (`composition`)
17. **Focal-feature visibility** — the named feature is unmistakably the
    subject of the frame, identifiable within one second, dominating 40–80%
    (40–60% for waistband families) of the frame. (`composition`)

## Reading two images side by side

`Read` both the illustration (`illustration.disk`, or fetch the remote URL)
and the candidate (`candidatePath`) before scoring anything. Don't score
from memory of the prompt you wrote — the prompt is what you *asked for*,
the illustration is the *ground truth*, and only the two images together
tell you whether the model actually delivered.

## Absence options

For `absence: true` options, invert the check: confirm the named feature is
genuinely absent (a clean, unbroken area) rather than checking for its
presence. A hallucinated version of the removed feature is a **critical**
error (see `error-taxonomy.md`) — it's the exact failure mode the option was
created to avoid.

## Walking the checklist vs. scoring the score card

The `checklist[]` items are concrete, per-option assertions ("length/width
matches exactly: 5.0 cm", "exactly 6 belt loops, evenly placed as drawn").
Walk every item and note pass/fail. The 9-category `scoreCard` is a coarser
grading of the same evidence — use the checklist failures to inform which
categories can't reach 98, and use `forbidden[]` to check for anything that
shouldn't be there at all. All three (checklist, score card, forbidden list)
should tell a consistent story; if they don't, that's a sign the comparison
wasn't thorough enough, not that you should average them into an approval.

## From judgement to a persisted verdict

Once you've walked the checklist and scored all 9 categories, write a
`qc-input.json` (schema in `log_qc_result.mjs`'s header) with your scores,
any errors found (each with a severity — see `error-taxonomy.md`), which
features should stay locked on a retry, and any notes — then run
`log_qc_result.mjs` to compute and persist the verdict. Do not report a
verdict in chat without also writing it to `qc.json`; the audit trail is the
point.

It returns one of four verdicts — `PASS`, `PASS_WAIVED`, `UNMET`, `FAIL` —
computed from your scores and severities alone (see SKILL.md for the table).
Two consequences for how you fill in `qc-input.json`:

- **The 95–97 band now carries weight.** It used to be indistinguishable from
  any other sub-98 score; on a final attempt it is the difference between an
  image shipping under a logged waiver and being lost to `UNMET`. Score that
  band deliberately rather than reaching for a round "95" to mean "not quite".
- **Severity is the harder lever.** No score at any attempt count can ship a
  Critical or Major finding, so the severity you assign decides more than the
  number does. Grade it on what the defect is, never on the outcome you want.

Name each finding's prose `description`. `detail`, `error`, `finding` and
`summary` are also read (field agents have used all of them, so the script
tolerates them rather than silently logging a null), but `description` is the
documented key and the one to write.
