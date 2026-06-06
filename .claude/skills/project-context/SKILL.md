---
name: project-context
description: >
  Key architecture, data flow, and gotchas for the Blessed & Dressed bespoke suiting app.
  Use this at the START of any session working on this project to orient yourself before
  reading files or making changes. Also use when debugging unexpected behavior, tracing
  where data comes from, or understanding why something isn't working.
---

# Blessed & Dressed — Project Context

**Christian bespoke suiting brand.** Next.js 16 App Router, Tailwind CSS v4, Supabase, Stripe.

## Project location

```
C:\Users\ChaseStanley\Downloads\files\brand_assets\blessed-dressed
```

## Brand tokens

| Token | Value |
|-------|-------|
| Gold | `#D4AF37` |
| Navy background | `#071A2D` |
| Surface | `#0B1B2E` |
| Foreground | `#F5F1E6` |
| Muted | `#B1A893` |
| Fonts | Cormorant Garamond (display) + Montserrat (sans) |

## Architecture at a glance

```
src/
  app/
    page.tsx               ← Home page (server component, force-dynamic)
    layout.tsx             ← Root layout (loads nav + theme from data-store)
    builder/[product]/     ← 7-step bespoke builder (client component)
    admin/                 ← Admin panel (client components)
    api/admin/             ← REST endpoints for admin saves
  components/
    builder/ThreeViewer.tsx   ← WebGL fabric cloth animation
    home/HeroSection.tsx      ← GSAP-animated hero (client)
    Nav.tsx                   ← Client component receiving server props
    Footer.tsx                ← Server component reading data-store
  lib/admin-data.ts           ← loadData / saveData (fs-based persistence)
  data/                       ← Static seed data (builder options, products, etc.)
  store/builderStore.ts       ← Zustand store for builder state
  types/three.d.ts            ← IMPORTANT: see Three.js section below

data-store/                   ← Live JSON files written by admin saves
  site-settings.json
  fabrics.json
  products.json
  collections.json
  accessories.json
  theme.json
  image-overrides.json
  fabric-book.json
  content.json
```

## Data persistence: how admin edits reach the consumer page

```
Admin UI  →  PUT /api/admin/site-settings  →  saveData("site-settings", body)
                                                    ↓
                                         data-store/site-settings.json  (disk)
                                                    ↓
Consumer page  →  loadData("site-settings", SITE_DEFAULTS)  →  readFileSync
```

- `loadData` / `saveData` in `src/lib/admin-data.ts` use Node.js `fs` directly — no ORM, no DB for CMS content.
- `process.cwd()` resolves to the project root in both API routes and server components (same Node.js process).
- All consumer pages that read CMS data have `export const dynamic = 'force-dynamic'` to opt out of Next.js static rendering.
- `next.config.ts` sets `experimental.staleTimes.dynamic: 0` — this disables the client-side router cache for dynamic pages so admin saves are immediately visible when navigating (requires dev server restart after next.config changes).
- After admin save, the admin page reloads its iframe by incrementing `iframeCount`. The admin save button now shows "Save Failed — Retry" if the API returns an error.

## Builder state (Zustand)

`useBuilderStore` in `src/store/builderStore.ts` holds:
- `product` — selected product slug (e.g., "suit-2pc")
- `fabric` — selected fabric ID (e.g., "navy-herringbone")
- `designSelections` — per-section design choices
- `monograms` — array of monogram configs
- `measureMode` / `standardSize` / measurements
- `price` — computed total

The Zustand store persists in browser memory (not localStorage). The builder page at `/builder/[product]` uses the store rather than URL params for state.

## ThreeViewer — animated fabric cloth

`src/components/builder/ThreeViewer.tsx`

**Props:**
- `product: string` — fallback color lookup
- `fabric?: string` — fabric ID for FABRIC_HEX color lookup
- `fabricImage?: string` — URL of the fabric swatch image (enables texture mode)

**How it works:**
- `FabricClothColored` — plain color from `FABRIC_HEX[fabric] ?? PRODUCT_HEX[product]`
- `FabricClothTextured` — loads the image URL via `useLoader(THREE.TextureLoader, url)`, tiles it 3×4 with `RepeatWrapping`, applies as `map` on `meshPhysicalMaterial`
- Scene switches between the two based on whether `fabricImage` is provided
- `GoldDust` — 52 gold particles floating upward with wrap-around
- Studio lighting: warm overhead key, gold side fill, cool backlight, spot rim

**Passing fabricImage from builder page (line ~1209):**
```tsx
fabricImage={(activeFabrics.find(f => f.id === fabric) as { image?: string } | undefined)?.image}
```
`activeFabrics` starts as built-in `fabrics` (no images), then after `/api/admin/fabrics` responds it updates to admin fabrics which include `photoImage ?? codeImage ?? image`.

## TypeScript gotcha — Three.js types

`src/types/three.d.ts` contains only `declare module "three"` with no body.
This makes the entire `THREE` namespace typed as `any`.

**Consequence:** never use Three.js types as TypeScript generics:
```ts
// ❌ Causes TS error:
const mesh = useRef<THREE.Mesh>(null!)

// ✅ Correct:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mesh = useRef<any>(null!)
```

Same for `THREE.TextureLoader` in `useLoader` — cast with `as any`:
```ts
const tex = useLoader(THREE.TextureLoader as any, url) as THREE.Texture;
```

## Admin panel

- `/admin/login` — password gate
- `/admin/customize` — full CMS: hero, nav, sections, typography, marquee, footer, accordion, craft, bento
- `/admin/fabrics` — fabric manager (add/edit/delete fabrics with photoImage upload)
- `/admin/builder-options/[product]` — per-product design option editor

