// kute-find-apis.mjs — find craft detail APIs by scanning JS bundle + navigating design flow
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots", "kute");

const USER = "LABDP";
const PASS = "Badslag91";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://www.kutetailor.net";

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function apiGet(token, urlPath) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "www.kutetailor.net",
      path: urlPath,
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      rejectUnauthorized: false,
    };
    https.get(opts, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { resolve({ raw: body.slice(0, 300) }); } });
    }).on("error", reject);
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false,
    args: ["--no-sandbox", "--window-size=1400,900", "--window-position=0,0"],
    defaultViewport: null,
  });

  let token = null;
  const captured = [];
  const jsUrls = [];

  const page = await browser.newPage();
  page.on("response", async res => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (url.includes("/oauth/token") && !token) {
      try { const j = await res.json(); if (j?.data?.access_token) { token = j.data.access_token; console.log("Token:", token.slice(0,30)+"..."); } } catch(_) {}
    }
    if (url.includes("kutetailor.net/api") && ct.includes("json")) {
      try { const body = await res.text(); captured.push({ url: url.replace(BASE, ""), body: body.slice(0, 8000) }); } catch(_) {}
    }
    if (url.includes("kutetailor.net") && ct.includes("javascript") && url.includes("chunk")) {
      jsUrls.push(url);
    }
  });

  // Login
  await page.goto(`${BASE}/system/login`, { waitUntil: "networkidle2" });
  await page.type("#username", USER);
  await page.type("#password", PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await delay(2000);

  console.log("Logged in. Navigating to startDesign...");
  await page.goto(`${BASE}/system/startDesign`, { waitUntil: "networkidle2" });
  await delay(2000);

  // Try to navigate to order design directly
  // The design page URL is likely /system/order/create or /system/design
  const testUrls = [
    `${BASE}/system/order/create?categoryId=2`,
    `${BASE}/system/startDesign?categoryId=2`,
    `${BASE}/system/design?categoryId=2`,
    `${BASE}/system/quickOrder`,
    `${BASE}/system/orderByStyle`,
  ];

  let designPageFound = false;
  for (const url of testUrls) {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    await delay(1000);
    const currentUrl = page.url();
    const text = await page.evaluate(() => document.body.innerText.slice(0, 100));
    console.log(`${url} → ${currentUrl} | ${text.slice(0, 60).replace(/\s+/g,' ')}`);
    if (currentUrl !== `${BASE}/system/startDesign` && currentUrl !== `${BASE}/system/login`) {
      designPageFound = true;
      console.log("Found accessible page:", currentUrl);
      await page.screenshot({ path: path.join(OUT_DIR, "design-direct.png") });
      await delay(3000);
      break;
    }
  }

  // Go back to startDesign and try the UI flow with visible browser
  await page.goto(`${BASE}/system/startDesign`, { waitUntil: "networkidle2" });
  await delay(2000);

  console.log("\n>>> Navigate to the design options page in the browser <<<");
  console.log(">>> (Select garment type, click NEXT, get to where you see style options) <<<");
  console.log(">>> Script will auto-capture all API calls <<<");
  console.log(">>> Waiting 90 seconds for navigation...\n");

  // Wait and watch for new API calls that look like craft/design data
  let prevCount = captured.length;
  for (let i = 0; i < 45; i++) {
    await delay(2000);
    const newCalls = captured.slice(prevCount);
    if (newCalls.length > 0) {
      const newPaths = newCalls.map(c => c.url.split("?")[0]);
      const interesting = newPaths.filter(p => p.includes("craft") && !p.includes("lining"));
      if (interesting.length > 0) {
        console.log(`New API calls: ${interesting.join(", ")}`);
      }
      prevCount = captured.length;
    }
    process.stdout.write(`\r  ${i*2}s elapsed, ${captured.length} total API calls`);
  }

  console.log(`\n\nTotal captured: ${captured.length} API calls`);
  writeFileSync(path.join(OUT_DIR, "api-design-flow.json"), JSON.stringify(captured, null, 2));

  // Show all unique paths
  const paths = [...new Set(captured.map(c => c.url.split("?")[0]))];
  console.log("All API paths:");
  paths.forEach(p => console.log(" ", p));

  await browser.close();

  // Now use token to scan getDictSystem categories looking for craft options with images
  if (!token) { console.log("No token for further probing"); return; }

  console.log("\n=== Scanning getDictSystem categories for craft options with images ===");
  const catResults = {};
  // Try categories that might contain design options (style choices)
  const categoriesToTry = [
    // Common design option category IDs
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
    120, 121, 122, 123, 124, 125, 130, 140, 150, 155, 156, 157, 158,
    200, 201, 202, 203, 204, 205, 210, 220, 230, 240, 250,
    300, 400, 500,
  ];

  for (const cat of categoriesToTry) {
    try {
      const res = await apiGet(token, `/api/craft/dict-system/getDictSystem?category=${cat}`);
      if (res.code === "0" && Array.isArray(res.data) && res.data.length > 0) {
        // Check if any items have realPic (image URL)
        const withImg = res.data.filter(d => d.realPic || d.expressUrl?.includes("http") || d.img);
        const sample = res.data[0];
        console.log(`  cat ${cat}: ${res.data.length} items, ${withImg.length} with images | first: "${sample.en || sample.name}" code:${sample.code}`);
        if (withImg.length > 0) {
          catResults[cat] = res.data;
          console.log(`    IMAGE FOUND: ${withImg[0].realPic || withImg[0].expressUrl || withImg[0].img}`);
        }
      }
    } catch(_) {}
  }

  writeFileSync(path.join(OUT_DIR, "category-scan.json"), JSON.stringify(catResults, null, 2));
  console.log("Saved category-scan.json");

  // Also try the craft/craft API with a broader search
  console.log("\n=== Trying broader craft endpoints ===");
  const broadProbes = [
    `/api/craft/dict-system/getDictSystem?category=156&extend=MXF&size=100`,
    `/api/craft/dict-system/getDictSystemList?categoryId=2`,
    `/api/craft/dict-system/getCraftList?categoryId=2`,
    `/api/craft/craft/craft/getCraftList?categoryId=2&extend=MXF`,
    `/api/craft/craft/craft/listCraftByCategory?categoryId=2`,
    `/api/craft/craft/craft/craftList?categoryId=2`,
    `/api/craft/craft/craft/getCraft?categoryId=2`,
    `/api/craft/craft/craft/queryAll?categoryId=2`,
    `/api/craft/craft/craft/getAll?categoryId=2`,
  ];

  for (const ep of broadProbes) {
    try {
      const res = await apiGet(token, ep);
      const hasData = res.code === "0" && res.data && (Array.isArray(res.data) ? res.data.length > 0 : true);
      if (hasData) {
        const sample = JSON.stringify(res.data).slice(0, 200);
        console.log(`✓ ${ep.split("?")[0]} → ${sample}`);
      }
    } catch(_) {}
  }
}

main().catch(e => { console.error(e); process.exit(1); });
