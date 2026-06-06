# Plan: Blessed & Dressed — Execution Layer Redesign
**Audit score:** 16/30 → target ≥ 22/30  
**Principles addressed:** #2 Useful · #4 Understandable · #6 Honest · #8 Thorough · #9 Environmental  
**Hard rule:** No builder option (lapel, canvas, collar, pleat, fabric) may be removed, hidden, or reduced. Only display labels change.

---

## Phase 0 — Documentation Discovery (COMPLETE)

All facts gathered by subagents. Key findings:

### Exact targets

| # | Location | Current | Change |
|---|----------|---------|--------|
| API fetch — fabrics | `page.tsx:1009-1021` | `.catch(() => {})` silent | Add `fabricsLoading` + `fabricsError` state |
| API fetch — options | `page.tsx:1022-1033` | Falls back silently | Add `optionsError` state |
| Fabric grid render | `page.tsx:1208-1243` | Maps `activeFabrics` | Conditionally render skeleton or error |
| "Chest Allowance" label | `page.tsx:645` | `<label>…Chest Allowance…</label>` | → "Extra Room for Movement" |
| "Wearing Habit" label | `page.tsx:658` | `<label>…Wearing Habit…</label>` | → "How You Plan to Wear It" |
| "Finished Measurements" title | `page.tsx:583` | `title: "Finished Measurements"` | → "Garment Dimensions" |
| "Finished Measurements" desc | `page.tsx:584` | `"Measure a suit…its flat dimensions."` | → "Measure a garment you own — enter its flat dimensions." |
| Posture step intro | `page.tsx:971-973` | Generic intro, no examples | Add example: "(e.g. rounded shoulders, forward posture)" |
| "Skip — show all options" | `StyleQuizStep.tsx:232-236` | Button label | → "Show all options →" |
| Canvas field label in data | `src/data/options/*.json` | Section name "Canvas" | → "Jacket Structure" (display label only; `id` stays `"canvas"`) |
| "Instant luxury essentials" | `page.tsx:148` | h2 headline | → "Ready to wear, made to impress." |
| "Every detail, considered." | `page.tsx:248` | h2 headline | → "A complete, considered wardrobe." |
| "Refined finishing pieces" | `page.tsx:205` | h2 headline | → "Finishing pieces, chosen with care." |
| Premium badge | `page.tsx:1238` | Shows only "+$150" | Add tooltip/note: "Super 120–150s Italian mill wool" |
| Duplicate Continue button | `page.tsx:1703-1711` | Full `<button>` block | Remove entirely |
| Fabric Continue gate | `page.tsx:1509-1520` | Always enabled | Add `disabled={!fabric}` |
| `@react-three/fiber` | `package.json:15` | In `"dependencies"` | Remove |
| `three` | `package.json` | In `"dependencies"` | Remove |
| `puppeteer-core` | `package.json:21` | In `"dependencies"` | Move to `"devDependencies"` |
| `mupdf` | `package.json:20` | In `"dependencies"` | Move to `"devDependencies"` |
| Home component imports | `src/app/page.tsx:7-11` | Eager static imports | Wrap in `next/dynamic` |
| Marquee — motion | `globals.css:119` | `animation: marquee 32s linear infinite` | Gate with `prefers-reduced-motion: reduce` |
| GSAP hero — motion | `HeroSection.tsx:22-39` | `useGSAP` timeline, no motion check | Skip animations if `prefers-reduced-motion` |

### Patterns confirmed

- Success flash pattern (copy for loading states): `const [cartAdded, setCartAdded] = useState(false); setTimeout(() => setCartAdded(false), 2000)` at `page.tsx:1145-1167`
- Fabric card pattern to skeleton: `page.tsx:1208-1243` — 6-card grid, each card is a `<button>` with border + rounded corners
- Sidebar Continue button exact block to delete: `page.tsx:1703-1711`
- Main Continue button to add `disabled`: `page.tsx:1512-1521`
- "Add another monogram (+$10)" label already exists at button: `page.tsx:510-518` — **no change needed here; cost IS surfaced**

---

## Phase 1 — Bundle & Dependency Cleanup
**Principle:** #9 Environmental  
**Est. time:** 15 minutes  
**Risk:** Low — only removes unused packages and restructures devDeps

### Tasks

**1A. Remove unused Three.js packages from `package.json`**

File: `package.json`

