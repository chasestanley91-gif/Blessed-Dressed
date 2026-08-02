# Spec-vs-illustration conflicts — logged, resolved per the authority ruling

_The owner's drafting spec is LAW; conflicts are recorded here, never silently dropped._

## 2026-08-01 — slant pocket `N cm` semantics (trouser front pockets)

- **Options:** `slant-20`, `quarter-top` (2.5), `slant-pockets` (3.2), `slant-51`, and stripe variants
- **Repo measurement (2026-08-01, HANDOFF-2026-08-01.md):** slant `N cm` decoded as the
  **horizontal offset of the mouth's top corner from the side seam** — measured 58/64/92/184 px
  against a 104 px waistband on a registered frame, self-validating against the labels
  (drawn travels ratio 2.51 vs label ratio 2.55).
- **Owner's spec (trouser-pattern-engineering.md):** slant `N cm` modeled as the **vertical
  drop** of the mouth over a ~15 cm run (θ = arctan(N/15): 7.6° / 12° / 18.8°).
- **Resolution:** the spec is law — descriptions and prompts state the drop-over-run model
  and its angles. The measured horizontal-offset reading is retained here as an aid: if
  spec-driven renders of this family fail QC on mouth geometry, this is the first place
  to look (the two models predict visibly different mouth corners at the waistband).

## 2026-08-01 — shawl variants 0A / 0E / 0005 characterization

- **Repo measurement (2026-08-01):** normalized to neckband width — 0A widens down its drop
  (0.219 → 0.281, foot 0.247), 0E flat (0.277 → 0.258, foot 0.365), 0005 narrows hard
  (0.228 → 0.137, 74% taper, foot 0.101). The foot span is the discriminator (3.6× spread).
- **Owner's spec (jacket-lapels.md):** 0A narrow/smaller radius; 0E broader/larger sweep;
  0005 expanded outer curve with deeper front sweep.
- **Resolution:** spec is law for character; the measured foot-span ordering (0E widest,
  0A middle, 0005 narrowest) does not contradict it and was folded into the descriptions
  ("wide foot" on 0E, "narrow foot" on 0005). Keep the no-tie styling rule for this family —
  the foot is the discriminator and a necktie across the lapel opening hides it.


## 2026-08-02 — lp-slanted-flap family: description vs drawing RAKE CONFLICT

Catalog descriptions say the slanted (hacking) pocket "sits higher at the back than at the front".
Drawing 02A1, measured per-column: BOTH pockets HIGH at the center-front end (top-edge y~378) and
LOW at the side-seam end (y~524/560) — the opposite rake. Owner drafting spec (jacket-geometry-system)
gives flap depths but is silent on rake direction, so per the 2026-08-01 ruling the ILLUSTRATION is law
for this geometry: images follow the drawn rake (high front, dropping to side seam). The description
sentence is a legacy-text conflict — flagged for the owner; not silently dropped. Note this drawn rake
is also opposite the classic equestrian hacking-pocket convention, which may mean the supplier drawing
itself is unconventional — owner may wish to confirm with the factory.

## 2026-08-02 — lapel-notch-removable-shawl / lapel-peak-removable-shawl (suit-2pc + fan-out)
Catalog descriptions say the shawl attaches "usually via hidden buttons or hand-worked hooks at the gorge";
both illustrations explicitly draw PRESS-STUD SNAPS (labelled "attached with hidden snaps", snap close-up panel).
Owner drafting spec is silent on the removable-shawl family, so the drawing is law: SNAPS rendered.
Illustrations are annotated infographics (not supplier line drawings) — vision-checked 2026-08-02, construction unambiguous.

## 2026-08-02 — collar-wrap-75 (shirt)
Catalog description: leaves 'overlap and sweep across the throat... asymmetric wrap'.
Supplier drawing (wrap-collar-in-75cm.jpg): SYMMETRIC collar with double-outlined (bound/layered) leaf edges and a small stud at each tip. No asymmetric overlap drawn.
Owner drafting spec silent -> drawing is law: shipped image follows the drawing (symmetric, tip studs). Description flagged for owner review.

---

## 2026-08-02 — WRONG-queue orientation pass: 5 spec-vs-drawing conflicts

Thirty options whose live catalog photo was graded WRONG were re-read against their
supplier references before re-shooting. Five carry a genuine conflict between the
owner's drafting specification and the drawing. Per the ruling of 2026-08-01 the
**specification is LAW and the drawing AIDS**, so all five are shot per spec and the
divergence is recorded here rather than silently dropped.

### 1. `shirt/collar-button-down-78` — drawing omits the defining feature
- **Spec** (`shirt-collars.md`, BUTTON DOWN COLLAR): point length 7–8 cm; button offset
  1.5 cm from tip; tips anchored to the shirt body; points develop a rolling wave;
  avoid rigid interlining.
- **Drawing**: no button and no buttonhole at either collar point — the points are
  drawn loose. It therefore does not depict a button-down collar at all. It carries no
  stand callout either; its only dimension is a 90.00° included angle between the tips.
- **Resolution**: shoot per spec, with anchor buttons 1.5 cm from each tip and a soft
  roll. The drawing's 90° point spread is retained as the aid it is.
