# 04 Handoff Prompt — /make-plan

Copy and paste the block below into a new session.

---

````
/make-plan Redesign Blessed & Dressed execution layer. Current design failed audit at 16/30 with critical gaps in principles #4 (understandable: 1/3), #6 (honest: 1/3), #8 (thorough: 1/3), and #9 (environmentally friendly: 1/3).

Verdict paragraph:
> The visual language and brand identity are solid, but the design as shipped is incomplete: the builder flow has no loading, empty, or error states; six configurator labels use tailoring jargon a first-time buyer cannot decode; four marketing claims are inflated without backing; animations run with no motion-preference gate; and the codebase carries a dead 580KB dependency — together these systemic execution gaps score 16/30, below the REFINE threshold.

Why redesign and not refine: Total score 16/30 is below the 20-point REFINE threshold; the pattern of failures is systemic (missing state coverage, copy imprecision, weight, motion governance) rather than isolated.

Preserve from current design:
- Dark navy + gold CSS variable palette in `src/app/globals.css:10-27` — do NOT change any color token
- Playfair Display / Montserrat font pairing (`globals.css:32-33`)
- 8-step builder architecture and step-pill progress bar (`src/app/builder/[product]/page.tsx:34`)
- StyleQuizStep filtering approach (`src/components/builder/StyleQuizStep.tsx`) — innovative; do not touch
- MeasuringGuide slide-over (`src/components/MeasuringGuide.tsx`) — well executed; do not touch
- Gold focus-ring system (`focus-visible:ring-2 focus-visible:ring-[#D4AF37]`) throughout builder
- Scripture quotations — keep all 4 instances; they are on-brand

Discard:
- Silent API fallbacks with no user signal. Evidence: `page.tsx:1009-1033` (fabrics + builder-options fetch). Caused failure on principle #8.
- 6 jargon labels in the configurator. Evidence: "Canvas" `page.tsx:51`, "Chest Allowance" `page.tsx:645`, "Wearing Habit" `page.tsx:658`, "Finished Measurements" `page.tsx:583`, "Posture Adjustments" `page.tsx:970`, "Skip — show all options" `page.tsx:235`. Caused failure on principle #4.
- Unsubstantiated marketing inflations. Evidence: "instant luxury essentials" `page.tsx:144`, "Premium fabric" badge with no spec `page.tsx:1238`, "Every detail, considered." `page.tsx:248`, "refined finishing pieces" `page.tsx:206`. Caused failure on principle #6.
- `@react-three/fiber` production dependency (`package.json`). Not imported anywhere; ~580KB if not tree-shaken. Caused failure on principle #9.
- Ungated GSAP + marquee animations. Evidence: `HeroSection.tsx:23-39` (mount-time cascade), `globals.css:115-120` (marquee infinite). No `prefers-reduced-motion` anywhere. Caused failure on principle #9.
- Duplicate "Continue to Step N" button in sidebar (`page.tsx:1703-1711`). Same `goNext()` call as main-content Continue. Caused failure on principle #10.

Top 5 moves from the audit:

1. Principle #8 — Thorough: Add skeleton loading cards to the Fabric step while `activeFabrics` loads (API fetch at `page.tsx:1009`); add error retry banner when fetch fails; add "no options" empty state card in Design step when a category has no entries. Target: zero silent waits in the builder.

2. Principle #9 — Environmentally friendly: Remove `@react-three/fiber` from `package.json`; move `puppeteer-core` and `mupdf` to devDependencies; wrap `HeroSection`, `TestimonialsReveal`, `PinnedCraft`, `BentoFeatures` in `dynamic(() => import(...), { ssr: false })`; add `@media (prefers-reduced-motion: reduce)` in `globals.css` to disable `.marquee-track` animation and reduce hero GSAP durations to 0.

3. Principle #4 — Understandable: Replace 6 jargon labels in builder: "Canvas" → "Jacket Structure", "Chest Allowance" → "Extra Room for Movement", "Wearing Habit" → "How You Plan to Wear It", "Finished Measurements" → "Garment Dimensions"; add one-line example to Posture step intro; change "Skip — show all options" to "Show all options →" since clicking it advances the flow.

4. Principle #6 — Honest: Delete "instant luxury essentials" from `page.tsx:144` — replace with the product category label; add a one-sentence wool-grade/mill spec next to every "Premium" badge; surface the +$10 per-additional-monogram cost in the UI at the moment a second monogram input is unlocked (not only in the step intro copy at `page.tsx:391`).

5. Principle #2 — Useful: Remove "Continue to Step N" from the sidebar Order Summary panel (`page.tsx:1703-1711`); add `disabled={!fabric}` to the Fabric-step Continue button with a visible disabled style; verify MeasurementsStep does not allow advancing with no measurement mode selected.

Redesign principles in priority order:
1. #8 Thorough — every state (loading, empty, error, success, focus, disabled) covered on the builder's primary path
2. #4 Understandable — a first-time bespoke buyer can name every configurator control without a glossary
3. #9 Environmentally friendly — bundle tree-shaken of dead code, motion respects user preferences
4. #6 Honest — every badge and claim maps 1:1 to a verifiable spec or behavior
5. #2 Useful — primary task (configure → purchase) has zero unnecessary detours or silent failures

Deliverables for the plan:
- Per-fix: exact target file(s), lines to change, and a verification step (screenshot or assertion)
- States coverage checklist to confirm all 6 states are addressed after the work
- Copy change table: old label → new label, for every jargon replacement
- Bundle delta: before/after dependency count and estimated gzip weight
- Regression checklist: confirm preserved items (palette, focus rings, quiz filter, measuring guide) still score 3 after changes

Out of scope for this pass: visual redesign of any page, changes to builder step architecture, changes to checkout flow, admin panel, new features.

Anti-patterns to guard against:
- Porting the old jargon labels under new styling
- Adding a feature flag that keeps both old and new labels simultaneously
- Redesigning the visual language (palette, fonts, layout) — that's not what failed
- Treating the Preserve list as optional — palette, focus rings, quiz, and measuring guide must not regress
````
