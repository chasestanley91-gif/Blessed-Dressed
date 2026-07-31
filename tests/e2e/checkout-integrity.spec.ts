import { expect, test } from "@playwright/test";

/**
 * REGRESSION — the four checkout ship-blockers found 2026-07-30.
 *
 * These are not hypothetical. Each was verified in the source before the fix:
 *
 *  1. `create-session` passed the browser's `item.price` straight into Stripe's
 *     `unit_amount`. A crafted POST bought a bespoke suit for $0.50.
 *  2. The bespoke configuration was persisted by a server-to-server fetch to
 *     `/api/admin/bespoke-orders` — a route `proxy.ts` gates. It always 401'd,
 *     `if (res.ok)` had no `else`, and every order lost its fabric, design,
 *     measurements and monograms while the customer was still charged.
 *  3. `GET /api/consultation` returned every lead's name, email, phone and
 *     budget to anyone.
 *  4. `/builder/suit` is not a real product; the builder substituted
 *     `builderProducts[0]`, `basePrices["suit"]` was `undefined → 0`, and Add to
 *     Cart read $150.
 *
 * Stripe is intentionally NOT configured in this environment, so the price-
 * tampering tests assert the request is rejected BEFORE Stripe is reached. That
 * is the meaningful boundary: repricing must happen server-side regardless of
 * whether a key is present. A 503 ("Stripe is not configured") would mean the
 * guard never ran, so it is asserted against explicitly.
 */

const VALID_CUSTOMER = {
  firstName: "Test",
  lastName: "Customer",
  email: "test.customer@example.com",
  phone: "555-0100",
  address: "1 Example Street",
  city: "London",
  country: "GB",
};

async function postCheckout(request: import("@playwright/test").APIRequestContext, body: unknown) {
  return request.post("/api/checkout/create-session", {
    data: body,
    headers: { "Content-Type": "application/json" },
    failOnStatusCode: false,
  });
}

/** A fabric id the live catalogue actually offers, so the reprice reaches the
 *  price comparison instead of stopping at "unknown fabric". */
async function liveFabric(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get("/api/fabrics");
  expect(res.ok(), "the public fabrics endpoint must serve the managed list").toBeTruthy();
  const fabrics = (await res.json()) as Array<{ id: string; premium?: boolean }>;
  expect(fabrics.length).toBeGreaterThan(0);
  return fabrics[0];
}

