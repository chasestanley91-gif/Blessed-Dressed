// scrape-dict.mjs — fetches the design options dictionary from the factory site
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const USER = process.env.FACTORY_USER || "";
const PASS = process.env.FACTORY_PASS || "";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";

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

  // Login
  console.log("Logging in…");
  await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2" });
  await page.$eval('input[type="text"]', (el, v) => { el.value = v; }, USER);
  await page.$eval('input[type="password"]', (el, v) => { el.value = v; }, PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  console.log("Logged in:", page.url());

  // Navigate to suit page to establish session context
  await page.goto(`${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=BB&categoryName=Men%27s%2520suit%2520jackets&sexty=1`, { waitUntil: "networkidle2", timeout: 30000 });
  await sleep(4000);

  // Call getDictionary/E with proper conditions from proper.js
  console.log("Fetching getDictionary/E…");
  const dictResult = await page.evaluate(async () => {
    const spras = "E";
    const request = {
      COND_PROPER: {
        spras: [{ SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: "" }]
      },
      COND_CUSTOM: {
        propt: [
          { SIGN: "I", OPTION: "EQ", LOW: "ISCSU", HIGH: "" },
          { SIGN: "I", OPTION: "EQ", LOW: "DRAWI", HIGH: "" },
          { SIGN: "I", OPTION: "EQ", LOW: "MEASU", HIGH: "" },
          { SIGN: "I", OPTION: "EQ", LOW: "DRESH", HIGH: "" },
          { SIGN: "I", OPTION: "EQ", LOW: "DRESI", HIGH: "" },
          { SIGN: "I", OPTION: "EQ", LOW: "TESTP", HIGH: "" },
        ],
        spras: [{ SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: "" }],
        ordtp: [{ SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: "" }, { SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: "" }],
        loekz: [{ SIGN: "I", OPTION: "NE", LOW: "X", HIGH: "" }],
      },
      COND_CUSTOMP: {
        propt: [{ SIGN: "I", OPTION: "EQ", LOW: "RMIMG", HIGH: "" }, { SIGN: "I", OPTION: "EQ", LOW: "URGEN", HIGH: "" }],
        spras: [{ SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: "" }],
        ordtp: [{ SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: "" }, { SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: "" }],
        loekz: [{ SIGN: "I", OPTION: "NE", LOW: "X", HIGH: "" }],
      },
    };
    const res = await fetch("/eis/measureData/getDictionary/E", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      credentials: "include",
      body: JSON.stringify(request),
    });
    return res.json();
  });

  writeFileSync(path.join(OUT_DIR, "dictionary-E.json"), JSON.stringify(dictResult, null, 2));
  console.log("flag:", dictResult.flag);

  if (dictResult.data) {
    const keys = Object.keys(dictResult.data);
    console.log("data keys:", keys.join(", "));

    for (const key of keys) {
      const arr = dictResult.data[key];
      if (Array.isArray(arr)) {
        console.log(`${key}: ${arr.length} items`);
        if (arr.length > 0) {
          console.log(`  First: ${JSON.stringify(arr[0]).slice(0, 300)}`);
        }
      }
    }
  }

  // Also try getCategoryDictionary for BB (suit jackets)
  console.log("\nFetching getCategoryDictionary/E for BB…");
  const catDictResult = await page.evaluate(async () => {
    const res = await fetch("/eis/measureData/getCategoryDictionary/E", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      credentials: "include",
      body: JSON.stringify({ mtypb: "BB" }),
    });
    return res.json();
  });

  writeFileSync(path.join(OUT_DIR, "category-dict-BB.json"), JSON.stringify(catDictResult, null, 2));
  console.log("getCategoryDictionary flag:", catDictResult.flag);
  if (catDictResult.data) {
    const keys = Object.keys(catDictResult.data);
    console.log("data keys:", keys.join(", "));
    for (const key of keys) {
      const arr = catDictResult.data[key];
      if (Array.isArray(arr)) {
        console.log(`${key}: ${arr.length} items`);
        if (arr.length > 0) {
          console.log(`  First: ${JSON.stringify(arr[0]).slice(0, 300)}`);
        }
      }
    }
  }

  await browser.close();
  console.log("\nDone. Check factory-screenshots/dictionary-E.json");
}

main().catch(e => { console.error(e); process.exit(1); });
