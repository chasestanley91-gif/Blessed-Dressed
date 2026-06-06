// fetch-dictionary.mjs — fetch full getDictionary/E response and extract design options per category
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");

const USER = "LT-BLESSED";
const PASS = "20260311Sa#";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";

function httpsGet(url, cookieStr) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: { Cookie: cookieStr, Referer: BASE + "/eis/" },
      rejectUnauthorized: false,
    };
    https.get(url, opts, res => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

async function main() {
  // Login via Puppeteer to get session cookie
  console.log("Logging in...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="text"]', USER);
  await page.type('input[type="password"]', PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  const cookies = await page.cookies();
  await browser.close();
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  console.log("Cookies:", cookieStr.slice(0, 60) + "...");

  // Fetch the full getDictionary/E response
  console.log("\nFetching getDictionary/E...");
  const dictUrl = `${BASE}/eis/measureData/getDictionary/E`;
  const { status, body } = await httpsGet(dictUrl, cookieStr);
  console.log(`  Status: ${status}, Body length: ${body.length}`);

  if (status !== 200) {
    console.log("  Failed:", body.slice(0, 200));
    return;
  }

  // Save the raw response
  writeFileSync(path.join(OUT_DIR, "dictionary-full.json"), body);
  console.log("  Saved to factory-screenshots/dictionary-full.json");

  // Parse and analyze
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch(e) {
    console.log("  Parse error:", e.message);
    return;
  }

  if (!parsed.data) {
    console.log("  No data field:", JSON.stringify(parsed).slice(0, 200));
    return;
  }

  // The structure is: parsed.data.CUSTOM.{FIELD_CODE: [{propt, prope, tprop, tprot, mtypb, hyurl, ...}]}
  // or it might be: parsed.data.{mtypb}.{FIELD_CODE: [...]}
  const topKeys = Object.keys(parsed.data);
  console.log("  Top-level data keys:", topKeys.slice(0, 10));

  // Determine structure
  const firstKey = topKeys[0];
  const firstVal = parsed.data[firstKey];
  console.log("  First key value type:", typeof firstVal, Array.isArray(firstVal) ? "array" : "object");

  if (typeof firstVal === "object" && !Array.isArray(firstVal)) {
    // Structure: {CUSTOM: {FIELD: [options]}} or {BB: {FIELD: [options]}, BT: {FIELD: [options]}}
    const nestedKeys = Object.keys(firstVal);
    console.log("  Nested keys (fields or categories?):", nestedKeys.slice(0, 10));
    const firstNested = firstVal[nestedKeys[0]];
    if (Array.isArray(firstNested) && firstNested.length > 0) {
      console.log("  First field option sample:", JSON.stringify(firstNested[0]));
    }
  }

  // Extract BT, BV, BS specific data
  const TARGETS = ["BT", "BV", "BS"];

  // Try to find category-specific data
  const dataKeys = topKeys;

  // Flatten all options by mtypb
  const byCategory = {};
  function flattenOptions(obj, depth = 0) {
    if (depth > 5) return;
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        if (item && item.mtypb && item.propt) {
          const cat = item.mtypb;
          if (!byCategory[cat]) byCategory[cat] = {};
          const field = item.propt;
          if (!byCategory[cat][field]) byCategory[cat][field] = { label: item.tprot || field, options: [] };
          byCategory[cat][field].options.push({
            value: item.prope,
            label: item.tprop,
            imageUrl: item.hyurl || "",
          });
        }
      });
    } else if (obj && typeof obj === "object") {
      Object.values(obj).forEach(v => flattenOptions(v, depth + 1));
    }
  }

  flattenOptions(parsed.data);

  console.log("\n  Categories found:", Object.keys(byCategory).sort().join(", "));

  for (const cat of TARGETS) {
    if (!byCategory[cat]) {
      console.log(`\n  ${cat}: NOT FOUND in dictionary`);
      continue;
    }
    const fields = byCategory[cat];
    const fieldNames = Object.keys(fields);
    console.log(`\n  ${cat}: ${fieldNames.length} fields`);

    // Count options with images
    let withImg = 0, withoutImg = 0;
    fieldNames.forEach(f => {
      fields[f].options.forEach(o => {
        if (o.imageUrl) withImg++;
        else withoutImg++;
      });
    });
    console.log(`    Options with imageUrl: ${withImg}, without: ${withoutImg}`);

    // Show sample fields
    fieldNames.slice(0, 5).forEach(f => {
      const sample = fields[f];
      console.log(`    ${f} (${sample.label}): ${sample.options.length} options, sample: ${JSON.stringify(sample.options[0])}`);
    });

    // Build design-options.json format
    const designOptions = fieldNames.map(f => ({
      f,
      l: fields[f].label,
      o: fields[f].options.filter(o => o.value).map(o => ({
        v: o.value,
        l: o.label,
        i: o.imageUrl,
      })),
    })).filter(f => f.o.length > 0);

    const catLabel = cat === "BT" ? "trousers" : cat === "BV" ? "vest" : "shirt";
    const catDir = path.join(OUT_DIR, catLabel);
    mkdirSync(catDir, { recursive: true });
    const outPath = path.join(catDir, "design-options-full.json");
    writeFileSync(outPath, JSON.stringify(designOptions, null, 2));
    console.log(`    Saved ${designOptions.length} fields to ${catLabel}/design-options-full.json`);
  }

  // Also check BB for comparison
  if (byCategory["BB"]) {
    const bbFields = Object.keys(byCategory["BB"]);
    console.log(`\n  BB: ${bbFields.length} fields (for comparison)`);
    let withImg = 0;
    bbFields.forEach(f => byCategory["BB"][f].options.forEach(o => { if (o.imageUrl) withImg++; }));
    console.log(`    BB options with imageUrl: ${withImg}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
