# 01 Evidence — Blessed & Dressed Full-Site Design Audit
**Date:** 2026-06-05

---

## A. Structural Evidence

### A1. Interactive-element counts per page
| Page | Buttons | Inputs | Selects | Links | Labels | Total |
|------|---------|--------|---------|-------|--------|-------|
| `/` (homepage) | — | — | — | 8 | — | 8 |
| `/builder` (product grid) | — | — | — | 1 | — | 1 |
| `/builder/[product]` (builder) | 25 | 7 | 4 | 1 | 7 | **44** |
| `/products` (RTW listing) | — | — | — | 3 | — | 3 |
| `/checkout` | 1 | 7 | — | 2 | 7 | 17 |
| `/cart` | 4 | — | — | 4 | — | 8 |

Source: `src/app/builder/[product]/page.tsx` (44 elements), others confirmed by agent.

### A2. Max nesting depth
Deepest chain in builder: `BuilderProductPage → main → div.mx-auto → div.grid → div.space-y-6 → {renderStep()} → MeasurementsStep → div → div → div → table → tbody → tr → td → input` = **14 levels**
Source: `src/app/builder/[product]/page.tsx:702-730`

### A3. Repeated affordances (same purpose, multiple locations)
- **"Continue" / "Continue to Step N"** appears in the main content nav row (`page.tsx:1510-1519`) AND in the sidebar Order Summary panel (`page.tsx:1703-1711`). Both call `goNext()`. Two buttons advancing the same step — one is redundant.

### A4. Dead props / unused imports
None detected. All imports in the builder page are used.

### A5. Builder steps
STEPS array at `page.tsx:34`:
1. **Product** — garment type grid (skipped on load; starts at step 2)
2. **Fabric** — fabric selection, premium tier
3. **Style** — StyleQuizStep; answers filter Design options
4. **Design** — per-product design fields, tabbed, filtered by quiz
5. **Monogram** — up to 3 monograms; first free, +$10 each additional
6. **Measurements** — 3 modes: standard size / body / finished
7. **Posture** — optional body-trait adjustments
8. **Review** — summary, price, Add to Cart

---

## B. Visual Evidence

### B1. Spacing scale
Tailwind-based, multiples of 4px. Observed values: 2px (gap-0.5), 4px, 6px, 8px, 10px, 12px, 16px, 20px, 24px, 32px. Custom button padding tokens in `globals.css:139-144` (btn-pad-xl = 14px/40px through btn-pad-acc = 9px/18px). **System is consistent.**

### B2. Type scale
Standard Tailwind sizes (text-xs through text-4xl) plus responsive clamp classes in `globals.css:134-136` (`.h1-hero`, `.h2-section`). **Heavy use of custom arbitrary sizes**: `text-[0.54rem]`, `text-[0.56rem]`, `text-[0.57rem]`, `text-[0.58rem]`, `text-[0.62rem]`, `text-[0.65rem]`, `text-[0.69rem]`, `text-[0.79rem]`, `text-[0.92rem]` — 9 orphan sizes, mostly in homepage labels and marquee. Fonts: `font-display` = Playfair Display, `font-sans` = Montserrat (`globals.css:32-33`).

### B3. Distinct color count
~30–35 unique values. CSS variable palette defined in `globals.css:10-27` (dark: 6 tokens; light: 9 tokens). Builder adds inline hex values: `#F5F1E6`, `#9B9180`, `#C9C1B3`, `#6A7A8C`, `#3A4C62`, `#071A2D`, `#0B1B2E`, `#122742`, `#040E1A`, `#1D3C62`, `#31425B`, `#D4AF37` (with /10, /30, /40 tints), `#EF4444`. Thread swatches add 10 more. **High count but all traceable to 2 logical palettes (dark builder + light homepage).**

### B4. Lowest contrast ratio
Worst pair: `#6A7A8C` text on `#071A2D` background ≈ **3.5:1** (INFERRED). Appears on secondary labels and disabled states (`page.tsx:278`). WCAG AA normal-text threshold = 4.5:1. This fails. Muted text (`#9B9180`) on same background ≈ 4.2:1 — passes AA marginally.

