import { defineConfig, devices } from "@playwright/test";
import { ADMIN_PASSWORD, ADMIN_TOKEN_SECRET, BASE_URL, PORT } from "./tests/helpers/env";

/**
 * Blessed & Dressed end-to-end suite.
 *
 * WHY PORT 3100 AND NOT 3000
 * --------------------------
 * A long-lived `next dev` server squats on :3000 in this workspace and is in a
 * wedged state (`/builder/shirt` never responds). Next 16 also refuses to start
 * a second dev server for the same project directory, so the suite cannot use
 * `next dev` at all. We therefore build once and run `next start` on a dedicated
 * port with `reuseExistingServer: false`, so every run is against a server this
 * config owns end to end. A production server is also what customers actually
 * hit, which makes these regression tests worth more than dev-server tests.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Run the full Chromium build in new-headless mode rather than the
        // stripped `chromium-headless-shell`. It is the binary real customers'
        // browsers are built from, and it keeps `playwright install chromium`
        // as the only setup step.
        channel: "chromium",
      },
    },
  ],

  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `${BASE_URL}/api/fabrics`,
    // Never adopt a stranger's server. A stale or wedged process would otherwise
    // silently decide what these regression tests are asserting against.
    reuseExistingServer: false,
    timeout: 600_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ADMIN_PASSWORD,
      ADMIN_TOKEN_SECRET,
      // `.env.production.local` in this workspace carries VERCEL=1 from a
      // `vercel env pull`. It has no BLOB_READ_WRITE_TOKEN, so lib/admin-data
      // already falls back to the on-disk data-store — pinning it empty makes
      // the data source explicit rather than incidental.
      BLOB_READ_WRITE_TOKEN: "",
      // Deliberately NOT set: STRIPE_SECRET_KEY. See tests/e2e/cart-checkout.spec.ts —
      // the paid path is unconfigured in this environment and the suite asserts
      // that honestly instead of mocking Stripe away.
    },
  },
});
