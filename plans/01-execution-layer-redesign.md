# Plan: Blessed & Dressed — Execution Layer Redesign
**Created:** 2026-06-05  
**Source audit:** `DESIGN-IS-2026-06-05/` (16/30 — below REFINE threshold)  
**Status:** Ready to execute  

---

## Hard Rules (read before touching anything)
- **DO NOT** remove, hide, filter, or reduce any builder option in `data-store/options/*.json`
- **DO NOT** change `src/components/builder/StyleQuizStep.tsx` — the quiz filter is correct and innovative
- **DO NOT** change `src/components/MeasuringGuide.tsx`
- **DO NOT** change any color token in `src/app/globals.css:10-27`
- **DO NOT** change the 8-step builder architecture or the STEPS array in `src/app/builder/[product]/page.tsx:34`
- **DO NOT** touch the Scripture quotations (4 instances; they are brand identity)

---

## Already Done — Do Not Re-Do
The following audit findings are already resolved in the current codebase (verified 2026-06-05):
- `@react-three/fiber` not in `package.json`
- `puppeteer-core` and `mupdf` are in `devDependencies`
- HeroSection GSAP cascade is gated: `src/components/home/HeroSection.tsx:25-27` checks `prefers-reduced-motion` before running timeline
- "Chest Allowance" label → "Extra Room for Movement" at `page.tsx:640`
- "Wearing Habit" label → "How You Plan to Wear It" at `page.tsx:655`
- StyleQuizStep skip label → "Show all options →" at `StyleQuizStep.tsx:236`
- Fabric-step Continue button gated on `!fabric`: `page.tsx:1658`
- Sidebar has no duplicate Continue button (verified: Order Summary panel is price-only)
- PostureStep intro includes examples ("rounded shoulders, forward posture, or a high hip") at `page.tsx:1066`
- Monogram cost disclosed upfront at `page.tsx:488`: "+$10 each (max 3 total)"
- API fetch state variables `fabricsLoading`, `fabricsError`, `optionsError` already tracked in `page.tsx:1108-1143`

---

## Phase 1 — Motion Governance
**Goal:** Make marquee respect `prefers-reduced-motion`. One CSS change. No JS.  
**Files:** `src/app/globals.css`  
**Risk:** None — additive CSS only.

### 1.1 Read before editing
```
Read src/app/globals.css lines 148-165
```
Confirm `.marquee-track` has `animation: marquee 32s linear infinite` with **no** `@media (prefers-reduced-motion)` override. If an override already exists, skip this phase entirely.

### 1.2 Edit
Add immediately after the `.marquee-track {}` block (after the closing `}`):

```css
@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
}
```

That's the entire change. Do not touch the keyframe definition or any other selector.

### 1.3 Verify
- Open `http://localhost:3000` in a browser.
- In DevTools → Rendering → enable "Emulate CSS media feature prefers-reduced-motion: reduce".
- Confirm the marquee text is **static** (not scrolling).
- Disable the emulation — confirm marquee scrolls normally.
- Screenshot both states.

**Anti-patterns:** Do not add `animation-duration: 0` (causes flicker), do not remove the keyframe, do not wrap in JS.

---

## Phase 2 — Builder Loading & Error States
**Goal:** Render UI that consumes the already-tracked `fabricsLoading`, `fabricsError`, and `optionsError` state variables. Zero silent waits on the builder's primary path.  
**Files:** `src/app/builder/[product]/page.tsx`  
**Hard rule:** Do not change `activeFabrics` array shape; do not remove any fabric options.

### 2.0 Pre-flight — confirm current render
Before editing, read these sections and confirm the current render:
```
Read src/app/builder/[product]/page.tsx lines 1195-1260
```
This is the Fabric step render (case `activeStep === 2`). Note whether `fabricsLoading` or `fabricsError` currently gate any JSX. If skeleton/error UI already exists, document it and skip the corresponding sub-task.

Also read:
```
Read src/app/builder/[product]/page.tsx lines 1095-1115
```
Confirm the state declarations for `fabricsLoading`, `fabricsError`, `optionsError` (these should exist from earlier work at ~line 1080-1095).

### 2.1 Fabric step — loading skeleton
Find the fabric card grid in the Fabric step render. It maps over `activeFabrics` to produce cards.

**When `fabricsLoading === true`**, render skeleton cards instead of the real grid:

```tsx
{fabricsLoading ? (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="animate-pulse rounded-2xl border border-[#1D3C62] bg-[#0B1B2E] h-36" />
    ))}
  </div>
) : (
  /* existing fabric card grid here — do not change it */
  ...existingFabricGrid...
)}
```

