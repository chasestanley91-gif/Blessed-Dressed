// scrape-step3.mjs — navigate all steps and extract design options for BT, BS, BV
import puppeteer from "puppeteer-core";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");

const USER = "LT-BLESSED";
const PASS = "20260311Sa#";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Click element by text content
async function clickByText(page, text) {
  return page.evaluate(t => {
    const els = Array.from(document.querySelectorAll("div, button, li, span"));
    const el = els.find(e => e.textContent.trim() === t && e.offsetParent !== null);
    if (el) { el.click(); return true; }
    return false;
  }, text);
}

// Wait for selector or timeout
async function waitForOrContinue(page, selector, timeout = 5000) {
  return page.waitForSelector(selector, { timeout }).catch(() => null);
}

// Extract design options from Design Details DOM
async function extractDesignOptions(page, mtypb) {
  // First click Hide button to reveal all fields
  const hideClicked = await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll("button, div, span, a"));
    // Look for "Hide" button - usually has class or near search area
    const hideBtn = allBtns.find(el => {
      const t = el.textContent.trim();
      return (t === "Hide" || t === "HIDE" || t === "隐藏") && el.offsetParent !== null;
    });
    if (hideBtn) { hideBtn.click(); return { found: true, text: hideBtn.textContent }; }
    return { found: false };
  });
  if (hideClicked.found) {
    console.log("    Clicked Hide:", hideClicked.text);
    await delay(2000);
  } else {
    console.log("    Hide button not found");
  }

  // Wait for design options to load
  await delay(3000);

  // Extract all design option rows
  // DOM structure: div[data-part-item='X'][name='FIELDCODE'] = field row
  //                div[data-part-item-opt='X'][name='FIELDCODE'] = option container
  //                div[data-value='VALUE'] > img = option tile
  const result = await page.evaluate((mtypb) => {
    const rows = [];
    // Field rows use data-part-item='X' (literal) with name=FIELDCODE
    const partItems = Array.from(document.querySelectorAll("[data-part-item='X']"));

    if (partItems.length === 0) {
      const altItems = Array.from(document.querySelectorAll("[class*='hPartItem'], [class*='partItem']"));
      return { partItems: 0, altItems: altItems.length, pageText: document.body.innerText.slice(0, 500) };
    }

    partItems.forEach(row => {
      // Field code is in 'name' attribute
      const fieldCode = row.getAttribute("name") || "";
      if (!fieldCode) return;

      // Field label: look for .hPartItemLabel or similar
      const labelEl = row.querySelector("[class*='Label'], [class*='label']") ||
                      row.querySelector("span, label");
      const fieldLabel = labelEl?.textContent?.trim() || fieldCode;

      // Option container: data-part-item-opt='X' with same name
      const optContainer = document.querySelector(`[data-part-item-opt='X'][name='${fieldCode}']`);
      if (!optContainer) return;

      // All option tiles inside the container
      const optTiles = Array.from(optContainer.querySelectorAll("[data-value]"));
      const options = optTiles.map(tile => {
        const value = tile.getAttribute("data-value") || "";
        const img = tile.querySelector("img");
        let imgUrl = img?.getAttribute("src") || img?.getAttribute("data-src") || "";
        if (imgUrl && !imgUrl.startsWith("http")) {
          imgUrl = "https://mtm.baoxiniao.co" + imgUrl;
        }
        return { v: value, i: imgUrl };
      }).filter(o => o.v);

      if (options.length > 0) {
        rows.push({ f: fieldCode, l: fieldLabel, o: options });
      }
    });

    return { partItems: partItems.length, rows };
  }, mtypb);

  return result;
}

