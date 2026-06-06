// kute-full-tree.mjs — walk the full craft tree and extract all option images
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
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { resolve(null); } });
    }).on("error", () => resolve(null));
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    if (existsSync(dest)) { resolve(true); return; }
    const file = createWriteStream(dest);
    https.get(url, { rejectUnauthorized: false }, (res) => {
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

function extractImageUrls(node) {
  const urls = [];
  // Check various image fields
  if (node.image && typeof node.image === "string" && node.image.includes("http")) urls.push(node.image);
  if (node.img && typeof node.img === "string" && node.img.includes("http")) urls.push(node.img);
  if (node.realPic && Array.isArray(node.realPic)) {
    node.realPic.forEach(r => { if (r.filePath) urls.push(r.filePath); });
  }
  if (node.attachments && Array.isArray(node.attachments)) {
    node.attachments.forEach(a => { if (a.filePath) urls.push(a.filePath); if (a.path) urls.push(a.path); });
  }
  if (node.paths && Array.isArray(node.paths)) {
    node.paths.forEach(p => { if (typeof p === "string") urls.push(p); else if (p.filePath) urls.push(p.filePath); });
  }
  return urls;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const token = await getToken();
  console.log("Token:", token.slice(0, 30) + "...");

  // Get full craft tree for jacket (id=2) via selectCraftTree
  console.log("\n=== Getting full selectCraftTree for Jacket (id=2) ===");
  const treeRes = await apiGet(token, `/api/craft/craft/craft/selectCraftTree?id=2`);
  if (treeRes?.code === "0" && treeRes.data) {
    console.log(`Top-level sections: ${treeRes.data.length}`);
    writeFileSync(path.join(OUT_DIR, "jacket-tree-top.json"), JSON.stringify(treeRes.data, null, 2));

    // Show each section and check for images
    for (const section of treeRes.data) {
      const imgs = extractImageUrls(section);
      console.log(`  Section ${section.id}: "${section.en}" (${section.code}) childFn:${section.childFunction} images:${imgs.length}`);
      if (imgs.length > 0) console.log(`    Images: ${imgs.join(", ")}`);

      // If this section has childrens already in the response, process them
      if (section.childrens && section.childrens.length > 0) {
        let optCount = 0;
        section.childrens.forEach(child => {
          const cImgs = extractImageUrls(child);
          optCount += cImgs.length;
        });
        console.log(`    Children in response: ${section.childrens.length} (${optCount} with images)`);
      }
    }

    // Get children of one section to understand image structure
    const firstSection = treeRes.data[0];
    console.log(`\n=== Fetching children of section ${firstSection.id} ("${firstSection.en}") ===`);
    const childRes = await apiGet(token, `/api/craft/craft/craft/selectCraftTree?id=${firstSection.id}`);
    if (childRes?.code === "0" && childRes.data) {
      console.log(`Children: ${childRes.data.length}`);
      childRes.data.slice(0, 5).forEach(c => {
        const imgs = extractImageUrls(c);
        console.log(`  Child ${c.id}: "${c.en}" ecode:${c.ecode} image:${c.image} | imgs:${imgs}`);
        console.log(`  Full: ${JSON.stringify(c).slice(0, 200)}`);
      });
    }
  }

  // Try codeSelectCraftTree with the jacket code
  console.log("\n=== codeSelectCraftTree for Jacket (1_2_) ===");
  const codeTreeRes = await apiGet(token, `/api/craft/craft/craft/codeSelectCraftTree/1_2_`);
  if (codeTreeRes?.code === "0" && codeTreeRes.data) {
    console.log(`Items: ${codeTreeRes.data.length}`);
    writeFileSync(path.join(OUT_DIR, "jacket-code-tree.json"), JSON.stringify(codeTreeRes.data, null, 2));
    const root = codeTreeRes.data[0];
    if (root?.childrens) {
      console.log(`Root children: ${root.childrens.length}`);
      root.childrens.forEach(c => {
        const imgs = extractImageUrls(c);
        const hasChildImg = c.childrens?.some(cc => extractImageUrls(cc).length > 0);
        console.log(`  ${c.id}: "${c.en}" image:${c.image} imgs:${imgs.length} childImgs:${hasChildImg}`);
      });
    }
  }

  // Check image URL pattern from AWS CDN using ecode
  console.log("\n=== Testing AWS image URL patterns with ecodes ===");
  const testEcodes = ["060K", "00N2", "00W9", "MXF", "MXK", "MMJ", "T", "S"];
  const awsBase = "https://aws-static-webp.kutetailor.com/comm/process/craft";
  for (const ecode of testEcodes) {
    for (const ext of ["png", "jpg", "jpeg"]) {
      const url = `${awsBase}/${ecode}.${ext}`;
      const ok = await new Promise(resolve => {
        https.get(url, { rejectUnauthorized: false }, res => resolve(res.statusCode === 200)).on("error", () => resolve(false));
      });
      if (ok) console.log(`  ✓ ${url}`);
    }
  }

  // Try the codeSelectCardingCraftTree which might return full tree with images
  console.log("\n=== codeSelectCardingCraftTree for jacket ===");
  const cardingRes = await apiGet(token, `/api/craft/craft/craft/codeSelectCardingCraftTree/1_2_`);
  if (cardingRes?.code === "0" && cardingRes.data) {
    writeFileSync(path.join(OUT_DIR, "jacket-carding-tree.json"), JSON.stringify(cardingRes.data, null, 2));
    const root = cardingRes.data[0];
    if (root?.childrens) {
      console.log(`Carding root children: ${root.childrens.length}`);
      // Check images at all levels
      let totalImg = 0;
      function countImgs(nodes) {
        nodes?.forEach(n => {
          const imgs = extractImageUrls(n);
          totalImg += imgs.length;
          if (n.childrens) countImgs(n.childrens);
        });
      }
      countImgs(root.childrens);
      console.log(`Total images in carding tree: ${totalImg}`);
    }
  }

  // Also: the "getDesignDetail" API from style might give design options with images
  console.log("\n=== style/style-info endpoints ===");
  const styleEndpoints = [
    `/api/style/style-info/getOtherCraft?categoryId=2`,
    `/api/style/style-info/getStyleCraft?categoryId=2`,
    `/api/craft/craft/craft/selectCraftByEcodeAndCloth?ecode=MXF&clothCategoryId=2`,
  ];
  for (const ep of styleEndpoints) {
    const res = await apiGet(token, ep);
    const ok = res?.code === "0";
    const len = Array.isArray(res?.data) ? res.data.length : (res?.data ? "obj" : "null");
    const sample = JSON.stringify(res?.data)?.slice(0, 200);
    console.log(`  ${ok ? "✓" : "✗"} ${ep.split("?")[0]} → code:${res?.code} len:${len} | ${sample}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
