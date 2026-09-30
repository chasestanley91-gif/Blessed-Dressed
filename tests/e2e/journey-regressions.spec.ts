import { expect, test } from "@playwright/test";

/**
 * Regression guards for bugs found during the BD-JOURNEY-001 first-time-customer
 * journey audit (2026-09-29). Each of these failed against the pre-fix code and
 * passes against the fix; see `.ai-team/runs/BD-JOURNEY-001/debug-report.md` for
 * the full repro and evidence.
 */

test.describe("BD-JOURNEY-001 regressions", () => {
  /**
   * Bug #2 — an empty second monogram slot used to add +$10 to the price shown
   * to the customer (client counted slots), while the server only charges for
   * slots with real text (server counted filled slots) — a guaranteed 409 at
   * checkout for anyone who added a slot and left it blank. Fixed in
   * `calcPrice` (src/store/builderStore.ts) to count filled slots only.
   */
  test("an empty second monogram slot does not change the displayed price", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/builder/shirt");
    await page.getByRole("button", { name: /Show all fabrics/i }).click();
    await page
      .locator('button:has(p:text-is("Premium")), button:has(p:text-is("Classic"))')
      .first()
      .click();
    await page.getByRole("button", { name: /^Continue$/ }).click(); // -> Style
    await page.getByRole("button", { name: /^Continue$/ }).click(); // -> Design
    await page.getByRole("button", { name: /^Continue$/ }).click(); // -> Monogram

    // Anchor to the "Est. Total" row specifically, not just the last "$…" on
    // the page — that generic match can compare two unrelated dollar figures
    // if the page's DOM order ever shifts, passing vacuously either way.
    const estTotal = () =>
      page.locator('span:text-is("Est. Total")').locator("xpath=following-sibling::span").first().textContent();

    const priceBefore = await estTotal();

    const addMonogramBtn = page.getByRole("button", { name: /add.*monogram/i });
    await expect(addMonogramBtn).toBeVisible();
    await addMonogramBtn.click();

    // Leave the new monogram's text field empty — do not type anything.
    const priceAfter = await estTotal();

    expect(
      priceAfter,
      "adding a blank second monogram slot must not change the price shown to the customer"
    ).toBe(priceBefore);
  });

  /**
   * Bug #3 (copy half) — a standard-size order with no size chosen used to be
   * labeled "· Custom measurements" in the cart, which is false (it is a
   * standard-mode order, just an incomplete one) and risks a real fulfillment
   * mix-up. Fixed in src/app/cart/page.tsx to say "· Size not selected" instead.
   * (The underlying missing gate — Continue not disabled with no size chosen —
   * is documented in the debug report, not fixed here: gating Add to Cart would
   * change ordering behavior and is Dustin's call.)
   */
  test('a standard-mode order with no size shows "Size not selected", not "Custom measurements"', async ({
    page,
  }) => {
    const res = await page.request.get("/api/fabrics");
    const fabrics = (await res.json()) as Array<{ id: string; label: string; premium?: boolean }>;
    const plain = fabrics.find((f) => !f.premium) ?? fabrics[0];

    await page.addInitScript(
      ([fabricId, fabricLabel]) => {
        window.localStorage.setItem(
          "bd_cart",
          JSON.stringify([
            {
              cartId: "regression-c5-item",
              id: "bespoke-shirt-1730000000001",
              name: "Bespoke Shirt",
              price: 85,
              type: "bespoke",
              qty: 1,
              config: {
                fabric: fabricId,
                fabricLabel,
                designSelections: {},
                measureMode: "standard",
                standardSize: "",
              },
            },
          ])
        );
      },
      [plain.id, plain.label] as const
    );

    await page.goto("/cart");
    await expect(page.getByText("· Size not selected")).toBeVisible();
    await expect(page.getByText("· Custom measurements")).toHaveCount(0);
  });

  /**
   * Found during the fix-verification pass, not in the original hypothesis
   * list — a real, customer-visible naming bug caught in this task's own
   * evidence (cart/checkout snippets) but not filed in the first draft of
   * the debug report. `src/data/builder.ts` already prefixes three of six
   * product labels with "Bespoke" (Shirt, Trousers, Vest); the builder page
   * unconditionally prepended another "Bespoke " when adding to cart, so
   * those three showed as "Bespoke Bespoke Shirt" etc. in cart, checkout,
   * and the persisted order name. Fixed in
   * src/app/builder/[product]/page.tsx's handleAddToCart.
   */
  test('cart never shows a doubled "Bespoke Bespoke" product name', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/builder/shirt"); // "Bespoke Shirt" is one of the three already-prefixed labels
    await page.getByRole("button", { name: /Show all fabrics/i }).click();
    await page
      .locator('button:has(p:text-is("Premium")), button:has(p:text-is("Classic"))')
      .first()
      .click();
    for (let i = 0; i < 6; i++) {
      await page.getByRole("button", { name: /^Continue$/ }).click();
    }
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/cart");
    await expect(page.getByText(/Bespoke Bespoke/i)).toHaveCount(0);
    await expect(page.getByText("Bespoke Shirt", { exact: false }).first()).toBeVisible();
  });

  /**
   * Bug #4 — a product with 2+ photos overflowed the 375px mobile viewport by
   * ~73px because ProductGallery's outer flex wrapper had no width constraint,
   * so the thumbnail strip's intrinsic width forced the whole page wider. Fixed
   * by adding `w-full min-w-0` to that wrapper.
   */
  test("a multi-photo product page does not overflow the mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/products/r2"); // r2 has 6 photos in the fixture catalog
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(overflow, "page must not be wider than the 375px viewport").toBe(false);
  });
});
