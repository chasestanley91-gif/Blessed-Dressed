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
 * REGRESSION GUARD — BUG F1 is fixed (2026-09-29). This test used to run under
 * `test.fail()`, pinned to the broken behavior; it now asserts the fix holds.
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("fabric-selection gate", () => {
  /**
   * BUG F1 (fixed) — the builder used to start with a phantom fabric already
   * selected. `src/store/builderStore.ts` initialised `fabric: "navy-herringbone"`
   * (and the reset matched) — an id from the *bundled fallback* list in
   * src/data/builder.ts that does not exist in the admin-managed catalog served
   * by /api/fabrics. That meant:
   *
   *   - the step-2 gate `disabled={activeStep === 2 && !fabric}` never engaged,
   *     and a customer could skip fabric selection entirely;
   *   - review rendered the raw string "navy-herringbone" instead of a real
   *     fabric label; and
   *   - that same string reached /api/checkout/create-session, which 409'd with
   *     "unknown fabric" and no customer-facing way to recover.
   *
   * Fixed by initialising `fabric: ""` / `fabricPremium: false` in both the
   * initial state and `resetBuilder`. This guard checks both halves: the gate
   * blocks an empty selection, and picking a real fabric clears the gate and
   * carries the real id all the way to review — never the phantom string.
   */
  test("no fabric is pre-selected, and Continue is gated until one is chosen", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const managed: { id: string; label: string }[] = await (
      await request.get("/api/fabrics")
    ).json();

    await page.goto("/builder/shirt");
    await page.getByRole("button", { name: /Show all fabrics/i }).click();
    await expect(page.locator(FABRIC_CARD).first()).toBeVisible();

    const continueButton = page.getByRole("button", { name: /^Continue$/ });

    // Nothing chosen yet, so the step must not be passable.
    await expect(
      continueButton,
      "a customer can advance past fabric selection without choosing a fabric"
    ).toBeDisabled();

    // Pick the first real, managed fabric. The gate must now release.
    const firstCard = page.locator(FABRIC_CARD).first();
    const chosenLabel = await firstCard.locator("h3").first().textContent();
    await firstCard.click();
    await expect(continueButton).toBeEnabled();

    for (let step = 2; step < 8; step++) {
      await page.getByRole("button", { name: /^Continue$/ }).click();
    }

    await expect(
      page.getByText("navy-herringbone", { exact: true }),
      'the phantom fallback fabric id must never reach order review'
    ).toHaveCount(0);
    if (chosenLabel) {
      await expect(
        page.getByText(chosenLabel.trim(), { exact: true }).first(),
        "the real chosen fabric's label should appear in order review"
      ).toBeVisible();
    }
    expect(
      managed.map((f) => f.id),
      "sanity: the phantom id should still not be in the managed catalog"
    ).not.toContain("navy-herringbone");
  });
});
