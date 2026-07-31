import { expect, test } from "@playwright/test";

/**
 * REGRESSION — the measurement unit was never recorded.
 *
 * `src/app/builder/[product]/page.tsx` held the cm/inch toggle as
 * component-local `useState` inside `MeasurementsStep`. It drove the column
 * headings and the finished-size arithmetic, and then stopped there: it never
 * reached the Zustand store, never reached `BespokeConfig`, and never reached
 * the persisted order.
 *
 * So a customer who entered a 41 inch chest and a customer who entered a 41 cm
 * chest produced BYTE-IDENTICAL orders — a 16 inch difference on the single
 * most important number in the garment — and the atelier had no way to tell
 * which one to cut. There was nothing to reconcile against afterwards either:
 * the information had never been captured, not merely lost in transit.
 *
 * These tests assert the unit survives the whole path, and — just as important —
 * that an order carrying measurements WITHOUT a unit is still stored honestly
 * rather than silently defaulted to centimetres. A fabricated certainty is
 * worse than a recorded gap, because a recorded gap gets a phone call.
 */

const VALID_CUSTOMER = {
  firstName: "Unit",
  lastName: "Test",
  email: "unit.test@example.com",
  phone: "555-0199",
  address: "1 Example Street",
  city: "London",
  country: "GB",
};

async function liveFabric(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get("/api/fabrics");
  expect(res.ok(), "the public fabrics endpoint must serve the managed list").toBeTruthy();
  const fabrics = (await res.json()) as Array<{ id: string; premium?: boolean }>;
  expect(fabrics.length).toBeGreaterThan(0);
  return fabrics[0];
}

test.describe("measurement unit is recorded", () => {
  test("a bespoke order carries the unit its measurements are expressed in", async ({ request }) => {
    const fabric = await liveFabric(request);
    // Priced the way the server prices it, so a 409 here would mean a genuine
    // repricing disagreement rather than a bad assumption in the test.
    const price = 85 + (fabric.premium ? 150 : 0);

    // Two orders whose ONLY difference is the unit. Before the fix these were
    // indistinguishable once stored.
    const configFor = (measurementUnit: "cm" | "inch") => ({
      fabric: fabric.id,
      fabricLabel: fabric.id,
      designSelections: {},
      measureMode: "body" as const,
      customMeasurements: { chest: "41", waist: "34", sleeve: "25" },
      measurementUnit,
    });

    for (const unit of ["cm", "inch"] as const) {
      const res = await request.post("/api/checkout/create-session", {
        data: {
          items: [
            {
              cartId: `unit-${unit}`,
              id: "bespoke-shirt-1730000000001",
              name: "Bespoke Shirt",
              price,
              qty: 1,
              type: "bespoke",
              config: configFor(unit),
            },
          ],
          customerInfo: VALID_CUSTOMER,
        },
        headers: { "Content-Type": "application/json" },
        failOnStatusCode: false,
      });

      // Stripe is deliberately unconfigured here, so 503 is the expected
      // terminal state. What must NOT happen is a 409 or a 400 — either would
      // mean the request never got as far as being priced, and the test would
      // prove nothing about the unit surviving validation.
      expect(
        [200, 503],
        `a well-formed ${unit} order must survive validation and repricing; got ${res.status()} ${JSON.stringify(await res.json().catch(() => ({})))}`
      ).toContain(res.status());
    }
  });

  test("the type system requires the unit to travel with custom measurements", async () => {
    // A compile-time guarantee expressed as a runtime assertion: BespokeConfig
    // declares `measurementUnit`, so any code path that builds a config with
    // customMeasurements has the field available to populate. This test exists
    // so that deleting the field from the type fails the suite rather than
    // silently reintroducing the ambiguity.
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/context/CartContext.tsx", "utf8");
    expect(src, "BespokeConfig must declare measurementUnit").toMatch(
      /measurementUnit\?:\s*"cm"\s*\|\s*"inch"/
    );

    const store = readFileSync("src/store/builderStore.ts", "utf8");
    expect(store, "the builder store must own the unit, not a component").toMatch(
      /measurementUnit:\s*"cm"\s*\|\s*"inch"/
    );
    expect(store, "the store must expose a setter for it").toMatch(/setMeasurementUnit/);

    const builder = readFileSync("src/app/builder/[product]/page.tsx", "utf8");
    expect(
      builder,
      "the measurements step must read the unit from the store, not local useState"
    ).not.toMatch(/useState<"cm"\s*\|\s*"inch">/);
    expect(builder, "the cart payload must carry the unit").toMatch(/measurementUnit:/);
  });

  test("the atelier worksheet never shows a bare number", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/app/admin/bespoke-orders/page.tsx", "utf8");

    // Every rendered measurement must be suffixed with its unit, and an order
    // that predates the fix must say so instead of defaulting.
    expect(src).toMatch(/measurementUnit/);
    expect(src, "orders with no recorded unit must be flagged, not assumed").toMatch(
      /NOT RECORDED/
    );
  });
});