async function processCategory(page, catLabel, mtypb, extraSteps) {
  console.log(`\n===== ${catLabel} (${mtypb}) =====`);
  const catDir = path.join(OUT_DIR, catLabel);
  mkdirSync(catDir, { recursive: true });

  // Navigate to order creation
  const url = `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=${mtypb}&categoryName=&sexty=1`;
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 }).catch(e => console.log("  Nav error:", e.message));
  await delay(2000);

  // Wait for fabric tiles to load (up to 10s)
  await page.waitForFunction(
    () => document.querySelectorAll("[onclick*='selectFabric']").length > 0,
    { timeout: 10000 }
  ).catch(() => console.log("  No BXN fabric tiles appeared within 10s"));

  await page.screenshot({ path: path.join(catDir, `step3-step1.png`) });
  console.log(`  Step 1 loaded`);

  // === STEP 1: Fabric selection ===
  // Try BXN tiles first (visible fabric tiles in default BXN tab)
  const bxnTileCount = await page.evaluate(() =>
    document.querySelectorAll("[onclick*='selectFabric']").length
  );
  console.log(`  BXN tiles (all): ${bxnTileCount}`);

  let fabricSelected = false;

  if (bxnTileCount > 0) {
    // Click first visible BXN fabric tile
    fabricSelected = await page.evaluate(() => {
      const tile = document.querySelector("[onclick*='selectFabric']");
      if (tile) { tile.click(); return true; }
      return false;
    });
    console.log(`  Clicked BXN fabric tile: ${fabricSelected}`);
    await delay(1500);
  } else {
    // No BXN tiles — click NON-BXN tab (use onclick attribute directly)
    const nonBxnOk = await page.evaluate(() => {
      // selectYunYi(2,this) = NON-BXN
      const btn = document.querySelector("[onclick*='selectYunYi(2']");
      if (btn) { btn.click(); return true; }
      // Fallback: find by text
      const allDivs = Array.from(document.querySelectorAll("div"));
      const nb = allDivs.find(d => d.textContent.trim() === "NON-BXN");
      if (nb) { nb.click(); return true; }
      return false;
    });
    console.log(`  Clicked NON-BXN: ${nonBxnOk}`);
    await delay(2000);

    // Now check for tiles in NON-BXN mode
    const nonBxnInfo = await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll("[onclick*='selectFabric']"));
      return { count: tiles.length, first: tiles[0] ? { text: tiles[0].textContent.trim().slice(0, 60), dataValue: tiles[0].getAttribute("data-value") } : null };
    });
    console.log(`  NON-BXN tiles: ${nonBxnInfo.count}, first: ${JSON.stringify(nonBxnInfo.first)}`);

    if (nonBxnInfo.count > 0) {
      fabricSelected = await page.evaluate(() => {
        const tile = document.querySelector("[onclick*='selectFabric']");
        if (tile) { tile.click(); return true; }
        return false;
      });
      console.log(`  Clicked NON-BXN fabric tile: ${fabricSelected}`);
      await delay(1500);
    } else {
      // No tiles. Try:
      // 1. Trigger FABNO input event to enable NEXT STEP
      // 2. Or call App functions directly
      console.log("  No fabric tiles. Attempting NON-BXN form activation...");
      const bypassed = await page.evaluate(() => {
        // Try triggering input event on FABNO to signal fabric is set
        const fabnoInput = document.querySelector("input[name='FABNO']");
        if (fabnoInput) {
          fabnoInput.dispatchEvent(new Event("input", { bubbles: true }));
          fabnoInput.dispatchEvent(new Event("change", { bubbles: true }));
          fabnoInput.dispatchEvent(new Event("blur", { bubbles: true }));
        }
        // Try calling App.selectFabric with a mock element
        const nonBxnEl = document.querySelector("[onclick*='selectYunYi(2']");
        if (nonBxnEl && typeof App !== "undefined" && App.nextFabric) {
          App.nextFabric(); return "App.nextFabric";
        }
        // Try enabling NEXT STEP button
        const nextBtn = document.querySelector("[class*='hNextBtn']");
        if (nextBtn) {
          nextBtn.classList.add("hActive");
          nextBtn.click();
          return "forced nextBtn click";
        }
        return false;
      });
      console.log(`  Bypass result: ${bypassed}`);
    }
  }

  // Click NEXT STEP
  await delay(500);
  const nextStep1 = await clickByText(page, "NEXT STEP");
  console.log(`  NEXT STEP 1: ${nextStep1}`);
  await delay(3000);
  await page.screenshot({ path: path.join(catDir, `step3-after-step1.png`) });

  // Check if we advanced
  const afterStep1 = await page.evaluate(() => {
    const hActives = Array.from(document.querySelectorAll("[class*='hActive']")).map(el => el.textContent.trim().slice(0, 50)).filter(Boolean);
    const partItems = document.querySelectorAll("[data-part-item]").length;
    return { hActives, partItems };
  });
  console.log(`  After STEP1 -> hActive: ${JSON.stringify(afterStep1.hActives.slice(0, 5))}, partItems: ${afterStep1.partItems}`);

  if (afterStep1.partItems > 0) {
    // Reached Design Details directly (2-step flow)
    console.log("  On Design Details (2-step flow)!");
  } else {
    // Need to handle Step 2 (Pattern No)
    console.log("  On Step 2 — handling Pattern No...");
    await delay(2000);

    // Look for Pattern No options
    const step2 = await page.evaluate(() => {
      // Find any clickable items on this step
      const allClickable = Array.from(document.querySelectorAll("[onclick*='select'], [data-value], [class*='hImgBox']")).filter(el => el.offsetParent !== null);
      return allClickable.slice(0, 10).map(el => ({
        tag: el.tagName,
        onclick: el.getAttribute("onclick")?.slice(0, 80),
        dataValue: el.getAttribute("data-value"),
        class: el.className?.slice(0, 60),
        text: el.textContent.trim().slice(0, 50),
      }));
    });
    console.log(`  Step 2 clickable items (${step2.length}):`, JSON.stringify(step2.slice(0, 3)));

    await page.screenshot({ path: path.join(catDir, `step3-step2.png`) });

    // Look specifically for selectPattern items
    const patternItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll("[onclick*='selectPattern']"));
      return items.slice(0, 5).map(el => ({ text: el.textContent.trim().slice(0, 50), dataValue: el.getAttribute("data-value"), onclick: el.getAttribute("onclick")?.slice(0,60) }));
    });
    console.log(`  Pattern items (selectPattern): ${JSON.stringify(patternItems.slice(0, 3))}`);

    if (patternItems.length > 0) {
      const patternClicked = await page.evaluate(() => {
        const item = document.querySelector("[onclick*='selectPattern']");
        if (item) { item.click(); return { text: item.textContent.trim().slice(0, 50) }; }
        return null;
      });
      console.log(`  Clicked pattern: ${JSON.stringify(patternClicked)}`);
      await delay(1500);
    } else {
      // No pattern tiles — just try NEXT STEP directly (fabric info step may not need a selection)
      console.log("  No pattern items found — trying NEXT STEP directly");
    }

    // Click NEXT STEP again
    const nextStep2 = await clickByText(page, "NEXT STEP");
    console.log(`  NEXT STEP 2: ${nextStep2}`);
    await delay(3000);
    await page.screenshot({ path: path.join(catDir, `step3-after-step2.png`) });

    const afterStep2 = await page.evaluate(() => {
      const partItems = document.querySelectorAll("[data-part-item]").length;
      const hActives = Array.from(document.querySelectorAll("[class*='hActive']")).map(el => el.textContent.trim().slice(0, 50)).filter(Boolean);
      return { partItems, hActives };
    });
    console.log(`  After STEP2 -> partItems: ${afterStep2.partItems}, hActive: ${JSON.stringify(afterStep2.hActives.slice(0, 5))}`);
  }

  // === Now on Design Details === Extract data
  console.log("  Extracting design options...");
  const extracted = await extractDesignOptions(page, mtypb);
  await page.screenshot({ path: path.join(catDir, `step3-design-details.png`) });

  if (!extracted.rows || extracted.rows.length === 0) {
    console.log(`  No design options extracted. partItems: ${extracted.partItems}, altItems: ${extracted.altItems}`);
    if (extracted.pageText) console.log(`  Page text: ${extracted.pageText}`);
    return;
  }

  console.log(`  Extracted ${extracted.rows.length} fields`);
  let totalOpts = 0, withImg = 0;
  extracted.rows.forEach(f => {
    totalOpts += f.o.length;
    f.o.forEach(o => { if (o.i) withImg++; });
    console.log(`    ${f.f} (${f.l}): ${f.o.length} opts`);
  });
  console.log(`  Total: ${totalOpts} options, ${withImg} with image`);

  const outPath = path.join(catDir, "design-options-full.json");
  writeFileSync(outPath, JSON.stringify(extracted.rows, null, 2));
  console.log(`  Saved to ${catLabel}/design-options-full.json`);
}

async function main() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,900"],
    defaultViewport: { width: 1400, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // Login
    await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="text"]', USER);
    await page.type('input[type="password"]', PASS);
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    console.log("Logged in:", page.url());

    await processCategory(page, "trousers", "BT", 2);
    // BS already done
    // await processCategory(page, "shirt", "BS", 2);
    await processCategory(page, "vest", "BV", 2);

  } finally {
    await browser.close();
  }

  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
