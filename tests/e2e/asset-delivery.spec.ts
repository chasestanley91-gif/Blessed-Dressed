import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import {
  BUILDER_PRODUCTS,
  fetchAllOptionImages,
  fetchAllRenderedThumbnails,
  fetchOptionImages,
  mapWithConcurrency,
} from "../helpers/catalog";
import { OPTION_IMAGE_MAX_BYTES } from "../helpers/env";

/**
 * Asset delivery for the builder's craft-option imagery.
 *
 * The generated catalog was repointed off its ~1,127 MB of PNG masters onto the
 * ~76 MB of WebP derivatives beside them (`.vercelignore` now excludes
 * `public/images/generated/**\/*.png`; the masters stay in git purely as the
 * provenance anchor for QC).
 *
 * ── READ THIS BEFORE ADDING A TEST HERE ──────────────────────────────────────
 * There are TWO different questions, and only one of them is about the catalog:
 *
 *   1. "What does the catalog's `image` field say?"  ← the tests in the first
 *      describe block. All WebP, all in budget. This is the migration's intent.
 *
 *   2. "What bytes does the customer's browser actually download?"  ← the
 *      known-defect block. `OptionCard` paints
 *      `realImage ?? aiImage ?? images[0] ?? image`, so `image` is the LAST
 *      choice, and today the browser mostly downloads something else entirely.
 *
 * A suite that only asked question 1 would report a healthy green while every
 * customer pulled multi-megabyte PNGs. Keep both.
 *
 * Every expectation is derived from what `/api/options/:product` actually
 * serves, then verified over HTTP against the running server. No path lists are
 * hardcoded, so the tests keep their meaning as the catalog grows.
 */

const SWEEP_TIMEOUT = 300_000;
const FETCH_CONCURRENCY = 12;

type AssetResult = {
  path: string;
  status: number;
  contentType: string;
  bytes: number;
};

async function measure(request: APIRequestContext, paths: string[]): Promise<AssetResult[]> {
  return mapWithConcurrency(paths, FETCH_CONCURRENCY, async (path) => {
    const res = await request.get(path);
    const body = res.ok() ? await res.body() : Buffer.alloc(0);
    return {
      path,
      status: res.status(),
      contentType: res.headers()["content-type"] ?? "",
      bytes: body.byteLength,
    };
  });
}

/* ───────────────────────── catalog-level invariants ───────────────────────── */

