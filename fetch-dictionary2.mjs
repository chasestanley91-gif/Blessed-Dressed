// fetch-dictionary2.mjs — capture full getDictionary/E response via Puppeteer interception
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");

const USER = "LT-BLESSED";
const PASS = "20260311Sa#";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Capture full response bodies for key endpoints
    const capturedResponses = {};
    page.on("response", async res => {
      const url = res.url();
      if (url.includes("getDictionary") || url.includes("getMergeZlcustom") || url.includes("getZlmatnr")) {
        try {
          const body = await res.text();
          const key = url.split("/eis/")[1]?.split("?")[0] || url;
          capturedResponses[key] = { url, status: res.status(), body };
          console.log(`  Captured: ${key} (${body.length} chars)`);
        } catch(e) {
          console.log(`  Error capturing ${url}: ${e.message}`);
        }
      }
    });

    // Login
    console.log("Logging in...");
    await page.goto(`${BASE}/eis/login`, { waitUntil: "networkidle2" });
    await page.type('input[type="text"]', USER);
    await page.type('input[type="password"]', PASS);
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    console.log("Logged in. URL:", page.url());

    // Navigate to BT to trigger getDictionary/E
    const categories = [
      { label: "trousers", mtypb: "BT" },
      { label: "vest",     mtypb: "BV" },
      { label: "shirt",    mtypb: "BS" },
    ];

    const { label, mtypb } = categories[0];
    console.log(`\nNavigating to ${label} (${mtypb}) page...`);

    // Set up a promise that resolves when getDictionary/E response arrives
    const dictPromise = page.waitForResponse(
      res => res.url().includes("getDictionary") && res.status() === 200,
      { timeout: 30000 }
    ).then(async res => {
      const body = await res.text();
      capturedResponses["measureData/getDictionary/E"] = { url: res.url(), status: 200, body };
      console.log(`  waitForResponse: getDictionary captured (${body.length} chars)`);
    }).catch(e => console.log("  waitForResponse timeout:", e.message));

    await page.goto(
      `${BASE}/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=${mtypb}&categoryName=&sexty=1`,
      { waitUntil: "networkidle2", timeout: 30000 }
    );

    // Wait for dictionary response to be captured
    await dictPromise;
    await delay(1000);

    // Check what we captured
    const keys = Object.keys(capturedResponses);
    console.log("Captured responses:", keys);

    // Find getDictionary
    const dictKey = keys.find(k => k.includes("getDictionary"));
    if (dictKey) {
      const resp = capturedResponses[dictKey];
      console.log(`  getDictionary status: ${resp.status}, body length: ${resp.body.length}`);

      // Try to parse
      try {
        const parsed = JSON.parse(resp.body);
        console.log("  Top keys:", Object.keys(parsed));
        if (parsed.data) {
          const dataKeys = Object.keys(parsed.data);
          console.log("  data keys:", dataKeys.slice(0, 10));

          // Save full response
          writeFileSync(path.join(OUT_DIR, "dictionary-full.json"), resp.body);
          console.log("  Saved dictionary-full.json");

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
                  if (!byCategory[cat][field]) {
                    byCategory[cat][field] = { label: item.tprot || field, options: [] };
                  }
                  byCategory[cat][field].options.push({
                    v: item.prope,
                    l: item.tprop,
                    i: item.hyurl || "",
                  });
                }
              });
            } else if (obj && typeof obj === "object") {
              Object.values(obj).forEach(v => flattenOptions(v, depth + 1));
            }
          }
          flattenOptions(parsed.data);

          const allCats = Object.keys(byCategory).sort();
          console.log("  All categories:", allCats.join(", "));

          for (const { label: catLabel, mtypb: catCode } of categories) {
            const catData = byCategory[catCode];
            if (!catData) {
              console.log(`\n  ${catCode} (${catLabel}): NOT FOUND`);
              continue;
            }
            const fieldNames = Object.keys(catData);
            let withImg = 0, withoutImg = 0;
            fieldNames.forEach(f => catData[f].options.forEach(o => { if (o.i) withImg++; else withoutImg++; }));
            console.log(`\n  ${catCode} (${catLabel}): ${fieldNames.length} fields`);
            console.log(`    Options with imageUrl: ${withImg}, without: ${withoutImg}`);

            if (fieldNames.length > 0) {
              const sampleField = fieldNames[0];
              console.log(`    Sample field "${sampleField}" (${catData[sampleField].label}):`, JSON.stringify(catData[sampleField].options[0]));
            }

            // Save as design-options-full.json
            const designOptions = fieldNames.map(f => ({
              f,
              l: catData[f].label,
              o: catData[f].options.filter(o => o.v),
            })).filter(item => item.o.length > 0);

            const catDir = path.join(OUT_DIR, catLabel);
            mkdirSync(catDir, { recursive: true });
            writeFileSync(path.join(catDir, "design-options-full.json"), JSON.stringify(designOptions, null, 2));
            console.log(`    Saved ${designOptions.length} fields to ${catLabel}/design-options-full.json`);
          }
        }
      } catch(e) {
        console.log("  Parse error:", e.message);
        console.log("  First 500 chars:", resp.body.slice(0, 500));
        // Save raw anyway
        writeFileSync(path.join(OUT_DIR, "dictionary-raw.txt"), resp.body);
      }
    } else {
      console.log("  getDictionary NOT found in captured responses");
      // Maybe try the page's own XHR cache
      const result = await page.evaluate(async () => {
        try {
          const r = await fetch('/eis/measureData/getDictionary/E', {
            method: 'GET',
            credentials: 'same-origin',
          });
          return { status: r.status, body: await r.text() };
        } catch(e) { return { error: e.message }; }
      });
      console.log("  Direct fetch result:", result.status, result.body?.slice(0, 200) || result.error);
    }
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
