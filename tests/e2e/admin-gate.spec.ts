import { expect, test } from "@playwright/test";
import { ADMIN_PASSWORD } from "../helpers/env";

/**
 * REGRESSION — the admin surface must stay closed to guests.
 *
 * `src/proxy.ts` (Next 16's middleware) matches `/admin`, `/admin/:path*` and
 * `/api/admin/:path*`. Pages redirect to the login screen; APIs answer 401.
 *
 * A deny-only gate test is a trap: it also passes when the whole app is broken
 * and every route errors. So this file pairs each denial with a positive control
 * that proves the gate opens for a real session. The suite injects its own
 * ADMIN_PASSWORD / ADMIN_TOKEN_SECRET (see playwright.config.ts) so it never
 * depends on a developer's gitignored .env.local.
 */

const GATED_ADMIN_PAGES = [
  "/admin",
  "/admin/fabrics",
  "/admin/products",
  "/admin/orders",
];

const GATED_ADMIN_APIS = [
  "/api/admin/products",
  "/api/admin/fabrics",
  "/api/admin/orders",
  "/api/admin/site-settings",
];

test.describe("admin gate — guest", () => {
  for (const path of GATED_ADMIN_PAGES) {
    test(`${path} redirects a guest to /admin/login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
      // The login form is what should be on screen — not an admin shell that
      // merely changed its URL.
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });
  }

  test("the redirect is issued by the proxy, before the page renders", async ({ request }) => {
    // maxRedirects:0 proves the 307 comes from middleware rather than from a
    // client-side bounce that would briefly expose admin markup.
    const res = await request.get("/admin", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toContain("/admin/login");
  });

  for (const path of GATED_ADMIN_APIS) {
    test(`${path} returns 401 for a guest`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
      expect(await res.json()).toMatchObject({ error: "Unauthorized" });
    });
  }

  test("/admin/login itself is reachable without a session", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("a wrong password does not mint a session", async ({ request }) => {
    const res = await request.post("/api/admin/auth", {
      data: { password: `${ADMIN_PASSWORD}-wrong` },
    });
    expect(res.status()).toBe(401);

    // And the gate is still shut afterwards.
    expect((await request.get("/api/admin/products")).status()).toBe(401);
  });
});

test.describe("admin gate — positive control", () => {
  test("a valid login opens the gate that guests are refused", async ({ request }) => {
    // Guard rail: without this, every 401 above could be "the app is on fire".
    expect((await request.get("/api/admin/products")).status()).toBe(401);

    const login = await request.post("/api/admin/auth", {
      data: { password: ADMIN_PASSWORD },
    });
    expect(login.status(), "the suite's injected ADMIN_PASSWORD must be accepted").toBe(200);

    // `request` carries the Set-Cookie forward within the fixture's context.
    const authed = await request.get("/api/admin/products");
    expect(authed.status(), "an authenticated session must reach the admin API").toBe(200);
  });
});
