---
name: run-app
description: >
  Launch, verify, screenshot, and smoke-test the Blessed & Dressed Next.js dev server.
  Use this whenever asked to "open", "run", "start", "show", "preview", "screenshot",
  "check", or "verify" the app, or when confirming a code change works in the browser.
  Also use when navigating to specific pages like the builder, admin panel, home page,
  fabric book, or accessories to confirm changes are live.
---

# Running Blessed & Dressed

Next.js 16 app driven by a Puppeteer + Edge headless browser. The driver lives at
`.claude/skills/run-app/driver.mjs` (relative to the project root). Screenshots land in
`C:\Users\ChaseStanley\Downloads\files\temporary screenshots\` (auto-numbered, never overwritten).

**Project root:** `C:\Users\ChaseStanley\Downloads\files\brand_assets\blessed-dressed`

---

## Run: agent path (driver)

```powershell
cd "C:\Users\ChaseStanley\Downloads\files\brand_assets\blessed-dressed"
```

### Check server health (no browser)
```powershell
node .claude/skills/run-app/driver.mjs check
```
Exits 0 if server is up, 1 if down.

### Screenshot one page
```powershell
node .claude/skills/run-app/driver.mjs /builder/suit-2pc
# → Screenshot saved: C:\...\temporary screenshots\screenshot-N.png
```
Pass any route (must start with `/`). Read the saved PNG with the Read tool to inspect visually.

### Smoke test all key pages
```powershell
node .claude/skills/run-app/driver.mjs smoke
# → 12/12 pages OK  (or lists which pages errored)
```
Takes a screenshot of each key page. Run this after any broad change to catch regressions.

---

## Key URLs (all verified 200 OK)

| Page | Route |
|------|-------|
| Homepage | `/` |
| Builder — 2-Piece Suit | `/builder/suit-2pc` |
| Builder — 3-Piece Suit | `/builder/suit-3pc` |
| Builder — Shirt | `/builder/shirt` |
| Builder — Sport Coat | `/builder/sport-coat` |
| Builder landing (choose product) | `/builder` |
| Ready to Wear listing | `/products` |
| Ready to Wear product detail | `/products/r1` |
| Accessories | `/accessories` |
| Fabric Book | `/fabric-book` |
| Collections | `/collections` |
| Cart | `/cart` |
| Checkout | `/checkout` |
| Admin login | `/admin/login` |
| Admin — Fabrics | `/admin/fabrics` (redirects to login if unauthenticated) |
| Admin — Bespoke Orders | `/admin/bespoke-orders` (redirects to login if unauthenticated) |

**Does NOT exist (all 404):** `/login`, `/register`, `/my-account`, `/contact`, `/support`

---

## Run: human path

```powershell
cd "C:\Users\ChaseStanley\Downloads\files\brand_assets\blessed-dressed"
npm run dev
```
Opens on `http://localhost:3000`. If port 3000 is busy, Next.js auto-increments to 3001.
Press Ctrl-C to stop. Not useful headless — use the driver instead.

---

## Prerequisites

- Node 20+ (check: `node -v`)
- Dependencies installed: `npm install` inside the project root
- Microsoft Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
  (the driver uses Edge via puppeteer-core — no separate Puppeteer install needed)

---

## Verifying a code change

1. Make the change. Hot-module replacement handles it automatically — no restart needed
   unless you changed `next.config.ts`.
2. Run the driver for the affected page:
   ```powershell
   node .claude/skills/run-app/driver.mjs /builder/suit-2pc
   ```
3. Read the screenshot PNG with the Read tool and inspect visually.
4. For admin changes: log in at `/admin/login` first, then screenshot the admin page.

---

## Gotchas

- **`/builder/suit` is NOT a valid route** — use `/builder/suit-2pc` or `/builder/suit-3pc`.
  The slug comes from `data-store/options/` filenames (suit-2pc.json, suit-3pc.json, shirt.json, sport-coat.json).
- **Admin pages 307-redirect** until authenticated. Screenshot `/admin/login` to get the
  password gate; the gate itself is a single password field (not a username/email form).
- **`next.config.ts` changes** require a full server restart (`Ctrl-C` then `npm run dev`).
  All other changes hot-reload automatically.
- **TypeScript errors** show as a Next.js error overlay — the page renders but has a red
  banner. Run `npx tsc --noEmit 2>&1 | head -30` to see the actual error.
- **6 × HTTP 401 in the browser console** on public pages — auth-protected API endpoints
  fire unconditionally; these are logged but don't break rendering.
- **Driver requires `headless: true`** (not `headless: false` + `--headless=chrome`). The
  mixed-mode launch fails with "Code: 0" on this machine. The driver is already fixed.

---

## Troubleshooting

**`Error: Failed to launch the browser process` / `Code: 0`**
→ Most likely the headless mode flag. The driver must use `headless: true` (not `false`). Check driver.mjs.
→ Also verify Edge is installed: `Test-Path "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"`

**`Server not running. Start it first.`**
→ `npm run dev` in the project root, wait ~8 seconds for "Ready" message, then retry.

**`navigation timeout exceeded`**
→ A page took >20s to respond. Usually a missing `.env.local` variable causing a slow
external API call. Check `.env.example` for required keys and set them in `.env.local`.

**Page shows error overlay instead of content**
→ TypeScript / import error. Run `npx tsc --noEmit 2>&1 | head -30` from project root.
