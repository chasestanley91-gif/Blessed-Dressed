# Stage 5: QA Verification and the Retry Loop

## How to inspect

Open BOTH images with vision: the blueprint illustration and the generated photo. Compare
feature by feature — not "does it look right overall." Overall impressions pass images that
have one wrong button, and one wrong button makes the catalog lie to a paying customer about
a garment they're ordering. If a feature is small, crop/zoom both images and re-look before
judging.

## The checklist

Verdict per line: `pass` / `fail` / `n-a`, each with a one-clause reason. No percentages —
a feature visibly matches the blueprint or it does not.

1. **Counts** — buttons, buttonholes, stitch rows, pleats, splice panels. Any count mismatch
   is an automatic overall FAIL regardless of everything else.
2. **Silhouette** — point/edge shape, corner sharpness vs rounding, curve placement.
3. **Proportions** — the locked ratios from spec.json (point length vs band height, placket
   width vs button diameter, pocket width vs visible chest area...). Judge each ratio.
4. **Positions** — button placement relative to edges, buttonhole orientation
   (horizontal vs vertical), stitch offset from edge, pocket location and angle.
5. **Construction** — top stitching present/absent exactly as drawn, seam lines where drawn,
   interlining stiffness plausible for what's drawn.
6. **Symmetry & physics** — left/right symmetry where the blueprint is symmetric; fabric
   behaves like real cloth; no melted/warped weave, no AI artifacts, no phantom seams.
7. **Photography** — square-on, detail centered and dominant, background clean, no props,
   no text/logo, lighting even.
8. **Nothing extra** — scan for features the blueprint does NOT have. Additions are as bad
   as omissions.

Overall verdict: PASS only if every line is pass/n-a. Record in the option's `qa.json`:

```json
{
  "attempts": [
    {
      "n": 1, "file": "photo-attempt1.png", "model": "nano_banana_pro",
      "settings": {"resolution": "2k", "aspect_ratio": "4:5"},
      "verdict": "fail",
      "checks": [
        {"feature": "stitch row count", "verdict": "fail", "note": "photo shows 2 rows, blueprint has 1"},
        {"feature": "point length ratio", "verdict": "pass", "note": ""}
      ],
      "correction_applied": null
    }
  ],
  "final": {"status": "approved", "file": "photo.png", "attempt": 2}
}
```

A second-opinion pass helps on high-stakes options: if subagents are available, hand the
blueprint + photo + checklist to a fresh agent (it has no attachment to the prompt it didn't
write) and reconcile disagreements by re-zooming.

## The retry loop (max 3 attempts)

On FAIL:

1. Write the correction as an explicit, physical instruction — name the feature, the error,
   and the fix: `"CORRECTION: render exactly ONE edge-stitch row, 3mm inside the collar
   edge. The previous render added a second parallel row — do not."`
2. Append the correction block to the end of the prompt (keep the original prompt intact —
   the contract still applies).
3. Re-generate with the SAME model, settings, and reference media_id (change one variable at
   a time; if you also swap models you learn nothing).
4. If attempt 3 fails: status `needs-human` in catalog.json, keep the best attempt file,
   write one line in `reports/failure-log.md` explaining what would not converge. Move on.
   Persistent failures usually mean the blueprint needs a different view/crop or the prompt
   needs a different anchor — a human decision, not a fourth coin flip.

## Failure log = compounding memory

`shirt-assets/reports/failure-log.md`, append-only, one line per lesson:

```
- [lapel] Models add a second stitch row on point collars → always state "exactly ONE stitch row" even when blueprint shows one. (2026-07-01, lapel-11)
- [cuff] Pleats collapse when cuff shot fully closed → prompt "cuff fastened, pleats visible and pressed open". (2026-07-01, cuff-03)
```

**Before generating any option, read the failure log entries for its category and pre-apply
the corrections to the first prompt.** This is how the pipeline gets cheaper every week: a
lesson paid for once should never be paid for twice.
