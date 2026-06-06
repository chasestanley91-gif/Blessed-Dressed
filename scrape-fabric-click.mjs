// scrape-fabric-click.mjs — clicks first fabric tile, then NEXT STEP, captures Step 2 design options
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
  { label: "suit-jacket", mtypb: "BB", sexty: "1" },
  { label: "shirt",       mtypb: "BS", sexty: "1" },
  { label: "trousers",    mtypb: "BT", sexty: "1" },
  { label: "vest",        mtypb: "BV", sexty: "1" },
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
    headless: false, // Use visible browser — headless blocks Step 2 rendering
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
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

    const apiResponses = [];
    const responseHandler = async (response) => {
      const rUrl = response.url();
      if (rUrl.includes("/eis/") && !rUrl.includes(".js") && !rUrl.includes(".css") && !rUrl.includes(".png") && !rUrl.includes(".jpg") && !rUrl.includes(".properties")) {
        try {
          const text = await response.text();
          if (text.length < 500000 && text.startsWith("{")) {
            apiResponses.push({ url: rUrl.split("baoxiniao.co")[1].split("?")[0], body: text.slice(0, 5000) });
            console.log(`  API: ${rUrl.split("baoxiniao.co")[1].slice(0, 80)} [${text.length}]`);
          }
        } catch (_) {}
      }
    };
    page.on("response", responseHandler);

    const url = `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=${KUNNR}&category=${mtypb}&categoryName=&sexty=${sexty}`;
    console.log(`\n[${label}] Navigating…`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await sleep(6000);

    // Inspect the first fabric tile
    const fabricInfo = await page.evaluate(() => {
      const tiles = document.querySelectorAll("div[data-value]");
      if (!tiles.length) return null;
      const t = tiles[0];
      return {
        dataValue: t.getAttribute("data-value"),
        onclick: t.getAttribute("onclick"),
        outerHTML: t.outerHTML.slice(0, 300),
        parentClass: t.parentElement?.className || "",
        count: tiles.length,
      };
    });
    console.log(`  Fabric tiles: ${fabricInfo?.count}, first value: ${fabricInfo?.dataValue}`);
    console.log(`  onclick: ${fabricInfo?.onclick}`);

    // Click the first fabric tile
    const fabricClicked = await page.evaluate(() => {
      const tiles = document.querySelectorAll("div[data-value]");
      if (!tiles.length) return false;
      tiles[0].click();
      return true;
    });
    console.log(`  Fabric clicked: ${fabricClicked}`);
    await sleep(1500);

    // Check if fabric is now selected
    const selectedFabric = await page.evaluate(() => {
      const sel = document.querySelector(".fabric-selected, [class*='selected'], [class*='active'][data-value]");
      const bottomBar = document.querySelector(".bottom-bar, [class*='fabric-name'], [class*='footer']");
      return {
        selectedEl: sel?.getAttribute("data-value") || null,
        bottomText: bottomBar?.textContent?.trim()?.slice(0, 80) || null,
      };
    });
    console.log(`  Selected fabric:`, selectedFabric);

    await page.screenshot({ path: path.join(catDir, "01-fabric-selected.png") });

    // Now click NEXT STEP
    apiResponses.length = 0;
    const nextClicked = await page.evaluate(() => {
      const all = document.querySelectorAll("div, button, a, span");
      for (const el of all) {
        if (el.textContent?.trim() === "NEXT STEP") { el.click(); return true; }
      }
      return false;
    });
    console.log(`  NEXT STEP clicked: ${nextClicked}`);

    // Wait for Step 2 to load
    await sleep(20000);

    // Check page state
    const state = await page.evaluate(() => ({
      url: location.href,
      dataValueCount: document.querySelectorAll("[data-value]").length,
      partItemOpts: document.querySelectorAll("[data-part-item-opt]").length,
      partItemOptsX: document.querySelectorAll('[data-part-item-opt="X"]').length,
      imgs: document.querySelectorAll("img[src*='mtmstorage']").length,
      allTabs: document.querySelectorAll(".layui-tab-item").length,
      tabTitles: Array.from(document.querySelectorAll(".layui-tab-title li")).map(l => l.textContent?.trim()),
      bodyHtml50: document.body.innerHTML.slice(0, 500),
    }));
    console.log(`  State:`, {
      ...state,
      bodyHtml50: state.bodyHtml50.slice(0, 100),
    });
    console.log(`  New API calls after NEXT STEP: ${apiResponses.length}`);
    apiResponses.forEach(r => console.log(`    ${r.url}`));

    await page.screenshot({ path: path.join(catDir, "02-after-next.png") });
    writeFileSync(path.join(catDir, "api-after-nextstep.json"), JSON.stringify(apiResponses, null, 2));

    if (state.partItemOptsX === 0) {
      console.log("  !! Still 0 design fields. Dumping body snippet…");
      const bodySnippet = await page.evaluate(() => document.body.innerHTML.slice(0, 3000));
      writeFileSync(path.join(catDir, "body-after-next.html"), bodySnippet);
      page.off("response", responseHandler);
      continue;
    }

    // Extract all design options
    const options = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('[data-part-item-opt="X"]').forEach(fieldEl => {
        const fieldName = fieldEl.getAttribute("name") || "";
        // Try to find the label from a sibling/parent title element
        const titleEl = document.querySelector(`[data-part-item="X"][name="${fieldName}"] .tit, [data-part-item="X"][name="${fieldName}"] .title`);
        const fieldLabel = titleEl?.textContent?.trim() || fieldName;
        const opts = Array.from(fieldEl.querySelectorAll("[data-value]")).map(opt => {
          const img = opt.querySelector("img");
          const labelEl = opt.querySelector(".name, .label, .txt, span");
          return {
            value: opt.getAttribute("data-value"),
            label: labelEl?.textContent?.trim() || "",
            imgSrc: img?.src || "",
          };
        });
        if (opts.length > 0) result.push({ fieldName, fieldLabel, options: opts });
      });
      return result;
    });

    console.log(`  Design fields: ${options.length}`);
    options.forEach(f => console.log(`    ${f.fieldName}: ${f.options.length} options`));
    writeFileSync(path.join(catDir, "design-options.json"), JSON.stringify(options, null, 2));

    // Download images
    const cookies = await page.cookies();
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    let downloaded = 0;
    const manifest = [];

    for (const field of options) {
      const fieldDir = path.join(catDir, field.fieldName);
      mkdirSync(fieldDir, { recursive: true });
      for (const opt of field.options) {
        if (!opt.imgSrc || opt.imgSrc.length < 10) continue;
        const ext = opt.imgSrc.split(".").pop()?.split("?")[0] || "jpg";
        const fname = `${opt.value.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
        const dest = path.join(fieldDir, fname);
        const ok = await downloadFile(opt.imgSrc, dest, cookieStr);
        if (ok) {
          downloaded++;
          manifest.push({ field: field.fieldName, fieldLabel: field.fieldLabel, value: opt.value, label: opt.label, url: opt.imgSrc, fname: `${field.fieldName}/${fname}` });
        }
      }
    }

    writeFileSync(path.join(catDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`  ✓ Downloaded ${downloaded} images`);
    page.off("response", responseHandler);
  }

  await browser.close();
  console.log("\nAll done.");
}

main().catch(e => { console.error(e); process.exit(1); });
