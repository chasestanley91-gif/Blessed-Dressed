// kute-scan-js.mjs — scan JS bundle to find craft options API + full design page capture
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

function fetchUrl(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : {},
      rejectUnauthorized: false,
    };
    https.get(opts, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let token = null;
  const captured = [];
  const jsUrls = new Set();

  const page = await browser.newPage();
  page.on("response", async res => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (url.includes("/oauth/token") && !token) {
      try { const j = await res.json(); if (j?.data?.access_token) token = j.data.access_token; } catch(_) {}
    }
    if (url.includes("kutetailor.net/api") && ct.includes("json")) {
      try { const body = await res.text(); captured.push({ url: url.replace(BASE, ""), body: body.slice(0, 10000) }); } catch(_) {}
    }
    if (ct.includes("javascript") && url.includes("kutetailor")) {
      jsUrls.add(url);
    }
  });

  await page.goto(`${BASE}/system/login`, { waitUntil: "networkidle2" });
  await page.type("#username", USER);
  await page.type("#password", PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await delay(1000);
  console.log("Token:", token?.slice(0,30) + "...");

  // Navigate to startDesign to capture JS
  await page.goto(`${BASE}/system/startDesign`, { waitUntil: "networkidle2" });
  await delay(2000);
  console.log(`JS files collected: ${jsUrls.size}`);

  // Navigate to design page
  await page.goto(`${BASE}/system/order/create?categoryId=2`, { waitUntil: "networkidle2", timeout: 20000 }).catch(() => {});
  await delay(3000);
  console.log("JS files after design page:", jsUrls.size);
  console.log("API calls so far:", captured.length);

  await browser.close();

  // Search JS bundles for craft API patterns
  const jsUrlList = [...jsUrls];
  console.log(`\nSearching ${jsUrlList.length} JS files for craft API patterns...`);

  const patterns = [
    /craft.*get/gi,
    /getCraft/g,
    /craftList/g,
    /dictBasic/g,
    /api\/craft\/craft\/craft/g,
    /realPic/g,
    /imgUrl/g,
    /expressUrl/g,
    /craft.*img/gi,
    /getCraftBy/g,
    /listCraft/g,
    /craftDetail/g,
    /craftInfo/g,
    /getCraftGroup/g,
    /craftGroupList/g,
    /\/api\/craft\//g,
  ];

  const findings = {};
  for (const jsUrl of jsUrlList.slice(0, 20)) {
    try {
      const js = await fetchUrl(jsUrl, null);
      if (js.length < 100) continue;

      const matches = {};
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        const found = [];
        let m;
        while ((m = pattern.exec(js)) !== null) {
          // Extract surrounding context (50 chars each side)
          const start = Math.max(0, m.index - 50);
          const end = Math.min(js.length, m.index + m[0].length + 100);
          const ctx = js.slice(start, end).replace(/\s+/g, ' ');
          found.push(ctx);
          if (found.length >= 5) break;
        }
        if (found.length > 0) {
          matches[pattern.source] = found;
        }
      }

      if (Object.keys(matches).length > 0) {
        const name = jsUrl.split("/").pop().slice(0, 30);
        findings[name] = matches;
        console.log(`  ${name}: found patterns: ${Object.keys(matches).join(", ")}`);
      }
    } catch(e) {
      // ignore
    }
  }

  writeFileSync(path.join(OUT_DIR, "js-findings.json"), JSON.stringify(findings, null, 2));
  console.log("\nSaved js-findings.json");

  // Also look for ALL /api/craft/ paths in JS
  console.log("\nSearching all JS for /api/craft/ paths...");
  const apiPaths = new Set();
  for (const jsUrl of jsUrlList) {
    try {
      const js = await fetchUrl(jsUrl, null);
      const matches = js.matchAll(/["']\/api\/craft\/[^"']+["']/g);
      for (const m of matches) {
        apiPaths.add(m[0].replace(/["']/g, ""));
      }
    } catch(_) {}
  }

  console.log("Found API paths in JS:");
  [...apiPaths].sort().forEach(p => console.log(" ", p));
  writeFileSync(path.join(OUT_DIR, "js-api-paths.txt"), [...apiPaths].sort().join("\n"));

  // Now try fetching each unique craft API path with the token
  if (token) {
    console.log("\nProbing discovered API paths...");
    for (const p of apiPaths) {
      if (!p.includes("craft")) continue;
      try {
        const url = `${BASE}${p}?categoryId=2`;
        const body = await fetchUrl(url, token);
        const parsed = JSON.parse(body);
        if (parsed.code === "0" && parsed.data && JSON.stringify(parsed.data) !== "null") {
          const len = Array.isArray(parsed.data) ? parsed.data.length : "obj";
          console.log(`  ✓ ${p} → ${len} items: ${JSON.stringify(parsed.data).slice(0,150)}`);
        }
      } catch(_) {}
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
