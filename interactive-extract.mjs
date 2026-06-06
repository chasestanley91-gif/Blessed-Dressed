// interactive-extract.mjs — open browser, auto-extract when Design Details page loads
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");

const USER = "LT-BLESSED";
const PASS = "20260311Sa#";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";

// BD = Men's trousers, BV = Vest
const TARGETS = [
  { label: "vest", mtypb: "BV", url: `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=BV&categoryName=&sexty=1` },
];

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForDesignDetails(page, timeoutMs = 300000) {
  console.log("  Polling for Design Details (data-part-item='X' elements)...");
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const count = await page.evaluate(() =>
      document.querySelectorAll("[data-part-item='X']").length
    );
    if (count >= 3) {
      console.log(`  Found ${count} design option fields — ready to extract!`);
      return count;
    }
    process.stdout.write(`\r  Waiting... (${count} fields found, ${Math.round((Date.now()-start)/1000)}s elapsed)`);
    await delay(2000);
  }
  return 0;
}

async function clickHideIfPresent(page) {
  const result = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll("button, div, span, a"));
    const hideBtn = allEls.find(el => {
      const t = el.textContent.trim();
      return (t === "Hide" || t === "HIDE") && el.offsetParent !== null;
    });
    if (hideBtn) { hideBtn.click(); return { found: true, text: hideBtn.textContent.trim() }; }
    return { found: false };
  });
  if (result.found) {
    console.log(`\n  Clicked Hide button`);
    await delay(2000);
  }
  return result.found;
}

async function extractDesignOptions(page) {
  return page.evaluate(() => {
    const partItems = Array.from(document.querySelectorAll("[data-part-item='X']"));
    if (partItems.length === 0) {
      return { count: 0, rows: [] };
    }

    const rows = [];
    const seen = new Set();
    partItems.forEach(row => {
      const fieldCode = row.getAttribute("name") || "";
      if (!fieldCode || seen.has(fieldCode)) return;
      seen.add(fieldCode);

      const labelEl = row.querySelector("[class*='Label'], [class*='label']") || row.querySelector("span, label");
      const fieldLabel = labelEl?.textContent?.trim() || fieldCode;

      const optContainer = document.querySelector(`[data-part-item-opt='X'][name='${fieldCode}']`);
      if (!optContainer) return;

      const optTiles = Array.from(optContainer.querySelectorAll("[data-value]"));
      const options = optTiles.map(tile => {
        const value = tile.getAttribute("data-value") || "";
        const img = tile.querySelector("img");
        let imgUrl = img?.getAttribute("src") || img?.getAttribute("data-src") || "";
        if (imgUrl && !imgUrl.startsWith("http")) imgUrl = "https://mtm.baoxiniao.co" + imgUrl;
        return { v: value, i: imgUrl };
      }).filter(o => o.v);

      if (options.length > 0) rows.push({ f: fieldCode, l: fieldLabel, o: options });
    });

    return { count: partItems.length, rows };
  });
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false,
    args: ["--no-sandbox", "--window-size=1400,900", "--window-position=0,0"],
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();

    // Login
    console.log("Logging in...");
    await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="text"]', USER);
    await page.type('input[type="password"]', PASS);
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    console.log("Logged in:", page.url());

    for (const { label, mtypb, url } of TARGETS) {
      console.log(`\n=== ${label} (${mtypb}) ===`);
      console.log(`Navigating to order creation page...`);
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});

      console.log(`\n>>> BROWSER IS OPEN <<<`);
      console.log(`>>> Navigate through the order steps to reach Design Details <<<`);
      console.log(`>>> (the page with all the style options and a 'Hide' button) <<<`);
      console.log(`>>> Script will auto-detect and extract when ready <<<\n`);

      // Wait up to 5 minutes for user to navigate to Design Details
      const fieldCount = await waitForDesignDetails(page, 300000);

      if (fieldCount === 0) {
        console.log(`\n  Timed out waiting for ${label}. Skipping.`);
        continue;
      }

      // Click Hide to reveal all hidden fields
      await clickHideIfPresent(page);
      await delay(1000);

      // Wait for any newly revealed fields
      const afterHide = await waitForDesignDetails(page, 5000).catch(() => fieldCount);
      console.log(`\n  Extracting ${afterHide} fields...`);

      const extracted = await extractDesignOptions(page);

      if (!extracted.rows || extracted.rows.length === 0) {
        console.log(`  No options extracted (${extracted.count} fields found but none with options).`);
        continue;
      }

      const catDir = path.join(OUT_DIR, label);
      mkdirSync(catDir, { recursive: true });
      const outPath = path.join(catDir, "design-options-full.json");
      writeFileSync(outPath, JSON.stringify(extracted.rows, null, 2));

      let totalOpts = 0, withImg = 0;
      extracted.rows.forEach(f => {
        totalOpts += f.o.length;
        f.o.forEach(o => { if (o.i) withImg++; });
      });
      console.log(`  Saved ${extracted.rows.length} fields, ${totalOpts} options (${withImg} with images)`);
      console.log(`  -> ${outPath}`);

      // Show sample
      extracted.rows.slice(0, 5).forEach(f => console.log(`    ${f.f} (${f.l}): ${f.o.length} opts`));

      console.log(`\n  ${label} DONE. Moving to next category in 5s...`);
      await delay(5000);
    }

    console.log("\nAll done! Close the browser window to exit.");
    await delay(10000);

  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
