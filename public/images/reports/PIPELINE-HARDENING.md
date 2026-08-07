# Craft-Option Pipeline — Hardening Report

**Date:** 2026-08-07 · **Credits spent:** 0 · **Craft options:** 2,862 (unchanged)

The goal of this pass was to make the pipeline refuse to spend money on a
photograph it cannot prove is correct. Nothing was generated.

---

## Why this was needed

Every expensive failure in this project has the same shape. The pipeline
continues with an incomplete or wrong specification and produces a confident,
well-scored photograph of the wrong thing.

Nothing downstream catches it. Quality control scores how faithfully the
render matches the reference drawing — so a faithful render of a **wrong**
drawing scores *higher*, not lower. The only place this class of error can be
caught is before generation.

---

## What was actually broken

Each of these was live in the catalog, silent, and would have been paid for.

| Defect | Effect |
|---|---|
| Left and right extracted to identical specs | 699 options named a side the spec dropped. A mirror-flipped render scores 100% against a flat drawing, so nothing downstream could tell. |
| Flat vocabulary could not express *how* a feature is made | "Real Functional (Machine)" and "Handmade Lapel Buttonhole" are the same shape; the whole difference is the method. 138 collisions in one field. |
| Descriptions were read as assertions | "Center Vent" says it "sits between the formality of **side vents** and the slickness of no-vent" — the parser recorded side vents. That garment cannot exist. |
| Absence options asserted the feature they deny | "No Suspender Buttons" carried the flag *suspender / brace buttons*. The prompt would render exactly the hardware the customer left off. |
| One option, two different garment parts | A trouser pocket resolved differently inside a suit than standalone, so one feature was shot to two different rule sets. |
| An unrecognised adjuster was guessed | A placeholder naming no mechanism let the render invent buckle, tab or strap. |
| A product could fail to load and the gate still passed | Consumers counted what they received, found no holes, and reported success. |
| Gates could pass over an empty set | "0 problems found" read as a clean bill of health. |
| Extracted facts never reached the prompt | Side and construction method were parsed, validated, stored — then dropped at the prompt boundary. |

---

## Where it stands now

**Verified generation queue — 152 options: 143 ready, 0 blocked.**

Whole catalog, in scope for photography (1,911 options):

| | before | after |
|---|---|---|
| generation-ready | 641 | **1,480** |
| blocked | 907 | **374** |

Every **parser-defect** category is now zero in scope: sibling collisions,
factless specs, contradictory shapes, absence contradictions, lost sides and
unresolved counts.

---

## What still blocks generation — all data, not code

236 distinct options, none of which should be photographed as they stand:

- **133 — the drawing shows the wrong thing.** Proven by visual audit. For
  example `jacket/sleeve-buttonhole/by-hands.jpg` is a lapel-buttonhole
  *position* diagram: no sleeve, no cuff, and nothing expressing hand versus
  machine.
- **137 — the drawing is the only specification, and it has never been
  checked.** These are the supplier's named decorative patterns ("Journey of
  Life", "Brave Winds, Break Waves"). The words contain no geometry, so no
  parser can honestly produce one. An unaudited drawing is not evidence.
- **116 — one drawing, two different options.** A reference that cannot tell
  two options apart cannot specify either of them.

---

## Guarantees now enforced before any credit is spent

1. A specification with an unresolved property throws instead of building a prompt.
2. Every attribute value must appear in the prompt or the pre-flight gate fails.
3. Handedness is stated as an instruction — *"do not mirror or swap"* — and
   asserted in the verification checklist.
4. A drawing already proven wrong blocks its option.
5. A gate that inspects nothing fails instead of reporting success.
6. 36 regression tests, one per defect above, so none can return silently.
