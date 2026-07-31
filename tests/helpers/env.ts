/**
 * Constants shared by playwright.config.ts and the specs.
 *
 * Kept in its own module so a spec can read them without importing (and
 * re-evaluating) the Playwright config.
 */

/**
 * Port 3000 is squatted by a wedged `next dev` in this workspace, and Next 16
 * refuses a second dev server for the same directory — so the suite builds and
 * runs its own production server here. Override with E2E_PORT if 3100 is taken.
 */
export const PORT = Number(process.env.E2E_PORT ?? 3100);

export const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Admin credentials injected into the app under test.
 *
 * Next.js's env loader never overwrites a variable already present in
 * `process.env`, so these deliberately shadow the developer's (gitignored)
 * `.env.local`. The admin-gate specs therefore behave identically on a fresh
 * clone and on CI instead of depending on one machine's secrets.
 */
export const ADMIN_PASSWORD = "e2e-admin-password";
export const ADMIN_TOKEN_SECRET = "e2e-admin-token-secret";

/**
 * Per-asset weight budget for builder option imagery.
 *
 * The catalog was repointed off ~1,127 MB of PNG masters onto ~76 MB of WebP
 * derivatives; 400 KB is the ceiling that migration was sized against.
 */
export const OPTION_IMAGE_MAX_BYTES = 400 * 1024;
