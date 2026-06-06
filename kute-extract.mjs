// kute-extract.mjs — extract full design option tree + download all images for all categories
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync, createWriteStream, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots", "kute");

const USER = "LABDP";
const PASS = "Badslag91";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const CATEGORIES = [
  { id: 2,    name: "jacket",   ecode: "MXF" },
  { id: 1001, name: "trousers", ecode: "MXK" },
  { id: 1002, name: "vest",     ecode: "MMJ" },
  { id: 1100, name: "shirt",    ecode: null  },
];

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function apiGet(token, urlPath) {
  return new Promise((resolve) => {
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
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { resolve(null); } });
    }).on("error", () => resolve(null));
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    if (existsSync(dest)) { resolve(true); return; }
    mkdirSync(path.dirname(dest), { recursive: true });
    const file = createWriteStream(dest);
    https.get(url, { rejectUnauthorized: false }, (res) => {
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
  await page.goto("https://www.kutetailor.net/system/login", { waitUntil: "networkidle2" });
  await page.type("#username", USER);
  await page.type("#password", PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
  await delay(500);
  await browser.close();
  return token;
}

// Recursively walk tree nodes and collect all leaf options with images
function walkTree(nodes, sectionPath, results) {
  for (const node of nodes) {
    const isLeaf = !node.childrens || node.childrens.length === 0;
    const hasImage = node.image && typeof node.image === "string" && node.image.startsWith("http");
    const hasActual = node.actualUrl && typeof node.actualUrl === "string" && node.actualUrl.startsWith("http");

    if (isLeaf && (hasImage || node.ecode)) {
      results.push({
        id: node.id,
        en: node.en,
        ecode: node.ecode || "",
        code: node.code,
        image: node.image || null,
        actualUrl: node.actualUrl || null,
        section: sectionPath,
      });
    }

    if (!isLeaf) {
      const childPath = sectionPath + (node.en ? ` > ${node.en}` : "");
      walkTree(node.childrens, childPath, results);
    }
  }
}

async function processCategory(token, cat) {
  console.log(`\n=== ${cat.name.toUpperCase()} (id=${cat.id}) ===`);
  const catDir = path.join(OUT_DIR, cat.name);
  mkdirSync(catDir, { recursive: true });

  const res = await apiGet(token, `/api/craft/craft/craft/selectCraftTree?id=${cat.id}`);
  if (!res || res.code !== "0" || !Array.isArray(res.data)) {
    console.log(`  ERROR: no data`);
    return [];
  }

  const sections = res.data;
  console.log(`  Sections: ${sections.length}`);
  writeFileSync(path.join(catDir, "tree.json"), JSON.stringify(sections, null, 2));

  // For each top-level section, fetch deeper tree if needed
  const allOptions = [];

  for (const section of sections) {
    if (section.component === "ISFABRIC") {
      console.log(`  [skip] ${section.en} (fabric section)`);
      continue;
    }

    // Check if section already has children embedded
    if (section.childrens && section.childrens.length > 0) {
      const sectionResults = [];
      walkTree(section.childrens, section.en, sectionResults);
      console.log(`  ${section.en}: ${sectionResults.length} options (from embedded childrens)`);
      allOptions.push(...sectionResults);
    } else {
      // Try fetching children via selectCraftTree?id=sectionId
      const childRes = await apiGet(token, `/api/craft/craft/craft/selectCraftTree?id=${section.id}`);
      if (childRes?.code === "0" && Array.isArray(childRes.data) && childRes.data.length > 0) {
        const sectionResults = [];
        walkTree(childRes.data, section.en, sectionResults);
        console.log(`  ${section.en}: ${sectionResults.length} options (from API fetch)`);
        allOptions.push(...sectionResults);
      } else {
        console.log(`  ${section.en}: 0 options`);
      }
    }
  }

  console.log(`  Total options: ${allOptions.length}`);
  writeFileSync(path.join(catDir, "options.json"), JSON.stringify(allOptions, null, 2));

  // Download images
  let downloaded = 0, skipped = 0, failed = 0;
  for (const opt of allOptions) {
    if (!opt.image) continue;

    const ext = opt.image.split(".").pop().split("?")[0] || "jpg";
    const safeLabel = opt.en.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50);
    const filename = `${opt.ecode || opt.id}_${safeLabel}.${ext}`;
    const sectionSafe = opt.section.replace(/[^a-zA-Z0-9._\- >]/g, "_").replace(/ > /g, "/").slice(0, 100);
    const dest = path.join(catDir, sectionSafe, filename);

    mkdirSync(path.dirname(dest), { recursive: true });
    if (existsSync(dest)) { skipped++; continue; }

    const ok = await downloadFile(opt.image, dest);
    if (ok) { downloaded++; }
    else { failed++; console.log(`  FAIL: ${opt.image}`); }

    if ((downloaded + failed) % 50 === 0 && downloaded + failed > 0) {
      process.stdout.write(`  ... ${downloaded} downloaded, ${failed} failed, ${skipped} skipped\r`);
    }
  }
  console.log(`  Downloaded: ${downloaded}, skipped: ${skipped}, failed: ${failed}`);

  return allOptions;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const token = await getToken();
  if (!token) { console.error("Failed to get token"); process.exit(1); }
  console.log("Token:", token.slice(0, 30) + "...");

  const allManifest = {};

  for (const cat of CATEGORIES) {
    const options = await processCategory(token, cat);
    allManifest[cat.name] = { categoryId: cat.id, ecode: cat.ecode, optionCount: options.length };
  }

  writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(allManifest, null, 2));
  console.log("\n=== DONE ===");
  console.log(JSON.stringify(allManifest, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
