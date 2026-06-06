# 02 Scorecard — Blessed & Dressed Full-Site Design Audit
**Date:** 2026-06-05  
**Scored by:** orchestrator (not subagents)  
**Scoring rules:** integer 0–3 · tie-break to lower · score worst instance, not mean

---

## 1. Good design is innovative — Score: 2/3
**Evidence:** Style Quiz (step 3) pre-filters Design options per quiz answer — not seen at Indochino, Suitsupply, or Huntsman. MeasuringGuide with body/finished toggle (`MeasuringGuide.tsx`) is a clear improvement over static PDF guides. Core checkout pattern (multi-step configurator → cart → Stripe) is standard.  
**Justification:** Refreshes existing bespoke-configurator pattern with a clear, functional improvement (quiz filter), but does not introduce a wholly new form; score 3 requires a pattern not seen in 5+ peers.

---

## 2. Good design makes a product useful — Score: 2/3
**Evidence:** Primary task (configure → purchase) completes end-to-end. Double-product-selection bug is fixed (starts at step 2). Style Quiz has a Skip path. Adjacent surface adds friction: API fetches at `page.tsx:1009-1033` have zero loading feedback; builder "Continue" is not gated on fabric selection; measurements step does not validate before advancing.  
**Justification:** Primary task completes but adjacent surface (ungated progression, silent API fetch) adds unnecessary detours; score 3 requires fewest possible steps with no decoy actions.

---

## 3. Good design is aesthetic — Score: 2/3
**Evidence:** Coherent dark-navy + gold palette from CSS variables (`globals.css:10-27`). Playfair/Montserrat pairing is appropriate and consistent. Spacing uses a clean 4px-base Tailwind system. **9 orphan arbitrary type sizes** (`text-[0.54rem]` through `text-[0.92rem]`) found in homepage labels/marquee — not visible in the builder but present on the site.  
**Justification:** The builder design obeys a single visible system, but the homepage introduces 9 orphan type sizes that break the scale; the inconsistency count (>2) prevents a 3, but they are minor and non-jarring, preventing a 1.

---

## 4. Good design makes a product understandable — Score: 1/3
**Evidence:** 6 jargon terms identified: "Canvas" (`page.tsx:51`), "Chest Allowance" (`builder/[product]/page.tsx:645`), "Wearing Habit" (`page.tsx:658`), "Finished Measurements" (`page.tsx:583`), "Posture Adjustments" (`page.tsx:970`), "MTM" (implied, never spelled out). "Skip — show all options" navigates forward rather than staying in place (`page.tsx:235`).  
**Justification:** More than 2–3 controls are unclear to a first-time bespoke buyer; jargon is present throughout the configurator's field names; score 2 requires at most 1 control needing a tooltip.

---

## 5. Good design is unobtrusive — Score: 2/3
**Evidence:** Builder chrome (step pills, sidebar) recedes cleanly; content is the figure. Homepage has more chrome (marquee, hero cascade, bento grid, testimonials scrub, pinned craft, CTA section) but this is appropriate for a marketing page. GlobalEditMode floating chip is always in the DOM on public pages but visually minimized.  
**Justification:** Chrome visible but quiet on the primary task surface (builder); homepage chrome is heavier but contextually justified; score 3 requires chrome to fully recede, which the homepage animations prevent.

---

## 6. Good design is honest — Score: 1/3
**Evidence:** Multiple inflations: "instant luxury essentials" (`page.tsx:144`), "Premium fabric" +$150 with no spec (`page.tsx:1238, 1594`), "Every detail, considered." (`page.tsx:248`), "refined finishing pieces" (`page.tsx:206`). Minor hidden-cost issue: additional monogram cost (+$10) not surfaced before user enters second monogram (`page.tsx:391`). "from $[amount]" pricing delays full cost visibility until checkout.  
**Justification:** 4 inflations and one minor hidden-cost pattern exceed the ≤1 inflation threshold for score 2; score 0 requires a deceptive flow, which is absent — these are soft inflations, not manipulative patterns.

---

## 7. Good design is long-lasting — Score: 2/3
**Evidence:** Dark navy + gold palette and Playfair/Montserrat pairing are classic — no skeuomorphism, no glassmorphism, no year-branded gradient. Two dated markers: GSAP hero cascade fade-up (`HeroSection.tsx:23`) and continuous horizontal marquee (`globals.css:115`) are both recognizable patterns from 2021–2024 premium landing pages.  
**Justification:** 2 dated markers present (hero cascade + marquee) prevent a 3, but neither is egregiously trendy; the underlying design language (dark navy, serif/sans pairing, gold accent) reads as enduring.

---

## 8. Good design is thorough down to the last detail — Score: 1/3
**Evidence:** States audit (see B5): **Empty — ABSENT**; **Loading — ABSENT** (API fetches at `page.tsx:1009-1033`); **Error — ABSENT on builder** (present only in checkout); **Success — PARTIAL** (cart-added and share-copied flashes only; no per-step confirmation); **Focus — PRESENT** (gold ring, comprehensive); **Disabled — PARTIAL** (back button only; Continue not gated).  
**Justification:** 3 states fully absent (empty, loading, builder error) and 2 partial (success, disabled) against 1 fully present (focus); anchors place "2–3 states missing" at score 1; the single fully-present focus state prevents a 0.

---

## 9. Good design is environmentally friendly — Score: 1/3
**Evidence:** `@react-three/fiber` in `package.json` (~580KB if not tree-shaken) is not imported anywhere in the codebase. Even assuming Next.js tree-shaking eliminates it, estimated bundle is **~420KB gzipped** (GSAP 100KB + Supabase 100KB + Stripe 50KB + others). Hero GSAP animation runs on mount (`HeroSection.tsx:23-39`); marquee runs continuously (`globals.css:115-120`). `prefers-reduced-motion` is **absent from all files**. `puppeteer-core` and `mupdf` are in production dependencies.  
**Justification:** Bundle is below 500KB (condition for score 2) but motion is not gated on `prefers-reduced-motion` (required for score 2); score 2 requires both conditions; tie-break to lower gives score 1.

---

## 10. Good design is as little design as possible — Score: 2/3
**Evidence:** Duplicate "Continue" button: main content (`page.tsx:1515`) + sidebar "Continue to Step N" (`page.tsx:1709`) — same `goNext()` call, 2 simultaneous invitations. `GlobalEditMode` (and its MutationObserver) loads on all public pages rather than admin-only. Everything else in the builder earns its place.  
**Justification:** ≤2 removable elements (duplicate Continue + unconditional GlobalEditMode on public pages); score 3 requires zero removable elements.

---

## Totals

| # | Principle | Score |
|---|-----------|-------|
| 1 | Innovative | 2 |
| 2 | Useful | 2 |
| 3 | Aesthetic | 2 |
| 4 | Understandable | 1 |
| 5 | Unobtrusive | 2 |
| 6 | Honest | 1 |
| 7 | Long-lasting | 2 |
| 8 | Thorough | 1 |
| 9 | Environmentally friendly | 1 |
| 10 | As little design as possible | 2 |
| | **TOTAL** | **16 / 30** |

---

**Verdict trigger:** Total < 20 → REDESIGN  
**Load-bearing check:** #2 = 2, #4 = 1, #6 = 1 (none scored 0 on a load-bearing dimension, but total alone triggers REDESIGN)