test.describe("checkout price integrity", () => {
  test("a tampered bespoke price is rejected, not charged", async ({ request }) => {
    const fabric = await liveFabric(request);

    const res = await postCheckout(request, {
      items: [
        {
          cartId: "tampered-1",
          id: "bespoke-suit-3pc-1730000000000",
          name: "Bespoke 3-Piece Suit",
          price: 0.5, // real base is 799.99
          qty: 1,
          type: "bespoke",
          config: {
            fabric: fabric.id,
            fabricLabel: fabric.id,
            designSelections: {},
            measureMode: "standard",
            standardSize: "40R",
          },
        },
      ],
      customerInfo: VALID_CUSTOMER,
    });

    // 503 would mean the Stripe guard short-circuited before repricing ran.
    expect(res.status(), "repricing must run before the Stripe check").not.toBe(503);
    expect(res.status()).toBe(409);

    const body = JSON.stringify(await res.json());
    expect(body).toMatch(/price mismatch/i);
    // The server's own figure must appear — proof it recomputed rather than
    // echoing the client's number back.
    expect(body).toMatch(/server computes \$\d/);
  });

  test("a fabric the catalogue does not offer is rejected", async ({ request }) => {
    const res = await postCheckout(request, {
      items: [
        {
          cartId: "bogus-fabric",
          id: "bespoke-shirt-1730000000000",
          name: "Bespoke Shirt",
          price: 85,
          qty: 1,
          type: "bespoke",
          config: {
            fabric: "not-a-real-fabric",
            fabricLabel: "Nope",
            designSelections: {},
            measureMode: "standard",
          },
        },
      ],
      customerInfo: VALID_CUSTOMER,
    });

    expect(res.status()).toBe(409);
    expect(JSON.stringify(await res.json())).toMatch(/unknown fabric/i);
  });

  test("a tampered ready-to-wear price is rejected", async ({ request }) => {
    const products = await request.get("/api/options/shirt", { failOnStatusCode: false });
    expect(products.ok()).toBeTruthy(); // sanity: the app is actually serving

    const res = await postCheckout(request, {
      items: [
        { cartId: "rtw-1", id: "p1", name: "Ready-to-wear", price: 1, qty: 1, type: "rtw" },
      ],
      customerInfo: VALID_CUSTOMER,
    });

    expect(res.status()).not.toBe(503);
    expect([400, 409]).toContain(res.status());
  });

  test("an unknown design selection is rejected rather than priced at zero", async ({ request }) => {
    const fabric = await liveFabric(request);

    const res = await postCheckout(request, {
      items: [
        {
          cartId: "bogus-option",
          id: "bespoke-shirt-1730000000000",
          name: "Bespoke Shirt",
          price: 85,
          qty: 1,
          type: "bespoke",
          config: {
            fabric: fabric.id,
            fabricLabel: fabric.id,
            designSelections: { lapel: "not-a-real-option-id" },
            measureMode: "standard",
          },
        },
      ],
      customerInfo: VALID_CUSTOMER,
    });

    expect(res.status()).toBe(409);
    expect(JSON.stringify(await res.json())).toMatch(/not offered/i);
  });

  test("malformed and incomplete requests are refused with 400, never 500", async ({ request }) => {
    const malformed = await request.post("/api/checkout/create-session", {
      data: "this is not json",
      headers: { "Content-Type": "application/json" },
      failOnStatusCode: false,
    });
    expect(malformed.status()).toBe(400);

    const noCustomer = await postCheckout(request, {
      items: [{ cartId: "x", id: "p1", name: "Item", price: 1, qty: 1, type: "rtw" }],
    });
    expect(noCustomer.status()).toBe(400);
    expect(JSON.stringify(await noCustomer.json())).toMatch(/customer/i);

    const badEmail = await postCheckout(request, {
      items: [{ cartId: "x", id: "p1", name: "Item", price: 1, qty: 1, type: "rtw" }],
      customerInfo: { ...VALID_CUSTOMER, email: "not-an-email" },
    });
    expect(badEmail.status()).toBe(400);

    const emptyCart = await postCheckout(request, { items: [], customerInfo: VALID_CUSTOMER });
    expect(emptyCart.status()).toBe(400);
  });
});

test.describe("consultation PII", () => {
  test("the public consultation endpoint exposes no listing", async ({ request }) => {
    const res = await request.get("/api/consultation", { failOnStatusCode: false });

    // Whatever the status, it must never be a 200 array of leads.
    if (res.ok()) {
      const body = await res.text();
      expect(
        body.trim().startsWith("["),
        "GET /api/consultation must not return a list of consultation records"
      ).toBeFalsy();
    } else {
      expect([401, 404, 405]).toContain(res.status());
    }
  });

  test("the admin consultations listing is gated", async ({ request }) => {
    const res = await request.get("/api/admin/consultations", { failOnStatusCode: false });
    expect(res.status()).toBe(401);
  });
});

test.describe("builder slug integrity", () => {
  test("an unknown builder slug 404s instead of selling a $0-base garment", async ({ page }) => {
    const res = await page.goto("/builder/suit", { waitUntil: "domcontentloaded" });
    expect(res?.status(), "/builder/suit must not render a priced builder").toBe(404);
  });

  test("a real builder slug still renders", async ({ page }) => {
    const res = await page.goto("/builder/suit-3pc", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
  });

  test("no page links to the non-existent /builder/suit", async ({ page }) => {
    await page.goto("/collections", { waitUntil: "domcontentloaded" });
    const bad = await page.locator('a[href="/builder/suit"]').count();
    expect(bad).toBe(0);
  });
});
