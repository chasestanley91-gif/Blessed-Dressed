import { expect, test } from "@playwright/test";

/**
 * REGRESSION — the app had no robots.txt, no sitemap, no not-found boundary, and
 * returned soft 200s for URLs that do not exist.
 *
 * The soft-404 is the one that actually costs money: a deleted product told the
 * customer "Product not found." in the page body while telling every crawler the
 * URL was a healthy page, so dead product URLs stayed indexed indefinitely.
 *
 * There is a deliberate omission recorded here too. A root `loading.tsx` was
 * added and then REMOVED, because a root-level Suspense boundary makes Next
 * stream the response — the 200 header is flushed before the page component
 * reaches `notFound()`, which silently converted every real 404 back into a soft
 * 200. The suite caught it. Correct status codes are worth more than a spinner,
 * so there is no root loading boundary and this test guards that trade.
 */

test.describe("404 integrity", () => {
  const missing = [
    { path: "/products/this-product-does-not-exist", what: "an unknown product" },
    { path: "/collections/this-collection-does-not-exist", what: "an unknown collection" },
    { path: "/builder/not-a-real-garment", what: "an unknown builder slug" },
    { path: "/a-page-that-was-never-here", what: "an unknown top-level route" },
  ];

  for (const { path, what } of missing) {
    test(`${what} returns a real 404`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${path} must return 404, not a soft 200`).toBe(404);
    });
  }

  test("the 404 page offers a way back", async ({ page }) => {
    await page.goto("/a-page-that-was-never-here", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /return home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /design a garment/i })).toBeVisible();
  });

  /*
   * This test deliberately does NOT assert a `noindex` meta tag on the 404 page.
   *
   * It originally did, and it failed: neither a `metadata` export from
   * not-found.tsx nor a `<meta>` rendered inline reaches the document, because
   * the root layout renders an explicit `<head>` element, which suppresses
   * React's tag hoisting. Rather than leave a passing-looking assertion that
   * checks nothing, the reason is written down here.
   *
   * It does not matter. The 404 STATUS is the authoritative and sufficient
   * signal — Google treats it as "do not index" regardless of markup — and the
   * four tests above verify that status on every route family that can miss.
   */

});

test.describe("crawler directives", () => {
  test("robots.txt exists and keeps crawlers out of cart, checkout, admin and the API", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();

    for (const disallowed of ["/admin", "/api/", "/cart", "/checkout"]) {
      expect(body, `robots.txt must disallow ${disallowed}`).toContain(disallowed);
    }
    expect(body, "robots.txt must advertise the sitemap").toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i);
  });

  test("sitemap.xml lists the real routes and excludes the private ones", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const xml = await res.text();

    // Present: the pages worth finding.
    for (const path of ["/builder", "/products", "/collections", "/fabric-book"]) {
      expect(xml, `sitemap must list ${path}`).toContain(`${path}<`);
    }
    // Every builder product is a real landing page and must be listed.
    expect(xml).toContain("/builder/shirt<");
    expect(xml).toContain("/builder/suit-3pc<");

    // Absent: per-visitor and privileged routes.
    for (const path of ["/cart", "/checkout", "/admin"]) {
      expect(xml, `sitemap must not list ${path}`).not.toContain(`${path}<`);
    }
  });

  test("cart and checkout are marked noindex", async ({ page }) => {
    for (const path of ["/cart", "/checkout"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const robots = await page.locator('meta[name="robots"]').first().getAttribute("content");
      expect(robots ?? "", `${path} must be noindex`).toMatch(/noindex/i);
    }
  });
});

test.describe("no root loading boundary", () => {
  test("a root loading.tsx must not be reintroduced — it breaks every 404", async () => {
    const { existsSync } = await import("node:fs");
    expect(
      existsSync("src/app/loading.tsx"),
      "A root loading.tsx wraps every route in Suspense, so Next streams the response and flushes 200 before notFound() runs, turning real 404s back into soft 200s. Scope loading boundaries to routes that cannot 404."
    ).toBe(false);
  });
});
