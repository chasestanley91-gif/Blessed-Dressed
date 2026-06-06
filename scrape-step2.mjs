// scrape-step2.mjs — reaches Step 2 using real mouse clicks, extracts all design options
import puppeteer from "puppeteer-core";
import { writeFileSync, createWriteStream, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");

const USER = process.env.FACTORY_USER || "";
const PASS = process.env.FACTORY_PASS || "";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";
const KUNNR = "0000030068";

const CATEGORIES = [
  { label: "suit-jacket", mtypb: "BB", sexty: "1" },
  { label: "shirt",       mtypb: "BS", sexty: "1" },
  { label: "trousers",    mtypb: "BT", sexty: "1" },
  { label: "vest",        mtypb: "BV", sexty: "1" },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadFile(url, dest, cookies) {
  return new Promise((resolve) => {
    const file = createWriteStream(dest);
    https.get(url, { headers: { Cookie: cookies, Referer: BASE }, rejectUnauthorized: false }, (res) => {
      if (res.statusCode === 200) { res.pipe(file); file.on("finish", () => { file.close(); resolve(true); }); }
      else { file.close(); resolve(false); }
    }).on("error", () => { file.close(); resolve(false); });
  });
}

async function main() {
  if (!USER || !PASS) { console.error("Set FACTORY_USER and FACTORY_PASS"); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
           "--window-size=1440,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Login
  console.log("Logging in…");
  await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="text"]', USER);
  await page.type('input[type="password"]', PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  console.log("Logged in:", page.url());

  for (const { label, mtypb, sexty } of CATEGORIES) {
    const catDir = path.join(OUT_DIR, label);
    mkdirSync(catDir, { recursive: true });

    const url = `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=${KUNNR}&category=${mtypb}&categoryName=&sexty=${sexty}`;
    console.log(`\n[${label}] Navigating…`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await sleep(8000);

    await page.screenshot({ path: path.join(catDir, "01-step1.png") });

    // Find NEXT STEP element by text content
    const nextStepHandle = await page.evaluateHandle(() => {
      const all = document.querySelectorAll("div, button, a, span");
      for (const el of all) {
        if (el.textContent?.trim() === "NEXT STEP") return el;
      }
      return null;
    });

    const nextStepEl = nextStepHandle?.asElement?.() || null;
    if (nextStepEl) {
      await nextStepEl.click();
      console.log("  Clicked NEXT STEP (real elementHandle click)");
      await sleep(20000);
    } else {
      // Fallback: use page.click with ::-p-text pseudo-selector or direct evaluate
      try {
        await page.click('::-p-text(NEXT STEP)');
        console.log("  Clicked NEXT STEP via ::-p-text");
        await sleep(20000);
      } catch {
        const clicked = await page.evaluate(() => {
          for (const el of document.querySelectorAll("div[onclick], div[class*='next'], button")) {
            if (el.textContent?.trim() === "NEXT STEP") { el.click(); return el.outerHTML.slice(0, 100); }
          }
          return null;
        });
        console.log(`  JS click result: ${clicked}`);
        if (clicked) await sleep(20000);
      }
    }

    await page.screenshot({ path: path.join(catDir, "02-after-next.png"), fullPage: false });

    // Check what step we're on
    const stepInfo = await page.evaluate(() => ({
      url: location.href,
      hasDesignOpts: !!document.querySelector('[data-part-item-opt="X"]'),
      dataValueCount: document.querySelectorAll('[data-value]').length,
      imgs: document.querySelectorAll('img[src*="mtmstorage"]').length,
      title: document.title,
    }));
    console.log(`  Step info:`, stepInfo);

    // Extract all design options
    const options = await page.evaluate(() => {
      // Try data-part-item-opt approach
      const fromFields = [];
      document.querySelectorAll('[data-part-item-opt="X"]').forEach(fieldEl => {
        const fieldName = fieldEl.getAttribute("name") || "";
        const opts = Array.from(fieldEl.querySelectorAll("[data-value]")).map(opt => ({
          value: opt.getAttribute("data-value"),
          label: opt.textContent?.trim()?.slice(0, 60) || "",
          imgSrc: opt.querySelector("img")?.src || "",
        }));
        if (opts.length > 0) fromFields.push({ fieldName, options: opts });
      });

      // Fallback: get ALL data-value divs with their images
      const allDataValue = Array.from(document.querySelectorAll("div[data-value]")).map(el => {
        const parent = el.closest("[data-part-item-opt]");
        return {
          field: parent?.getAttribute("name") || "",
          value: el.getAttribute("data-value"),
          imgSrc: el.querySelector("img")?.src || "",
          label: el.textContent?.trim()?.slice(0, 60) || "",
        };
      }).filter(x => x.imgSrc.includes("mtmstorage"));

      return { fromFields, allDataValue };
    });

    console.log(`  fromFields: ${options.fromFields.length} field groups`);
    console.log(`  allDataValue with mtmstorage images: ${options.allDataValue.length}`);

    writeFileSync(path.join(catDir, "design-options.json"), JSON.stringify(options, null, 2));

    // Download images
    const cookies = await page.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    let downloaded = 0;
    const manifest = [];

    // From allDataValue
    const fieldDirs = new Set();
    for (const item of options.allDataValue) {
      if (!item.imgSrc) continue;
      const fieldDir = path.join(catDir, item.field || "misc");
      if (!fieldDirs.has(fieldDir)) { mkdirSync(fieldDir, { recursive: true }); fieldDirs.add(fieldDir); }
      const ext = item.imgSrc.split(".").pop()?.split("?")[0] || "jpg";
      const fname = `${(item.value || "x").replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
      const dest = path.join(fieldDir, fname);
      const ok = await downloadFile(item.imgSrc, dest, cookieStr);
      if (ok) { downloaded++; manifest.push({ ...item, fname: `${item.field || "misc"}/${fname}` }); }
    }

    // Also grab all mtmstorage images not captured above
    const pageImgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img[src*='mtmstorage']")).map(i => ({ src: i.src, alt: i.alt }))
    );
    for (const img of pageImgs) {
      if (manifest.find(m => m.imgSrc === img.src)) continue;
      const parts = img.src.split("/");
      const fname = parts[parts.length - 1];
      const ok = await downloadFile(img.src, path.join(catDir, fname), cookieStr);
      if (ok) { downloaded++; manifest.push({ field: "misc", value: fname, imgSrc: img.src, label: img.alt, fname }); }
    }

    writeFileSync(path.join(catDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`  ✓ Downloaded ${downloaded} images`);
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
