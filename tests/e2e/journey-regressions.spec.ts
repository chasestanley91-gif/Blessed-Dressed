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

    const priceBefore = await page.getByText(/^\$[\d,]+$/).last().textContent();

    const addMonogramBtn = page.getByRole("button", { name: /add.*monogram/i });
    await expect(addMonogramBtn).toBeVisible();
    await addMonogramBtn.click();

    // Leave the new monogram's text field empty — do not type anything.
    const priceAfter = await page.getByText(/^\$[\d,]+$/).last().textContent();

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
