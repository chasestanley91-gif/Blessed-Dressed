// kute-scrape.mjs — scrape kutetailor.net design options via REST API
import puppeteer from "puppeteer-core";
import { writeFileSync, createWriteStream, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots", "kute");

const USER = "LABDP";
const PASS = "Badslag91";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://www.kutetailor.net";

// Men's garment categories we care about
const CATEGORIES = [
  { id: 2,    name: "jacket",   ecode: "MXF" },
  { id: 1001, name: "trousers", ecode: "MXK" },
  { id: 1002, name: "vest",     ecode: "MMJ" },
  { id: 1100, name: "shirt",    ecode: null  },
];

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function downloadFile(url, dest, token) {
  return new Promise((resolve) => {
    if (existsSync(dest)) { resolve(true); return; }
    const file = createWriteStream(dest);
    const opts = {
      headers: {
        Authorization: `Bearer ${token}`,
        Referer: BASE,
      },
      rejectUnauthorized: false,
    };
    https.get(url, opts, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(true); });
      } else {
        file.close();
        try { require("fs").unlinkSync(dest); } catch(_) {}
        resolve(false);
      }
    }).on("error", () => { file.close(); resolve(false); });
  });
}

async function apiGet(token, path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "www.kutetailor.net",
      path,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      rejectUnauthorized: false,
    };
    https.get(opts, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { resolve({ raw: body }); }
      });
    }).on("error", reject);
  });
}

async function login() {
  console.log("Getting JWT token via browser...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let token = null;
  const page = await browser.newPage();

  page.on("response", async res => {
    if (res.url().includes("/oauth/token") && !token) {
      try {
        const json = await res.json();
        if (json?.data?.access_token) {
          token = json.data.access_token;
          console.log("Token captured:", token.slice(0, 40) + "...");
        }
      } catch(_) {}
    }
  });

  await page.goto(`${BASE}/system/login`, { waitUntil: "networkidle2" });
  await page.type("#username", USER);
  await page.type("#password", PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await delay(1000);
  await browser.close();

  if (!token) throw new Error("Failed to capture JWT token");
  return token;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const token = await login();

  // First, explore what craft/design APIs exist by capturing them during design flow
  console.log("\nExploring available design-option APIs...");

  // Try known API patterns for design options
  const probeEndpoints = [
    `/api/craft/craft/listCraft`,
    `/api/craft/craft/craft/listCraft`,
    `/api/craft/design/getCraftList`,
    `/api/craft/craft/getCraftListByCategory?categoryId=2`,
    `/api/craft/craft/craft/getCraftList?categoryId=2`,
    `/api/craft/craft/craft/listAllCraftByRole?categoryId=2`,
    `/api/craft/dict-system/getDictSystem?category=2`,
    `/api/craft/dict-system/listByCategory?categoryId=2`,
    `/api/craft/tech/getCraftTechList?categoryId=2`,
  ];

  const results = {};
  for (const ep of probeEndpoints) {
    try {
      const res = await apiGet(token, ep);
      const hasData = res.code === "0" && res.data && (Array.isArray(res.data) ? res.data.length > 0 : Object.keys(res.data).length > 0);
      console.log(`  ${hasData ? "✓" : "✗"} ${ep} → code:${res.code} data:${JSON.stringify(res.data)?.slice(0,100)}`);
      if (hasData) results[ep] = res;
    } catch(e) {
      console.log(`  ✗ ${ep} → error: ${e.message}`);
    }
  }

  writeFileSync(path.join(OUT_DIR, "api-probe.json"), JSON.stringify(results, null, 2));
  console.log("\nSaved probe results to api-probe.json");

  // Now do a browser-based capture during actual design flow to find the right endpoint
  console.log("\nCapturing API calls during design flow...");
  const browser2 = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const captured = [];
  const page2 = await browser2.newPage();
  await page2.setExtraHTTPHeaders({ Authorization: `Bearer ${token}` });

  page2.on("response", async res => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (url.includes("kutetailor.net/api") && ct.includes("json")) {
      try {
        const body = await res.text();
        captured.push({ url: url.replace(BASE, ""), status: res.status(), body: body.slice(0, 3000) });
      } catch(_) {}
    }
  });

  // Login again in this browser
  await page2.goto(`${BASE}/system/login`, { waitUntil: "networkidle2" });
  await page2.type("#username", USER);
  await page2.type("#password", PASS);
  await page2.keyboard.press("Enter");
  await page2.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});

  // Navigate to startDesign and click Jacket
  await page2.goto(`${BASE}/system/startDesign`, { waitUntil: "networkidle2" });
  await delay(3000);
  await page2.screenshot({ path: path.join(OUT_DIR, "startDesign.png") });

  // Click Men's Jacket
  const clicked = await page2.evaluate(() => {
    const els = Array.from(document.querySelectorAll("*"));
    // Find clickable element with text "Jacket" under "Men" section
    const jacketEl = els.find(el =>
      el.textContent.trim() === "Jacket" &&
      el.children.length === 0 &&
      el.offsetParent !== null
    );
    if (jacketEl) { jacketEl.click(); return { found: true, tag: jacketEl.tagName, class: jacketEl.className }; }
    return { found: false };
  });
  console.log("Clicked Jacket:", JSON.stringify(clicked));
  await delay(2000);
  await page2.screenshot({ path: path.join(OUT_DIR, "after-jacket-click.png") });

  // Click NEXT
  await page2.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "NEXT");
    if (btn) btn.click();
  });
  await delay(3000);
  await page2.screenshot({ path: path.join(OUT_DIR, "after-next.png") });
  console.log("URL after NEXT:", page2.url());

  // Wait for design options to load
  await delay(3000);
  await page2.screenshot({ path: path.join(OUT_DIR, "design-page.png") });
  console.log("URL on design page:", page2.url());

  // Dump the page structure to find design options
  const designInfo = await page2.evaluate(() => {
    // Look for option cards/tiles with images
    const imgEls = Array.from(document.querySelectorAll("img")).filter(i => i.offsetParent !== null).slice(0, 10);
    const allText = document.body.innerText.slice(0, 800);
    const dataEls = Array.from(document.querySelectorAll("[data-id], [data-code], [data-craft-id]")).slice(0, 10).map(el => ({
      tag: el.tagName,
      attrs: Array.from(el.attributes).reduce((a,b) => { a[b.name]=b.value; return a; }, {}),
      text: el.textContent.trim().slice(0,50),
    }));
    return {
      url: location.href,
      bodyText: allText,
      imgs: imgEls.map(i => ({ src: i.src.slice(0,80), alt: i.alt, class: i.className.slice(0,40) })),
      dataEls,
    };
  });
  console.log("Design page URL:", designInfo.url);
  console.log("Body text:", designInfo.bodyText.slice(0, 400));
  console.log("Images:", JSON.stringify(designInfo.imgs));
  console.log("Data elements:", JSON.stringify(designInfo.dataEls));

  await delay(5000); // wait for more API calls

  writeFileSync(path.join(OUT_DIR, "api-captures.json"), JSON.stringify(captured, null, 2));
  console.log(`\nCaptured ${captured.length} API calls → api-captures.json`);

  // Print all unique API paths captured
  const apiPaths = [...new Set(captured.map(c => c.url.split("?")[0]))];
  console.log("Unique API paths:");
  apiPaths.forEach(p => console.log(" ", p));

  await browser2.close();
}

main().catch(e => { console.error(e); process.exit(1); });
