// scrape-api2.mjs — uses puppeteer session to call factory APIs directly
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
  { label: "suit-jacket", mtypb: "BB" },
  { label: "shirt",       mtypb: "BS" },
  { label: "trousers",    mtypb: "BT" },
  { label: "vest",        mtypb: "BV" },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiPost(page, path, body) {
  return page.evaluate(async (path, body, base) => {
    const res = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return res.json();
  }, path, body, BASE);
}

function downloadFile(url, dest, cookies) {
  return new Promise((resolve) => {
    const file = createWriteStream(dest);
    const options = {
      headers: { Cookie: cookies || "" },
      rejectUnauthorized: false,
    };
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
  console.log("Logged in, URL:", page.url());

  // Navigate to suit page to establish full session context
  await page.goto(`${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=${KUNNR}&category=BB&categoryName=Men%27s%2520suit%2520jackets&sexty=1`, { waitUntil: "networkidle2", timeout: 30000 });
  await sleep(3000);

  // Get cookies for image downloads
  const cookies = await page.cookies();
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  console.log("Session cookies:", cookieStr.slice(0, 100));

  for (const { label, mtypb } of CATEGORIES) {
    console.log(`\n[${label}] Fetching model list…`);
    const catDir = path.join(OUT_DIR, label);
    mkdirSync(catDir, { recursive: true });

    // Get model for this category
    const pmrData = await apiPost(page, "/eis/measureData/getZlpmrByStoreConfigAndResource",
      { mtypb, kunnr: KUNNR, sexty: "1" });

    if (pmrData?.flag !== "SUCCESS" || !pmrData.data?.length) {
      console.log(`  ✗ No model data: ${JSON.stringify(pmrData).slice(0, 200)}`);
      continue;
    }

    const modem = pmrData.data[0].modem;
    console.log(`  Model: ${modem}`);

    // Get design options
    console.log(`  Fetching design options…`);
    const designData = await apiPost(page, "/eis/measureData/getMergeZlcustomData", {
      mtypb,
      modem,
      ordtp: "P",
      spras: "E",
      loekz: "",
    });

    writeFileSync(path.join(catDir, "raw-design-data.json"), JSON.stringify(designData, null, 2));

    if (designData?.flag !== "SUCCESS") {
      console.log(`  ✗ API error: ${JSON.stringify(designData).slice(0, 300)}`);
      continue;
    }

    const dataKeys = Object.keys(designData.data || {});
    console.log(`  Data keys: ${dataKeys.join(", ")}`);

    // Extract all design options with images
    // Structure: data.zlmodList contains the model parts/options
    const zlmodList = designData.data?.zlmodList || [];
    console.log(`  zlmodList items: ${zlmodList.length}`);
    if (zlmodList.length > 0) {
      console.log(`  Sample item: ${JSON.stringify(zlmodList[0]).slice(0, 300)}`);
    }

    // Also check zlpmr for structure
    const zlpmr = designData.data?.zlpmr;
    if (zlpmr) {
      console.log(`  zlpmr keys: ${Object.keys(zlpmr).join(", ")}`);
    }

    // Download images from zlmodList
    const manifest = [];
    let count = 0;

    for (const item of zlmodList) {
      // Look for image fields
      const imgUrl = item.imgurl || item.image || item.img || item.pic || item.src;
      if (!imgUrl) continue;

      const fullUrl = imgUrl.startsWith("http") ? imgUrl : `${BASE}${imgUrl}`;
      const safeName = (item.modnm || item.name || item.modc || item.code || String(count))
        .replace(/[^a-zA-Z0-9\-_]/g, "_").slice(0, 50);
      const ext = fullUrl.split("?")[0].split(".").pop() || "jpg";
      const fname = `${String(count + 1).padStart(3, "0")}-${safeName}.${ext}`;
      const dest = path.join(catDir, fname);

      const ok = await downloadFile(fullUrl, dest, cookieStr);
      if (ok) {
        manifest.push({ fname, url: fullUrl, ...item });
        count++;
        if (count % 10 === 0) console.log(`  Downloaded ${count} images…`);
      }
    }

    writeFileSync(path.join(catDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`  ✓ Saved ${count} images`);
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
