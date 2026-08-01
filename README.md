# Blessed & Dressed

A bespoke menswear storefront and made-to-measure builder, plus the AI photography
pipeline that produces its craft-option catalog imagery.

Next.js 16 (App Router) · React 19 · Tailwind v4 · Vercel Blob · Stripe.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

`npm run build && npm start` for a production build.

## Two things live in this repo

**1. The web application** (`src/`) — storefront, the 8-step product builder, cart,
Stripe checkout, and an 18-page admin CMS.

**2. The craft-option photography pipeline** (`tools/`, `.craft-pipeline/`) — turns a
supplier tech-pack illustration into a verified, catalog-ready photograph. This is
the larger and less obvious system; see [Architecture](#architecture) below.

---

## Architecture

### Data layer — filesystem + Vercel Blob, no database

`src/lib/admin-data.ts` is the whole persistence layer:

| helper | behaviour |
|---|---|
| `loadData` / `saveData` | synchronous `fs` against `data-store/` — local dev only |
| `loadDataAsync` / `saveDataAsync` | Vercel Blob when `VERCEL && BLOB_READ_WRITE_TOKEN`, else falls through to the sync pair |

**Always use the async pair in application code.** Public pages once used the sync
readers while admin routes wrote through Blob, so on Vercel admin edits were invisible
to the storefront. Binary images go through `src/lib/image-store.ts`, which follows the
same split.

Note `data-store/*.json` is gitignored except `data-store/options/*.json` — runtime data
lives in Blob in production. The 6 option files (2,862 craft options) are static config
and *are* committed.

### The three-skill photography pipeline

The written specification is the highest authority. The tech-pack illustration is
a visual reference that identifies the craft option, confirms orientation, and
anchors shape/placement, but if the catalog text defines a measurement, angle,
count, or construction detail, the written spec takes precedence over the drawing.
If the illustration is missing a detail that the text specifies, the text still
defines the final garment; missing visual detail is only flagged when the spec is
absent or ambiguous.

See `CRAFT_SPECIFICATION_STANDARD.md` for the formal parameterized tailoring
specification standard and the exact hierarchy of authority used by the pipeline.

Artifacts live in `.craft-pipeline/<productId>/<optionId>/`. **`garment-image-qc` is the
only authority that may approve a catalog write-back.**

### Image provenance

Every served image traces back to a specific QC verdict:

```
qc.json (attempt N)
  → candidate-N.png        SHA-1 X, the bytes QC actually graded
  → generated/<id>.png     SHA-1 X, byte-identical — publish_approved gate 2
  → generated/<id>.webp    derived; manifest records sourceSha1 = X
```

The catalog serves the `.webp` (1,127 MB → 76 MB across 578 images). The PNG masters
are the provenance anchor: kept in git, excluded from the Vercel upload via
`.vercelignore`. Never convert a master in place — that breaks the byte-identity gate.

---

## Tools

| command | what it does |
|---|---|
| `node tools/project_state.mjs` | rebuild the state docs — **run after every work unit** |
| `node tools/project_state.mjs --audit` | findings only, writes nothing; exit 1 if blocking |
| `node tools/publish_approved.mjs [--apply]` | write QC-approved images into the catalog |
| `node tools/localize_blueprints.mjs [--apply]` | pull remote CDN blueprints into the repo |
| `node tools/optimize_assets.mjs --apply [--repoint]` | build WebP derivatives, repoint the catalog |

All default to a dry run and require `--apply` to write.

## Where the project stands

`STATE.md` is generated, current, and the only number worth trusting — a prose
checkpoint claiming a batch passed is not evidence, only `qc.json` is.

- `STATE.md` — position and blocking findings
- `CONTINUE.md` — the next concrete action
- `HANDOFF.md` — where the last session stopped and how to resume
- `PROJECT_DASHBOARD.md` — per-product coverage
- `public/images/reports/CHECKPOINT.json` — decisions, bugs fixed, credit ledger
- `public/images/reports/failure-log.md` — **read before writing any prompt**

## Environment

See `.env.example`. `ADMIN_PASSWORD` and `ADMIN_TOKEN_SECRET` are required in
production — the app fails closed without them rather than falling back to a
build-time default. Stripe needs `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` and
`NEXT_PUBLIC_SITE_URL`; Blob persistence needs `BLOB_READ_WRITE_TOKEN`.

## Scripts

```bash
npm run dev              # dev server (webpack)
npm run build            # production build
npm run lint             # eslint
npm run visual-qa        # puppeteer screenshot crawl over 9 routes
npm run visual-qa-report # render the screenshot inventory
```

The ~65 loose `.mjs` files at the repo root are one-off scrapers and migrations kept
for history. They are not part of the build and are excluded from the Vercel upload.
