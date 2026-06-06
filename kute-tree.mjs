// kute-tree.mjs — fetch the full craft option tree for each garment category
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
      res.on("end", () => { try { resolve({ status: res.statusCode, json: JSON.parse(body), body }); } catch(e) { resolve({ status: res.statusCode, raw: body.slice(0, 500) }); } });
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
  page.on("response", async res => {
    if (res.url().includes("/oauth/token") && !token) {
      try { const j = await res.json(); if (j?.data?.access_token) token = j.data.access_token; } catch(_) {}
    }
  });
  await page.goto(`${BASE}/system/login`, { waitUntil: "networkidle2" });
  await page.type("#username", USER);
  await page.type("#password", PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
  await delay(500);
  await browser.close();
  return token;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const token = await getToken();
  console.log("Token:", token.slice(0, 30) + "...");

  // Categories: Jacket=2 (code 1_2_), Pants=1001 (code 1_1001_), Vest=1002 (code 1_1002_), Shirt=1100
  const categories = [
    { id: 2,    name: "jacket",   code: "1_2_",     ecode: "MXF" },
    { id: 1001, name: "trousers", code: "1_1001_",  ecode: "MXK" },
    { id: 1002, name: "vest",     code: "1_1002_",  ecode: "MMJ" },
    { id: 1100, name: "shirt",    code: "1_1100_",  ecode: null  },
  ];

  // Probe tree endpoints for jacket
  console.log("\n=== Tree endpoint probes for Jacket (id=2) ===");
  const treeEndpoints = [
    `/api/craft/craft/craft/selectCraftTree?categoryId=2`,
    `/api/craft/craft/craft/selectCraftTree?clothCategoryId=2`,
    `/api/craft/craft/craft/selectCraftTree?id=2`,
    `/api/craft/craft/craft/codeSelectCraftTree/1_2_`,
    `/api/craft/craft/craft/codeSelectCraftTree/2`,
    `/api/craft/craft/craft/codeSelectCardingCraftTree/1_2_`,
    `/api/craft/craft/craft/codeSelectCardingCraftTree/2`,
    `/api/craft/craft/craft/getCategoryAll?categoryId=2`,
    `/api/craft/craft/craft/getCategoryAll?clothCategoryId=2`,
    `/api/craft/craft/craft/selectExtensionCraftTree?categoryId=2&extend=MXF`,
    `/api/craft/craft/craft/selectExtensionCraftTree?clothCategoryId=2`,
    `/api/craft/craft/craft/getCraftById/2`,
    `/api/craft/craftvwithq/public/2`,
    `/api/craft/craftvwithq/public/1_2_`,
    `/api/craft/craft/craft/getClothAlone?categoryId=2`,
    `/api/craft/craft/craft/getClothAloneAll?categoryId=2`,
    `/api/craft/craft/craft-default/showCategories?clothCategoryId=2`,
    `/api/craft/craft/craft-default/showSingleCategories?clothCategoryId=2`,
    `/api/craft/dict-system/dictSystemById?id=7`,
    `/api/craft/dict-system/dictSystemById/7`,
  ];

  for (const ep of treeEndpoints) {
    const res = await apiGet(token, ep);
    const ok = res.json?.code === "0";
    const hasData = ok && res.json?.data && JSON.stringify(res.json.data) !== "null";
    const dataLen = Array.isArray(res.json?.data) ? res.json.data.length : (res.json?.data ? "obj" : "null");
    if (hasData || (!ok && res.status === 200)) {
      console.log(`${hasData ? "✓" : "?"} ${ep} → HTTP${res.status} code:${res.json?.code} len:${dataLen}`);
      if (hasData) {
        const sample = JSON.stringify(res.json.data).slice(0, 300);
        console.log(`  Data: ${sample}`);
        if (ep.includes("getCraftById/2")) {
          writeFileSync(path.join(OUT_DIR, "craft-id-2.json"), JSON.stringify(res.json.data, null, 2));
        }
      }
    }
  }

  // Now fetch the full tree starting from craft ID 2 (Jacket) recursively
  console.log("\n=== Fetching craft tree recursively from getCraftById ===");

  async function fetchCraftNode(id, depth = 0) {
    const res = await apiGet(token, `/api/craft/craft/craft/getCraftById/${id}`);
    if (!res.json?.data) return null;
    const node = res.json.data;
    return node;
  }

  // Get jacket node (id=2)
  const jacketNode = await fetchCraftNode(2);
  if (jacketNode) {
    console.log("Jacket node:", JSON.stringify(jacketNode).slice(0, 400));
    writeFileSync(path.join(OUT_DIR, "jacket-root.json"), JSON.stringify(jacketNode, null, 2));
  }

  // The getDesignInfo craftIds for jacket are: [7, 10, 12, 13, 42, 54, ...]
  // Let's fetch the first 20 to understand the structure
  const sampleIds = [2, 7, 10, 12, 13, 42, 54, 55, 57, 58, 59, 60, 61, 62, 63, 64, 66, 67, 68, 69, 70];
  console.log("\n=== Sample craft nodes (IDs from getDesignInfo) ===");
  const sampleNodes = {};
  for (const id of sampleIds) {
    const res = await apiGet(token, `/api/craft/craft/craft/getCraftById/${id}`);
    if (res.json?.data) {
      const n = res.json.data;
      const imgInfo = n.image || n.img || n.realPic || "";
      console.log(`  ID ${id}: pid=${n.pid} en="${n.en}" code=${n.code} ecode=${n.ecode} image=${imgInfo ? "yes" : "no"} | ${JSON.stringify(n).slice(0,150)}`);
      sampleNodes[id] = n;
    }
  }

  writeFileSync(path.join(OUT_DIR, "sample-nodes.json"), JSON.stringify(sampleNodes, null, 2));

  // Try selectCategoryByPid to get children of a node
  console.log("\n=== Testing selectCategoryByPid ===");
  for (const pid of [2, 7]) {
    const res = await apiGet(token, `/api/craft/craft/craft/selectCategoryByPid/${pid}`);
    const ok = res.json?.code === "0";
    const len = Array.isArray(res.json?.data) ? res.json.data.length : 0;
    console.log(`  selectCategoryByPid/${pid} → code:${res.json?.code} items:${len}`);
    if (ok && len > 0) {
      const sample = res.json.data.slice(0, 3).map(n => `id=${n.id} en="${n.en}" img=${n.image ? "yes" : "no"}`).join(", ");
      console.log(`  Sample: ${sample}`);
      writeFileSync(path.join(OUT_DIR, `children-of-${pid}.json`), JSON.stringify(res.json.data, null, 2));
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
