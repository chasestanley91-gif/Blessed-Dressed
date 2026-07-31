import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Cart → checkout.
 *
 * ── ON STRIPE ────────────────────────────────────────────────────────────────
 * Stripe is NOT configured in this environment. `src/lib/stripe.ts` returns null
 * without STRIPE_SECRET_KEY, and `/api/checkout/create-session` answers:
 *
 *     503  {"error":"Stripe is not configured. Please add STRIPE_SECRET_KEY."}
 *
 * These tests assert that *honest* behaviour. They deliberately do NOT stub the
 * Stripe SDK or inject a fake key: a mocked-green payment path is exactly the
 * kind of test that would let a real "payments are down" outage ship. What is
 * covered is everything up to and including the handoff — configuration, cart
 * persistence, form validation, and the customer-facing failure message.
 *
 * The paid path below (redirect to Stripe → /checkout/confirmation → webhook →
 * order record) is marked `test.fixme` and stays unimplemented until a test-mode
 * STRIPE_SECRET_KEY exists in CI. It is a gap, and it is labelled as one rather
 * than faked.
 */

const CUSTOMER = {
  firstName: "Marcus",
  lastName: "Whitfield",
  email: "e2e@blessed-dressed.test",
  address: "1 Savile Row",
  city: "London",
};

/**
 * Seed the cart directly. The full click-through purchase of a configured
 * garment is covered by the "real UI journey" test below; the remaining tests
 * seed state so a checkout assertion never fails for a builder reason.
 */
/** Bespoke shirt base price — must match BASE_PRICES.shirt in src/lib/pricing.ts. */
const SHIRT_BASE = 85;

/**
 * Seed a cart the SERVER will accept.
 *
 * The checkout route reprices every line from live data and rejects mismatches
 * (that is the fix for the client-supplied-price defect). So the fixture has to
 * be a genuinely valid order: a real, non-premium fabric id, the real base
 * price, and a cart id the bespoke product parser understands
 * (`bespoke-<product>-<digits>`). An invented fixture would be rejected at
 * repricing and never reach the behaviour these tests are about.
 */
async function seedBespokeCart(page: Page): Promise<{ fabricId: string; price: number }> {
  const res = await page.request.get("/api/fabrics");
  const fabrics = (await res.json()) as Array<{ id: string; label: string; premium?: boolean }>;
  const plain = fabrics.find((f) => !f.premium) ?? fabrics[0];
  const price = SHIRT_BASE + (plain.premium ? 150 : 0);

  await page.addInitScript(
    ([fabricId, fabricLabel, unitPrice]) => {
      window.localStorage.setItem(
        "bd_cart",
        JSON.stringify([
          {
            cartId: "e2e-cart-item",
            id: "bespoke-shirt-1730000000000",
            name: "Bespoke Shirt",
            price: unitPrice,
            type: "bespoke",
            qty: 1,
            config: {
              fabric: fabricId,
              fabricLabel,
              designSelections: {},
              measureMode: "standard",
              standardSize: "M",
            },
          },
        ])
      );
    },
    [plain.id, plain.label, price] as const
  );

  return { fabricId: plain.id, price };
}

