// scrape-non-bxn-debug.mjs — diagnose BT/BV NON-BXN flow with screenshots
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");

const USER = "LT-BLESSED";
const PASS = "20260311Sa#";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";

// Categories to debug
const CATEGORIES = [
  { label: "trousers", mtypb: "BT" },
  { label: "vest",     mtypb: "BV" },
  { label: "shirt",    mtypb: "BS" },
];

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,900"],
    defaultViewport: { width: 1400, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // Capture console logs
    page.on("console", msg => process.stdout.write(`  [console] ${msg.text()}\n`));

    // Intercept all XHR responses
    const apiData = {};
    await page.setRequestInterception(true);
    page.on("request", req => req.continue());
    page.on("response", async res => {
      const url = res.url();
      if (url.includes("/eis/") && !url.includes("login")) {
        try {
          const body = await res.text().catch(() => "");
          if (body.length > 10 && body.length < 2000000) {
            const key = url.split("/eis/")[1]?.split("?")[0] || url;
            apiData[key] = body.slice(0, 5000);
          }
        } catch(_) {}
      }
    });

    // Login
    console.log("Logging in...");
    await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await page.type('input[type="text"]', USER);
    await page.type('input[type="password"]', PASS);
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    console.log("Logged in. URL:", page.url());

    for (const { label, mtypb } of CATEGORIES) {
      console.log(`\n========== ${label} (${mtypb}) ==========`);
      const catDir = path.join(OUT_DIR, label);
      mkdirSync(catDir, { recursive: true });
      Object.keys(apiData).forEach(k => delete apiData[k]);

      const url = `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=${mtypb}&categoryName=&sexty=1`;
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 }).catch(e => console.log("nav err:", e.message));
      await delay(3000);

      await page.screenshot({ path: path.join(catDir, "debug-step1-initial.png"), fullPage: false });
      console.log(`  Screenshot: debug-step1-initial.png`);

      // Check current step
      const stepInfo = await page.evaluate(() => {
        const steps = Array.from(document.querySelectorAll('[class*="hActive"], [class*="active"]'));
        const stepText = Array.from(document.querySelectorAll('[class*="step"] *')).map(el => el.textContent.trim()).filter(t => t).slice(0, 20);
        const allText = document.body.innerText.slice(0, 500);
        return { stepText, allText };
      });
      console.log("  Page text sample:", stepInfo.allText.replace(/\s+/g, ' ').slice(0, 200));

      // Find and click NON-BXN
      console.log("  Looking for NON-BXN button...");
      const nonBxnClicked = await page.evaluate(() => {
        // Try various selectors
        const allDivs = Array.from(document.querySelectorAll('div'));
        const nonBxnDiv = allDivs.find(d => d.textContent.trim() === 'NON-BXN');
        if (nonBxnDiv) {
          nonBxnDiv.click();
          return { found: true, text: nonBxnDiv.textContent, tag: nonBxnDiv.tagName, class: nonBxnDiv.className };
        }
        return { found: false };
      });
      console.log("  NON-BXN click result:", JSON.stringify(nonBxnClicked));
      await delay(2000);

      await page.screenshot({ path: path.join(catDir, "debug-step1-after-nonbxn.png"), fullPage: false });
      console.log(`  Screenshot: debug-step1-after-nonbxn.png`);

      // Check what the NON-BXN area shows now
      const nonBxnDOM = await page.evaluate(() => {
        // Look for inputs, textboxes, or new content that appeared
        const inputs = Array.from(document.querySelectorAll('input, textarea')).map(el => ({
          type: el.type, placeholder: el.placeholder, value: el.value, id: el.id, name: el.name, visible: el.offsetParent !== null
        }));
        // Look for fabric tiles
        const tiles = Array.from(document.querySelectorAll('[onclick*="selectFabric"], [data-value]')).slice(0, 10).map(el => ({
          tag: el.tagName, onclick: el.getAttribute('onclick')?.slice(0, 80), dataValue: el.getAttribute('data-value'),
          text: el.textContent.trim().slice(0, 50), visible: el.offsetParent !== null
        }));
        return { inputs, tiles };
      });
      console.log("  Inputs after NON-BXN click:", JSON.stringify(nonBxnDOM.inputs.filter(i => i.visible)));
      console.log("  Tiles after NON-BXN click:", nonBxnDOM.tiles.length, "tiles");
      if (nonBxnDOM.tiles.length > 0) console.log("  First tiles:", JSON.stringify(nonBxnDOM.tiles.slice(0, 3)));

      // Try to fill any visible input with dummy fabric code
      const hasInput = nonBxnDOM.inputs.some(i => i.visible && i.type !== 'hidden');
      if (hasInput) {
        console.log("  Found visible input — filling with dummy value...");
        await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input, textarea')).filter(el => el.offsetParent !== null && el.type !== 'hidden');
          inputs.forEach(inp => { inp.value = 'TEST001'; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); });
        });
        await delay(1000);
        await page.screenshot({ path: path.join(catDir, "debug-step1-after-input.png"), fullPage: false });
      }

      // If there are NON-BXN fabric tiles, click the first one
      if (nonBxnDOM.tiles.length > 0) {
        console.log("  Found tiles — clicking first tile...");
        await page.evaluate(() => {
          const tile = document.querySelector('[onclick*="selectFabric"], [data-value]');
          if (tile) tile.click();
        });
        await delay(1500);
        await page.screenshot({ path: path.join(catDir, "debug-step1-after-tile.png"), fullPage: false });
      }

      // Click NEXT STEP
      console.log("  Clicking NEXT STEP...");
      const nextClicked = await page.evaluate(() => {
        const allDivs = Array.from(document.querySelectorAll('div, button'));
        const nextBtn = allDivs.find(d => d.textContent.trim() === 'NEXT STEP');
        if (nextBtn) { nextBtn.click(); return { found: true, class: nextBtn.className }; }
        return { found: false };
      });
      console.log("  NEXT STEP click result:", JSON.stringify(nextClicked));
      await delay(4000);

      await page.screenshot({ path: path.join(catDir, "debug-after-nextstep.png"), fullPage: false });
      console.log(`  Screenshot: debug-after-nextstep.png`);

      // Check current page state
      const afterNext = await page.evaluate(() => {
        const allText = document.body.innerText.replace(/\s+/g, ' ').slice(0, 800);
        const stepElems = Array.from(document.querySelectorAll('*')).filter(el => {
          const cls = el.className || '';
          return typeof cls === 'string' && cls.includes('hActive');
        }).map(el => ({ text: el.textContent.trim().slice(0, 50), class: el.className }));
        const partItems = document.querySelectorAll('[data-part-item]').length;
        const partItemOpts = document.querySelectorAll('[data-part-item-opt]').length;
        return { allText, stepElems, partItems, partItemOpts };
      });
      console.log("  After NEXT STEP text:", afterNext.allText.slice(0, 300));
      console.log("  hActive elements:", JSON.stringify(afterNext.stepElems));
      console.log("  data-part-item count:", afterNext.partItems);
      console.log("  data-part-item-opt count:", afterNext.partItemOpts);

      // Check for any error messages
      const errors = await page.evaluate(() => {
        const err = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [class*="tip"], [class*="msg"], [class*="alert"]'))
          .map(el => el.textContent.trim()).filter(t => t.length > 0 && t.length < 200);
        return err;
      });
      if (errors.length) console.log("  Errors/tips:", errors);

      // If we advanced to a pattern step, try to handle it
      if (afterNext.partItems === 0 && afterNext.partItemOpts === 0) {
        console.log("  Not on Design Details yet. Checking for Pattern No step...");

        // Try to select a pattern or press NEXT STEP again
        const patternInfo = await page.evaluate(() => {
          const allDivs = Array.from(document.querySelectorAll('div')).filter(d => d.offsetParent !== null);
          const patternItems = allDivs.filter(d => d.getAttribute('data-value') || d.getAttribute('onclick')?.includes('selectPattern')).slice(0, 5);
          return patternItems.map(el => ({ text: el.textContent.trim().slice(0, 50), dataValue: el.getAttribute('data-value'), onclick: el.getAttribute('onclick')?.slice(0, 80) }));
        });

        if (patternInfo.length > 0) {
          console.log("  Found pattern items:", JSON.stringify(patternInfo.slice(0, 3)));
          await page.evaluate(() => {
            const ptn = document.querySelector('[onclick*="selectPattern"], [data-value][class*="pattern"]');
            if (ptn) ptn.click();
          });
          await delay(2000);

          // Click NEXT STEP again
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('div, button')).find(d => d.textContent.trim() === 'NEXT STEP');
            if (btn) btn.click();
          });
          await delay(4000);
          await page.screenshot({ path: path.join(catDir, "debug-after-nextstep2.png"), fullPage: false });
          console.log("  Screenshot: debug-after-nextstep2.png");
        }
      }

      // Save API data captured
      const apiKeys = Object.keys(apiData);
      console.log("  API calls captured:", apiKeys);
      if (apiKeys.length > 0) {
        writeFileSync(path.join(catDir, "debug-api-responses.json"), JSON.stringify(apiData, null, 2));
        console.log("  Saved API responses");
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
