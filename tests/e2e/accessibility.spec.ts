import { expect, test } from "@playwright/test";

/**
 * REGRESSION — accessibility defects found in the 2026-07-30 audit.
 *
 * These are structural, not cosmetic. Each one removes a control or a piece of
 * information from someone who navigates by keyboard or screen reader:
 *
 *  - `OptionCard` rendered a `<div role="button" tabIndex={0}>` INSIDE a
 *    `<button>`. Interactive content inside a button is invalid HTML; the
 *    accessibility tree collapses the inner control into the outer one, so the
 *    expand action was announced as part of the select action and Tab could not
 *    reach it at all.
 *  - Every checkout input was unlabelled (no `htmlFor`, no `aria-label`) and
 *    carried no `autoComplete` token, so a screen reader announced seven
 *    identical "edit text" fields and no browser or password manager could fill
 *    a single one.
 */

test.describe("no nested interactive controls", () => {
  test("a button never contains another button or a role=button", async ({ page }) => {
    await page.goto("/builder/shirt", { waitUntil: "domcontentloaded" });

    const nested = await page.evaluate(() => {
      const bad: string[] = [];
      for (const btn of Array.from(document.querySelectorAll("button"))) {
        const inner = btn.querySelectorAll(
          'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (inner.length > 0) {
          bad.push(
            `${btn.getAttribute("id") ?? btn.className.slice(0, 40)} contains ${inner.length} interactive descendant(s): ` +
              Array.from(inner)
                .map((n) => n.tagName.toLowerCase() + (n.getAttribute("role") ? `[role=${n.getAttribute("role")}]` : ""))
                .join(", ")
          );
        }
      }
      return bad;
    });

    expect(nested, "interactive content inside a <button> is invalid and unreachable by keyboard").toEqual([]);
  });
});

test.describe("checkout form is operable", () => {
  test("every input has a programmatic label and an autocomplete token", async ({ page }) => {
    // An empty cart renders the empty state, not the form — seed one item first,
    // or this test passes by finding nothing to check.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem(
        "bd_cart",
        JSON.stringify([
          {
            cartId: "a11y-fixture",
            id: "a11y-fixture",
            name: "Accessibility fixture",
            price: 100,
            qty: 1,
            type: "product",
            size: "M",
          },
        ])
      );
    });
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("input", { timeout: 15_000 });

    const problems = await page.evaluate(() => {
      const bad: string[] = [];
      const inputs = Array.from(document.querySelectorAll("input")).filter(
        (i) => !["hidden", "submit", "button"].includes(i.type)
      );
      for (const input of inputs) {
        const id = input.id;
        const labelled =
          (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
          input.getAttribute("aria-label") ||
          input.getAttribute("aria-labelledby") ||
          input.closest("label");
        if (!labelled) bad.push(`input#${id || "(no id)"} has no programmatic label`);
        if (!input.getAttribute("autocomplete")) {
          bad.push(`input#${id || "(no id)"} has no autocomplete token`);
        }
      }
      return { bad, count: inputs.length };
    });

    expect(problems.count, "the checkout form should have rendered its fields").toBeGreaterThan(0);
    expect(problems.bad).toEqual([]);
  });
});

test.describe("skip link", () => {
  test("the first tab stop is a skip link that targets real content", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Tab");

    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement | null;
      if (!el) return null;
      const href = el.getAttribute("href") ?? "";
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? "").trim(),
        href,
        targetExists: href.startsWith("#") ? !!document.querySelector(href) : false,
      };
    });

    expect(focused?.tag).toBe("a");
    expect(focused?.text).toMatch(/skip to content/i);
    expect(focused?.targetExists, "the skip link must point at an element that exists").toBe(true);
  });
});