Match the existing card grid's className wrapper exactly. The skeleton must be inside the same container.

### 2.2 Fabric step — error state
**When `fabricsError === true` AND `fabricsLoading === false`**, render an error banner above (or instead of) the grid:

```tsx
{fabricsError && !fabricsLoading && (
  <div className="flex items-center justify-between rounded-2xl border border-[#EF4444]/30 bg-[#5A1A1A]/20 px-4 py-3">
    <p className="font-sans text-sm text-[#EF4444]">
      Could not load fabrics. Check your connection and try again.
    </p>
    <button
      type="button"
      onClick={fetchFabrics}
      className="ml-4 shrink-0 font-sans text-xs font-semibold text-[#EF4444] underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]"
    >
      Retry
    </button>
  </div>
)}
```

`fetchFabrics` is already defined at `page.tsx:1108` as a `useCallback`. The Retry button calls it directly. If the error banner is shown AND fabrics loaded partially, show both the banner and the existing fabric cards.

### 2.3 Design step — error state  
**When `optionsError === true`**, the code already falls back to `allProductDesigns[productSlug]` (the hardcoded default). Add a visible note so the user knows we're using defaults, not their saved custom options:

Find the Design step render. At the top of the DesignStep JSX (before the section tabs), add:

```tsx
{optionsError && (
  <div className="mb-4 rounded-xl border border-[#1D3C62] bg-[#071A2D] px-4 py-2.5">
    <p className="font-sans text-xs text-[#9B9180]">
      Using standard design options. Custom options could not be loaded.
    </p>
  </div>
)}
```

Pass `optionsError` as a prop to `DesignStep` or read it from the outer scope — match the existing pattern for how `styleQuiz` is passed.

### 2.4 Verify
1. Temporarily replace `fetch("/api/admin/fabrics")` with `fetch("/api/nonexistent")` in the `fetchFabrics` function.
2. Reload `/builder/suit-2pc`. Fabric step should show the error banner with Retry button.
3. Click Retry — should attempt fetch again.
4. Revert the URL. Reload. The skeleton should flash briefly, then fabric cards appear.
5. Screenshot each state.

**Anti-patterns:**
- Do not change `activeFabrics` shape or remove fabrics from the array
- Do not wrap the fetch in a try/catch that swallows errors silently
- Do not add a "loading" spinner that blocks the entire page — scope it to the Fabric step only

---

## Phase 3 — Copy Precision
**Goal:** Verify and fix the remaining jargon labels and unsubstantiated claims. Read each target before editing.  
**Files:** `src/app/builder/[product]/page.tsx`, `src/app/page.tsx`

### 3.0 Pre-flight reads (all required before any edit)

**3.0.a** Read `src/app/builder/[product]/page.tsx` lines 595-630 and find the third measurement mode card (the one after "Body Measurements"). Report its current `title` and `desc` strings.
- If `title` is already "Garment Dimensions" or similar plain language → skip 3.1.
- If `title` is still "Finished Measurements" → apply 3.1.

**3.0.b** Read `src/app/page.tsx` lines 195-230 (the accessories/RTW section). Find any instances of:
- "instant luxury essentials" 
- "refined finishing pieces"
- "Every detail, considered."
- "Luxury tailoring"
Report exact line numbers and surrounding context for each found string.

**3.0.c** Read `src/app/builder/[product]/page.tsx` lines 260-340 (the DesignStep component header and section tab rendering). Find the user-visible label for the section whose `id` includes "canvas". Report the exact string shown to the user.

### 3.1 "Finished Measurements" → "Garment Dimensions" (conditional on 3.0.a)
In the third measurement mode card's `title` field:
```
"Finished Measurements" → "Garment Dimensions"
```
Also update `desc` to: "Measure a well-fitting garment you own — enter its flat dimensions directly."

Verify: Reload `/builder/suit-2pc`, go to Measurements step, confirm the third card reads "Garment Dimensions".

### 3.2 "Canvas" visible label (conditional on 3.0.c)
If the Design step's canvas section header shows "Canvas" to the user, change it to "Jacket Structure". The section ID in `filterOptions()` is `"canvas"` — do not change that internal ID. Only change the user-facing `label` field in the data or the rendered string.

> **WARNING:** Do not change any option IDs in `data-store/options/*.json`. Only the section heading label if it shows the word "Canvas" literally to the user.

### 3.3 Marketing inflation copy (conditional on 3.0.b)
For each inflation string found in 3.0.b, apply the corresponding replacement:

