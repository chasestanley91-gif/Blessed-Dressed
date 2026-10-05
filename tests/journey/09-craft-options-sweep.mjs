import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3100';
const RUN_DIR = '.ai-team/runs/BD-JOURNEY-001';
const PRODUCTS = ['shirt', 'trousers', 'vest', 'suit-2pc', 'suit-3pc', 'sport-coat'];

async function priceText(page) {
  return page.locator('span:text-is("Est. Total")').locator('xpath=following-sibling::span').first().textContent().catch(() => null);
}

async function main() {
  const browser = await chromium.launch();
  const results = {};

  for (const product of PRODUCTS) {
    const page = await browser.newContext().then((c) => c.newPage());
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

    const productResult = { tabs: [] };
    try {
      await page.goto(`${BASE}/builder/${product}`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Show all fabrics/i }).click().catch(() => {});
      await page.waitForTimeout(300);
      await page.locator('button:has(p:text-is("Premium")), button:has(p:text-is("Classic"))').first().click();
      await page.waitForTimeout(200);
      await page.getByRole('button', { name: /^Continue$/ }).click(); // -> Style
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /^Continue$/ }).click(); // -> Design
      await page.waitForTimeout(400);

      const tabContainer = page.locator('div.flex.flex-wrap.gap-2').first();
      const tabCount = await tabContainer.locator('button').count();

      for (let i = 0; i < tabCount; i++) {
        // Re-query fresh each iteration -- the DOM re-renders after each click.
        const tab = tabContainer.locator('button').nth(i);
        const tabLabel = (await tab.textContent())?.trim() ?? `tab-${i}`;
        await tab.click();
        await page.waitForTimeout(300);

        const noOptions = (await page.getByText(/No options found for this section/i).count()) > 0;

        // Field-card options live in the sibling container, not inside the
        // tab bar itself -- exclude the tab container's own buttons.
        const fieldButtons = page.locator('div.space-y-6 button');
        const fieldCount = await fieldButtons.count();
        let selectedOne = false;
        let priceAfter = null;
        if (fieldCount > 0) {
          await fieldButtons.first().click().catch(() => {});
          await page.waitForTimeout(250);
          selectedOne = true;
          priceAfter = await priceText(page);
        }

        productResult.tabs.push({
          label: tabLabel,
          noOptionsFound: noOptions,
          fieldOptionCount: fieldCount,
          selectedOne,
          priceAfter,
          priceLooksValid: priceAfter ? /^\$[\d,]+$/.test(priceAfter) : null,
        });
      }

      await page.screenshot({ path: `${RUN_DIR}/screenshots/desktop/craft-sweep-${product}.png`, fullPage: true }).catch(() => {});
    } catch (e) {
      productResult.error = e.message;
    }
    productResult.consoleErrors = consoleErrors;
    results[product] = productResult;
    const badPrices = productResult.tabs.filter((t) => t.priceLooksValid === false).map((t) => t.label);
    console.log(`[${product}] tabs=${productResult.tabs.length} noOptionsFound=${JSON.stringify(productResult.tabs.filter(t=>t.noOptionsFound).map(t=>t.label))} badPrices=${JSON.stringify(badPrices)} errors=${consoleErrors.length}`);
    await page.context().close();
  }

  await browser.close();
  fs.writeFileSync(`${RUN_DIR}/craft-options-sweep-findings.json`, JSON.stringify(results, null, 2));
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
