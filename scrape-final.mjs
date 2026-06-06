// scrape-final.mjs — complete factory design option scraper
// Uses known URL pattern: /mtmstorage/images/measure/{MTYPB}/{FIELD}/{FIELD}{MTYPB}{VALUE}.jpg
import puppeteer from "puppeteer-core";
import { writeFileSync, createWriteStream, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const USER = process.env.FACTORY_USER || "";
const PASS = process.env.FACTORY_PASS || "";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";
const KUNNR = "0000030068";

const CATEGORIES = [
  { label: "suit-jacket", mtypb: "BB", url: `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=${KUNNR}&category=BB&categoryName=Men%27s%2520suit%2520jackets&sexty=1` },
  { label: "shirt",       mtypb: "BS", url: `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=${KUNNR}&category=BS&categoryName=Men%27s%2520dress%2520shirts&sexty=1` },
  { label: "trousers",    mtypb: "BT", url: `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=${KUNNR}&category=BT&categoryName=Men%27s%2520trousers&sexty=1` },
  { label: "vest",        mtypb: "BV", url: `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=${KUNNR}&category=BV&categoryName=Men%27s%2520vest&sexty=1` },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadFile(url, dest, cookies) {
  return new Promise((resolve) => {
    const file = createWriteStream(dest);
    const options = { headers: { Cookie: cookies || "", Referer: BASE }, rejectUnauthorized: false };
    https.get(url, options, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(true); });
      } else {
        file.close();
        resolve(false);
      }
    }).on("error", () => { file.close(); resolve(false); });
  });
}