- **Label note**: the catalog label reads "Button-Down 7.8 cm Stand". 7.8 cm is the
  POINT LENGTH (matching spec 7–8 cm and the option id `-78`); a 7.8 cm collar stand is
  not a real garment. The word "Stand" in the label is an error.

### 2–4. `trousers/slant-20`, `slant-20-stripe`, `slant-51-stripe` — inverted geometry
- **Spec** (`trouser-pockets.md`, FRONT POCKET STYLES): the cm value is the RISE and the
  angle is measured OFF HORIZONTAL. The spec's own siblings fix the direction —
  `quarter-top` 2.5 cm = 15–20°, "closer to horizontal"; `slant-pockets` 3.2 cm = 22–28°;
  `slant-20` = "minimal rise, nearly horizontal" (draft `____/`); `slant-51` = "aggressive
  rise, climbs dramatically" (draft `/ / /`). Larger cm ⇒ steeper.
- **Drawing**: reads as a NEAR-VERTICAL pocket mouth, with the cm value as a horizontal
  offset over a ~15 cm vertical run — the opposite orientation.
- **Resolution**: shoot per spec. The spec and the catalog description agree with each
  other ("2.0 cm drop over a 15 cm run, nearly horizontal at about 7.6°"; "18.8° climbing
  toward the waistband") and disagree with the drawing; two independent authorities beat
  one. Getting this backwards would ship a four-member ladder in reverse order.
- **Second flag**: `slant-20` (3100) and `slant-20-stripe` (3120) are geometrically
  identical line art — the only difference between the two reference files is the red
  stroke marking the stripe. Easy to confuse; the stripe is the sole discriminator.

### 5. `vest/vest-bottom-point` — wrong reference file
- **Spec** (`waistcoat-drafting-system.md`, FRONT EDGE SHAPE): LARGE POINT projects 5–8 cm
  below the waistline on a V draft. Sibling `vest-bottom-small` already owns the spec's
  SMALL POINT (2–4 cm), so "Slant / Point" is the large one.
- **Drawing**: a smooth shallow CURVE — which is precisely what the separate sibling
  `vest-bottom-round` depicts — inside a soft, upscaled crop of a larger tech-pack sheet
  that also shows an unrelated double-breasted closure with two columns of four buttons.
- **Resolution**: the reference is simply the wrong crop. Shoot per spec: a 5–8 cm V point.

### REVERSAL (same day, 2026-08-02) — items 2–4 above: the DRAWINGS govern the slant family

The adjudication above resolved `slant-20`, `slant-20-stripe` and `slant-51-stripe` per the spec
(near-horizontal). A closer read of the drawings, with pixel measurements, reverses that. Recording
the reversal rather than quietly re-deciding:

**The evidence that changed it.** Measured endpoints in the 1200×1200 reference files:

| option | mouth run (px) | angle off vertical | cm label |
|---|---|---|---|
| `slant-20`        | 82 h / 505 v  | 9.2°  | 2.0 cm |
| `slant-20-stripe` | 86 h / 511 v  | 9.6°  | 2.0 cm |
| `slant-51-stripe` | 205 h / 466 v | 23.7° | 5.1 cm |

The drawn horizontal-offset ratio between the 5.1 cm and 2.0 cm members is **2.6×**, against an
expected **2.55×** from the labels. The drawings therefore encode the centimetre value *exactly*, as a
forward offset over a vertical run, and the family is drawn in correct, internally consistent order.
Geometrically this is the standard trouser slant pocket — mouth running from the waistband seam down
and outward to the side seam — which is what these garments actually are. The near-horizontal reading
describes a frogmouth/western pocket, a different pocket.

**Why the spec does not govern here.** The ruling makes the spec law, but the spec is *internally
inconsistent on this one attribute*: its `slant-20` entry draws `____/` (horizontal) while its own
siblings `slant-pockets` 3.2 cm and `quarter-top` 2.5 cm both draw backslashes (steep), and its stated
angles (15–20°, 22–28°) reconcile with neither reading on a common run. An authority that contradicts
itself on an attribute cannot be law for that attribute; per the ruling, the illustration governs where
the spec is silent or unusable. The spec's *ordering* (larger cm ⇒ more aggressive) is retained and
agrees with the drawings.

**Note on the catalog description.** "2.0 cm drop over a 15 cm run, nearly horizontal at about 7.6°"
uses the same 2:15 ratio as the drawing but with rise and run transposed — 9.2° off vertical versus
7.6° off horizontal is the same triangle, rotated. The description is a transposition error, not an
independent second authority, so the "two authorities beat one" argument made above does not hold.

**Consequence.** The three slant options are shot per drawing: a near-vertical mouth from the waistband
seam to the side seam, ~9° off vertical at 2.0 cm and ~24° at 5.1 cm.

**Cost of the earlier reading.** `suit-2pc/quarter-top` was already generated (job
`d1901a55-e293-4cfd-b3fd-eb20aae1d55b`, 0.5 credits) under the superseded near-horizontal spec lock.
It is left in flight and sent to QC on its merits; if it fails on pocket angle it is retried per drawing.
Logged here so the spend and the reason are on the record.
