// download-options.mjs — downloads all design option images from extracted JSON data
import puppeteer from "puppeteer-core";
import { writeFileSync, createWriteStream, mkdirSync, existsSync, readFileSync, unlinkSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");

const USER = process.env.FACTORY_USER || "";
const PASS = process.env.FACTORY_PASS || "";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://mtm.baoxiniao.co";

const CATEGORIES = [
  { label: "suit-jacket", mtypb: "BB" },
  { label: "shirt",       mtypb: "BS" },
  { label: "trousers",    mtypb: "BD" },
  { label: "vest",        mtypb: "BV" },
];

function downloadFile(url, dest, cookieStr) {
  return new Promise((resolve) => {
    if (existsSync(dest)) { resolve(true); return; } // skip existing
    const file = createWriteStream(dest);
    const options = { headers: { Cookie: cookieStr || "", Referer: BASE }, rejectUnauthorized: false };
    https.get(url, options, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(true); });
      } else {
        file.close();
        try { unlinkSync(dest); } catch(_) {}
        resolve(false);
      }
    }).on("error", () => { file.close(); resolve(false); });
  });
}

async function getCookies() {
  if (!USER || !PASS) { console.error("Set FACTORY_USER and FACTORY_PASS"); process.exit(1); }
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
  return cookies.map(c => `${c.name}=${c.value}`).join("; ");
}

async function main() {
  console.log("Getting auth cookies…");
  const cookieStr = await getCookies();
  console.log("Cookies obtained:", cookieStr.slice(0, 50) + "…");

  let totalDownloaded = 0;
  const allManifests = {};

  for (const { label, mtypb } of CATEGORIES) {
    const catDir = path.join(OUT_DIR, label);
    mkdirSync(catDir, { recursive: true });

    // Try to load design options JSON (could be bb-design-options-raw.json or design-options.json)
    const jsonPaths = [
      path.join(catDir, `${mtypb.toLowerCase()}-design-options.json`),
      path.join(catDir, "bb-design-options-raw.json"),
      path.join(catDir, "design-options-full.json"),
      path.join(catDir, "design-options-raw.json"),
    ];

    let fields = null;
    for (const p of jsonPaths) {
      if (existsSync(p)) {
        try {
          const raw = readFileSync(p, "utf8");
          fields = JSON.parse(raw);
          console.log(`\n[${label}] Loaded ${fields.length} fields from ${path.basename(p)}`);
          break;
        } catch (e) {
          // Try to parse partial JSON
          try {
            // Fix truncated JSON by finding last complete object
            const lastClose = raw.lastIndexOf("}]");
            if (lastClose > 0) {
              fields = JSON.parse(raw.slice(0, lastClose + 2));
              console.log(`\n[${label}] Loaded partial: ${fields.length} fields from ${path.basename(p)}`);
              break;
            }
          } catch(_) {}
        }
      }
    }

    if (!fields || fields.length === 0) {
      console.log(`\n[${label}] No design options JSON found — skipping`);
      continue;
    }

    const manifest = [];
    let downloaded = 0;

    for (const field of fields) {
      const fieldCode = field.f || field.fieldName || "";
      const fieldLabel = field.l || field.fieldLabel || fieldCode;
      const options = field.o || field.options || [];

      if (!fieldCode || options.length === 0) continue;

      const fieldDir = path.join(catDir, fieldCode);
      mkdirSync(fieldDir, { recursive: true });

      for (const opt of options) {
        const value = opt.v || opt.value || "";
        const imgUrl = opt.i || opt.imgSrc || "";
        if (!imgUrl || !value) continue;

        const ext = imgUrl.split(".").pop()?.split("?")[0] || "jpg";
        const fname = `${value.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;
        const dest = path.join(fieldDir, fname);

        const ok = await downloadFile(imgUrl, dest, cookieStr);
        if (ok) {
          downloaded++;
          totalDownloaded++;
          manifest.push({
            mtypb,
            field: fieldCode,
            fieldLabel,
            value,
            label: opt.label || opt.l || "",
            url: imgUrl,
            localPath: `${label}/${fieldCode}/${fname}`,
          });
        }
      }
      process.stdout.write(`\r  [${label}] ${fieldCode}: ${downloaded} downloaded...`);
    }

    console.log(`\n  ✓ ${downloaded} images downloaded for ${label}`);
    writeFileSync(path.join(catDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    allManifests[label] = manifest;
  }

  writeFileSync(path.join(OUT_DIR, "all-manifests.json"), JSON.stringify(allManifests, null, 2));
  console.log(`\n\nTotal downloaded: ${totalDownloaded} images`);
}

main().catch(e => { console.error(e); process.exit(1); });