test.describe("builder option catalog", () => {
  test("every product serves a non-empty option-image set", async ({ request }) => {
    for (const product of BUILDER_PRODUCTS) {
      const images = await fetchOptionImages(request, product);
      expect(images.size, `/api/options/${product} served no option imagery`).toBeGreaterThan(0);
    }
  });

  test("no catalog `image` entry points back at a PNG master", async ({ request }) => {
    const all = await fetchAllOptionImages(request);
    const generated = all.filter((p) => p.startsWith("/images/generated/"));

    expect(
      generated.length,
      "no /images/generated/ imagery is being served — the assertion below would be vacuous"
    ).toBeGreaterThan(0);

    const notWebp = generated.filter((p) => !p.toLowerCase().endsWith(".webp"));
    expect(
      notWebp,
      "these catalog entries still name pre-migration masters; the PNGs are " +
        "excluded from the Vercel upload by .vercelignore, so they 404 in production"
    ).toEqual([]);
  });

  test("catalog `image` WebP assets serve as image/webp and stay inside the weight budget", async ({
    request,
  }) => {
    // Scope note: this measures the catalog's `image` field, which is NOT
    // necessarily the byte the browser fetches. See the known defects below.
    test.setTimeout(SWEEP_TIMEOUT);

    const all = await fetchAllOptionImages(request);
    const generated = all.filter((p) => p.startsWith("/images/generated/"));
    const results = await measure(request, generated);

    const broken = results.filter((r) => r.status !== 200);
    expect(broken.map((r) => `${r.status} ${r.path}`), "generated asset did not serve").toEqual([]);

    const wrongType = results.filter((r) => !r.contentType.includes("image/webp"));
    expect(
      wrongType.map((r) => `${r.path} -> ${r.contentType}`),
      "generated craft photos must be delivered as image/webp"
    ).toEqual([]);

    const overBudget = results
      .filter((r) => r.bytes > OPTION_IMAGE_MAX_BYTES)
      .map((r) => `${Math.round(r.bytes / 1024)}KB ${r.path}`);
    expect(
      overBudget,
      `generated craft photos must stay under ${OPTION_IMAGE_MAX_BYTES / 1024}KB each`
    ).toEqual([]);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
 * KNOWN DEFECTS — these assertions are correct and currently FAIL.
 *
 * `test.fail()` runs the test at full strength and requires it to fail. The
 * assertion is NOT weakened. When the underlying bug is fixed the test starts
 * passing, Playwright reports "expected to fail but passed", and whoever fixed
 * it deletes the annotation. That is deliberate: a weakened assertion would
 * hide the defect forever, and a skipped test asserts nothing.
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("known asset defects", () => {
  /**
   * BUG A1 — two catalog entries point at files that do not exist.
   *
   *   404 /images/ultra/ultra-thin-half-OIP.jpg
   *   404 /images/opt/opt-1779526586804-174107443891659.webp
   *
   * A customer comparing craft options sees a broken image where a construction
   * difference should be. Fix by repointing (or restoring) those two entries in
   * data-store/options/*.json — not by deleting this test.
   */
  test.fail(
    "[KNOWN BUG] every option image the catalog serves resolves to a real file",
    async ({ request }) => {
      test.setTimeout(SWEEP_TIMEOUT);

      const all = await fetchAllOptionImages(request);
      const results = await measure(request, all);
      const missing = results.filter((r) => r.status !== 200).map((r) => `${r.status} ${r.path}`);

      expect(missing, "catalog entries pointing at non-existent files").toEqual([]);
    }
  );

  /**
   * BUG A2 — six legacy PNG option images blow the per-asset weight budget.
   *
   *   1856KB /images/factory/kute/jacket/Lining_Body_lining/072D__Appointed_DIY_Printing-.png
   *   1550KB /images/lapel/lapel-peak-removable-shawl-<uuid>.png
   *   1537KB /images/lapel/lapel-notch-removable-shawl-<uuid>.png
   *   1277KB /images/ai/collar-one-collar.png
   *   1215KB /images/ai/collar-regular-85-tab.png
   *   1069KB /images/ai/collar-point-75-tri.png
   *
   * These sit OUTSIDE /images/generated/, so the WebP migration never touched
   * them. Fix by converting them the same way the generated catalog was.
   */
  test.fail(
    `[KNOWN BUG] no served option image exceeds ${OPTION_IMAGE_MAX_BYTES / 1024}KB`,
    async ({ request }) => {
      test.setTimeout(SWEEP_TIMEOUT);

      const all = await fetchAllOptionImages(request);
      const results = await measure(request, all);
      const overBudget = results
        .filter((r) => r.status === 200 && r.bytes > OPTION_IMAGE_MAX_BYTES)
        .sort((a, b) => b.bytes - a.bytes)
        .map((r) => `${Math.round(r.bytes / 1024)}KB ${r.path}`);

      expect(overBudget, "option images over the weight budget").toEqual([]);
    }
  );

  /**
   * BUG A3 — the WebP migration never reached the render path. HIGHEST SEVERITY.
   *
   * `OptionCard` (src/app/builder/[product]/page.tsx) picks its thumbnail as
   * `realImage ?? aiImage ?? images[0] ?? image` — the migrated `image` is the
   * LAST resort. 525 craft options still carry a `realImage` pointing at the
   * PNG master beside the WebP:
   *
   *   "image":     "/images/generated/shirt/collar-point-70.webp"   ← 140 KB, migrated
   *   "realImage": "/images/generated/shirt/collar-point-70.png"    ← 2 MB, what ships
   *
   * Measured across the catalog: 525 unique thumbnails resolve to PNG masters
   * totalling 1,032 MB, averaging 2,013 KB each. The same set as WebP is
   * 72.1 MB. The customer-facing benefit of the migration is currently ~0%.
   *
   * It is worse in production than locally. `.vercelignore` excludes
   * `public/images/generated/**\/*.png`, so on Vercel all 525 of those requests
   * 404 and only OptionCard's `onError` fallback — which re-points the <img> at
   * `image` — keeps the page from looking broken. That is 525 wasted round trips
   * per full catalog browse, and the failure is invisible on localhost because
   * the masters are sitting right there on disk.
   *
   * Fix by clearing/repointing `realImage` (and `aiImage`) for every option whose
   * `image` is already the WebP derivative. Do NOT fix it by deleting this test.
   */
  test.fail(
    "[KNOWN BUG] no option's rendered thumbnail resolves to a PNG master",
    async ({ request }) => {
      test.setTimeout(SWEEP_TIMEOUT);

      const thumbnails = await fetchAllRenderedThumbnails(request);
      expect(thumbnails.length, "no thumbnails resolved at all").toBeGreaterThan(0);

      const masters = thumbnails.filter(
        (t) => t.startsWith("/images/generated/") && t.toLowerCase().endsWith(".png")
      );

      expect(
        masters.length,
        "rendered thumbnails still pointing at pre-migration PNG masters " +
          "(sample: " + masters.slice(0, 3).join(", ") + ")"
      ).toBe(0);
    }
  );

  /**
   * BUG A3b — empirical confirmation of BUG A3, measured in a real browser.
   *
   * Walks a guest to the shirt design studio and records what the page actually
   * downloaded. Today every `/images/generated/` request comes back
   * `image/png`; not one WebP is fetched.
   */
  test.fail(
    "[KNOWN BUG] the design studio downloads WebP, not the PNG masters",
    async ({ page }) => {
      test.setTimeout(120_000);

      const imageResponses: { url: string; contentType: string }[] = [];
      page.on("response", (res) => {
        const type = res.headers()["content-type"] ?? "";
        if (type.startsWith("image/") && res.url().includes("/images/generated/")) {
          imageResponses.push({ url: res.url(), contentType: type });
        }
      });

      await page.goto("/builder/shirt");
      await page.getByRole("button", { name: /Show all fabrics/i }).click();

      const fabricCards = page.locator(
        'button:has(p:text-is("Premium")), button:has(p:text-is("Classic"))'
      );
      await expect(fabricCards.first()).toBeVisible();
      await fabricCards.first().click();

      // Step 2 → 3 (style) → 4 (design studio), where craft thumbnails live.
      for (let i = 0; i < 2; i++) {
        await page.getByRole("button", { name: /^Continue$/ }).click();
      }
      await expect(page.getByText(/Design studio/i).first()).toBeVisible();

      // Deliberately NOT `networkidle`: the design studio also hotlinks
      // thumbnails from third-party hosts (BUG A4), so the network never goes
      // quiet. Wait on the <img> elements themselves — `complete` settles on
      // error too, so this always terminates.
      await page.waitForFunction(
        () => {
          const imgs = [...document.querySelectorAll("img")].filter(
            (i) =>
              i.currentSrc.includes("/images/generated/") ||
              i.src.includes("/images/generated/")
          );
          return imgs.length > 0 && imgs.every((i) => i.complete);
        },
        undefined,
        { timeout: 60_000 }
      );

      expect(
        imageResponses.length,
        "the design studio requested no generated craft imagery at all"
      ).toBeGreaterThan(0);

      const nonWebp = imageResponses.filter((r) => !r.contentType.includes("image/webp"));
      expect(
        nonWebp.map((r) => `${r.url} -> ${r.contentType}`),
        "the browser downloaded non-WebP generated imagery"
      ).toEqual([]);
    }
  );

  /**
   * BUG A4 — the builder hotlinks craft-option thumbnails from third-party sites.
   *
   * Because `OptionCard` prefers `images[0]` over the local `image`, ~337
   * options resolve to ~89 distinct URLs on 15 external hosts — including direct
   * competitors and editorial blogs:
   *
   *   propercloth.com · turnbullandasser.com · permanentstyle.com · heddels.com
   *   bondsuits.com · senszio.com · deoveritas.com · sartorialnotes.com
   *   giammarcosaviano.com · bykowskitailorgarb.com · doinaalexei.com
   *   cdn.shopify.com · images.squarespace-cdn.com · static.wixstatic.com
   *   cdn.prod.website-files.com
   *
   * Consequences, in severity order:
   *   1. Licensing — the storefront serves other tailoring houses' product
   *      photography as its own craft-option imagery.
   *   2. Reliability — any of those hosts can 404, rate-limit, or enable
   *      hotlink protection and the customer sees a broken option.
   *   3. Privacy/performance — a customer's IP and referrer are handed to 15
   *      third parties, and the page's network never goes idle (which is why no
   *      test in this suite can use `waitForLoadState("networkidle")`).
   *
   * Fix by downloading, licence-clearing and repointing these at local assets —
   * the workflow the blessed-dressed-craft-image-research skill exists for.
   */
  test.fail(
    "[KNOWN BUG] every thumbnail the builder paints is served by this app",
    async ({ request }) => {
      test.setTimeout(SWEEP_TIMEOUT);

      const thumbnails = await fetchAllRenderedThumbnails(request);
      expect(thumbnails.length, "no thumbnails resolved at all").toBeGreaterThan(0);

      const remote = thumbnails.filter((t) => /^https?:\/\//i.test(t));
      const hosts = [...new Set(remote.map((u) => new URL(u).host))].sort();

      expect(
        hosts,
        `${remote.length} craft-option thumbnails are hotlinked from third-party hosts`
      ).toEqual([]);
    }
  );
});
