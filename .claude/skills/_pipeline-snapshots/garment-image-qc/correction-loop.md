# Correction loop — structured regeneration, not "try again"

"Bounded retries" used to be a sentence in a markdown file — nothing counted
attempts, nothing structured what should change on a retry, and nothing
stopped an option from being regenerated forever with the same vague
instruction. `log_qc_result.mjs` fixes all three: it reads the attempt count
from `generation.json`, it structures exactly what needs to change, and it
caps retries at `--max-attempts` (default 3), converting a FAIL past the cap
into a terminal `UNMET` — or, for a minor-only image at ≥ 95, a logged
`PASS_WAIVED` (see the bounded-retries section below).

## The structured correction format

When `log_qc_result.mjs` produces a `FAIL` verdict, it writes a `correction`
object into `qc.json`:

```jsonc
{
  "errors": [
    {
      "severity": "major",
      "category": "placement",
      "error": "The image generated two waistband buttons.",
      "expected": "One visible waistband button.",
      "actual": "Two visible buttons.",
      "correction": "Regenerate the waistband while preserving the existing pocket shape, waistband height, fabric, and camera angle."
    }
  ],
  "lockedFeatures": ["pocket placement", "waistband width", "fabric texture", "lighting"],
  "forbiddenChanges": [
    "do not alter any checklist item this attempt already passed",
    "do not change the camera crop, composition, or accessories unless the error is itself a composition error",
    "do not change the garment part, orientation, or any other option's geometry"
  ]
}
```

Each error carries: what went wrong (`error`), what should have happened
(`expected`), what actually happened (`actual`), and a specific instruction
for the next attempt (`correction`) — not just "try again."

## Write the `correction` as a DESCRIPTION, never as a prohibition

This is the single highest-yield rule for writing a correction, and it was
learned the expensive way — three separate options, each of which had already
failed with a prohibition in the prompt, and each of which was fixed on the very
next attempt once the same instruction was rewritten as a description.

**A prohibition tells the model what not to draw. A description tells it what to
draw instead. Only the second reliably works.**

| option | the prohibition that FAILED | the description that WORKED |
|---|---|---|
| `collar-point-70-hidden-btn` | "do not render a visible buttonhole on the collar leaf" | "the button is sewn on the UNDERSIDE of the leaf, its buttonhole cut on the shirt front beneath; from outside the collar reads completely clean" |
| `canvas-normal` | (implicitly) render the finish properly | "a flat nacreous button, matte not mirrored, four holes each crossed by dark thread with a visible shank; a straight slit bound by dense whipstitching with a bar tack at each end" |
| `lbp-both` and others | "red or coloured guide marks are annotations — do not render them" | "any highlighted region marks WHERE the option sits; render that area in the garment's own cloth and thread" |

The failure mode a bare prohibition produces is specific and worth recognising:
the model removes the named thing and puts **nothing** there, or puts something
equally wrong there, because it was never told what belongs in that space. Naming
the construction closes the gap.

Two corollaries:

- **Say what the feature MEANS, not only where it is.** "Hidden button" failed as
  a label and succeeded as an explanation. The model does not share the trade
  vocabulary; it shares the physical description.
- **When a whole paragraph is losing, do not add a louder paragraph.** A
  `FRAMING LOCK` that declared itself to *outrank* the close-crop mandate lost
  three times running, because the close-crop sentence was still in the prompt.
  The contradiction has to stop being emitted at all — which is a change to
  `prompt.mjs`, not to a correction. If two attempts fail the same way, suspect
  the prompt is fighting itself and read it end to end before writing a third.

## Feature locking

`lockedFeatures` names what already passed and must survive the next
attempt unchanged. **You** (the agent, doing the comparison) populate this
in `qc-input.json` before calling `log_qc_result.mjs` — you're the one who
knows what looked right. Be specific: "fabric", "camera angle", "pocket
shape" is more useful to garment-image-director than "everything except the
button count."

A correction must never regress something that was already correct. If
attempt 1 fixed the collar shape and attempt 2's correction is about button
count, the collar shape from attempt 1 stays locked — don't let a narrow fix
silently reintroduce a previously-fixed error.

## Consuming a correction (garment-image-director's side)

Before regenerating, garment-image-director reads `qc.json`'s `correction`
block (see its own SKILL.md, "Regenerating after a rejection") and
strengthens the specific geometry/coverage wording the correction calls for
— it does not regenerate with an unchanged prompt and hope for a different
result. `record_generation.mjs` auto-increments the attempt number, so
`log_qc_result.mjs` always knows which attempt it's grading.

## Bounded retries → PASS_WAIVED or UNMET, never a silent ship

Once `attempt >= maxAttempts` and the option still hasn't cleared the 98
gate, `log_qc_result.mjs` stops issuing `FAIL` and closes the option out one
of two ways:

- **`PASS_WAIVED`** — every category is still ≥ 95 and there are **zero**
  Critical/Major findings. The image ships with a `waiver` object written
  into `qc.json` naming each category between 95 and 98, its shortfall, the
  Minor findings, the attempt, and the granting authority. This exists
  because the ≥98-everywhere gate was stranding usable minor-only images and
  the catalog could not finish; it is a *logged exception*, not a lower
  standard. Authorised by the user decision of 2026-07-30.
- **`UNMET`** — anything else. A **terminal** state for this run: keep the
  existing illustration as the catalog `image`, and report the option as
  unmet in your summary — that's a finding about the catalog or the image
  model's limits on this option, not a failure of the pipeline.

Never loop past the cap hoping for a lucky generation, and never quietly
approve a below-threshold result just to close out a batch. Note that the
waiver deliberately cannot be reached early: the attempt floor is the larger
of `--max-attempts` and the 3-attempt default, so shrinking the budget shortens
the retry loop without ever buying a cheaper approval.

## Retrying an option that already closed out

`record_generation.mjs` derives the attempt number from any prior `qc.json`,
so simply re-running a closed-out option immediately re-exhausts the budget
and lands straight back on `UNMET`/`PASS_WAIVED`. To grant a genuine further
attempt, rename the prior `qc.json` (keep it as evidence) and delete the
rejected candidate images first.
