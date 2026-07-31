import { expect, test } from "@playwright/test";
import { scriptConsoleErrors, watchPageHealth } from "../helpers/page-health";

/**
 * Smoke coverage for every route a customer can reach without an account.
 *
 * Each route must:
 *   1. answer 200 at the HTTP level,
 *   2. paint real content (not an empty error shell),
 *   3. raise no uncaught exception, and
 *   4. log no console error from app code.
 *
 * Subresource load failures are excluded from (4) on purpose — they are asserted
 * far more precisely, asset by asset, in asset-delivery.spec.ts. See
 * helpers/page-health.ts. Everything else is unfiltered.
 *
 * NOTE ON WAITING: `networkidle` is unusable on this app. The builder hotlinks
 * craft-option thumbnails from 15 third-party hosts (see the "no third-party
 * hotlinks" defect in asset-delivery.spec.ts), so the network never goes quiet.
 * We wait for `load` plus a bounded settle instead, which is enough for
 * hydration and the builder's two client-side fetches to complete.
 */

const HYDRATION_SETTLE_MS = 2_000;

type Route = { path: string; heading: RegExp };

const PUBLIC_ROUTES: Route[] = [
  { path: "/", heading: /\S/ },
  { path: "/builder", heading: /\S/ },
  { path: "/builder/shirt", heading: /Choose your fabric/i },
  { path: "/builder/suit-2pc", heading: /Choose your fabric/i },
  { path: "/products", heading: /\S/ },
  { path: "/collections", heading: /\S/ },
  { path: "/fabric-book", heading: /\S/ },
  { path: "/cart", heading: /cart/i },
  { path: "/checkout", heading: /\S/ },
];

test.describe("public routes smoke", () => {
  for (const { path, heading } of PUBLIC_ROUTES) {
    test(`${path} renders cleanly`, async ({ page }) => {
      const health = watchPageHealth(page);

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response, `no response for ${path}`).not.toBeNull();
      expect(response!.status(), `${path} must return 200`).toBe(200);

      // Something was actually rendered, and it is not Next's error boundary.
      // `.last()` because the app nests a second <main> inside the layout's —
      // see the landmark defect at the bottom of this file.
      await expect(page.getByRole("main").last()).toBeVisible();
      await expect(page.getByRole("heading").first()).toHaveText(heading);
      await expect(
        page.getByText(/Application error: a client-side exception/i)
      ).toHaveCount(0);

      await page.waitForLoadState("load");
      await page.waitForTimeout(HYDRATION_SETTLE_MS);

      expect(health.pageErrors, `uncaught exception on ${path}`).toEqual([]);
      expect(scriptConsoleErrors(health), `console error on ${path}`).toEqual([]);
    });
  }

  test("the document title is set (no untitled pages)", async ({ page }) => {
    for (const { path } of PUBLIC_ROUTES) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(await page.title(), `${path} has no <title>`).not.toBe("");
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
 * KNOWN DEFECT — the assertion is correct and currently FAILS. `test.fail()`
 * runs it at full strength; it is not weakened and not skipped.
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("known landmark defect", () => {
  /**
   * BUG L1 — every page renders two nested <main> landmarks.
   *
   * `src/app/layout.tsx:114` wraps children in `<main>{children}</main>`, and
   * every page component then opens its own `<main className="min-h-screen …">`.
   * The result is `<main><main>…</main></main>` on all nine public routes.
   *
   * ARIA allows at most one `main` landmark per document and forbids nesting
   * one inside another. Screen-reader users get two "main" landmarks in the
   * rotor, and "skip to main content" becomes ambiguous. It also breaks
   * `page.getByRole("main")` for anyone writing tests — which is how it was
   * found.
   *
   * Fix in exactly one place: either drop the wrapper in layout.tsx and let each
   * page own its <main>, or change every page's <main> to a <div>.
   */
  test("each page exposes exactly one <main> landmark", async ({ page }) => {
    const offenders: string[] = [];

    for (const { path } of PUBLIC_ROUTES) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const count = await page.locator("main").count();
      if (count !== 1) offenders.push(`${path}: ${count} <main> elements`);
    }

    expect(offenders, "nested/duplicate main landmarks").toEqual([]);
  });
});