Remove these two lines from `"dependencies"`:
```json
"@react-three/fiber": "^9.6.1",
"three": "^0.184.0",
```

Confirm neither is imported anywhere before removing:
```bash
grep -r "react-three" src/ --include="*.tsx" --include="*.ts"
grep -r "from 'three'" src/ --include="*.tsx" --include="*.ts"
```
Expected: 0 matches. If any match, DO NOT remove — investigate first.

**1B. Move runtime-only tools to `devDependencies`**

Move from `"dependencies"` to `"devDependencies"`:
- `"puppeteer-core": "^25.0.4"`
- `"mupdf": "^1.27.0"`

**1C. Run npm install to update lockfile**
```bash
cd "C:\Users\ChaseStanley\Downloads\files\brand_assets\blessed-dressed"
npm install
```

**1D. Wrap the 4 heavy homepage components in `next/dynamic`**

File: `src/app/page.tsx`

Replace lines 7–11 (the 4 eager imports):
```ts
// BEFORE
import HeroSection from "@/components/home/HeroSection";
import BuilderAccordion from "@/components/home/BuilderAccordion";
import BentoFeatures from "@/components/home/BentoFeatures";
import PinnedCraft from "@/components/home/PinnedCraft";
import TestimonialsReveal from "@/components/home/TestimonialsReveal";

// AFTER
import dynamic from "next/dynamic";
const HeroSection      = dynamic(() => import("@/components/home/HeroSection"),      { ssr: false });
const BuilderAccordion = dynamic(() => import("@/components/home/BuilderAccordion"), { ssr: false });
const BentoFeatures    = dynamic(() => import("@/components/home/BentoFeatures"),    { ssr: false });
const PinnedCraft      = dynamic(() => import("@/components/home/PinnedCraft"),      { ssr: false });
const TestimonialsReveal = dynamic(() => import("@/components/home/TestimonialsReveal"), { ssr: false });
```

Note: `ssr: false` is required here because HeroSection uses `useGSAP` which needs the browser. If any of the 5 components render server-side critical content (e.g., Hero h1 for SEO), set `ssr: true` for that one and add a loading skeleton.

### Verification
```bash
# Confirm three.js is gone
grep -r "react-three\|from 'three'" src/ --include="*.tsx" --include="*.ts"
# Should output: 0 lines

# Confirm dynamic imports are present
grep -n "next/dynamic" src/app/page.tsx
# Should output: 1 match

# Dev server still starts
npm run dev
```
Screenshot `/` and `/builder/suit-2pc` — both pages should render correctly.

### Anti-patterns
- Do NOT remove `react-image-crop` — it is used in the admin image override modal
- Do NOT move `stripe` to devDependencies — it runs server-side in API routes
- Do NOT set `ssr: false` on a component that renders the page's `<h1>` for SEO

---

## Phase 2 — Motion Governance
**Principle:** #9 Environmental  
**Est. time:** 20 minutes  
**Risk:** Low — additive CSS + one GSAP conditional

### Tasks

**2A. Add `prefers-reduced-motion` block to `globals.css`**

File: `src/app/globals.css`

After line 120 (after the `.marquee-track` block), add:
```css
/* ── Respect reduced-motion preference ─────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
  .anim-fade-up {
    animation: none;
  }
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

**2B. Add motion check to HeroSection GSAP timeline**

File: `src/components/home/HeroSection.tsx`

Inside the `useGSAP` callback (currently line 22), wrap the timeline in a motion check:
```ts
// BEFORE (line 22-39)
useGSAP(
  () => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(eyebrowRef.current, { y: 18, opacity: 0, duration: 0.7 })
      // ...rest of tl chain
  },
  { scope: containerRef }
);

