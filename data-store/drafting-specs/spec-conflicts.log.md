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