### B5. States checklist — builder flow
| State | Status | Source |
|-------|--------|--------|
| Empty | **ABSENT** | No UI for "no fabrics available" or "no design options loaded" |
| Loading | **ABSENT** | API fetches at `page.tsx:1009-1033` have zero visual feedback during pending |
| Error | **PARTIAL** — checkout only | Checkout: `checkout/page.tsx:208-212` (red banner). Builder: silent fallback to null on API error |
| Success | **PARTIAL** | Cart-added flash (`page.tsx:1165`) + share-copied flash (`page.tsx:1092`). No per-step confirmation. |
| Focus | **PRESENT** | Comprehensive gold ring (`focus-visible:ring-2 focus-visible:ring-[#D4AF37]`) on all interactive elements |
| Disabled | **PARTIAL** | Back at step 1 disabled (`page.tsx:1500-1501`); checkout submit disabled while submitting. Builder "Continue" not gated on required selections. |

---

## C. Copy & Honesty Evidence

### C1. Primary CTAs with file:line
- "Start Bespoke Order" — `page.tsx:259`
- "Start designing" — `builder/page.tsx:58`
- "Continue to Design" — `builder/[product]/page.tsx:224`
- "Skip — show all options" — `builder/[product]/page.tsx:235`
- "Add to Cart — $[price]" — `builder/[product]/page.tsx:1414`
- "Share this build" — `builder/[product]/page.tsx:1431`
- "Back" / "Continue" — `builder/[product]/page.tsx:1506, 1515`
- "Continue to Step [n]" — `builder/[product]/page.tsx:1709`
- "How to Measure" — `builder/[product]/page.tsx:1487`
- "Proceed to Payment" — `checkout/page.tsx:219`
- "Proceed to Checkout" — `cart/page.tsx:163`
- "Book Consultation" — `site-settings.json:8`

### C2. Flagged inflations
- **"instant luxury essentials"** — `page.tsx:144` — no material spec or provenance differentiator
- **"refined finishing pieces"** — `page.tsx:206` — undefined refinement criteria
- **"Curated looks for the season"** — `page.tsx:96` — no curation methodology disclosed
- **"Premium fabric"** — `builder/[product]/page.tsx:1238, 1594` — +$150 upcharge; no spec explaining what "premium" means vs. standard in the UI
- **"Every detail, considered."** — `page.tsx:248` — unmeasurable claim

### C3. Flagged dark patterns
- **Hidden cost reveal**: First monogram labeled "complimentary" in monogram step (`page.tsx:391`). Additional monograms at +$10 each — disclosed in step copy but not surfaced in the CTA before user adds a second monogram. Minor; not malicious.
- **"from $[amount]" pricing** — shipping and tax "calculated at checkout" (`cart/page.tsx:157`); price is not final until very late in the flow.

### C4. Flagged jargon
| Term | File:Line | First-Timer Problem | Proposed Plain Text |
|------|-----------|---------------------|---------------------|
| **Canvas** | `page.tsx:51-56` (filter logic) | Refers to interlining type (full/half/fused) — invisible to buyer | "Jacket Structure" |
| **Chest Allowance** | `builder/[product]/page.tsx:645` | "Allowance" is MTM jargon | "Extra Room for Movement" |
| **Wearing Habit** | `builder/[product]/page.tsx:658` | "Habit" implies custom not fit preference | "How You Plan to Wear It" |
| **Finished Measurements** | `builder/[product]/page.tsx:583` | Contrasts with "body" opaquely | "Garment Dimensions" |
| **Posture Adjustments** | `builder/[product]/page.tsx:970` | No examples shown; sounds medical | Add example: "e.g. forward posture, sloping shoulders" |
| **MTM** | Implied throughout; never spelled out | Made-to-Measure unrecognized by first-time buyer | Spell out on first use |