// AFTER
useGSAP(
  () => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return; // skip all animations; elements render in their final positions
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(eyebrowRef.current, { y: 18, opacity: 0, duration: 0.7 })
      // ...rest of tl chain (unchanged)
  },
  { scope: containerRef }
);
```

### Verification
- In Chrome DevTools → Rendering tab → check "Emulate CSS media feature prefers-reduced-motion: reduce"
- Screenshot `/` — marquee should be stationary, hero elements should appear instantly (no cascade)
- Uncheck → marquee runs, hero cascade animates — confirming the gate works in both directions

### Anti-patterns
- Do NOT add `prefers-reduced-motion` to the GSAP ScrollTrigger animations in `PinnedCraft` or `TestimonialsReveal` — those are scroll-driven and acceptable; they don't run on idle
- Do NOT remove the GSAP import or `useGSAP` registration — they're used regardless

---

## Phase 3 — Builder UI States (Loading · Empty · Error)
**Principle:** #8 Thorough  
**Est. time:** 60–75 minutes  
**Risk:** Medium — modifies state management and conditional renders in `page.tsx`

### Tasks

**3A. Add loading and error states to the fabric fetch**

File: `src/app/builder/[product]/page.tsx`

Find the existing state declarations (near line 1058 where `showMeasuringGuide` is declared). Add:
```ts
const [fabricsLoading, setFabricsLoading] = useState(true);
const [fabricsError,   setFabricsError]   = useState(false);
const [optionsError,   setOptionsError]   = useState(false);
```

Update the fabrics `useEffect` (line 1009):
```ts
// BEFORE
useEffect(() => {
  fetch("/api/admin/fabrics")
    .then((r) => r.json())
    .then((adminFabrics: AdminFabric[]) => {
      if (!adminFabrics?.length) return;
      setActiveFabrics(adminFabrics.map((f) => ({ /* … */ })));
    })
    .catch(() => {});
}, []);

// AFTER
useEffect(() => {
  setFabricsLoading(true);
  setFabricsError(false);
  fetch("/api/admin/fabrics")
    .then((r) => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
    .then((adminFabrics: AdminFabric[]) => {
      if (adminFabrics?.length) {
        setActiveFabrics(adminFabrics.map((f) => ({
          id: f.id, label: f.label, detail: f.detail,
          premium: f.premium,
          image: f.photoImage ?? f.codeImage ?? f.image ?? undefined,
        })));
      }
    })
    .catch(() => setFabricsError(true))
    .finally(() => setFabricsLoading(false));
}, []);
```

Update the builder-options `useEffect` (line 1022):
```ts
// In the .catch() block, add:
.catch(() => {
  setOptionsError(true);
  setLiveConfig(allProductDesigns[productSlug] ?? null);
});
```

**3B. Add skeleton loading cards to the Fabric step**

File: `src/app/builder/[product]/page.tsx`

In the Fabric step render block (line 1208), replace:
```tsx
// BEFORE (line 1208-1244)
if (activeStep === 2) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {activeFabrics.map((f) => ( /* card */ ))}
    </div>
  );
}

