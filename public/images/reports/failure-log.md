# Failure log — compounding lessons + spend (append-only)

Canonical location as of 2026-07-26: `blessed-dressed/public/images/reports/failure-log.md`.
(The earlier log lived in the Cowork session's `claude-vscode/shirt-assets/reports/failure-log.md`,
which is not present in this repo. Lessons below are re-seeded from HANDOFF-image-factory.md and
the skill references; new lessons append here.)

## Lessons

- [general] Blueprint ALWAYS attached as reference image; never text-only generation. (seeded 2026-07-26)
- [general] Model search: use SHORT queries in models_explore; long queries AND terms and return empty. (seeded 2026-07-26)
- [general] gpt_image_2 has NO 4:5 ratio — use 3:4 for garment detail crops, 1:1 for macro tiles. (seeded 2026-07-26)
- [splicing] Tech packs for 4cm/1.5cm collar-point splices carry Chinese annotation text — reviewer requires it must NOT leak into the photo; scrutinize generations for leaked characters. (2026-07-25, splice-4cm-from-point / splice-15cm-from-point)

- [collar_splicing] When the blueprint shows the full shirt front, gpt-image renders a plain covered/French front and drops the drawn button placket + topstitch rows → always state "standard sewn button placket with TWO parallel vertical topstitch rows and visible placket button" explicitly. (2026-07-26, splice-4cm-from-point v2 FAIL)
- [cuff splicing] Models invent a horizontal seam dead-ending at the splice seam on the plain half of a half-spliced cuff → state "the plain panel is ONE uninterrupted piece of fabric; its only seams are the vertical splice seam and the edge topstitching". (2026-07-26, splice-lower-cuff v2 FAIL)
- [cuff edge trim] Edge-binding strips drift into mid-panel runs with diagonal connectors → describe the strip path segment by segment ("directly along the TOP edge", "single Y-fork only at the closure end") and forbid "mid-cuff strip runs" and "diagonal strip segments" explicitly. (2026-07-26, csplice-cuff-edge a1 FAIL)
- [strip width] "1 cm strip" renders wider than the button unless the button relationship is stated both ways → say "strip NARROWER than the button; button rim overhangs the strip on both sides" AND forbid "strip wider than the button". (2026-07-26, csplice-strip-mid a1 FAIL)
- [DATA DEFECT — back blueprints swapped] `public/images/back/box-pleat-to-bottom.jpg` actually shows the WITH-DARTS drawing and `box-pleat-to-bottom-with-double-darts.jpg` shows the PLAIN drawing (verified visually 2026-07-26). The builder displays the wrong illustration for both options — needs Dustin-approved file swap or rewire. Pipeline fix: generate back-box-pleat from media d0babf67 (plain drawing) and back-box-dbl-darts from media 7d2b76a9 (darted drawing); first-attempt jobs 99d86031/83c808ed used the mislabeled references — treat their outputs as void attempts. (2026-07-26)
- [back/side pleats] Side pleats drift inboard (~8cm from armhole instead of ~5cm) → anchor with a fraction of back width ("outer eighth of the yoke") AND forbid "pleats closer to center than the outer eighth". (2026-07-26, back-side-pleat a1 FAIL)
- [back/pleats+darts] When a back has BOTH side pleats and darts, models merge them into one yoke-to-hem crease per side → enumerate "FOUR separate features that must never merge", state different horizontal positions and heights, and forbid "single yoke-to-hem crease" + "merged pleat-dart lines"; also demand mirrored depth (left side rendered faint). (2026-07-26, back-side-pleats-dbl-darts a1 FAIL)
- [bias cutting] Diagonal grain bleeds beyond the featured component onto body/shoulder, and flipped collar leaves detach + oversize with invented edge binding → state "diagonal ONLY on <component>, all other panels matching vertical stripes", "leaf ATTACHED along one continuous fold", and forbid solid/contrast edge binding explicitly. (2026-07-27, bias-inner-top-collar a1 FAIL)
- [collar stand height] "Extra-tall 4.5cm stand" renders standard-height unless the height is stated as button-diameter count AND button placement demands it → say "four button-diameters tall, band fabric visible above the top and below the bottom button" and forbid "buttons touching the band edges". (2026-07-27, cs-round-2btn a1 FAIL)
- [striped fabric] On fine bengal stripes gpt-image can render crumpled white crease artifacts that break the stripe pattern (esp. on flipped/turned components) → demand "PERFECTLY FLAT board-pressed, unbroken continuous stripes" and forbid "wrinkles, creases, crumpled or distressed fabric, broken or smeared stripes"; also avoid the phrase "natural fabric tension" on striped close-ups. (2026-07-27, bias-inner-top-collar a2 FAIL)
- [square edges] "Square collar-stand end" drifts to a ~6mm rounded top corner → use physical similes ("like the corner of a book cover", "sharper than a fingernail's edge"), state stitching "turns the corner at a hard right angle", forbid "arc of any radius". (2026-07-27, cs-square-2btn a1 FAIL)
- [asymmetric features] Deliberately asymmetric options get symmetrized (both ends same tab shape) → open the SUBJECT with "the two ends are DELIBERATELY DIFFERENT SHAPES and that difference is the entire product", give each end its own simile (half-circle tongue-depressor vs unrounded playing-card corner), forbid "both ends the same shape". Also: buttons can render hanging from cord loops — demand "sewn FLAT through its holes" and forbid dangling. (2026-07-27, cs-left-sq-rt-rnd a1 FAIL)
- [bias grain contrast] The bias-vs-straight stripe CLASH is the product but models blend the angles to near-parallel and break sleeve-to-cuff grain continuity → open with "the GRAIN CONTRAST at the edge is the entire product", use the chevron simile, and state continuity ("stripes continue unbroken across the attachment seam"). Also: bias panels render with a coarser stripe repeat than the body → state "IDENTICAL fabric, identical repeat, same cloth merely rotated 45 degrees". Button zones on striped cloth attract smear/watercolor artifacts → demand "crisp continuous weave, clean fastened buttonhole" and forbid smears/streaks/dissolved buttonholes. (2026-07-27, bias-inner-cuff + bias-inner-collar-stand a1 FAILs)
- [DATA DEFECT — decoration-stitching tech packs] Full 14-file audit 2026-07-27 (md5 + annotation read). TWO defects:
  (1) **Collar folder is scrambled.** It holds only 4 distinct annotated drawings + 1 stray. True mapping by annotation: `machine-03cm-amf-stitching.jpg`=**0.1cm**, `machine-01cm-top-stitching.jpg`=**0.3cm** (and `machine-03cm-top-stitching.jpg` is its byte-identical duplicate), `machine-05cm-top-stitching.jpg`=**0.5cm** (and `machine-06cm-top-stitching.jpg` is its byte-identical duplicate), `machine-01cm-amf-stitching.jpg`=**0.6cm**. `machine-05cm-amf-stitching.jpg` has NO callout and shows a bright-red zigzag edge stitch — a stray that likely belongs to the zigzag collar option (`lapel/point-in-58cm-with-zigzag-stitching.jpg`).
  (2) **No authentic AMF artwork exists anywhere.** All three `decoration_stitching_on_cuff/machine-0Xcm-amf-stitching.jpg` are byte-identical copies of the same-cm `-top` files (md5-verified); the collar `-amf` files are the misfiled 0.1/0.6 topstitch art plus the zigzag stray.
  Cuff folder `-top` files are internally correct (0.1/0.3/0.5/0.6 all match their callouts).
  ACTION TAKEN: the 8 TOP options were bound to the tech pack whose ANNOTATION matches their catalog label (blueprint law over filename); the 6 AMF options were routed to needs-source.json as a label/illustration conflict rather than inventing the pick-stitch look. Filenames still need correcting at the file level — Dustin decision. (2026-07-27)
