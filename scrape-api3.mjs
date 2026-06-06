// scrape-api3.mjs — intercepts page API calls, extracts model data, then fetches design options
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
    const options = {
      headers: { Cookie: cookies || "", Referer: BASE },
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

  for (const { label, mtypb, url } of CATEGORIES) {
    console.log(`\n[${label}] Navigating to ${mtypb}…`);
    const catDir = path.join(OUT_DIR, label);
    mkdirSync(catDir, { recursive: true });

    // Intercept getZlpmrByStoreConfigAndResource to capture modem
    let capturedModem = null;
    const responseHandler = async (response) => {
      if (response.url().includes("getZlpmrByStoreConfigAndResource")) {
        try {
          const json = await response.json();
          if (json?.flag === "SUCCESS" && json.data?.length > 0) {
            capturedModem = json.data[0].modem;
            console.log(`  Intercepted modem: ${capturedModem}`);
          }
        } catch (_) {}
      }
    };
    page.on("response", responseHandler);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await sleep(5000); // Give JS time to make API calls

    page.off("response", responseHandler);

    if (!capturedModem) {
      console.log(`  ✗ Could not capture modem for ${label}`);
      // Try known fallbacks
      const fallbacks = { BB: "US66", BS: "US66", BT: "US66", BV: "US66" };
      capturedModem = fallbacks[mtypb];
      console.log(`  Using fallback modem: ${capturedModem}`);
    }

    // Now call getMergeZlcustomData from the page context (uses session cookies)
    console.log(`  Calling getMergeZlcustomData with modem ${capturedModem}…`);
    const designData = await page.evaluate(async (base, mtypb, modem) => {
      try {
        const res = await fetch(`${base}/eis/measureData/getMergeZlcustomData`, {
          method: "POST",
          headers: { "Content-Type": "application/json;charset=utf-8" },
          credentials: "include",
          body: JSON.stringify({ mtypb, modem, ordtp: "P", spras: "E", loekz: "" }),
        });
        return res.json();
      } catch (e) {
        return { error: e.message };
      }
    }, BASE, mtypb, capturedModem);

    writeFileSync(path.join(catDir, "raw-design-data.json"), JSON.stringify(designData, null, 2));
    console.log(`  flag: ${designData?.flag}`);

    if (designData?.flag !== "SUCCESS") {
      console.log(`  Response: ${JSON.stringify(designData).slice(0, 400)}`);
      continue;
    }

    const dataKeys = Object.keys(designData.data || {});
    console.log(`  Data keys: ${dataKeys.join(", ")}`);

    // Extract design options
    // zlmodList = the list of model variants/options
    const zlmodList = designData.data?.zlmodList || [];
    const zlpmr = designData.data?.zlpmr || {};
    const zlcustomList = designData.data?.zlcustomList || designData.data?.zlcustom || [];

    console.log(`  zlmodList: ${zlmodList.length} items`);
    console.log(`  zlcustomList: ${zlcustomList.length} items`);
    if (zlmodList.length > 0) console.log(`  First zlmod: ${JSON.stringify(zlmodList[0]).slice(0, 300)}`);
    if (zlcustomList.length > 0) console.log(`  First zlcustom: ${JSON.stringify(zlcustomList[0]).slice(0, 300)}`);

    // Get cookies for image download
    const cookies = await page.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    // Try downloading images from zlcustomList (these are the design options)
    const allItems = [...zlmodList, ...zlcustomList];
    const manifest = [];
    let count = 0;

    for (const item of allItems) {
      const imgUrl = item.imgurl || item.image || item.img || item.picture || item.pic;
      if (!imgUrl || imgUrl.length < 3) continue;

      const fullUrl = imgUrl.startsWith("http") ? imgUrl : `${BASE}${imgUrl}`;
      const nameParts = [item.field || item.prope || "", item.modc || item.code || item.value || ""];
      const safeName = nameParts.filter(Boolean).join("_").replace(/[^a-zA-Z0-9\-_]/g, "_").slice(0, 50) || String(count);
      const ext = fullUrl.split("?")[0].split(".").pop()?.replace(/[^a-z]/g, "") || "jpg";
      const fname = `${String(count + 1).padStart(3, "0")}-${safeName}.${ext}`;
      const dest = path.join(catDir, fname);

      const ok = await downloadFile(fullUrl, dest, cookieStr);
      if (ok) {
        manifest.push({ fname, url: fullUrl, ...item });
        count++;
        if (count % 10 === 0) console.log(`  Downloaded ${count}…`);
      }
    }

    writeFileSync(path.join(catDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`  ✓ Saved ${count} images for ${label}`);
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