async function main() {
  if (!USER || !PASS) { console.error("Set FACTORY_USER and FACTORY_PASS"); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Login
  console.log("Logging in…");
  await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2" });
  await page.$eval('input[type="text"]', (el, v) => { el.value = v; }, USER);
  await page.$eval('input[type="password"]', (el, v) => { el.value = v; }, PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  console.log("Logged in:", page.url());

  for (const { label, mtypb, url } of CATEGORIES) {
    console.log(`\n[${label}] Loading…`);
    const catDir = path.join(OUT_DIR, label);
    mkdirSync(catDir, { recursive: true });

    // Intercept getMergeZlcustomData to get option field labels
    const capturedResponses = [];
    const responseHandler = async (response) => {
      const rUrl = response.url();
      if (rUrl.includes("getMergeZlcustomData") || rUrl.includes("getZlpmrByStoreConfigAndResource") || rUrl.includes("getDictionary")) {
        try {
          const json = await response.json();
          capturedResponses.push({ url: rUrl, data: json });
        } catch (_) {}
      }
    };
    page.on("response", responseHandler);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await sleep(8000); // Wait for full JS render including fabric thumbnails

    // Check if fabric tiles loaded
    const fabricCount = await page.evaluate(() =>
      document.querySelectorAll('[class*="fabric"], [onclick*="selectFabric"], [onclick*="matnr"]').length
    );
    console.log(`  Fabric elements found: ${fabricCount}`);

    // Try clicking the first clickable fabric item in the fabric grid
    const clicked = await page.evaluate(() => {
      // Try various selectors for fabric tiles
      const selectors = [
        '.fabric-item', '.matnr-item', '[class*="fabric-tile"]',
        // Based on Firecrawl DOM: fabric tiles have onclick and are inside a grid
        'div[onclick*="select"]', 'div[onclick*="fabric"]', 'div[onclick*="Fabric"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) { el.click(); return sel; }
      }
      // Fallback: click first child of the fabric grid
      const gridItems = document.querySelectorAll('.layui-tab-content div[onclick]');
      if (gridItems.length > 0) { gridItems[0].click(); return 'gridItems[0]'; }
      return null;
    });
    console.log(`  Clicked fabric via: ${clicked || "not found"}`);
    await sleep(1000);

    // Find and click NEXT STEP button
    const nextClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div, button, a'));
      for (const el of btns) {
        if (el.textContent?.trim() === "NEXT STEP") { el.click(); return true; }
      }
      return false;
    });
    console.log(`  Next step clicked: ${nextClicked}`);

    if (!nextClicked) {
      // Try to directly trigger step 2 via page JS
      await page.evaluate(() => {
        if (typeof App !== "undefined" && App.gotoStep) App.gotoStep(2);
        else if (typeof App !== "undefined" && App.nextStep) App.nextStep();
      });
      console.log("  Tried App.gotoStep(2)");
    }

    await sleep(15000); // Wait for design options to fully load

    page.off("response", responseHandler);
    await page.screenshot({ path: path.join(catDir, "design-step.png"), fullPage: false });

    // Extract all design options with images
    const options = await page.evaluate(() => {
      const result = [];
      // Method 1: [data-part-item-opt="X"] elements
      const fieldEls = document.querySelectorAll('[data-part-item-opt="X"]');
      fieldEls.forEach(fieldEl => {
        const fieldName = fieldEl.getAttribute("name") || "";
        const fieldLabel = document.querySelector(`[data-part-item="X"][name="${fieldName}"] [class*="title"], [data-part-item="X"][name="${fieldName}"]`)?.textContent?.trim() || fieldName;
        const opts = Array.from(fieldEl.querySelectorAll("[data-value]")).map(opt => {
          const img = opt.querySelector("img");
          const labelEl = opt.querySelector("[class*='name'], [class*='label'], .txt, .title, span");
          return {
            value: opt.getAttribute("data-value"),
            label: labelEl?.textContent?.trim() || opt.textContent?.trim()?.slice(0, 60) || "",
            imgSrc: img?.src || "",
          };
        });
        if (opts.length > 0) result.push({ fieldName, fieldLabel, options: opts });
      });
      return result;
    });

    console.log(`  Design fields found: ${options.length}`);
    options.forEach(f => console.log(`    ${f.fieldName} (${f.fieldLabel}): ${f.options.length} options`));

    writeFileSync(path.join(catDir, "design-options.json"), JSON.stringify(options, null, 2));

    // Also dump ALL images on the page (backup approach)
    const allImages = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .map(i => ({ src: i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight }))
        .filter(i => i.w > 20 && i.h > 20 && i.src.includes("mtmstorage"))
    );
    console.log(`  Total mtmstorage images: ${allImages.length}`);
    writeFileSync(path.join(catDir, "all-images.json"), JSON.stringify(allImages, null, 2));

    // Download images
    const cookies = await page.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    let downloaded = 0;
    const manifest = [];

    for (const field of options) {
      const fieldDir = path.join(catDir, field.fieldName);
      mkdirSync(fieldDir, { recursive: true });
      for (const opt of field.options) {
        if (!opt.imgSrc || opt.imgSrc.length < 5) continue;
        const ext = opt.imgSrc.split(".").pop()?.split("?")[0] || "jpg";
        const fname = `${opt.value.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
        const dest = path.join(fieldDir, fname);
        const ok = await downloadFile(opt.imgSrc, dest, cookieStr);
        if (ok) { downloaded++; manifest.push({ field: field.fieldName, value: opt.value, label: opt.label, fname: `${field.fieldName}/${fname}`, url: opt.imgSrc }); }
      }
    }

    // Also download from all-images as backup
    for (const img of allImages) {
      if (!manifest.find(m => m.url === img.src)) {
        const urlParts = img.src.split("/");
        const fname = urlParts[urlParts.length - 1];
        const dest = path.join(catDir, fname);
        const ok = await downloadFile(img.src, dest, cookieStr);
        if (ok) { downloaded++; manifest.push({ field: "misc", value: fname, label: img.alt, fname, url: img.src }); }
      }
    }

    writeFileSync(path.join(catDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    writeFileSync(path.join(catDir, "captured-api.json"), JSON.stringify(capturedResponses, null, 2));
    console.log(`  ✓ Downloaded ${downloaded} images`);
  }

  await browser.close();
  console.log("\nDone. Check factory-screenshots/*/");
}

main().catch(e => { console.error(e); process.exit(1); });
