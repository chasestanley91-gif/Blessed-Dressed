// scrape-api.mjs — directly calls the factory API to get all design options
import { writeFileSync, mkdirSync } from "fs";
import { createWriteStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const USER = process.env.FACTORY_USER || "";
const PASS = process.env.FACTORY_PASS || "";
const BASE = "https://mtm.baoxiniao.co";
const KUNNR = "0000030068";

const CATEGORIES = [
  { label: "suit-jacket", mtypb: "BB" },
  { label: "shirt",       mtypb: "BS" },
  { label: "trousers",    mtypb: "BT" },
  { label: "vest",        mtypb: "BV" },
];

function post(path, body, cookies) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: "mtm.baoxiniao.co",
      port: 443,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Content-Length": Buffer.byteLength(data),
        Cookie: cookies || "",
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(url, cookies) {
  return new Promise((resolve, reject) => {
    const options = { headers: { Cookie: cookies || "" }, rejectUnauthorized: false };
    https.get(url, options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on("error", reject);
  });
}

function downloadImage(url, dest, cookies) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, { headers: { Cookie: cookies || "" }, rejectUnauthorized: false }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(true); });
      } else {
        file.close();
        resolve(false);
      }
    }).on("error", (e) => { file.close(); reject(e); });
  });
}

async function login() {
  console.log("Logging in…");
  // Use form-encoded POST to the login endpoint
  const https = await import("https");
  const loginData = new URLSearchParams({ userName: USER, userPwd: PASS }).toString();
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "mtm.baoxiniao.co",
      port: 443,
      path: "/eis/login/loginByAjax",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(loginData),
      },
      rejectUnauthorized: false,
    };
    const req = https.default.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        const cookies = res.headers["set-cookie"]?.map((c) => c.split(";")[0]).join("; ") || "";
        console.log("Login status:", res.statusCode, "| Cookies:", cookies.slice(0, 80));
        resolve(cookies);
      });
    });
    req.on("error", reject);
    req.write(loginData);
    req.end();
  });
}

async function getModelForCategory(mtypb, cookies) {
  const res = await post("/eis/measureData/getZlpmrByStoreConfigAndResource",
    { mtypb, kunnr: KUNNR, sexty: "1" }, cookies);
  if (res.body?.flag === "SUCCESS" && res.body.data?.length > 0) {
    return res.body.data[0].modem;
  }
  return null;
}

async function getDesignOptions(mtypb, modem, cookies) {
  const res = await post("/eis/measureData/getMergeZlcustomData", {
    mtypb,
    modem,
    ordtp: "P",
    spras: "E",
    loekz: "",
  }, cookies);
  return res.body;
}

async function processDesignData(data, label, cookies) {
  const catDir = path.join(OUT_DIR, label);
  mkdirSync(catDir, { recursive: true });

  if (!data || data.flag !== "SUCCESS") {
    console.log(`  ✗ No success data for ${label}:`, JSON.stringify(data).slice(0, 200));
    return;
  }

  // Save raw response
  writeFileSync(path.join(catDir, "raw-design-data.json"), JSON.stringify(data, null, 2));

  const zlmodList = data.data?.zlmodList || data.data?.zlmod || [];
  const zlpmr = data.data?.zlpmr;

  console.log(`  zlpmr keys: ${Object.keys(data.data || {}).join(", ")}`);
  console.log(`  zlmodList length: ${zlmodList.length}`);
  if (zlmodList.length > 0) console.log(`  First item: ${JSON.stringify(zlmodList[0]).slice(0, 200)}`);

  // Collect images
  const manifest = [];
  let downloaded = 0;

  for (const item of zlmodList) {
    // The image is typically at /mtmstorage/images/proper/{code}/{value}.jpg or similar
    const imgKeys = Object.keys(item).filter(k => /img|image|pic|src|photo/i.test(k));
    const possibleImgFields = imgKeys.length > 0 ? imgKeys : ["imgurl", "image", "img"];

    for (const field of possibleImgFields) {
      if (item[field]) {
        const imgUrl = item[field].startsWith("http") ? item[field] : `${BASE}${item[field]}`;
        const fname = `${String(downloaded + 1).padStart(3, "0")}-${(item.modc || item.code || item.value || downloaded).toString().replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}.jpg`;
        const dest = path.join(catDir, fname);
        try {
          const ok = await downloadImage(imgUrl, dest, cookies);
          if (ok) {
            manifest.push({ fname, url: imgUrl, ...item });
            downloaded++;
            if (downloaded % 10 === 0) console.log(`  Downloaded ${downloaded} images…`);
          }
        } catch (e) {
          console.log(`  Error downloading ${imgUrl}: ${e.message}`);
        }
        break;
      }
    }
  }

  writeFileSync(path.join(catDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`  ✓ Saved ${downloaded} images for ${label}`);
}

async function main() {
  if (!USER || !PASS) { console.error("Set FACTORY_USER and FACTORY_PASS"); process.exit(1); }

  const cookies = await login();
  if (!cookies) { console.error("Login failed"); process.exit(1); }

  for (const { label, mtypb } of CATEGORIES) {
    console.log(`\n[${label}] Getting model…`);
    const modem = await getModelForCategory(mtypb, cookies);
    console.log(`  Model: ${modem || "(not found)"}`);
    if (!modem) continue;

    console.log(`  Fetching design options…`);
    const designData = await getDesignOptions(mtypb, modem, cookies);
    await processDesignData(designData, label, cookies);
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
