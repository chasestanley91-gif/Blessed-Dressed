// kute-craft-api.mjs — find the craft options API with images
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
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { resolve({ raw: body.slice(0, 200) }); } });
    }).on("error", reject);
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  // Login and get token
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let token = null;
  const captured = [];

  const page = await browser.newPage();
  page.on("response", async res => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (url.includes("/oauth/token") && !token) {
      try { const j = await res.json(); if (j?.data?.access_token) token = j.data.access_token; } catch(_) {}
    }
    if (url.includes("kutetailor.net/api") && ct.includes("json")) {
      try {
        const body = await res.text();
        captured.push({ url: url.replace(BASE, ""), body: body.slice(0, 5000) });
      } catch(_) {}
    }
  });

  await page.goto(`${BASE}/system/login`, { waitUntil: "networkidle2" });
  await page.type("#username", USER);
  await page.type("#password", PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await delay(2000);
  console.log("Token:", token?.slice(0, 30) + "...");

  // Navigate to startDesign
  await page.goto(`${BASE}/system/startDesign`, { waitUntil: "networkidle2" });
  await delay(2000);

  // Click "Sample Garment" checkbox/button to skip customer requirement
  const sampleClicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("*"));
    const el = els.find(e => e.textContent.trim() === "Sample Garment" && e.offsetParent !== null);
    if (el) {
      // Try clicking the parent label/div
      const clickTarget = el.closest("[class*='sample'], label, .el-checkbox") || el;
      clickTarget.click();
      return { found: true, tag: clickTarget.tagName, class: clickTarget.className?.slice(0,60) };
    }
    return { found: false };
  });
  console.log("Sample Garment click:", JSON.stringify(sampleClicked));
  await delay(1000);

  // Select Men's Jacket (first one)
  const jacketClicked = await page.evaluate(() => {
    const jackets = Array.from(document.querySelectorAll(".category-names-stitle, .cate-item"))
      .filter(el => el.textContent.trim() === "Jacket" && el.offsetParent !== null);
    if (jackets[0]) { jackets[0].click(); return { found: true }; }
    return { found: false };
  });
  console.log("Jacket click:", JSON.stringify(jacketClicked));
  await delay(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "before-next.png") });

  // Click NEXT button
  const nextClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "NEXT");
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log("NEXT clicked:", nextClicked);
  await delay(4000);
  console.log("URL after NEXT:", page.url());
  await page.screenshot({ path: path.join(OUT_DIR, "after-next2.png") });

  // If still on startDesign, try different approach
  if (page.url().includes("startDesign")) {
    console.log("Still on startDesign. Trying ADD NEW CUSTOMER...");
    // Try clicking ADD NEW CUSTOMER
    const addCust = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, div, a")).find(b =>
        /ADD NEW CUSTOMER|new customer/i.test(b.textContent) && b.offsetParent !== null
      );
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log("ADD NEW CUSTOMER click:", addCust);
    await delay(2000);
    await page.screenshot({ path: path.join(OUT_DIR, "add-customer.png") });

    // Fill minimal customer info
    const customerInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input[type=text], input[type=email]"))
        .filter(i => i.offsetParent !== null)
        .slice(0, 3)
        .map(i => ({ id: i.id, placeholder: i.placeholder, name: i.name }));
      return inputs;
    });
    console.log("Customer form inputs:", JSON.stringify(customerInfo));

    // Fill first name field
    if (customerInfo.length > 0) {
      const firstInput = `input[placeholder="${customerInfo[0].placeholder}"]`;
      await page.type(firstInput, "Test").catch(() => {});
      await delay(500);
    }

    // Submit customer form
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b =>
        /confirm|save|submit|ok|create/i.test(b.textContent) && b.offsetParent !== null
      );
      if (btn) btn.click();
    });
    await delay(2000);
    await page.screenshot({ path: path.join(OUT_DIR, "after-customer.png") });

    // Try NEXT again
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "NEXT");
      if (btn) btn.click();
    });
    await delay(4000);
    console.log("URL after 2nd NEXT:", page.url());
    await page.screenshot({ path: path.join(OUT_DIR, "after-next3.png") });
  }

  await delay(3000);
  const finalUrl = page.url();
  console.log("Final URL:", finalUrl);
  await page.screenshot({ path: path.join(OUT_DIR, "final-page.png") });

  // Check what's on the page now
  const pageInfo = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    text: document.body.innerText.slice(0, 600),
    imgs: Array.from(document.querySelectorAll("img"))
      .filter(i => i.offsetParent !== null && i.src.includes("kutetailor"))
      .slice(0, 10)
      .map(i => i.src),
  }));
  console.log("Page text:", pageInfo.text.slice(0, 400));
  console.log("KuteTailor images:", pageInfo.imgs);

  await delay(3000);

  // Save all captured API calls
  writeFileSync(path.join(OUT_DIR, "api-captures2.json"), JSON.stringify(captured, null, 2));
  console.log(`\nCaptured ${captured.length} API calls`);

  // Show unique paths
  const paths = [...new Set(captured.map(c => c.url.split("?")[0]))];
  console.log("Unique paths:", paths.join("\n  "));

  await browser.close();

  // Now probe craft APIs with the token we have
  if (!token) { console.log("No token"); return; }

  console.log("\n=== Probing craft APIs ===");
  const craftProbes = [
    `/api/craft/dict-system/getDictSystem?category=1`,  // category 1 = craft groups?
    `/api/craft/dict-system/getDictSystem?category=6`,  // jacket crafts?
    `/api/craft/craft/getCraftList?categoryId=2`,
    `/api/craft/craft/getCraftListByType?categoryId=2`,
    `/api/craft/craft/getGroupCraft?categoryId=2`,
    `/api/craft/craft/craft/getCraftGroupByCategory?categoryId=2`,
    `/api/craft/craft/craft/getCraftsByCategory?categoryId=2`,
    `/api/craft/craft/craft/listCraftGroupByCategory?categoryId=2`,
    `/api/craft/craft/craft/getCraftGroupList?categoryId=2`,
    `/api/craft/craft/craft/getCraftInfoList?categoryId=2`,
    `/api/craft/craft/getCraftInfoByGroup?categoryId=2`,
    // Try fetching specific craft IDs from the craftIds list we saw
    `/api/craft/craft/craft/getCraftById?id=7`,
    `/api/craft/dict-system/getDictSystem?category=7`,
    `/api/craft/dict-system/getDictSystem?category=10`,
  ];

  const probeResults = {};
  for (const ep of craftProbes) {
    try {
      const res = await apiGet(token, ep);
      const ok = res.code === "0";
      const dataLen = Array.isArray(res.data) ? res.data.length : (res.data ? "obj" : 0);
      const sample = JSON.stringify(res.data)?.slice(0, 200) || "";
      console.log(`${ok ? "✓" : "✗"} ${ep.split("?")[0]} → ${dataLen} | ${sample}`);
      if (ok && res.data) probeResults[ep] = res;
    } catch(e) {
      console.log(`✗ ${ep} → ${e.message}`);
    }
  }

  writeFileSync(path.join(OUT_DIR, "craft-probe.json"), JSON.stringify(probeResults, null, 2));
  console.log("\nSaved craft-probe.json");
}

main().catch(e => { console.error(e); process.exit(1); });