| Old string | Replacement |
|-----------|-------------|
| "instant luxury essentials" | The product category name (e.g. "Ready-to-Wear Collection") |
| "refined finishing pieces" | "Accessories" or the literal category name |
| "Every detail, considered." | Remove entirely, or replace with a factual claim like "Handcrafted to your measurements." |
| "Luxury tailoring, your way" | Keep if used as a tagline — it's mild. Only remove if it appears as a product description without backing. |

If a string is not found in 3.0.b, do not make a speculative edit.

### 3.4 "Premium" fabric badge spec
Location: `src/app/builder/[product]/page.tsx:1738-1740` — the sidebar fabric display.

Current:
```tsx
{f.premium && (
  <span className="shrink-0 font-sans text-[9px] uppercase tracking-[0.15em] text-gold border border-gold/30 rounded-full px-2 py-0.5">Premium</span>
)}
```

Add a `title` attribute so hovering shows what "Premium" means. Also add a second line below the fabric label showing the premium explanation:

```tsx
{f.premium && (
  <>
    <span
      title="150s+ Italian wool — superior drape and softness"
      className="shrink-0 font-sans text-[9px] uppercase tracking-[0.15em] text-gold border border-gold/30 rounded-full px-2 py-0.5 cursor-help"
    >
      Premium
    </span>
  </>
)}
```

And below the `f.detail` line, add:
```tsx
{f.premium && (
  <p className="font-sans text-[10px] text-[#6A7A8C] mt-0.5">150s+ Italian wool · +$150</p>
)}
```

Verify: Select a premium fabric in the builder → sidebar shows "Premium" badge + "150s+ Italian wool · +$150" line.

### 3.5 Verify all copy changes
Grep for any remaining instances:
```bash
grep -r "instant luxury" src/
grep -r "Finished Measurements" src/app/builder/
grep -r '"Canvas"' src/app/builder/
```
All three should return zero results after changes.

---

## Phase 4 — Verification Run
**Goal:** Confirm all changes are live and no regressions in preserved items.

### 4.1 Preserved items regression check
```bash
grep -r "ring-2 ring-gold\|ring-\[#D4AF37\]" src/app/builder/ | wc -l
```
Should be > 10 (focus rings still present throughout builder).

```bash
grep -r "StyleQuizStep\|clearStyleQuiz\|styleQuiz" src/app/builder/[product]/page.tsx | wc -l
```
Should be > 0 (quiz filter still wired).

```bash
cat data-store/options/suit-2pc.json | grep -c '"id"'
```
Note count. Must match before and after (no options removed).

### 4.2 Screenshot suite
Using the project driver at `.claude/skills/run-app/driver.mjs`:

```powershell
cd "C:\Users\ChaseStanley\Downloads\files\brand_assets\blessed-dressed"
node .claude/skills/run-app/driver.mjs smoke
```

Review each screenshot. Check:
- Homepage: marquee visible and correct (no motion breakage on default)
- Builder fabric step: fabric cards load with no error banner
- Builder design step: Design Studio renders; all option tabs accessible
- Builder measurements step: three mode cards visible; third card reads "Garment Dimensions" (if changed)
- Builder sidebar: Premium fabric shows spec line when premium fabric selected

### 4.3 TypeScript check
```powershell
cd "C:\Users\ChaseStanley\Downloads\files\brand_assets\blessed-dressed"
npx tsc --noEmit 2>&1 | Select-Object -First 20
```
Must produce zero errors.

### 4.4 Reduced-motion check
```powershell
node .claude/skills/run-app/driver.mjs /
```
Open the screenshot and visually confirm marquee is rendered (text visible). Then use browser DevTools to emulate `prefers-reduced-motion: reduce` and confirm the animation is gone.

---

## Summary of Changes by File

| File | Phase | What changes |
|------|-------|-------------|
| `src/app/globals.css` | 1 | Add `@media (prefers-reduced-motion: reduce)` for `.marquee-track` |
| `src/app/builder/[product]/page.tsx` | 2 | Add loading skeleton + error banner to Fabric step; add error note to Design step |
| `src/app/builder/[product]/page.tsx` | 3 | "Finished Measurements" → "Garment Dimensions" (if still present); "Premium" badge spec line |
| `src/app/page.tsx` | 3 | Remove inflation strings (conditional on 3.0.b finds) |

**Total estimated edits: 4–6 targeted changes across 2 files.**

---

## Execution Order
1. Phase 1 (motion) → smallest change, zero risk, instant wins
2. Phase 2 (states) → builder reliability; test before proceeding
3. Phase 3 (copy) → all preflight reads first, then edits
4. Phase 4 (verify) → full smoke test + grep checks

Each phase is self-contained. If a phase fails TypeScript or the smoke test, stop and fix before proceeding to the next.