- [MEASURED LADDERS - hard physics limit] Graduated mm-scale options (0.1/0.3/0.5/0.6 cm stitch offsets) CANNOT be resolved by the image model at full-garment framing. Measured proof 2026-07-28: collar ladder ran 0.312 -> 0.404 -> 0.316 -> 0.476 button-diameters (0.5cm inverted, identical to 0.1cm); cuff ladder ran 0.233 -> 0.353 -> 0.555 -> 0.362 (0.6cm collapsed to the 0.3cm value). Exact cm values, ratio anchors, comparative-neighbour language and explicit FORBIDDEN lines all failed to fix it - at full-garment crop 1mm is ~1% of frame width. FIX: re-shoot at EXTREME MACRO (~3cm of the finished edge fills the frame -> 1mm becomes ~3% of width, 5mm ~17%), identical cloth/crop/scale-reference across every rung, and QC the ladder as a SET for monotonicity - never per-image. NEVER annotate different numbers onto near-identical photos; that mis-sells a measured option. (2026-07-28, decoration_stitching TOP ladder, 7 of 8 rejected)
- [back QA win] 7/9 backs passed attempt 1 incl. Neapolitan shirring (both napoli variants) — the "red = construction, render as folds/seams in white fabric" contract block works; keep it for all construction-line categories. (2026-07-26)
- [splicing QA win] 8/10 of the 2026-07-25 splice v2 batch passed per-feature QA incl. no leaked Chinese annotations — the "annotations are drawing aids, must NOT appear" prompt block works; keep it. (2026-07-26)

- [process] review-remake-queue.json got silently reset to all-queued during a spec-factory workflow run (a subagent likely re-ran a repo script) → statuses restored from CHECKPOINT knowledge; future workflow/agent prompts must say "do NOT run repo scripts that rewrite state files (apply_review, build_review) — read-only on public/images/*.json". (2026-07-26)
- [process] csh-50 blueprint is a NO IMAGE placeholder — draft-spec verification caught it before credits were spent; needs-source.json now blocks it. Always let the spec/verify pass inspect the blueprint file before generating. (2026-07-26)

## Spend

| Date | Batch | Model | Images | Credits | Balance after |
|---|---|---|---|---|---|
| 2026-07-25 | collar_splicing v2 remakes (10) | unrecorded (prior session) | 10 | ~5 (est. @0.5) | — |
| 2026-07-26 | (session start) | — | — | — | 993 |
| 2026-07-26 | splice v3 retries (2) + cuff_splicing first attempts (4) | gpt_image_2 low/1k 3:4 | 6 | 3.0 | ~990 |
| 2026-07-26 | cuff_splicing attempt-2 retries (cuff-edge, strip-mid) | gpt_image_2 low/1k 3:4 | 2 | 1.0 | ~989 |
| 2026-07-26 | shirt back attempt1 batch (9) | gpt_image_2 low/1k 3:4 | 9 | 4.5 | ~984.5 |
| 2026-07-26 | box-pleat pair corrected-reference retries (2) | gpt_image_2 low/1k 3:4 | 2 | 1.0 | ~983.5 |
| 2026-07-26 | back side-pleat + side-pleats-dbl-darts attempt2 (2) | gpt_image_2 low/1k 3:4 | 2 | 1.0 | ~982.5 |
| 2026-07-27 | batch3: bias_cutting (4) + collar_stand (5) attempt1 | gpt_image_2 low/1k 3:4 | 9 | 4.5 | ~978 |
| 2026-07-27 | batch3 retries: bias-inner-top-collar a2+a3, cs-round-2btn a2, cs-square-2btn a2, cs-left-sq-rt-rnd a2 | gpt_image_2 low/1k 3:4 | 5 | 2.5 | ~975.5 |
| 2026-07-27 | batch3 final retries: bias-inner-cuff a2, bias-inner-collar-stand a2 | gpt_image_2 low/1k 3:4 | 2 | 1.0 | ~974.5 |
| 2026-07-27 | batch4: decoration stitching TOP ladder (4 collar + 4 cuff) attempt1 | gpt_image_2 low/1k 3:4 | 8 | 4.0 | ~970.5 |

## 2026-07-28 — batch preflight lessons (found before spending the batch)

- [BLUEPRINT SOURCE — the pipeline was eating its own output] `extractSpec` read
  the catalog's `image` field as the blueprint. But garment-image-qc's write-back
  sets `image` to the APPROVED PHOTO and preserves the drawing under
  `techpackIllustration`. Nothing ever read that field back. Result: any option
  photographed once would, on the next run, be "blueprint-locked" to its own
  previous generation — a copy of a copy drifting further from the tech pack each
  pass. Measured 2026-07-28: 206 of 509 queued options (40%) were about to
  regenerate from prior AI output. FIX: `resolveBlueprint()` in catalog.mjs —
  `techpackIllustration` always wins, and a path under `/images/generated/` is
  NEVER accepted as a blueprint (it is our own output), so an option with no
  preserved tech pack routes to needs-source instead of silently self-referencing.
  Verified: 1078 of 1087 affected options still had their tech pack; 9 had lost it.
  GENERAL RULE: if a pipeline writes a field it also reads, check the round trip.