// AFTER
if (activeStep === 2) {
  // Error state
  if (fabricsError) {
    return (
      <div className="rounded-2xl border border-[#EF4444]/30 bg-[#5A1A1A]/20 px-6 py-8 text-center">
        <p className="font-sans text-sm text-[#EF4444]">
          Unable to load fabrics. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => { setFabricsError(false); setFabricsLoading(true); /* re-trigger fetch by toggling a retryCount state */ }}
          className="font-sans mt-4 rounded-full border border-[#D4AF37]/40 px-5 py-2 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading skeleton
  if (fabricsLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[1.5rem] border border-[#1D3C62] bg-[#071A2D] p-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-md bg-[#1D3C62]" />
              <div className="space-y-2 flex-1">
                <div className="h-2 w-16 rounded bg-[#1D3C62]" />
                <div className="h-4 w-32 rounded bg-[#1D3C62]" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-2.5 w-full rounded bg-[#1D3C62]" />
              <div className="h-2.5 w-3/4 rounded bg-[#1D3C62]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Normal populated state
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {activeFabrics.map((f) => ( /* existing card JSX — unchanged */ ))}
    </div>
  );
}
```

Note: To enable the retry button, add a `fabricRetry` counter state: `const [fabricRetry, setFabricRetry] = useState(0)` and add it to the `useEffect` dependency array `[fabricRetry]`. The retry button calls `setFabricRetry(n => n + 1)`.

**3C. Add empty state to the Design step**

File: `src/app/builder/[product]/page.tsx`

In `DesignStep`, find where `activeSections` is mapped (inside the section content area). After the section filter, before the field/option list, add an empty-state guard:

```tsx
// If the active section has zero fields after filtering:
{filteredFields.length === 0 && (
  <div className="rounded-2xl border border-[#1D3C62] bg-[#071A2D] px-6 py-8 text-center">
    <p className="font-sans text-sm text-[#9B9180]">
      No options found for this section.
    </p>
    <p className="font-sans mt-1 text-xs text-[#6A7A8C]">
      This may be a content gap — check back soon or contact us for a consultation.
    </p>
  </div>
)}
```

Also add an `optionsError` banner at the top of the Design step:
```tsx
// At the top of the DesignStep render, if optionsError is true:
{optionsError && (
  <div className="mb-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3">
    <p className="font-sans text-xs text-[#D4AF37]">
      Design options loaded from defaults — custom options unavailable right now.
    </p>
  </div>
)}
```

Pass `optionsError` from the parent component as a prop to `DesignStep`.

### Verification
States checklist after Phase 3:
| State | Location | How to verify |
|-------|----------|---------------|
| Loading | Fabric step | Throttle network to Slow 3G in DevTools; see skeleton cards |
| Error | Fabric step | Block `/api/admin/fabrics` in DevTools Network; see error banner + Retry |
| Error | Design step | Block `/api/admin/builder-options/*`; see gold warning banner |
| Empty | Design step | Ensure the "no options" guard renders if a section has 0 fields |
| Success | Cart-added | Already present; no change needed |
| Focus | All buttons | Tab through builder; gold ring visible on every interactive element |
| Disabled | Back + Continue | Back disabled at step 1; Continue disabled with no fabric selected (Phase 6) |

### Anti-patterns
- Do NOT change what `activeFabrics` contains — only wrap its render in loading/error branches
- Do NOT remove the `.catch()` fallback on the builder-options fetch — it falls back to `allProductDesigns` correctly; just add the `optionsError` signal
- Do NOT add a loading state to the builder-options fetch that blocks the Design step — the fallback to hardcoded data is instant

---

## Phase 4 — Copy: Jargon Label Renames
**Principle:** #4 Understandable  
**Est. time:** 30 minutes  
**Hard rule:** Change display labels only. Do NOT change field IDs, option IDs, data keys, or filterOptions logic.

### Copy change table

| Old label | New label | File | Line |
|-----------|-----------|------|------|
| `Chest Allowance` | `Extra Room for Movement` | `page.tsx` | 645 |
| `Wearing Habit` | `How You Plan to Wear It` | `page.tsx` | 658 |
| `Finished Measurements` | `Garment Dimensions` | `page.tsx` | 583 |
| `Finished Measurements` (desc) | `"Measure a garment you own — enter its flat dimensions."` | `page.tsx` | 584 |
| `Posture Adjustments` (intro) | Append example: `"…All adjustments are optional — for example: rounded shoulders, forward posture, high hip."` | `page.tsx` | 972-973 |
| `Skip — show all options` | `Show all options →` | `StyleQuizStep.tsx` | ~233 |
| `"Canvas"` section display label | `"Jacket Structure"` | `src/data/options/*.json` | find + replace |

### Tasks

**4A. Rename labels in `page.tsx`**

Three targeted edits:
1. Line 645: change `>Chest Allowance<` → `>Extra Room for Movement<` in the `<label>` tag. Also update the `aria-label` on the `<select>` at line 650.
2. Line 658: change `>Wearing Habit<` → `>How You Plan to Wear It<` in the `<label>`. Update `aria-label` on the `<select>` at line 663.
3. Line 583: change `title: "Finished Measurements"` → `title: "Garment Dimensions"` and line 584: change description text.
4. Line 972: append to the PostureStep intro paragraph — add: `" For example: rounded shoulders, forward posture, or a high hip."` before the closing `</p>`.

**4B. Update "Skip" button in `StyleQuizStep.tsx`**

File: `src/components/builder/StyleQuizStep.tsx`

Line ~233 (the skip button):
```tsx
// BEFORE
Skip — show all options

// AFTER
Show all options →
```

**IMPORTANT:** Do not change the `handleSkipAll` function. Only the visible button text changes.

**4C. Find and rename "Canvas" section display label in design options data**

Run this search to find the display label:
```bash
grep -r '"Canvas"' "src/data/options/" "data-store/options/" 2>/dev/null
grep -r '"canvas"' "src/data/options/" "data-store/options/" 2>/dev/null | grep -i "label\|title\|name"
```

Find the JSON key that stores the user-visible section name (likely `"label": "Canvas"` or `"section": "Canvas"`). Change only that value to `"Jacket Structure"`. Leave the `id`, `key`, or any field referenced in `filterOptions` unchanged.

### Verification
- Screenshot Step 3 (Style) — "Show all options →" label visible
- Screenshot Step 6 (Measurements) — "Extra Room for Movement" and "How You Plan to Wear It" labels
- Screenshot Design step Canvas/Jacket Structure section — new label showing
- Tab-completion test: confirm aria-labels updated on all renamed selects

### Anti-patterns
- Do NOT rename `fieldId === "canvas"` in filterOptions (`page.tsx:51`) — that's an internal data key
- Do NOT change any option `id` values in the data files
- Do NOT change the "Body Measurements" or "Standard Size" tabs — only the 3rd tab "Finished Measurements" → "Garment Dimensions"

---

## Phase 5 — Copy: Marketing Honesty
**Principle:** #6 Honest  
**Est. time:** 20 minutes  
**Risk:** Low — copy-only changes on homepage and builder sidebar

### Tasks

**5A. Update homepage h2 headlines**

File: `src/app/page.tsx`

Line 148 — RTW section heading:
```tsx
// BEFORE
Instant luxury <em className="italic text-[#6B6560]">essentials.</em>

// AFTER
Ready to wear, <em className="italic text-[#6B6560]">made to impress.</em>
```

Line 205-207 — Accessories section heading:
```tsx
// BEFORE
Refined <em className="italic text-[#6B6560]">finishing pieces.</em>

// AFTER
Finishing pieces, <em className="italic text-[#6B6560]">chosen with care.</em>
```

Line 248 — Closing CTA section heading:
```tsx
// BEFORE
Every detail, <em className="italic">considered.</em>

// AFTER
A complete, <em className="italic">considered wardrobe.</em>
```

**5B. Add spec to Premium fabric badge**

File: `src/app/builder/[product]/page.tsx`  
Location: line 1237-1239 (inside the Fabric step card)

```tsx
// BEFORE
{f.premium && (
  <span className="…">+$150</span>
)}

// AFTER
{f.premium && (
  <div className="mt-3 flex items-center gap-2 flex-wrap">
    <span className="font-sans inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">+$150</span>
    <span className="font-sans text-[11px] text-[#6A7A8C]">Super 120–150s Italian mill wool</span>
  </div>
)}
```

### Verification
- Screenshot homepage `/` — confirm 3 headline changes, no other content altered
- Screenshot Fabric step in builder — Premium badge shows "+$150 · Super 120–150s Italian mill wool"
- Confirm Scripture quotations unchanged (grep: `DEUTERONOMY\|Corinthians` — should still be present)

### Anti-patterns
- Do NOT change the page section structure, order, or any other copy
- Do NOT modify the Scripture quotations
- Do NOT change product names, prices, or any RTW product copy

---

## Phase 6 — Structural UX Fixes
**Principle:** #2 Useful  
**Est. time:** 20 minutes  
**Risk:** Low — targeted deletions and one `disabled` addition

### Tasks

**6A. Remove duplicate sidebar Continue button**

File: `src/app/builder/[product]/page.tsx`

Delete lines 1703–1711 entirely:
```tsx
// DELETE THIS ENTIRE BLOCK:
{activeStep < STEPS.length && (
  <button
    type="button"
    onClick={goNext}
    className="font-sans w-full rounded-full border border-[#D4AF37]/50 py-2.5 text-sm font-semibold text-[#D4AF37] transition-[border-color,background] hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
  >
    Continue to Step {activeStep + 1}
  </button>
)}
```

The sidebar Order Summary panel should retain all other content (fabric name, price summary, Est. Total) — only the button block is removed.

**6B. Gate the Fabric-step Continue button**

File: `src/app/builder/[product]/page.tsx`

The main Continue button is at line 1512. The `disabled` condition should be:
```tsx
// Add disabled prop to the main Continue button at line 1512:
<button
  type="button"
  onClick={goNext}
  disabled={activeStep === 2 && !fabric}   // ← add this
  className="… disabled:opacity-40 disabled:cursor-not-allowed …"   // ← add disabled classes
>
  Continue
</button>
```

The existing `disabled:opacity-30` class on the Back button at line 1500 shows the precedent pattern.

### Verification
- In builder at Step 2 (Fabric): Continue button should be visually dimmed before a fabric is selected; enabled after selection
- Builder sidebar should show Order Summary without a Continue button at any step
- Back button at Step 1 still disabled (unchanged)
- Navigate through all 8 steps verifying the only Continue is in the main content area

### Anti-patterns
- Do NOT disable the Continue button on any step other than Fabric (step 2) — measurements, design, etc. are intentionally un-gated to allow partial progress
- Do NOT remove any other content from the sidebar — only the button block (lines 1703-1711)

---

## Phase 7 — Regression & Final Verification

### States coverage checklist
Run through the builder at `/builder/suit-2pc` and confirm each:

| State | Check |
|-------|-------|
| Loading | Throttle network → Fabric step shows skeleton cards (6 pulsing placeholders) |
| Error | Block API → Fabric step shows error banner with Retry button |
| Error (options) | Block options API → Design step shows gold warning banner |
| Empty (design) | N/A unless a real category has 0 options — confirm guard renders correctly |
| Success | Add to Cart → gold "Added to cart ✓" flash appears |
| Focus | Tab through all steps → gold ring on every interactive element |
| Disabled | Step 2, no fabric selected → Continue button dimmed |

### Builder options integrity check
```bash
# Confirm no option IDs were removed from data files
grep -c '"id"' "src/data/options/suit-2pc.json"
grep -c '"id"' "data-store/options/suit-2pc.json" 2>/dev/null
# Compare count before and after — should be unchanged
```
- Navigate to Step 4 (Design) for suit-2pc
- Click "Show all options →" (formerly "Skip — show all options") in quiz
- Confirm all lapel, button config, canvas sections are still present with the same option count

### Copy change verification
| Old | New | Page/Step |
|-----|-----|-----------|
| "Chest Allowance" | "Extra Room for Movement" | Measurements (step 6) |
| "Wearing Habit" | "How You Plan to Wear It" | Measurements (step 6) |
| "Finished Measurements" tab | "Garment Dimensions" | Measurements (step 6) |
| "Canvas" section | "Jacket Structure" | Design (step 4) |
| "Skip — show all options" | "Show all options →" | Style Quiz (step 3) |
| "Instant luxury essentials" | "Ready to wear, made to impress." | Homepage |
| "Every detail, considered." | "A complete, considered wardrobe." | Homepage |
| "Refined finishing pieces" | "Finishing pieces, chosen with care." | Homepage |

### Palette regression check
```bash
grep -n "D4AF37\|071A2D\|040E1A\|F5F1E6" src/app/globals.css | head -20
# Should return same lines as before — no color tokens changed
```

### Bundle delta
```bash
npm run build 2>&1 | grep -E "First Load JS|Page"
# Compare bundle sizes before and after — removing @react-three/fiber + three
# should eliminate ~580KB if not tree-shaken; at minimum removing from package.json
# prevents any accidental future import
```

### Measuring Guide + Quiz regression
- Go to Step 6 → "How to Measure" button → guide opens ✓
- Go to Step 3 → quiz shows all 3 questions → "Show all options →" button visible and prominent ✓
- Go to Step 3 → answer all questions → "Continue to Design" becomes active ✓
- Confirm `clearStyleQuiz()` still fires on "Show all options →" (behavior unchanged, only label changed)

### Scripture quotations intact
```bash
grep -n "DEUTERONOMY\|Corinthians\|LORD shall" src/app/builder/\[product\]/page.tsx src/app/page.tsx
# Should return 4 matches
```

---

## Execution order summary

| Phase | Principle | Time | Files touched |
|-------|-----------|------|---------------|
| 1 — Bundle cleanup | #9 | 15 min | `package.json`, `src/app/page.tsx` |
| 2 — Motion governance | #9 | 20 min | `globals.css`, `HeroSection.tsx` |
| 3 — UI states | #8 | 60 min | `src/app/builder/[product]/page.tsx` |
| 4 — Jargon labels | #4 | 30 min | `page.tsx`, `StyleQuizStep.tsx`, `data/options/*.json` |
| 5 — Honesty copy | #6 | 20 min | `src/app/page.tsx`, `builder/[product]/page.tsx` |
| 6 — UX fixes | #2 | 20 min | `src/app/builder/[product]/page.tsx` |
| 7 — Verification | all | 30 min | read-only + screenshots |
| **Total** | | **~3.5 hrs** | |

Each phase is self-contained and can be executed in a fresh chat session. Start each new session by reading this plan and the files listed for that phase.
