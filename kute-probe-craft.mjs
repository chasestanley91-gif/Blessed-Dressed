// kute-probe-craft.mjs — probe admin craft APIs and search JS for the design options loader
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

function apiGet(token, urlPath, params = "") {
  return new Promise((resolve, reject) => {
    const fullPath = params ? `${urlPath}?${params}` : urlPath;
    const opts = {
      hostname: "www.kutetailor.net",
      path: fullPath,
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      rejectUnauthorized: false,
    };
    https.get(opts, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => { try { resolve({ status: res.statusCode, data: JSON.parse(body) }); } catch(e) { resolve({ status: res.statusCode, raw: body.slice(0, 300) }); } });
    }).on("error", reject);
  });
}

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, rejectUnauthorized: false }, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

async function getToken() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH, headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  let token = null;
  const page = await browser.newPage();
  const jsFiles = [];
  page.on("response", async res => {
    const url = res.url();
    if (url.includes("/oauth/token") && !token) {
      try { const j = await res.json(); if (j?.data?.access_token) token = j.data.access_token; } catch(_) {}
    }
    if (res.headers()["content-type"]?.includes("javascript") && url.includes("kutetailor")) {
      jsFiles.push(url);
    }
  });
  await page.goto(`${BASE}/system/login`, { waitUntil: "networkidle2" });
  await page.type("#username", USER);
  await page.type("#password", PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await delay(500);
  await browser.close();
  return { token, jsFiles };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const { token, jsFiles } = await getToken();
  console.log("Token:", token?.slice(0,30) + "...");
  console.log("JS files:", jsFiles.length);

  // First: search main app JS for design-option loading patterns
  const mainJs = jsFiles.find(u => u.includes("app."));
  if (mainJs) {
    console.log("\nSearching app JS for craft loading patterns...");
    const js = await fetchRaw(mainJs);

    // Find all API URL strings in the JS
    const urlMatches = [...js.matchAll(/url\s*:\s*["'`]([^"'`]+)["'`]/g)].map(m => m[1]);
    const craftUrls = urlMatches.filter(u => u.includes("craft") || u.includes("dict") || u.includes("style"));
    const uniqueCraftUrls = [...new Set(craftUrls)];
    console.log("Craft-related API URLs found in JS:");
    uniqueCraftUrls.forEach(u => console.log(" ", u));
    writeFileSync(path.join(OUT_DIR, "js-craft-urls.txt"), uniqueCraftUrls.join("\n"));

    // Search for setCraft function body
    const setCraftIdx = js.indexOf("setCraft");
    if (setCraftIdx > -1) {
      console.log("\nsetCraft context:");
      console.log(js.slice(Math.max(0, setCraftIdx - 100), setCraftIdx + 500));
    }

    // Search for how craftList is populated
    const craftListIdx = js.indexOf("getCraftListAction");
    if (craftListIdx > -1) {
      console.log("\ngetCraftListAction context:");
      console.log(js.slice(Math.max(0, craftListIdx - 50), craftListIdx + 400));
    }

    // Search for "interfaceMsg" usage (seen in the craftList JS)
    const interfaceMsgIdx = js.indexOf("interfaceMsg");
    if (interfaceMsgIdx > -1) {
      console.log("\ninterfaceMsg context:");
      console.log(js.slice(Math.max(0, interfaceMsgIdx - 100), interfaceMsgIdx + 600));
    }
  }

  // Probe all found API endpoints
  console.log("\n=== Probing craft APIs ===");
  const endpointsToTry = [
    // From JS scan
    ["/api/craft/admin/dict-category/listDictSystem", "categoryId=2"],
    ["/api/craft/admin/dict-category/listDictSystem", "categoryId=2&clothCategory=2"],
    ["/api/craft/admin/styleCraft/getCraftList", "categoryId=2"],
    ["/api/craft/admin/styleCraft/getCraftList", "clothCategoryId=2"],
    ["/api/craft/admin/styleCraft/getCraftList", "categoryId=2&clothCategoryId=2"],
    // Craft-item by ID
    ["/api/craft/craft/craft/getCraftById/7", ""],
    ["/api/craft/craft/craft/getCraftById", "id=7"],
    ["/api/craft/craft/craft/selectById", "id=7"],
    // Batch fetch
    ["/api/craft/craft/craft/listByIds", "ids=7,10,12,13"],
    ["/api/craft/craft/craft/getCraftByIds", "ids=7,10,12,13"],
    ["/api/craft/craft/craft/getCraftListByIds", "ids=7,10,12,13"],
    // Dict-system full list
    ["/api/craft/dict-system/getDictSystemList", "categoryId=2"],
    ["/api/craft/dict-system/getAllByCategory", "category=2"],
    ["/api/craft/dict-system/getDictSystemAll", ""],
    // Dict-basic (design options)
    ["/api/craft/dict-basic/getCraftList", "categoryId=2"],
    ["/api/craft/dict-basic/getCraftListByCategory", "categoryId=2"],
    ["/api/craft/dict-basic/listByClothCategory", "clothCategoryId=2"],
    ["/api/craft/dict-basic/getAll", "clothCategoryId=2"],
    // Interface msg (from craftList JS)
    ["/api/craft/craft/craft/getInterfaceMsg", "categoryId=2"],
    ["/api/craft/craft/craft/getInterfaceMsgByCategory", "categoryId=2"],
    ["/api/craft/craft/craft/interfaceMsg", "categoryId=2"],
  ];

  const probeResults = {};
  for (const [path, params] of endpointsToTry) {
    try {
      const res = await apiGet(token, path, params);
      const ok = res.data?.code === "0";
      const dataStr = JSON.stringify(res.data?.data);
      const hasData = ok && res.data?.data && dataStr !== "null" && dataStr !== "[]";
      const len = Array.isArray(res.data?.data) ? res.data.data.length : (res.data?.data ? "obj" : 0);
      if (hasData || res.status !== 200) {
        console.log(`${hasData ? "✓" : res.status === 200 ? "?" : "✗"} ${path}?${params} → HTTP${res.status} code:${res.data?.code} len:${len} | ${dataStr?.slice(0,150)}`);
      }
      if (hasData) probeResults[path + "?" + params] = res.data.data;
    } catch(e) {
      // silent
    }
  }

  if (Object.keys(probeResults).length > 0) {
    writeFileSync(path.join(OUT_DIR, "craft-probe-results.json"), JSON.stringify(probeResults, null, 2));
    console.log("\nSaved craft-probe-results.json");
  } else {
    console.log("\nNo results found from probing.");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
