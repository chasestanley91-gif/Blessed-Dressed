// dump-dom.mjs — navigate to BS Design Details and dump the design option DOM structure
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

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false,
    args: ["--no-sandbox", "--window-size=1400,900"],
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

    // Navigate to BS
    await page.goto(
      `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=BS&categoryName=&sexty=1`,
      { waitUntil: "networkidle2", timeout: 30000 }
    );
    await delay(2000);

    // Click first BXN fabric
    await page.evaluate(() => {
      const tile = document.querySelector("[onclick*='selectFabric']");
      if (tile) tile.click();
    });
    await delay(1500);

    // NEXT STEP 1
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "NEXT STEP");
      if (btn) btn.click();
    });
    await delay(3000);

    // Click first pattern
    await page.evaluate(() => {
      const pattern = document.querySelector("[onclick*='selectPattern']");
      if (pattern) pattern.click();
    });
    await delay(1500);

    // NEXT STEP 2
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("div")).find(d => d.textContent.trim() === "NEXT STEP");
      if (btn) btn.click();
    });
    await delay(4000);

    await page.screenshot({ path: path.join(OUT_DIR, "shirt", "dump-design-details.png") });

    // Dump the actual DOM structure around data-part-item
    const domInfo = await page.evaluate(() => {
      const partItems = document.querySelectorAll("[data-part-item]");
      const firstFew = Array.from(partItems).slice(0, 5).map(el => ({
        outerHTML: el.outerHTML.slice(0, 400),
        attributes: Array.from(el.attributes).map(a => ({ name: a.name, value: a.value })),
      }));

      // Also check the name attribute approach
      const withName = Array.from(document.querySelectorAll("[data-part-item][name]")).slice(0, 5).map(el => ({
        dataPartItem: el.getAttribute("data-part-item"),
        name: el.getAttribute("name"),
        className: el.className?.slice(0, 60),
      }));

      // Check what data-part-item-opt looks like
      const optContainers = Array.from(document.querySelectorAll("[data-part-item-opt]")).slice(0, 3).map(el => ({
        dataPartItemOpt: el.getAttribute("data-part-item-opt"),
        name: el.getAttribute("name"),
        childCount: el.children.length,
        firstChild: el.children[0]?.outerHTML?.slice(0, 200),
      }));

      return {
        totalPartItems: partItems.length,
        firstFew,
        withName,
        optContainers,
      };
    });

    console.log("total data-part-item elements:", domInfo.totalPartItems);
    console.log("\nFirst 5 data-part-item elements:");
    domInfo.firstFew.forEach((el, i) => {
      console.log(`  [${i}] attributes:`, JSON.stringify(el.attributes));
      console.log(`      HTML: ${el.outerHTML.replace(/\n/g, ' ')}`);
    });

    console.log("\nElements with both data-part-item AND name:");
    domInfo.withName.forEach(el => console.log(" ", JSON.stringify(el)));

    console.log("\ndata-part-item-opt containers:");
    domInfo.optContainers.forEach(c => {
      console.log("  opt value:", c.dataPartItemOpt, "name:", c.name, "children:", c.childCount);
      if (c.firstChild) console.log("  first child:", c.firstChild.replace(/\n/g, ' '));
    });

    // Save full DOM dump
    const fullDom = await page.evaluate(() => {
      // Find all design-option related elements
      const relevantEls = Array.from(document.querySelectorAll("[data-part-item], [data-part-item-opt], [data-value]")).slice(0, 30);
      return relevantEls.map(el => ({
        tag: el.tagName,
        attrs: Array.from(el.attributes).reduce((acc, a) => { acc[a.name] = a.value; return acc; }, {}),
        text: el.textContent.trim().slice(0, 100),
        imgSrc: el.querySelector("img")?.src || "",
      }));
    });

    writeFileSync(path.join(OUT_DIR, "shirt", "dom-dump.json"), JSON.stringify(fullDom, null, 2));
    console.log("\nSaved dom-dump.json");

    // Also try the Firecrawl-style extraction with name attribute
    const extracted = await page.evaluate((mtypb) => {
      const rows = Array.from(document.querySelectorAll("[data-part-item]"));
      const results = [];

      rows.forEach(row => {
        // Try multiple ways to get field code
        const partItemIdx = row.getAttribute("data-part-item");
        const nameAttr = row.getAttribute("name");
        const dataField = row.getAttribute("data-field");
        const id = row.id;
        const classMatch = row.className?.match(/\b([A-Z]{4,6})\b/);

        // Get label from child elements
        const labelEl = row.querySelector("[class*='label'], [class*='Label'], [class*='title'], h3, h4, span") ||
                        row.querySelector("[class*='tit']");
        const label = labelEl?.textContent?.trim() || "";

        // Find option container - try different approaches
        let optContainer = null;
        if (partItemIdx) {
          optContainer = document.querySelector(`[data-part-item-opt="${partItemIdx}"]`);
        }
        if (!optContainer && nameAttr) {
          optContainer = document.querySelector(`[data-part-item-opt][name="${nameAttr}"]`);
        }

        const tiles = optContainer ? Array.from(optContainer.querySelectorAll("[data-value]")) : [];
        const opts = tiles.map(t => ({
          v: t.getAttribute("data-value"),
          i: t.querySelector("img")?.src || t.querySelector("img")?.getAttribute("data-src") || "",
        })).filter(o => o.v);

        if (opts.length > 0) {
          results.push({
            partItemIdx,
            nameAttr,
            dataField,
            classMatch: classMatch?.[1],
            label,
            opts: opts.slice(0, 2),
          });
        }
      });

      return results.slice(0, 10);
    }, "BS");

    console.log("\nExtraction test (first 10 fields with options):");
    extracted.forEach(f => console.log(" ", JSON.stringify(f)));

  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