test.describe("cart → checkout", () => {
  test("an empty cart tells the customer so, and checkout refuses to collect details", async ({
    page,
  }) => {
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /Your cart is empty/i })).toBeVisible();

    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: /Nothing to checkout/i })).toBeVisible();
    // No payment button may exist with nothing to pay for.
    await expect(page.getByRole("button", { name: /Proceed to Payment/i })).toHaveCount(0);
  });

  test("real UI journey: configure a garment, add to cart, reach checkout", async ({
    page,
  }) => {
    // The builder's design studio renders the full option catalog, so give the
    // walk-through room. This is the one test that exercises the genuine path.
    test.setTimeout(180_000);

    await page.goto("/builder/shirt");

    // Step 2 — fabric. Skip the discovery funnel, then take whatever the
    // catalog offers first so the test survives re-merchandising.
    await page.getByRole("button", { name: /Show all fabrics/i }).click();
    const fabricCards = page.locator(
      'button:has(p:text-is("Premium")), button:has(p:text-is("Classic"))'
    );
    await expect(fabricCards.first()).toBeVisible();
    const chosenFabric = (await fabricCards.first().locator("h3").textContent())?.trim();
    expect(chosenFabric, "no fabric label to select").toBeTruthy();
    await fabricCards.first().click();

    // Steps 3 → 8. Defaults are valid for every step after fabric, so Continue
    // is the whole journey.
    const continueButton = page.getByRole("button", { name: /^Continue$/ });
    await expect(continueButton).toBeEnabled();
    for (let step = 2; step < 8; step++) {
      await expect(
        page.getByText(new RegExp(`Step ${step} of 8`, "i")),
        `expected to be on step ${step}`
      ).toBeVisible();
      await continueButton.click();
    }

    // Step 8 — review. Add to Cart lives here.
    await expect(page.getByRole("heading", { name: /Review your order/i })).toBeVisible();
    // The chosen fabric survived seven steps of state.
    await expect(page.getByText(chosenFabric!, { exact: true }).first()).toBeVisible();

    const addToCart = page.getByRole("button", { name: /^Add to Cart/ });
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // Assert on the nav's cart counter, not the button's own label: the button
    // flips to "Added to cart ✓" for exactly 2s and then reverts, so polling its
    // text is a race. The counter is durable state.
    await expect(page.getByRole("link", { name: /^Cart \(1 items?\)$/ })).toBeVisible();

    // Cart holds the configured garment, with its fabric.
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /Your atelier cart/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bespoke Shirt" })).toBeVisible();

    // …and hands off to checkout.
    await page.getByRole("link", { name: /Proceed to Checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { name: /Complete your order/i })).toBeVisible();
    await expect(page.getByText("Order Summary")).toBeVisible();
    await expect(page.getByText(chosenFabric!, { exact: true }).first()).toBeVisible();
  });

  test("/checkout renders the order summary and payment form for a stocked cart", async ({
    page,
  }) => {
    const seeded = await seedBespokeCart(page);
    await page.goto("/checkout");

    await expect(page.getByRole("heading", { name: /Complete your order/i })).toBeVisible();
    await expect(page.getByText("Order Summary")).toBeVisible();
    await expect(page.getByText("Bespoke Shirt")).toBeVisible();
    await expect(page.getByText(`$${seeded.price}`).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Proceed to Payment/i })).toBeEnabled();
  });

  test("checkout blocks submission when required fields are missing", async ({ page }) => {
    await seedBespokeCart(page);
    await page.goto("/checkout");

    await page.getByRole("button", { name: /Proceed to Payment/i }).click();

    await expect(page.getByText(/Please fill in all required fields/i)).toBeVisible();
    // Still on checkout — no half-submitted order.
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("POST /api/checkout/create-session reports 503 while Stripe is unconfigured", async ({
    request,
  }) => {
    // A VALID, correctly-priced cart. Validation and repricing deliberately run
    // before the Stripe check, so an invented cart would be rejected at 409 and
    // this test would never exercise the unconfigured-payment path at all.
    const fabricsRes = await request.get("/api/fabrics");
    const fabrics = (await fabricsRes.json()) as Array<{ id: string; label: string; premium?: boolean }>;
    const plain = fabrics.find((f) => !f.premium) ?? fabrics[0];

    const res = await request.post("/api/checkout/create-session", {
      data: {
        items: [
          {
            cartId: "e2e-503",
            id: "bespoke-shirt-1730000000000",
            name: "Bespoke Shirt",
            price: SHIRT_BASE + (plain.premium ? 150 : 0),
            qty: 1,
            type: "bespoke",
            config: {
              fabric: plain.id,
              fabricLabel: plain.label,
              designSelections: {},
              measureMode: "standard",
              standardSize: "M",
            },
          },
        ],
        customerInfo: CUSTOMER,
      },
      failOnStatusCode: false,
    });

    // 503 (not 200, not 500): the deployment is missing configuration, and it
    // says so. If a STRIPE_SECRET_KEY is ever added to this environment this
    // test will fail loudly — which is the correct prompt to implement the
    // `test.fixme` paid-path coverage at the bottom of this file.
    expect(
      res.status(),
      "expected 503 while STRIPE_SECRET_KEY is absent — if this is now 200, Stripe " +
        "got configured and the paid-path tests below must be written"
    ).toBe(503);
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining("Stripe is not configured"),
    });
  });

  test("an unconfigured payment path fails visibly, not silently", async ({ page }) => {
    await seedBespokeCart(page);
    await page.goto("/checkout");

    await page.getByPlaceholder("Marcus").fill(CUSTOMER.firstName);
    await page.getByPlaceholder("Whitfield").fill(CUSTOMER.lastName);
    await page.getByPlaceholder("you@example.com").fill(CUSTOMER.email);
    await page.getByPlaceholder("123 Savile Row").fill(CUSTOMER.address);
    await page.getByPlaceholder("London").fill(CUSTOMER.city);

    await page.getByRole("button", { name: /Proceed to Payment/i }).click();

    // The customer is told, in plain language, that payment is unavailable.
    await expect(page.getByText(/Payments are not yet configured/i)).toBeVisible();

    // And critically: no false confirmation, and the cart is not cleared.
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("button", { name: /Proceed to Payment/i })).toBeEnabled();
    const cart = await page.evaluate(() => window.localStorage.getItem("bd_cart"));
    expect(cart, "an unpaid order must not empty the cart").toContain("Bespoke Shirt");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PENDING CONFIGURATION — not a passing test, and not pretending to be one.
  // Requires a Stripe test-mode key (STRIPE_SECRET_KEY=sk_test_...) plus a
  // webhook signing secret in the test environment. Until then the paid path
  // is genuinely uncovered.
  // ───────────────────────────────────────────────────────────────────────────
  test.fixme(
    "paid path: create-session returns a Stripe URL and confirmation records the order",
    async () => {
      // 1. POST /api/checkout/create-session → 200 { url: "https://checkout.stripe.com/..." }
      // 2. the bespoke order is persisted as "Pending Payment" BEFORE redirect
      // 3. /api/webhook flips it to paid on checkout.session.completed
      // 4. /checkout/confirmation?session_id=... renders the confirmation
    }
  );
});