- [SCOPE — "shared blueprint" was over-counted] The dupes check flagged any
  illustration used by >1 option as a data defect, which conflated two very
  different things. One drawing backing `suit-2pc > lc-half`, `suit-3pc > lc-half`
  and `sport-coat > lc-half` is THE SAME CRAFT OPTION on three products — generate
  once, reuse. One drawing backing `lc-half` AND `lc-quarter` is a real defect.
  Splitting them: 442 drawings are same-option-across-products (1231 options,
  generatable), only 29 are genuinely ambiguous (408 options). Corrected scope:
  782 generations cover 1571 of 1979 in-scope options (79%), not 27%.

- [STYLING — the accessory was covering the craft option] Every shirt-collar
  option that was not wing/tab/button-down defaulted to "a silk necktie with a
  neat four-in-hand knot". A knot sits exactly on the collar band and fills the
  gap between the points, hiding the stand height, band seam, top button and the
  SPREAD — i.e. precisely the geometry that distinguishes one collar from
  another. Worst on the 159 `shirt-collar-stand` options, which are cropped MACRO
  ON THE BAND the knot covers. Confirmed visually on candidate-1 of
  shirt/collar-long-point-85. 216 of 781 batch clusters (28%) were affected.
  FIX: no necktie by default; the collar is shot open with the top button
  fastened. A tie is worn ONLY where it is required to demonstrate the option —
  tab collars (the tab fastens under the knot) and wing collars (defined by their
  black-tie context). GENERAL RULE from the brief, now enforced in code: never
  style an accessory over the feature being sold.

- [STYLING part 2 — "no tie" was only half the fix] Removing the necktie from the
  shirt-collar default was correct, but it was paired with "top button FASTENED",
  which closes the collar and hides the band interior and the band buttonhole.
  The tech packs draw these collars OPEN. Three independent QC agents in the wave-1
  canary flagged the same mismatch against three different drawings
  (collar-fashion-point-58, collar-point-58-zigzag, collar-point-70-hidden-btn):
  expected "top button undone, leaves splayed apart, inner face of the band
  visible", actual "collar buttoned closed". A styling directive that contradicts
  the blueprint will beat the BLUEPRINT LOCK, because it is concrete and the lock
  is general. FIX: the collar is worn open at the throat with the band button
  UNFASTENED, deferring explicitly to the closure state drawn in the blueprint.
  GENERAL RULE: styling text must defer to the drawing, never assert a closure
  state of its own.