The customize page has an inline iframe preview of `/?__edit=1`. Sections wrapped in `<EditableSection>` become clickable in edit mode and post messages to the admin panel.

## CSS

`src/app/globals.css` uses Tailwind v4 `@import "tailwindcss"` (not `@tailwind base` etc.).
Custom classes for cloth animation, builder accordion, image filters, and swatch colors live here. Prefer adding new utilities to `globals.css` rather than inline `style={{}}` to keep the codebase consistent.

## Image uploads

Fabric swatches and hero images are uploaded via the admin panel to `/public/images/uploads/`. These are served as static files. The admin fabrics API stores paths like `/images/uploads/filename.jpg`.

## Key dependencies

| Package | Version | Notes |
|---------|---------|-------|
| next | 16.2.6 | App Router, Turbopack |
| @react-three/fiber | ^9.6.1 | R3F v9 |
| three | ^0.184.0 | Three.js |
| tailwindcss | ^4 | CSS-first config |
| gsap | — | Home page animations |
| zustand | — | Builder state |
| @supabase/supabase-js | — | Auth + DB |
| stripe | — | Payments |

---

# GARMENT CONFIGURATION SYSTEM

## AI BEHAVIOR RULES

# EXISTING CRAFT OPTION DISCOVERY SYSTEM

## CRITICAL INSTRUCTION

The project already contains a comprehensive library of bespoke menswear craft options, tailoring configurations, garment variants, and construction choices embedded throughout the codebase, JSON data structures, model metadata, fabric systems, and component architecture.

Claude MUST NEVER:

* hardcode replacement options
* invent incomplete tailoring choices
* overwrite existing craft systems
* create duplicate configuration structures
* ignore existing tailoring data
* bypass internal option registries

Claude MUST ALWAYS first discover, analyze, map, and reuse the existing craft architecture before implementing new systems.

---

## REQUIRED DISCOVERY PROCESS

Before generating any configurator logic, Claude MUST recursively scan the entire project to identify all existing:

* garment option registries
* tailoring configuration files
* JSON schemas
* fabric libraries
* texture mappings
* model metadata
* mesh variants
* component option systems
* pricing matrices
* garment modifiers
* fit configurations
* tailoring enums
* constants
* TypeScript interfaces
* GraphQL schemas
* API responses
* CMS structures
* database models

---

## REQUIRED SEARCH TARGETS

Claude must search for files containing keywords such as:

* lapel, pocket, vent, pleat, cuff, collar
* fit, silhouette, drape, break, rise, waist, inseam
* monogram, lining, button, canvas, shoulder
* tuxedo, shirt, vest, waistcoat, trousers, suit
* fabric, swatch, texture, wool, cashmere, linen, mohair, flannel

Claude must inspect:

* /data, /config, /constants, /models, /public
* /lib, /api, /types, /schemas, /utils, /components

---

## REQUIRED OPTION MAPPING

Claude must build a complete internal understanding of:

**Garment Categories:** jackets, trousers, shirts, waistcoats, tuxedos, overcoats

**Craft Categories:** lapels, pockets, vents, button stances, shoulder constructions, trouser finishes, cuff styles, collar styles, pleat styles, lining selections, stitching details, hand-finished details

**Fabric Categories:** seasonal fabrics, mill collections, texture groups, performance fabrics, luxury fabrics

---

## CONFIGURATION INTEGRITY RULE

Every UI control MUST connect to:

1. the correct existing data source
2. the correct model variation
3. the correct texture mapping
4. the correct pricing logic
5. the correct rendering behavior

Claude must validate all relationships before implementation.

---

## EXISTING OPTION PRIORITY RULE

If an existing option system already exists:

* reuse it — extend it carefully — normalize it if necessary — optimize it without breaking compatibility

Claude must preserve: naming conventions, data structures, API compatibility, rendering compatibility, pricing compatibility.

---

## DYNAMIC OPTION ENGINE

Claude must build the configurator dynamically from discovered option data whenever possible.

The UI should NOT rely on manually duplicated option definitions. Instead:

* generate selectors dynamically
* render menus dynamically
* populate swatches dynamically
* generate tailoring categories dynamically

The system architecture must remain scalable for: future garment additions, future fabrics, future tailoring options, multilingual support, enterprise expansion.

---

## MODEL LINKING REQUIREMENTS

Each discovered craft option must be mapped to:

* corresponding 3D meshes, material groups, shader behavior, UV regions, texture channels, animation states

Example — changing from notch lapel to peak lapel must automatically:
* swap geometry
* preserve fabric, lighting, fit, and animation compatibility

---

## FABRIC DISCOVERY SYSTEM

Claude must locate and understand: existing fabric texture libraries, texture resolution hierarchy, fabric naming conventions, texture compression systems, fabric metadata and categorization.

Claude must NEVER: duplicate fabric textures, create redundant shaders, or create disconnected material systems.

---

## DEBUGGING & VALIDATION

Before completing any implementation, Claude must verify:

* every craft option renders correctly
* every selector updates the model
* every fabric applies correctly
* all texture maps load properly
* no orphan options, broken mesh references, duplicate enums, or dead configuration paths exist

Claude must proactively fix: inconsistent naming, broken mappings, duplicate systems, outdated schemas, performance bottlenecks.

---

## ENTERPRISE SCALABILITY RULE

All discovered craft systems must be reorganized into: modular registries, scalable schemas, reusable rendering systems, centralized configuration architecture.

Claude should continuously improve: maintainability, rendering quality, scalability, configurator flexibility, developer experience.

---

## FINAL MANDATE

The existing tailoring intelligence inside the project is a major asset.

Claude's responsibility is to: uncover it, organize it, optimize it, connect it, enhance it, and scale it — NOT replace it with simplistic hardcoded systems.
