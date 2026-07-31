import { expect, test } from "@playwright/test";

/**
 * REGRESSION — the storefront at 375px, the width of the phone most customers
 * will actually hold.
 *
 * Two defects this guards against, both of which make the page unusable rather
 * than merely ugly:
 *
 *  1. **The page itself scrolling sideways.** A single element wider than the
 *     viewport drags the whole document with it, so every vertical scroll also
 *     drifts horizontally and the layout never sits still. Wide content —
 *     tables in particular — has to scroll inside its own container.
 *  2. **Form controls under 16px.** iOS Safari force-zooms the page when one
 *     receives focus and does not zoom back out, stranding the customer on a
 *     panned page mid-checkout with the field they were typing into off screen.
 */

const PHONE = { width: 375, height: 812 };

test.use({ viewport: PHONE });

const PUBLIC_ROUTES = ["/", "/products", "/collections", "/builder", "/builder/shirt", "/fabric-book"];

test.describe("375px layout", () => {
  for (const path of PUBLIC_ROUTES) {
    test(`${path} does not scroll the document sideways`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Let any client-side layout settle before measuring.
      await page.waitForTimeout(400);

      const overflow = await page.evaluate((vw) => {
        const doc = document.documentElement;
        if (doc.scrollWidth <= vw + 1) return null;

        // Name the widest offender rather than just failing — "something is too
        // wide" is not actionable on a page with hundreds of nodes.
        let worst: { tag: string; cls: string; width: number } | null = null;
        for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
          const r = el.getBoundingClientRect();
          if (r.width > vw + 1 && (!worst || r.width > worst.width)) {
            worst = {
              tag: el.tagName.toLowerCase(),
              cls: (el.className || "").toString().slice(0, 80),
              width: Math.round(r.width),
            };
          }
        }
        return { scrollWidth: doc.scrollWidth, viewport: vw, worst };
      }, PHONE.width);

      expect(
        overflow,
        overflow
          ? `document is ${overflow.scrollWidth}px wide in a ${overflow.viewport}px viewport; widest element: ${overflow.worst?.tag}.${overflow.worst?.cls} at ${overflow.worst?.width}px`
          : ""
      ).toBeNull();
    });
  }

  test("every table can be reached by scrolling its own container", async ({ page }) => {
    await page.goto("/builder/shirt", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const unscrollable = await page.evaluate(() => {
      const bad: string[] = [];
      for (const table of Array.from(document.querySelectorAll("table"))) {
        const parent = table.parentElement;
        if (!parent) continue;
        const overflowX = getComputedStyle(parent).overflowX;
        const overflows = table.scrollWidth > parent.clientWidth + 1;
        // A wide table in a clipped or visible container is unreachable.
        if (overflows && overflowX !== "auto" && overflowX !== "scroll") {
          bad.push(`table ${table.scrollWidth}px inside a ${parent.clientWidth}px parent with overflow-x:${overflowX}`);
        }
      }
      return bad;
    });

    expect(unscrollable, "a wide table must scroll inside its own container, never be clipped").toEqual([]);
  });
});

test.describe("form controls do not trigger iOS zoom", () => {
  test("checkout inputs compute to at least 16px on a coarse pointer", async ({ browser }) => {
    // The rule is scoped to `@media (pointer: coarse)`, so the emulated context
    // has to actually report a touch device — a plain narrow viewport does not.
    const context = await browser.newContext({
      viewport: PHONE,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem(
        "bd_cart",
        JSON.stringify([
          { cartId: "mobile-fixture", id: "mobile-fixture", name: "Mobile fixture", price: 100, qty: 1, type: "product", size: "M" },
        ])
      );
    });
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("input", { timeout: 15_000 });

    const tooSmall = await page.evaluate(() => {
      const bad: string[] = [];
      const controls = [
        ...Array.from(document.querySelectorAll("input")).filter(
          (i) => !["hidden", "submit", "button", "checkbox", "radio", "range"].includes(i.type)
        ),
        ...Array.from(document.querySelectorAll("select, textarea")),
      ];
      for (const el of controls) {
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 16) bad.push(`${el.tagName.toLowerCase()}#${(el as HTMLElement).id || "(no id)"} at ${size}px`);
      }
      return { bad, count: controls.length };
    });

    expect(tooSmall.count, "the checkout form should have rendered its fields").toBeGreaterThan(0);
    expect(tooSmall.bad, "a control under 16px force-zooms iOS Safari and never zooms back").toEqual([]);

    await context.close();
  });
});
