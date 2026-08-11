# Wrong images currently live — owner decision needed

Found 2026-08-10 by `tools/shared_image_check.mjs`, which is now a standing gate:
**no generated photograph may serve two different craft options.** Two files break
that rule, affecting **6 live catalog rows**. Both were verified by opening the
images, not by reading metadata — the option-id collision that caused them had
already corrupted the metadata (see failure-log.md, 2026-08-10).

Neither can be fixed by generating a replacement. **Both options are missing a
usable tech-pack drawing**, and the standing rule is that a photograph is never
generated from text alone — a text-only render invents the geometry, which is how
a wrong image gets made in the first place.

---

## 1. Jacket coin pocket, "Left Side" — showing a pair of trousers

| | |
|---|---|
| File | `/images/generated/suit-2pc/coin-left.webp` |
| What it actually shows | a **trouser** waistband coin pocket (verified by eye) |
| Correctly serving | `suit-2pc` and `suit-3pc` → `Trousers-front-pockets/coin-pocket/coin-left` |
| **Wrongly serving** | `sport-coat`, `suit-2pc`, `suit-3pc` → `suit-pockets/coin-pocket/coin-left` |

A customer choosing a **jacket** coin pocket is shown a photograph of trousers.

**Why it can't be re-shot:** the drawing on file for the jacket option,
`/images/jacket/coin-pocket/left.jpg`, is a **fabric swatch catalogue page** —
printed swatches with codes FB188631, FB188638, FB18C311, FB18C580. It is not a
drawing of anything. This is consistent with the rest of `/images/jacket/`, which
was measured at 5.8% usable (46 of 52 files are the wrong subject) and is blocked
by the validator by default.

**Needed:** a real jacket coin-pocket drawing from Baoxiniao (mtm.baoxiniao.co).

---

## 2. Trouser belt loops, "5 Loops" — showing 7 loops

| | |
|---|---|
| File | `/images/generated/trousers/loops-standard.webp` |
| What it actually shows | the **"Standard (7 Loops)"** option |
| **Wrongly serving** | `suit-2pc`, `suit-3pc`, `trousers` → `belt-loops/loops-5` ("5 Loops") |

A customer choosing **5 loops** is shown 7 loops. The difference is countable, so
this is not a subtle mismatch — it is the option's entire content.

**Why it can't be re-shot:** `loops-5` has **no illustration at all**
(`illustration: undefined`). Every sibling in the field has one. The 7-loop photo
appears to have been wired in as a fallback for the empty slot.

**Needed:** a 5-loop waistband drawing from Baoxiniao.

---

## The interim decision, which is yours

Until drawings arrive, each row either keeps a photograph that is definitely wrong,
or shows nothing. My recommendation is **unwire both** — an empty slot is honest,
a wrong photograph actively mis-sells and a customer cannot tell it is wrong.

This is an edit to live catalog data, so it is not something to do without a clear
go-ahead. Say the word and it is two edits:

```
data-store/options/{suit-2pc,suit-3pc,sport-coat}.json
  suit-pockets/coin-pocket/coin-left      image: <remove>
data-store/options/{suit-2pc,suit-3pc,trousers}.json
  belt-loops/loops-5                      image: <remove>
```

Nothing is deleted — the craft options stay, the count stays 2,862, and both rows
reappear in the generation queue automatically the moment a real drawing lands.

---

## How this is prevented from here

`tools/shared_image_check.mjs` fails the build on any generated file that serves
more than one `(garment scope, field, option)` identity. It runs on the wiring the
customer actually sees, not on pipeline metadata — because the metadata was what
got this wrong. It currently exits 1 on exactly these two files and nothing else,
across 642 generated files in use.
