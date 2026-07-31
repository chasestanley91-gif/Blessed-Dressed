# Approval rubric — the final acceptance standard

> The purpose of this skill is **not to generate images**. It is to
> **prevent inaccurate images from entering the catalog**. Generation is one
> step. Verification is the process. Approval is earned, never assumed.

## Supreme rule — the illustration is always correct, the image is always suspect

Every visible characteristic in the generated photo must trace back to the
spec tech-pack-interpreter produced or the illustration itself. If anything
in the photo can't be traced to one of those two sources, treat it as
invented — even if it looks plausible, even if it looks *better* than what
the drawing shows. Aesthetics never outrank geometry.

## Adversarial review — try to reject, not approve

Run the comparison with the explicit goal of finding a reason to reject the
image, not confirming it looks fine. Actively hunt for: incorrect geometry,
dimensions, angles, proportions, placement; missing construction, closures,
or stitching; asymmetry; styling conflicts; and — the single most common
failure — **generic-category substitution** (a generic spread collar /
notch-or-peak lapel / pocket / pleat / vent / cuff / waistband standing in
for the drawn one). Matching the *category* is not sufficient; the *exact
option* must be represented.

## Score-card gate — ≥ 98 in every category, no averaging

Grade the candidate 0–100 in each of the 9 `scoreCard` categories from
`prompt.json`: `shape`, `geometry`, `dimensions`, `angles`, `construction`,
`placement`, `symmetry`, `composition`, `blueprint-match`. **Every** category
must reach **98**. One weak category is not offset by strong scores
elsewhere — `log_qc_result.mjs` enforces this mechanically; there is no path
to a PASS verdict that averages around a gap.

## The waiver — an exhausted-budget exception, not a lower bar

The 98 gate above is unchanged and still the only route to `PASS`. Separately,
once the retry budget is genuinely spent (attempt ≥ max-attempts, never
earlier than the 3rd), an image with **zero** Critical/Major findings whose
every category is still ≥ **95** closes out as `PASS_WAIVED` rather than
`UNMET`, and ships with a `waiver` object in `qc.json` naming each sub-98
category and its shortfall. Authorised by the user decision of 2026-07-30;
it exists because ≥98-everywhere was stranding usable minor-only images and
the catalog could not otherwise finish.

Three things this does **not** change, and you must not let it:

- It is not a target. Grade every attempt against 98. Scoring toward 95
  because "it'll be waived anyway" converts an exception into the new
  standard, which is exactly what the decision refused to do.
- It never applies while a retry is still owed. Below the attempt floor the
  verdict is `FAIL` and the correct response is a better generation.
- It cannot launder a Critical or Major finding. There is no score and no
  attempt count at which the wrong construction becomes shippable — see
  `error-taxonomy.md`. Everything under "when in doubt, reject" below still
  governs how you classify; the waiver only decides what happens to findings
  you have already honestly graded as Minor.

You never request a waiver — `log_qc_result.mjs` computes it, and there is
deliberately no input field through which one can be asserted.

## Illustration-mirror standard

The generated image must look as though: (1) the illustration was
manufactured, (2) the garment was professionally tailored, (3) it was
professionally photographed. The illustration and the photograph must
describe the **same object** — not similar objects. Any deviation is a
failure.

## When in doubt, reject

A false rejection costs one regeneration cycle. A false approval ships a
wrong image that teaches the customer the wrong thing about what they're
ordering. **False rejection is acceptable; false approval is not.** If
verification is incomplete, or blueprint matching can't be proven, the
answer is reject, not "probably fine."

## Absence options

An absence option (`spec.absence: true`) passes only if the feature is
genuinely absent — a clean, unbroken area, not a hallucinated version of the
removed feature. Checking this is not optional just because there's "nothing
to check" — verify the clean area dominates the frame and that no trace of
the forbidden feature appears (`spec.forbidden` will name it explicitly).

## Shared-blueprint caveat

If `tech-pack-interpreter`'s `inventory.mjs --dupes` flagged this option's
illustration as shared with other options, treat any generation from it as
unreliable regardless of score — "the drawing is law" cannot disambiguate
which option a shared illustration actually documents. Flag this to the
user rather than approving.

## Final success criterion

An image is approved only when an experienced bespoke tailor, pattern
cutter, or garment technician could compare the technical illustration and
the generated photograph and conclude they describe the **same manufactured
garment**. Anything less is not approved — log it as FAIL (with a
correction), PASS_WAIVED (minor-only at ≥ 95 with the budget spent, shortfall
recorded) or UNMET (retries exhausted, waiver floor not met) via
`log_qc_result.mjs`, never wave it through because it's "close enough."
