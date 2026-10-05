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
   * Bug #3, full gate (added after Dustin authorized closing the gap the
   * copy-only fix left open) — Continue at the Measurements step used to
   * never be disabled, so a customer could reach Add to Cart with no
   * standard size and no custom measurements at all. Fixed with the same
   * gate pattern as the fabric step (Bug #1): Continue is now disabled at
   * step 6 until a real size or a real custom measurement is provided.
   */
  test("Continue is gated at the Measurements step until a size is chosen", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/builder/shirt");
    await page.getByRole("button", { name: /Show all fabrics/i }).click();
    await page
      .locator('button:has(p:text-is("Premium")), button:has(p:text-is("Classic"))')
      .first()
      .click();
    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: /^Continue$/ }).click(); // -> Style -> Design -> Monogram
    }
    await page.getByRole("button", { name: /^Continue$/ }).click(); // -> Measurements

    const continueButton = page.getByRole("button", { name: /^Continue$/ });
    await expect(
      continueButton,
      "a customer can advance past Measurements with nothing selected"
    ).toBeDisabled();

    const sizeButtons = page.locator("main button").filter({ hasText: /^\d/ });
    await expect(sizeButtons.first()).toBeVisible();
    await sizeButtons.first().click();
    await expect(continueButton).toBeEnabled();
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
   * UX Friction #1, now fixed (was previously documented, not fixed) —
   * /checkout/confirmation used to show "Payment Confirmed" unconditionally,
   * including a bare visit with no query params at all. Fixed to verify a
   * real Stripe session (payment_status === "paid") before claiming success;
   * anything else — no session_id, an invalid/expired one, or the legacy
   * `order=` reference (dead code, nothing generates it anymore) — shows an
   * honest "we couldn't confirm a payment" state instead.
   */
  test("checkout confirmation never claims success without a verified Stripe session", async ({
    page,
  }) => {
    await page.goto("/checkout/confirmation");
    await expect(page.getByText(/Payment Confirmed/i)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /couldn.t confirm a payment/i })).toBeVisible();

    await page.goto("/checkout/confirmation?order=TEST-123");
    await expect(page.getByText(/Payment Confirmed/i)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /couldn.t confirm a payment/i })).toBeVisible();

    await page.goto("/checkout/confirmation?session_id=cs_test_definitely_not_real");
    await expect(page.getByText(/Payment Confirmed/i)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /couldn.t confirm a payment/i })).toBeVisible();
  });

  /**
   * UX Friction #2, now fixed (was previously documented, not fixed) —
   * accessory cards on /accessories link to /products/[id], but that route
   * only ever looked up the `readyToWear` catalog, so every accessory link
   * 404'd and there was no way to add one to cart at all. Fixed by having
   * that route also check the accessories catalog and render a simpler
   * detail view (no sizes/stock — accessories don't have them) with a real
   * Add to Cart button.
   */
  test("an accessory can be opened and added to cart", async ({ page }) => {
    await page.goto("/accessories");
    const firstCard = page.locator('a[href^="/products/"]').first();
    await expect(firstCard).toBeVisible();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();

    await expect(page).toHaveURL(new RegExp(href!.replace(/[/]/g, "\\/") + "$"));
    const addToCart = page.getByRole("button", { name: /add to cart/i });
    await expect(addToCart, "accessory detail page must not 404 and must offer Add to Cart").toBeVisible();
    await addToCart.click();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /Your atelier cart/i })).toBeVisible();
    await expect(page.getByText(/your cart is empty/i)).toHaveCount(0);
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