### C5. Label → behavior mismatches
- **"Skip — show all options"** (`page.tsx:235`): calls `clearStyleQuiz()` AND `onComplete()` — advances to Design step. "Skip" implies no advancement; behavior is navigation forward.
- **Duplicate Continue** (`page.tsx:1515` main content + `page.tsx:1709` sidebar): same action, two simultaneous button invitations. Minor but noisy.

### C6. Scripture / faith copy
4 instances found: Deuteronomy 28:13 at builder review step (`page.tsx:1399`) and homepage closing CTA (`page.tsx:269`); 1 Corinthians 14:40 in hero (`site-settings.json:40`); "FAITH · INTEGRITY · EXCELLENCE" footer tagline. All feel coherent with the brand identity and are non-intrusive (no modal, no forced reading). No opt-out path; users unfamiliar with faith-branding may be surprised.

---

## D. Weight & Friction Evidence

### D1. Dependencies + bundle weight
From `package.json:11-26`:
- `@react-three/fiber` ^9.6.1 — **NOT imported anywhere in codebase. ~580KB gzipped if not tree-shaken.**
- `gsap` + `@gsap/react` — ~100KB gzipped (actively used)
- `@supabase/supabase-js` — ~100KB (used conditionally; returns null if no env vars)
- `stripe` — ~50KB (checkout page only)
- `react-image-crop` — ~30KB (admin edit modal)
- `mupdf` — PDF renderer; likely dev/server-only
- `puppeteer-core` — headless browser; should be devDependency
- `zustand` — ~2.5KB
- Estimated total (tree-shaken): **~380–420KB gzipped**. With dead three.js: **~975KB**.

### D2. Network requests on primary view
External domains: `fonts.googleapis.com`, `fonts.gstatic.com`, images from `images.unsplash.com` / `placehold.co` / `*.public.blob.vercel-storage.com`. **Tailwind is local (PostCSS JIT), NOT CDN.** Homepage uses `<img>` tags, not Next.js `<Image>` — no automatic optimization or lazy loading. Source: `layout.tsx:102-108`, `next.config.ts:6-20`.

### D3. Animations on idle
- **HeroSection GSAP cascade** — runs immediately on mount, ~2 seconds of cascading fade-up + scale animations. Source: `HeroSection.tsx:23-39`. **Not gated on `prefers-reduced-motion`.**
- **`.marquee-track` CSS animation** — `animation: marquee 32s linear infinite` — **runs continuously on every page that includes the homepage sections.** Source: `globals.css:115-120`.
- Scroll-driven animations (TestimonialsReveal, PinnedCraft, BentoFeatures) — only fire on scroll, acceptable.
- **`prefers-reduced-motion` is absent from all CSS files and GSAP configurations.**

### D4. Overlays on initial load
- `GlobalEditMode` is mounted on every public page via layout. Registers a `MutationObserver` and attaches click listeners to all `<img>` elements when edit mode is activated. On public pages edit mode is off by default; the floating toolbar chip is in the DOM but minimized. Source: `GlobalEditMode.tsx:1-23`. **No user-facing modals on initial load.**

### D5. Dynamic imports
**Zero `dynamic(() => import(...), { ssr: false })` calls found anywhere.** All heavy components (HeroSection with GSAP, BentoFeatures, PinnedCraft, TestimonialsReveal) are eagerly imported on the homepage. No code splitting.

### D6. TTI estimate
**ESTIMATED: slow, 4–7 seconds perceived TTI.**
Reasoning: ~420KB+ JS parse/eval (~1–2s), Google Fonts FOUT (~3–5s until stable), hero animation cascade (~2s competing with hydration), no `priority` on hero LCP image except nav logo. Source: all D1–D5.

---

## E. Known Gaps
- Design option labels (lapel names, canvas types) in `data/options/` not inspected — jargon may be present there too
- Actual gzip bundle size requires `next build --analyze`; D1 is estimated
- Mobile viewport / tap-target audit not performed
- Accessibility subagent not deployed (noted as optional for complex interactive UI — recommend adding in a follow-up)
- Email/transactional copy not inspected
- `data-store/products.json`, `data-store/accessories.json` product descriptions not inspected for copy inflations