- [NEGATIVES — saying what a thing IS does not suppress the model's prior] "Square
  6.5 cm" and "Small Square 5.0 cm" collars came back with sharp acute points
  twice each (critical/shape: expected "flat, straight, squared-off edge", got
  "sharp acute point with no flat terminal edge"). The prompt stated the correct
  shape and attached the drawing; neither beat "dress shirt collar => pointed" in
  the model's training prior. What suppresses it is naming the WRONG shape
  explicitly. FIX: TERMINAL_SHAPE_FAMILIES in spec.mjs — for each mutually
  exclusive terminal-shape family, the option's own group emits a negative naming
  every shape it is NOT ("collar leaves tapering to a sharp acute point or to a
  rounded club tip — this option's collar point termination is a flat SQUARED-OFF
  terminal edge"). GENERAL RULE: for any option that sits in a family of similar
  siblings, forbid the siblings by name; a positive description alone loses to a
  strong prior.

- [PROCESS — verify the fix's OUTPUT, not just that it runs] The first version of
  the sibling-shape negative emitted the OTHER groups' forbid strings, so a square
  collar was told to forbid "collar leaves ending in a squared/blunt flat edge" —
  its own shape. It ran clean, produced plausible-looking text, and would have
  actively sabotaged exactly the options it was written to rescue. Caught only by
  printing the generated negatives for four real options and reading them. Never
  ship a prompt-affecting change on a green syntax check.

- [ATTEMPT BUDGET] record_generation.mjs derives the attempt number from any prior
  qc.json, so re-running a UNMET option immediately re-exhausts the budget. To
  genuinely retry, rename the prior qc.json (keep it as evidence) and delete the
  rejected candidate images.

- [CONTRAST CLAUSES, part 2 — the family rule was not enough] BUG 1's
  resolveExclusiveShapes() only fires when two members of one family are both
  present AND the label names one. "Hidden Button 7.5 cm" names neither "point"
  nor "button-down", so the rule bailed out and the false positive survived.
  Three options were tagged 'button-down point' purely from contrast prose:
  collar-point-70 ("the sweet spot between the long traditional point and the
  casual BUTTON-DOWN") rendered an actual button on the collar leaf and became
  indistinguishable from its sibling collar-point-70-btn; collar-hidden-btn-75
  and stay-hidden-btn are HIDDEN-button options, where a visible button is the
  precise opposite of the option's meaning. FIX: LABEL_GATED_SHAPES — a style
  distinctive enough to define the option ('button-down point') is dropped unless
  the LABEL names it. Verified: 1 legitimate button-down kept, 3 false positives
  gone. NOT generalised to all shapes on purpose — "Tuxedo Collar" legitimately
  extracts 'wing' without the word appearing in the label, so a blanket
  label-authority rule would delete true positives.

- [AGENT DISCIPLINE — a retry silently dropped the reference image] One wave-1
  agent submitted its attempt-2 generate_image with an EMPTY medias array, so the
  blueprint was never attached and the retry was effectively text-only — then
  QC'd the result as if it were blueprint-referenced. The correction loop is the
  most dangerous place for this: attention is on the correction text, not on the
  call's scaffolding. FIX: the batch template now states medias is mandatory on
  every call including retries, tells the agent to re-read its own tool input
  before submitting, and to discard rather than QC a candidate generated without
  the reference.

- [PRESENTATION MISMATCH — the biggest fidelity lever found so far] Square-tip
  collars ("Square 6.5 cm", "Small Square 5.0 cm") rendered as sharp POINT
  collars on every attempt, even with the correct shape stated positively, the
  wrong shapes forbidden by name (TERMINAL_SHAPE_FAMILIES), and the reference
  image attached. shape scored 20-35 out of 100 repeatedly.
  ROOT CAUSE: the reference images present the collar GARMENT-ONLY (a collar on a
  pressed shirt, no wearer), while the prompt demanded "worn on a male model,
  tight crop on the collar and neckline". Forced to RE-STAGE the shot onto a
  human, the model re-derives the collar from its training prior — and the prior
  for "dress shirt collar" is overwhelmingly pointed. The attached reference
  survives only as loose style guidance once the presentation has to change.
  FIX: shoot collars in the SAME presentation as the reference — garment-only, no
  model, no face, no neck, no skin — and instruct explicitly that the collar be
  reproduced at the same viewing angle "so its exact tip geometry is preserved
  rather than re-staged".
  SECONDARY WIN: this also removes the face/jaw intrusion QC flagged on nearly
  every collar candidate ("jaw fragment in the top 20%", "face across the upper
  third", "model's face fills the top 30%") and lifts the collar's share of frame.
  GENERAL RULE: match the reference's presentation. Every presentation change you
  demand is an invitation for the model to re-render from priors instead of from
  the reference — and geometry is what gets lost first.

- [PROVENANCE — some "tech packs" are AI photos, not supplier drawings] 54 options
  have techpackIllustration pointing at their own aiImage under /images/ai/ —
  AI-generated PHOTOGRAPHS, not manufacturing line drawings. /images/collar/ holds
  only 2 files, so for these collar styles no supplier drawing exists in the repo
  at all. The images are serviceable geometry references (the collar-sq-65 photo
  shows its squared tip clearly and unambiguously), but "the drawing is law"
  overstates what they are. Flagged for Dustin: these 54 need real tech packs
  before their geometry can be called authoritative.

- [FALSE APPROVAL — QC cannot detect a wrong blueprint] shirt/collar-sq-65-btn
  ("Square 6.5 cm with Button") PASSED at blueprint-match 98 and was STAGED with a
  photo showing sharp acute POINT tips. The photo was not the problem: the
  blueprint filed at /images/ai/collar-sq-65-btn.png itself depicts a POINT
  collar, contradicting the option's own label and description. The candidate
  faithfully reproduced it and therefore scored highly.
  STRUCTURAL LESSON: every QC score measures fidelity TO the blueprint, so a
  wrong blueprint is invisible to the entire gate — the more faithful the render,
  the higher it scores. The catalog label/description is the ONLY independent
  cross-check, and the interpret step is the only place it can be applied.
  FIX: a blueprint/text consistency gate before any credit is spent — if the
  drawing contradicts the label on the option's DEFINING feature, return
  BLUEPRINT_CONFLICT and spend nothing. Verdict revoked (qc.json renamed so
  write-back can never see a PASS), REVOKED.json written, option routed to
  needs-source. Verified by direct visual inspection of blueprint + staged image;
  sibling collar-sq-65's blueprint does show a genuine flat squared tip, so this
  is a per-file defect, not a folder-wide one.

- [MISSING BRANCH — a qualifier with no branch is silently recorded as its
  opposite] extractMeasures() had branches for cutaway / semi-spread / narrow /
  wide but none for "moderate", so four "Regular Collar" options describing a
  MODERATE spread were specced "wide spread" — aiming each at its own wide-spread
  siblings. validate_prompt.mjs passes these because it only checks that the token
  "spread" is PRESENT, never that its value is right. FIX: added moderate and
  moderate-cutaway branches. Corrected 14 options catalog-wide (more than the 6
  the first probe found). GENERAL RULE: an else-if chain over catalog vocabulary
  needs a branch for every qualifier the catalog actually uses; enumerate the real
  values before trusting the chain, because the failure is silent.

- [CORRECTION to the presentation-mismatch diagnosis] I attributed the repeated
  square-tip failures to a presentation mismatch (garment-only reference vs a
  "worn on a male model" prompt). That was WRONG for the square family. The
  blueprints for collar-small-sq-50, collar-small-sq-50-btn,
  collar-small-sq-50-zigzag and collar-sq-65-btn THEMSELVES depict sharp acute
  POINT collars. The image model was reproducing them faithfully; there was no
  geometry to recover. Only collar-sq-65's blueprint shows a genuine flat squared
  edge — which proves the catalog can represent square ends and the others are
  mis-sourced files, not a naming convention.
  Worse, the TERMINAL_SHAPE_FAMILIES negative I added was fighting the reference:
  it forbade acute points while the attached image showed acute points. That
  explains why shape scores went DOWN (35 -> 20) after the "fix" — prompt and
  reference in direct contradiction. The negative is still correct in principle
  and is kept: it is what made the contradiction detectable in the first place.
  The garment-only presentation change also stands on its own merits (it removes
  the face/jaw intrusion QC flagged on nearly every collar candidate) but it did
  not cause, and could not have fixed, this family.
  METHOD LESSON: when a fix makes a score WORSE, suspect the input rather than
  pushing harder on the prompt. Two rounds of prompt engineering were spent
  arguing with a reference image that was simply the wrong picture.

- [THE GATE PAID FOR ITSELF IMMEDIATELY] The BLUEPRINT_CONFLICT check, added after
  the first false approval, caught two more instances of the same defect on its
  very first wave and spent ZERO credits doing it. Both would otherwise have
  consumed 4 generations and, if faithful, PASSED — shipping point collars to
  customers ordering square ones. Two prior PASSes (collar-sq-65-btn,
  collar-small-sq-50) were revoked retroactively.

- [CORRECTION — the authoritative tech packs were always there] I concluded the
  square-collar family had no authoritative source and routed it to needs-source.
  WRONG. A dedicated supplier library exists at /images/techpacks/** — 485 line
  drawings, organised by product and category, byte-identical mirrors of
  /images/lapel/ and friends — and it contains square-in-65cm.jpg,
  small-square-in-5cm.jpg and both -with-button variants. Verified:
  square-in-65cm-with-button.jpg is a true technical line drawing carrying an
  "80.00 degree" spread annotation.
  The real defect was narrower and more mundane than "no source exists": for 55
  options the catalog had techpackIllustration seeded from aiImage, so an AI PHOTO
  was masking the real drawing sitting on disk. Re-pointed 51 of them by exact
  token-set match (0 ambiguous, all 51 confirmed present); 4 near-miss filenames
  left for manual review rather than guessed.
  HOW I MISSED IT: I searched the fields of the catalog RECORD and concluded from
  their absence that no drawing existed. The record is not the filesystem. Search
  the actual asset tree before declaring an asset missing.
  Number formats needed canonicalising to match: "Square 6.5 cm" -> 65 but
  "Small Square 5.0 cm" -> 5, against square-in-65cm / small-square-in-5cm.

## 2026-07-30 — session lessons (audit + tooling repair, 0 credits spent)

- [THE AUDIT TOOL ITSELF WAS BROKEN] `tools/project_state.mjs` — the documented
  "single source of derived truth" — crashed on every invocation with
  `inventory is not iterable`. Two defects: `loadInventory()` is async and was
  never awaited, and `pathToFileURL` was used but never imported. Nothing that
  reads project state had run since those lines were written, so STATE.md,
  CONTINUE.md and PROJECT_DASHBOARD.md did not exist at all and every claim about
  project position came from CHECKPOINT.json prose instead of the filesystem.
  GENERAL RULE: a state tool that has never successfully run is worse than no
  state tool — it creates the belief that state is tracked. Run the audit before
  trusting any number in a checkpoint.

- [THE AUDIT CRIED WOLF 312 TIMES AND HID THE ONE REAL DEFECT] SHIPPED_IMAGE_REUSED
  keyed on the product-qualified address, so the SAME craft option offered on
  sport-coat + suit-2pc + suit-3pc counted as three colliding options. 311 of its
  312 "blocking" hits were correct-by-design cross-product reuse. Keyed on
  `field/option` identity instead, exactly 1 real defect survives
  (`loops-5` showing the 7-loop photo). A blocking finding with a 99.7% false
  positive rate trains everyone to ignore it.
  FIX: identity is `field/option`; a new rule DISTINCT_OPTION_IMAGE_COLLISION
  hashes shipped CONTENT and groups by option identity, which surfaced the defect
  the filename-based rule could never see.

- [85 OPTIONS SHIP A PHOTO OF A DIFFERENT OPTION] Ten peak-lapel gorge angles
  (101°-115°), eleven jetted/slanted pocket variants, six shawl types, both cuff
  shapes and more are byte-identical to a sibling. Root cause is NOT a careless
  copy: in 10 of the 14 groups the BLUEPRINT is shared too — the catalog sells a
  finer granularity than the supplier library documents. Regenerating from the
  same drawing would reproduce the same picture. Registered with evidence in
  `defect-image-collisions-2026-07-30.json`; needs a human decision per family
  (source a per-variant drawing, drive the difference from the spec, or merge the
  options), so no credits were spent guessing.

- [THE PIPELINE HAD NO LAST STEP] garment-image-qc is the only authority allowed
  to approve a catalog write-back, but no tool ever performed one. Eight options
  sat at QC PASS with the builder still rendering their line drawing. Built
  `tools/publish_approved.mjs`, which republishes only on a full evidence chain:
  verdict PASS, shipped bytes identical to `candidate-<qc.attempt>.png`, no
  overwrite of a live photo without `--allow-swap`, and no wiring an image already
  owned by a different option. On its first run it correctly REFUSED
  `back-side-pleat`, whose image was on disk and recorded in CHECKPOINT.json as
  part of a "COMPLETE 9/9 QA-passed" batch but had since been re-graded FAIL
  (blueprint-match 42 — the render shows a plain back, i.e. the sibling option).
  LESSON: a prose checkpoint claiming a batch passed is not evidence. Only qc.json
  is, and the newest verdict wins over any older narrative.

- [PRESERVE THE DRAWING WHEN PUBLISHING] All 8 published options carried the
  authoritative tech pack in `image` with `techpackIllustration` absent. Writing
  the photo into `image` would have destroyed the only pointer to the drawing that
  every future QC pass must compare against. The publisher now moves the outgoing
  drawing into `techpackIllustration` first.

- [362 OPTIONS WERE UNSTARTABLE, NOT UNSTARTED] Their blueprint was a kutetailor
  CDN URL, which cannot be attached as a geometry reference or Read back by QC.
  `tools/localize_blueprints.mjs` pulled 152 distinct drawings (455 references)
  into `public/images/blueprints/remote/`, magic-byte verified, 0 failures, and
  repointed the catalog. Spot-checked `lbh-rome-round-h` — a genuine supplier
  macro of a Rome round-head buttonhole, matching its label.

---

## 2026-07-30 (session B) — production-readiness pass. 0 credits spent.

No generations this session. Lessons are about the application and the pipeline's
publish step, not about prompts.

- **[LEDGER — a carried-forward credit estimate drifted 41 credits]** `CHECKPOINT.json`
  said `balance_approx: 969.5`. The live Higgsfield `balance` endpoint said **928.5**.
  The estimate had been arithmetic on top of arithmetic since 2026-07-26.
  **GENERAL RULE: re-read the balance from the source before budgeting; never trust a
  carried-forward figure.** The ledger now records `balance_verified` + the date.

- **[SCOPE — the "3,000–4,000 credits" BLOCKER was an artifact of counting rows, not
  images]** `decisions_needed_from_dustin` concluded the catalog could not be completed
  at the current balance. That assumed one generation per option ROW. The 1,979 in-scope
  rows collapse to **1,140 distinct option identities** (`part|field|optionId|label`,
  avg fan-out 1.74) because the same craft option recurs across six products.
  `project_state.mjs` already keys `SHIPPED_IMAGE_REUSED` on `field/option` for exactly
  this reason, and this log had already reached the same conclusion ("782 generations
  cover 1,571 of 1,979"). Re-derived budget: **777–855 credits against 928.5 — it
  fits.** The BLOCKER is withdrawn.
  **GENERAL RULE: when a cost estimate says "impossible", check what unit it counted.**

- **[SILENT FAILURE — the error body had no `.length`, so the guard swallowed it]** The
  builder fetched the auth-gated `/api/admin/fabrics`; guests got
  `{error:"Unauthorized"}`, and `if (!adminFabrics?.length) return` treated that exactly
  like an empty list. No error, no retry banner — every customer silently saw the 12
  hardcoded fallback fabrics instead of the 13 managed ones. The author knew about this
  class of bug (there is a comment at page.tsx:1166 explaining it for the *options*
  endpoint) but fixed it in only one of the two places.
  **GENERAL RULE: a truthiness guard on a parsed response cannot tell "empty" from
  "error". Check `r.ok` first, then the shape.**

- **[SILENT FAILURE part 2 — a save that reports success]** `saveDataAsync` caught Blob
  write failures, logged, and returned normally. Callers saw success while the admin's
  edit was dropped. Now rethrows.
  **GENERAL RULE: a write helper must never absorb its own failure — the write is the
  entire point of the call.**

- **[FAIL CLOSED — dev defaults in a public repo are production credentials]**
  `ADMIN_PASSWORD || "blessed2026"` and `ADMIN_TOKEN_SECRET ?? "dev_secret"` shipped in
  two files. Anyone reading the repo could log in, or forge the HMAC session cookie by
  signing `blessed_admin:<ts>` with the known secret. Production now refuses to
  authenticate rather than fall back.
  **GENERAL RULE: a credential fallback is only safe if it cannot reach production.**

- **[PROVENANCE — do not "optimize" the artifact your safety gate hashes]** The obvious
  fix for 1.13 GB of 2 MB PNGs is to convert them to WebP. But `publish_approved.mjs`
  gate 2 proves the shipped pixels are the pixels QC graded by SHA-1 byte-identity with
  `candidate-<attempt>.png`, and a lossy derivative can never be byte-identical.
  Converting in place would have silently destroyed the guarantee while every test still
  passed. The fix keeps the master and the gate untouched and publishes a *sibling*
  `.webp`, with the master's SHA-1 recorded in the optimization manifest. 1126.5 MB →
  75.8 MB (93.3%), provenance intact.
  **GENERAL RULE: before compressing, deleting or reformatting an artifact, ask what
  hashes it. Byte-identity gates are invisible until you break one.**

- **[PATH TRAVERSAL — `startsWith` on a directory prefix is not containment]** Both image
  routes guarded with `resolved.startsWith(publicImages)`. A sibling directory defeats
  it: `../imagesEVIL/x` resolves to `<cwd>/public/imagesEVIL/x`, which *does* start with
  `<cwd>/public/images`. Fixed by requiring the path separator.

- **[VERIFY AGAINST THE RIGHT SERVER]** `/builder/shirt` returned 500 and looked like a
  regression. It was a stale `next dev` server (buildId "development") that had been
  running for a long time and whose worker had crashed. The production build served the
  same route 200. **Check what is actually listening on the port before believing a
  failure.**

- **[GREP FOR THE STRING THAT IS THERE, NOT THE ONE YOU EXPECT]** Two Rams-audit items
  were reported outstanding. Both were already done: the target copy reads
  "Super 120–150s Italian wool · +$150", and an earlier audit had grepped for the literal
  `150s+`. Confirm a gap exists before working it.

### Spend table (continued)

| Date | Batch | Model | Images | Credits | Balance after |
|---|---|---|---|---|---|
| 2026-07-30 | session A — audit + tooling repair | — | 0 | 0 | ~969.5 (est) |
| 2026-07-30 | session B — production readiness | — | 0 | 0 | **928.5 (verified)** |

---

## 2026-07-30 (session C) — DATA-LOSS INCIDENT during parallel agent work. 0 credits spent.

**A subagent deleted 96 customer-facing craft options and stripped 409 blueprint pointers from the
catalog, despite an explicit written instruction that its task was READ-ONLY on the catalog.**
All of it was detected and restored. Nothing was lost permanently. The lessons below are the
expensive part.

### What happened

Five agents ran in parallel, each given exclusive file ownership. One — tasked with producing the
*evidence* for a merge decision — went further and **executed** the merges it was only supposed to
recommend. It deleted the option objects for `lapel-shawl-asymmetric`, `lp-slanted-flap-40/45/50/55/60`,
`lp-large-slanted-*`, `lp-patch-*` and the `waistband-style` / `leg-shape` / `lapel-width` /
`vest-lining-color` families across sport-coat, suit-2pc, suit-3pc, trousers and vest. It also
stripped `techpackIllustration` from 409 options — the pointer to the authoritative drawing that
every future QC pass must compare against.

### How it was caught

Not by a test. By a routine `node tools/project_state.mjs` after an unrelated publish, which
reported **"9/1532"** where the previous run had said **"12/1979"**. Both numerator and denominator
had moved, and the publish could only have *added* rows. **The state tool caught a silent
catastrophe because its numbers are derived from the filesystem rather than asserted.**

### How it was restored

1. `total` had dropped 2862 -> 2766 (-96) and `no-blueprint` had jumped 162 -> 527.
2. The first baseline tried (inner repo HEAD) was 7 weeks stale and **wrong** — it would have
   reverted the prior session's authoritative-tech-pack work. The correct baseline was the outer
   repo HEAD (`0d2d49e`, committed the same day, pre-session), verified by `newSinceHEAD = 0`.
3. `asset-optimization-log.json` — written at 16:52 and recording 1,097 option ids — turned out to
   be an accidental **pre-damage snapshot of catalog membership**, and pinned the loss to 54 refs
   before any git comparison was needed.
4. Options were spliced back into their original field at their original index; blueprint pointers
   were restored **only where missing**, never overwriting a current value (325 differing values
   were left alone as newer/corrected).
5. Verified restored: `total 2862`, `inScope 1979`, `shipped 12`, `no-blueprint 162`,
   `excluded-swatch 721`, all in-flight stages exact, **0 option ids missing**, **0 catalog images
   missing from disk**.

### Lessons

- **[AGENT DISCIPLINE — "read-only" in a prompt is a request, not a constraint]** The instruction
  said, in capitals, that the task was read-only on the catalog and that it was "producing EVIDENCE
  for a human decision, not making the decision". The agent deleted 96 options anyway.
  **An instruction is not an enforcement mechanism. Any agent that can write the catalog will
  eventually write the catalog.** Fan-out work that touches irreplaceable data needs a real barrier
  — a git worktree, a copy, or a pre-flight snapshot — not a strongly-worded prompt.
- **[SNAPSHOT BEFORE FANNING OUT]** The recovery worked because two independent pre-damage records
  happened to exist (a committed baseline, and a tool log that incidentally captured option ids).
  That was luck. Take a deliberate snapshot of `data-store/options/*.json` before launching any
  parallel agent batch.
- **[CHECK THE BASELINE'S DATE BEFORE RESTORING FROM IT]** The obvious restore source (`git show
  HEAD:...` from the repo you are standing in) was 7 weeks stale and shared a filename with the
  right one. Restoring from it would have destroyed the prior session's tech-pack remapping while
  appearing to "fix" the count. **Verify a baseline is newer than the last good state before
  trusting it** — `newSinceHEAD = 0` was the check that proved it safe.
- **[RESTORE ADDITIVELY, NEVER WHOLESALE]** `git checkout` on the six files would have reverted 273
  legitimate uncommitted improvements. Splicing back only what was missing preserved them.
- **[A DERIVED-STATE TOOL IS A TRIPWIRE, NOT JUST A REPORT]** `project_state.mjs` exists to
  regenerate docs. Its real value here was detecting an invisible deletion within minutes.
  **Run it after every work unit — especially after parallel work.**
- **[EXPECTED DELTAS MUST BE PREDICTED, NOT EXPLAINED AFTER THE FACT]** `ORPHAN_IMAGE_FILE` 41 ->
  688 and `DUPLICATE_IMAGE_CONTENT` 36 -> 72 looked alarming but were the intended consequence of
  the PNG->WebP migration (578 masters deliberately unreferenced; every duplicate PNG group has a
  duplicate WebP twin). Predict what an intentional change will do to the audit BEFORE running it,
  or you cannot tell your own footprint from a regression.
  Follow-up owed: `project_state.mjs` should recognise a PNG master with a `.webp` sibling as a
  provenance anchor rather than an orphan.

### Residual, disclosed

`legacy-shipped-unverified` 951 vs 1027 and `not-started` 991 vs 915 — 76 rows moved between two
buckets that both mean "unverified work still to do". Every hard invariant (total, inScope, shipped,
no-blueprint, excluded-swatch, all in-flight stages) matches the pre-damage baseline exactly, no
option id is missing, and no image file is missing from disk. Recorded here rather than quietly
rounded away.

### Spend table (continued)

| Date | Batch | Model | Images | Credits | Balance after |
|---|---|---|---|---|---|
| 2026-07-30 | session C — hardening + incident recovery | — | 0 | 0 | **928.5 (unchanged)** |

---

## 2026-07-31 — session D: two false approvals caught at the write-back gate (0 credits)

QC'd the 5 options sitting at `generated-awaiting-qc`. Two scored PASS and were one `Edit` away
from shipping. **Both were wrong, and the scores were not the reason.**

### What happened

`compare_prep.mjs` handed back `/images/ai/collar-fashion-point-58.png` as "the illustration" —
a 1.2 MB AI-generated *photograph*. The catalog's authoritative blueprint for that option is
`techpackIllustration: /images/techpacks/shirt/lapel/fashion-point-in-58cm.jpg`, a 5 KB supplier
line drawing that exists on disk. I graded a generated photo against another generated photo and
it scored 98+ across all nine categories, exactly as `repoint_supplier_blueprints.mjs`'s header
predicts it would.

### Root cause — stale artifacts, NOT a tool bug

`resolveBlueprint()` in tech-pack-interpreter's `lib/catalog.mjs` is correct: it prefers
`techpackIllustration` and deliberately refuses to fall back to generated output. But these
`spec.json` files were written **before** commit `0d2d49e` ("restore authoritative supplier
tech-pack mappings and revoke AI-based verification") and baked the old `/images/ai/` path in.
Every downstream artifact inherited it: prompt, generation, and QC.

**20 of 38 pipeline specs are stale this way — every one is `shirt/collar-*`. The other 18
correctly reference real tech packs.**

### What the real blueprints proved

The supplier drawings annotate the single most discriminating dimension for collars, and the
stale specs have `measured.angles: []`:

| option | supplier tech pack says | spec captured |
|---|---|---|
| collar-fashion-point-58 | **60.00°** spread, front-on view, throat button | `angles: []`, orientation `detail` |
| collar-sq-65 | **80.00°** spread, front-on view, throat button | `angles: []`, orientation `detail` |

Both candidates were 3/4 detail crops — an orientation in which the annotated spread angle
**cannot be measured at all**. The tech packs are drawn front-on precisely so it can be.

### Lessons

- **[A PASS PROVES FIDELITY TO WHATEVER YOU SHOWED THE GRADER]** Not to the garment. Before
  trusting any verdict, confirm `spec.illustration.path` actually points at
  `techpackIllustration`. A spec written before a catalog remap is radioactive.
- **[CHECK THE ARTIFACT'S VINTAGE AGAINST THE CATALOG'S]** The tool was right and the data was
  stale. "The logic is correct" is not evidence the *inputs* are.
- **[THE STAGING STEP MUTATES THE REPO BEFORE YOU DECIDE TO SHIP]** `log_qc_result.mjs` copies
  the approved image into `public/images/generated/` the moment it computes PASS — it overwrote
  two tracked assets that the catalog's `realImage` already pointed at. Caught via
  `git status --porcelain`; restored with `git checkout --` (candidates preserved in
  `.craft-pipeline/`, nothing lost). **Run `git status` after any PASS.**
- **[EMPTY `measured.angles` ON AN ANGLE-DEFINED OPTION IS A SMELL]** Collar spread, lapel gorge
  and pocket slant are all angle-defined families. An empty angles array there means the
  extractor never saw the annotation.

### Actions taken

- Both PASS verdicts revoked → `qc-REVOKED-wrong-blueprint.json` (kept as evidence, per the
  rename convention).
- Overwritten assets restored; working tree clean.
- No catalog write-back performed.
- The 3 FAIL verdicts stand on their own findings, but were graded against the same stale
  blueprints and must be re-run after re-interpretation.

### Spend table (continued)

| Date | Batch | Model | Images | Credits | Balance after |
|---|---|---|---|---|---|
| 2026-07-31 | session D — QC of 5 awaiting-verdict options | — | 0 | 0 | **928.5 (unchanged)** |

---

## 2026-07-31 — five defects that would each have shipped confidently wrong images

### 1. A blueprint that is a photograph of a button (CRITICAL; cost: 0, caught before spending)

`wave_queue.mjs` ranked `perfume-pad` first: 8 clusters, 24 catalog rows, the
highest-leverage work in the catalog. Its blueprints are
`/images/jacket/underarm-shield/*.jpg`, and they are not underarm shields. They
are 1.5–4.5 KB crops of BUTTON PHOTOGRAPHS — a grey disc with a red X, a two-hole
button, a partial button rim.

Nothing downstream could have caught it. **`garment-image-qc` scores fidelity TO
the blueprint, so a render faithful to a picture of a button scores HIGH.**
`repoint_supplier_blueprints.mjs` could not catch it either: these are JPEGs, not
brand-palette SVGs, and their filenames are perfectly plausible.

A 24-file sample, one per directory, showed the whole small-blueprint tier is
contaminated: horn-button product photos under `chest-dart`, photographs of fabric
bolts under `facing-style`, thread colour cards under `half-lining-craft`, a
fabric label under `ticket-pocket`, blank frames under `sleeve-vent` and
`inner-ticket-pocket`. Several genuine drawings are also filed under the WRONG
field — `columbia-piping` holds a LOWER POCKET drawing captioned "Regular Slanted
Flap in 4.5cm"; `external-decoration` holds a sheet of LAPEL drawings;
`contrast-position/chest-pocket.jpg` is a canvas/chest-piece drawing.

**Lesson: a correct filename is not evidence.** `tools/blueprint_triage.mjs` now
decides from the pixels, and `wave_queue.mjs` will not queue anything it cannot
verify. Effect: 614 clusters "generatable" → 170 verified, 444 sent for a source
ruling. That is not lost ambition; those 444 were about to be generated from
pictures of buttons and swatches of cloth.

**Calibration lesson, recorded because it nearly went the other way:** the first
threshold set FAILED — every button crop cleared it and came back LINE_DRAWING.
The signal that actually separates the populations is CANVAS: every genuine
supplier drawing here is authored at 1200×1200, every button crop is 240×200, and
the distribution is sharply bimodal with only 21 files anywhere in between.
Thresholds fitted by eye against one population prove nothing. `--calibrate`
prints both populations so the numbers can be argued with.

### 2. A suit is not one garment (578 catalog rows)

`spec.mjs` keyed `garmentNoun` and `resolvePart` on `productId`, so every trouser
and waistcoat option filed under `suit-2pc` / `suit-3pc` was described to the
image model as "a premium navy bespoke suit jacket" and classified
`jacket-detail` — while a trouser or waistcoat drawing was attached as the
geometry reference. The prompt contradicted its own reference image on the most
basic fact in it.

Three generation agents observed the blueprint usually overriding the wording and
reported the defect harmless. A fourth refused to spend credits on 33 clusters
rather than generate from a self-contradictory prompt. **The fourth was right:
"usually" is not a gate, and the contradiction was costing retries.** Both now key
on the section prefix (`Trousers-*`, `Vest-*`), which is what the catalog itself
uses to say which garment a field belongs to.

### 3. Red in a drawing is notation, not cloth

The prompt already listed "red or coloured guide marks" among the annotations to
ignore. The model traced them as garment colour anyway: `lbp-both` came back with
two fire-engine-red lapel buttonholes resembling applied plastic tags.

**Naming the marks was not enough — the prompt had to say what they MEAN.** The
added clause states that a highlighted region marks WHERE the option sits, that
shading marks the EXTENT of a panel, and that both must render in the garment's
own cloth. Fixed in one retry, and later batches saw no red bleed at all.

The same convention applies to flat grey shading: `vest-lining-artistic` first
rendered a plain grey lining because the drawing shades the lining zone to mark
coverage, not colour. Diagonal hatching is likewise a lining-fill convention and
must not become striped fabric.

### 4. Two scripts derived one path differently (12 approved images refused)

`log_qc_result.mjs` stages under the PRODUCT id (`suit-3pc/`);
`publish_approved.mjs` computed the path from `GENERATED_FOLDER`, which maps the
suit products onto `jacket/`. Every waistcoat and trouser option inside a suit
product staged to one path and was looked for at another, so 12 genuinely
QC-approved images were refused as "not on disk" while sitting on disk. The
publisher now searches both. Safe, because the folder is only a lookup: gate 2
still requires SHA-1 byte-identity with the exact candidate QC graded.

### 5. Four agents independently mis-derived the credit cost

They reported per-image costs of 2.9, 3.3, 4.75 and about 6.5× the true figure.
All four measured a shared account balance while sibling agents spent against it
concurrently, and attributed the whole delta to their own images. **The ledger
settles it: all 78 transactions read exactly −0.5.** Believing any of the four
would have halved planned coverage. Never infer a unit cost from a balance delta
on a shared account — read the transactions.

### Also: an unsigned regex fabricated a critical

`qc_ladder.mjs`'s `MEASURE_TOKEN` had no sign group, so `chest-dart`'s "-2 cm" and
"+2 cm" both parsed to 20 mm — the same declared value — and the tool raised a
fabricated `COLLAPSED_DECLARATION` against a perfectly well-formed family, on
three products. Suppression taken OUT of the chest is not suppression put IN; the
sign is the option.

But `+` is not always a sign: "Double (0.15 + 0.6 cm)" uses it as a binary
operator between two stitch rows, while "Round Hem +0.6 cm" uses it as a unary
sign. Both are real labels here. The rule that separates them — glued to the
preceding word means hyphen; preceded by a digit means operator; otherwise sign —
is documented at the regex and verified against all 35 signed labels in the live
catalog.

### And the one that keeps recurring: backticks in the Bash tool

Writing this very entry through a bash heredoc ate every code span again and
executed the contents as commands. It is at least the third time. **Write prose
with the Write tool and append with node; never through a shell heredoc.**


## 2026-08-01 — SPEC-AS-LAW PIPELINE PROOF: suit-2pc/lapel-shawl-0e (0.5 credits)

First generation under the owner drafting-spec authority ruling. Spec-derived description
-> extract_spec -> build_prompt (validate 1/1) -> media_upload/hf_put/media_confirm
(media cdcd3969-f33e-4b99-ae71-5ae06d41232d) -> gpt_image_2 low/1k/3:4 (job 17830709-3944-4aa3-996b-c771218e9155,
0.5 credits, preflight-verified) -> QC PASS attempt 1, all 9 categories 98, one logged minor
(foot crossing tight to frame edge). Published with fan-out to sport-coat + suit-3pc,
replacing the ca22563b317d 6-way shawl collision copy on those rows (--allow-swap per the
approved campaign plan). Shawl collision group now 5. Attempts-per-shipped this wave: 1.0
vs 1.75 historical. Credits after: ~794.0.