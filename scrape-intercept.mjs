// scrape-intercept.mjs — captures ALL API responses when clicking NEXT STEP
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");

const USER = process.env.FACTORY_USER || "";
const PASS = process.env.FACTORY_PASS || "";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";
const KUNNR = "0000030068";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (!USER || !PASS) { console.error("Set FACTORY_USER and FACTORY_PASS"); process.exit(1); }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Intercept ALL responses from the eis domain
  const allResponses = [];
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/eis/") && !url.includes(".js") && !url.includes(".css") && !url.includes(".png") && !url.includes(".jpg")) {
      try {
        const text = await response.text();
        if (text.length < 200000) {
          allResponses.push({ url: url.split("?")[0], status: response.status(), body: text.slice(0, 2000) });
          console.log(`  Response: ${url.split("baoxiniao.co")[1].slice(0, 80)} [${text.length}]`);
        }
      } catch (_) {}
    }
  });

  // Login
  console.log("Logging in…");
  await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="text"]', USER);
  await page.type('input[type="password"]', PASS);
  allResponses.length = 0;
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  console.log("Logged in:", page.url());

  allResponses.length = 0;
  const url = `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=${KUNNR}&category=BB&categoryName=Men%27s%2520suit%2520jackets&sexty=1`;
  console.log("\nNavigating to suit page…");
  await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(10000);

  console.log(`\nResponses after page load: ${allResponses.length}`);
  writeFileSync(path.join(OUT_DIR, "intercept-pageload.json"), JSON.stringify(allResponses, null, 2));

  // Now click NEXT STEP and capture new responses
  allResponses.length = 0;
  console.log("\nClicking NEXT STEP…");
  const clicked = await page.evaluateHandle(() => {
    const all = document.querySelectorAll("div, button, a, span");
    for (const el of all) {
      if (el.textContent?.trim() === "NEXT STEP") return el;
    }
    return null;
  });
  const el = clicked?.asElement?.();
  if (el) {
    await el.click();
    console.log("Clicked NEXT STEP");
  } else {
    console.log("NEXT STEP not found!");
  }

  await sleep(20000);

  console.log(`\nResponses after NEXT STEP click: ${allResponses.length}`);
  allResponses.forEach(r => console.log(`  ${r.url.split("baoxiniao.co")[1]} [${r.body.length}]`));
  writeFileSync(path.join(OUT_DIR, "intercept-nextstep.json"), JSON.stringify(allResponses, null, 2));

  // Check page state
  const state = await page.evaluate(() => ({
    url: location.href,
    dataValues: document.querySelectorAll("[data-value]").length,
    partItemOpts: document.querySelectorAll("[data-part-item-opt]").length,
    imgs: document.querySelectorAll("img[src*='mtmstorage']").length,
    activeTab: document.querySelector(".layui-tab-item.layui-show")?.className,
    allTabs: document.querySelectorAll(".layui-tab-item").length,
    layuiTabs: document.querySelectorAll("[lay-id]").length,
  }));
  console.log("\nPage state:", state);

  await page.screenshot({ path: path.join(OUT_DIR, "intercept-screenshot.png"), fullPage: false });

  await browser.close();
  console.log("\nDone.");
}

main().catch(e => { console.error(e); process.exit(1); });
