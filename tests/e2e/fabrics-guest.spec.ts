import { expect, test } from "@playwright/test";
// Relative, not `@/data/builder`: this is the *bundled fallback* list compiled
// into the client bundle, and the whole point of these tests is that a customer
// must never be shown it in place of the admin-managed catalog.
import { fabrics as bundledFallbackFabrics } from "../../src/data/builder";

/**
 * REGRESSION — "guest sees the admin-managed fabrics" (repaired 2026-07-30).
 *
 * The builder used to fetch `/api/admin/fabrics`. `src/proxy.ts` gates every
 * `/api/admin/*` route, so a signed-out customer got:
 *
 *     401  {"error":"Unauthorized"}
 *
 * The client then did `if (!adminFabrics?.length) return`. A plain object has no
 * `.length`, so the guard was truthy-falsy in exactly the wrong direction: it
 * returned early, no error surfaced, no retry banner appeared — and every
 * customer silently browsed the 12 hardcoded fabrics from src/data/builder.ts
 * instead of the merchandised list. A silent failure, not a loud one, which is
 * why it survived so long.
 *
 * The fix added the ungated `/api/fabrics`. These tests pin all three halves of
 * that: the public endpoint works for guests, the admin endpoint is still gated
 * (so the bug's precondition is real, not imagined), and the UI actually renders
 * what the public endpoint returned.
 *
 * Nothing below hardcodes a fabric count or a fabric name — expectations are
 * derived from whatever the running app serves.
 */

/** Fabric cards in step 2 carry a "Premium"/"Classic" eyebrow above an <h3>. */
const FABRIC_CARD =
  'button:has(p:text-is("Premium")), button:has(p:text-is("Classic"))';

test.describe("public fabric catalog — guest access", () => {
  test("GET /api/fabrics is ungated and returns the managed fabric array", async ({
    request,
  }) => {
    const res = await request.get("/api/fabrics");

    expect(res.status(), "the public fabric endpoint must not be auth-gated").toBe(200);

    const body = await res.json();
    expect(Array.isArray(body), "/api/fabrics must return a JSON array").toBe(true);
    expect(body.length, "a storefront with zero fabrics cannot take an order").toBeGreaterThan(0);

    // Shape check — the builder maps over exactly these fields.
    for (const fabric of body) {
      expect(fabric).toHaveProperty("id");
      expect(fabric).toHaveProperty("label");
      expect(typeof fabric.id).toBe("string");
      expect(typeof fabric.label).toBe("string");
      expect(fabric.id.length).toBeGreaterThan(0);
      expect(fabric.label.length).toBeGreaterThan(0);
    }

    // ids must be unique, otherwise selecting a fabric is ambiguous
    const ids = body.map((f: { id: string }) => f.id);
    expect(new Set(ids).size, "duplicate fabric ids").toBe(ids.length);
  });

  test("GET /api/admin/fabrics still rejects guests, and its body has no .length", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/fabrics");

    expect(res.status(), "the admin fabric endpoint must stay gated").toBe(401);

    // This is the exact mechanic that made the original bug silent. If a future
    // refactor ever returns an *array* from the 401 path, `!adminFabrics?.length`
    // would start behaving differently and this comment stops being true — so we
    // pin it rather than trusting it.
    const body = await res.json();
    expect(Array.isArray(body), "a 401 body must not be array-shaped").toBe(false);
    expect(
      (body as { length?: unknown }).length,
      "the 401 body has no .length — which is why `if (!x?.length) return` swallowed it"
    ).toBeUndefined();
  });

  test("the builder renders the fabrics from the PUBLIC endpoint, not the bundled fallback", async ({
    page,
    request,
  }) => {
    // Source of truth: whatever the app serves guests right now.
    const managed: { id: string; label: string }[] = await (
      await request.get("/api/fabrics")
    ).json();
    const managedLabels = managed.map((f) => f.label);

    await page.goto("/builder/shirt");

    // Step 2 opens on the fabric discovery funnel; skip it to reach the grid.
    await page.getByRole("button", { name: /Show all fabrics/i }).click();

    const cards = page.locator(FABRIC_CARD);
    await expect(cards.first()).toBeVisible();

    // 1. Exactly the managed set is rendered — no more, no fewer.
    await expect(
      cards,
      "the builder must render one card per fabric returned by /api/fabrics"
    ).toHaveCount(managed.length);

    const renderedLabels = (await cards.locator("h3").allTextContents()).map((t) => t.trim());
    expect(renderedLabels.slice().sort()).toEqual(managedLabels.slice().sort());

    // 2. The regression itself: nothing that exists ONLY in the compiled-in
    //    fallback may reach the customer. If the builder ever falls back again,
    //    these labels reappear and this fails.
    const fallbackOnlyLabels = bundledFallbackFabrics
      .map((f) => f.label)
      .filter((label) => !managedLabels.includes(label));

    expect(
      fallbackOnlyLabels.length,
      "sanity: the bundled fallback must differ from the managed list, or this " +
        "test cannot distinguish the two and proves nothing"
    ).toBeGreaterThan(0);

    for (const label of fallbackOnlyLabels) {
      await expect(
        page.getByText(label, { exact: true }),
        `bundled fallback fabric "${label}" leaked into the customer builder`
      ).toHaveCount(0);
    }
  });

  test("selecting a fabric records the managed label and carries it to review", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const managed: { id: string; label: string }[] = await (
      await request.get("/api/fabrics")
    ).json();

    await page.goto("/builder/shirt");
    await page.getByRole("button", { name: /Show all fabrics/i }).click();

    const cards = page.locator(FABRIC_CARD);
    await expect(cards.first()).toBeVisible();

    // Pick the first rendered card, whatever it is, so the test survives
    // reordering and re-merchandising.
    const chosen = (await cards.first().locator("h3").textContent())?.trim();
    expect(managed.map((f) => f.label)).toContain(chosen);

    await cards.first().click();

    // The selected card is the one marked selected — proves the click reached
    // the store rather than just toggling a hover class.
    await expect(cards.first().getByText("✓")).toBeVisible();

    // Walk to review (step 8) and confirm the *label* survived, not a raw id.
    const continueButton = page.getByRole("button", { name: /^Continue$/ });
    for (let step = 2; step < 8; step++) await continueButton.click();

    await expect(page.getByRole("heading", { name: /Review your order/i })).toBeVisible();
    await expect(page.getByText(chosen!, { exact: true }).first()).toBeVisible();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
 * KNOWN DEFECT — the assertion is correct and currently FAILS. `test.fail()`
 * runs it at full strength; it is not weakened and not skipped.
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("known fabric-selection defect", () => {
  /**
   * BUG F1 — the builder starts with a phantom fabric already selected.
   *
   * `src/store/builderStore.ts:123` (and the reset at :240) initialise
   * `fabric: "navy-herringbone"` — an id from the *bundled fallback* list in
   * src/data/builder.ts. It does not exist in the admin-managed catalog served
   * by /api/fabrics, so:
   *
   *   - the step-2 gate `disabled={activeStep === 2 && !fabric}` never engages,
   *     and a customer can skip fabric selection entirely;
   *   - no fabric card is highlighted, so the UI shows "nothing chosen" while
   *     the store says otherwise;
   *   - review renders `activeFabrics.find(f => f.id === fabric)?.label ?? fabric`,
   *     i.e. the raw string "navy-herringbone"; and
   *   - that same string lands in the cart as `config.fabricLabel` and is sent
   *     to /api/checkout/create-session — a real order naming a fabric the
   *     atelier does not stock.
   *
   * This is the last residue of the /api/admin/fabrics regression: the default
   * still points into the fallback list that customers were never meant to see.
   * Fix by initialising `fabric: ""` so the Continue gate does its job.
   */
  test.fail(
    "[KNOWN BUG] no fabric is pre-selected, and Continue is gated until one is chosen",
    async ({ page, request }) => {
      test.setTimeout(120_000);

      const managed: { id: string; label: string }[] = await (
        await request.get("/api/fabrics")
      ).json();

      await page.goto("/builder/shirt");
      await page.getByRole("button", { name: /Show all fabrics/i }).click();
      await expect(page.locator(FABRIC_CARD).first()).toBeVisible();

      // Nothing chosen yet, so the step must not be passable.
      await expect(
        page.getByRole("button", { name: /^Continue$/ }),
        "a customer can advance past fabric selection without choosing a fabric"
      ).toBeDisabled();

      // Second proof, reachable only because the gate above is broken: walking
      // straight to review surfaces a fabric the catalog does not offer.
      const continueButton = page.getByRole("button", { name: /^Continue$/ });
      for (let step = 2; step < 8; step++) await continueButton.click();

      for (const phantom of ["navy-herringbone"]) {
        expect(
          managed.map((f) => f.id),
          "sanity: the default fabric id should not be in the managed catalog"
        ).not.toContain(phantom);
        await expect(
          page.getByText(phantom, { exact: true }),
          `raw fabric id "${phantom}" leaked into the order review`
        ).toHaveCount(0);
      }
    }
  );
});
