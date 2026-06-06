// kute-hero-images.mjs
// Browses the kutetailor.net image library (tagId=100 and related tags)
// and downloads the best hero images for each builder product card.
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync, createWriteStream, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = path.join(__dirname, "public", "images", "builder-heroes");
const RAW_DIR   = path.join(__dirname, "factory-screenshots", "hero-library");

const USER      = "LABDP";
const PASS      = "Badslag91";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(RAW_DIR, { recursive: true });

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

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
        resolve(false);
      }
    }).on("error", () => { file.close(); resolve(false); });
  });
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false, // show browser so we can see what's there
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,900"],
    defaultViewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();

  // ── Login ────────────────────────────────────────────────────────────────────
  console.log("Logging in...");
  await page.goto("https://www.kutetailor.net/system/login", { waitUntil: "networkidle2" });
  await page.type("#username", USER);
  await page.type("#password", PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
  await delay(1000);
  console.log("Logged in. Current URL:", page.url());

  // ── Navigate to image library ─────────────────────────────────────────────
  console.log("Opening image library...");
  await page.goto("https://www.kutetailor.net/system/imageLibrary?from=my_sys&tagId=100", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await delay(2000);

  // Take a screenshot to see the page layout
  await page.screenshot({ path: path.join(RAW_DIR, "00-library-main.png"), fullPage: false });
  console.log("Screenshot saved: 00-library-main.png");

  // Collect all image URLs visible on the page
  const imageData = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs
      .filter(img => img.src && img.src.includes("http") && img.naturalWidth > 100)
      .map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        alt: img.alt || "",
        title: img.title || "",
        parentText: img.closest("[title],[data-name],[data-title]")?.getAttribute("title")
          || img.closest("[title],[data-name],[data-title]")?.getAttribute("data-name") || "",
      }));
  });

  console.log(`Found ${imageData.length} images on the page`);

  // Check what tag categories exist in the sidebar
  const tags = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a, li, .tag, [class*='tag'], [class*='category']"));
    return links
      .filter(el => el.textContent.trim().length > 1 && el.textContent.trim().length < 50)
      .map(el => ({ text: el.textContent.trim(), href: el.href || "", class: el.className }))
      .filter((v, i, a) => a.findIndex(x => x.text === v.text) === i)
      .slice(0, 50);
  });

  console.log("\nSidebar tags/categories found:");
  for (const t of tags) console.log(" ", t.text, t.href ? `→ ${t.href}` : "");

  // Save a full inventory
  writeFileSync(
    path.join(RAW_DIR, "library-images.json"),
    JSON.stringify(imageData, null, 2)
  );
  console.log(`\nSaved library-images.json (${imageData.length} entries)`);

  // Try additional tag IDs likely to contain garment photography
  const tagIds = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 1, 2, 3, 4, 5, 6];
  const allImages = [...imageData];

  for (const tagId of tagIds.slice(1)) {
    await page.goto(`https://www.kutetailor.net/system/imageLibrary?from=my_sys&tagId=${tagId}`, {
      waitUntil: "networkidle2",
      timeout: 20000,
    }).catch(() => {});
    await delay(1000);

    const imgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img"))
        .filter(img => img.src && img.src.includes("http") && img.naturalWidth > 100)
        .map(img => ({
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          alt: img.alt || "",
        }));
    });

    if (imgs.length) {
      console.log(`tagId=${tagId}: ${imgs.length} images`);
      allImages.push(...imgs.map(i => ({ ...i, tagId })));
    }
  }

  // Download all unique large images (likely product photos)
  const seen = new Set();
  let downloaded = 0;
  for (const img of allImages) {
    if (seen.has(img.src)) continue;
    seen.add(img.src);
    if (img.width < 200 && img.height < 200) continue; // skip icons

    const ext = img.src.split(".").pop().split("?")[0].slice(0, 4) || "jpg";
    const fname = `img_${downloaded.toString().padStart(3,"0")}.${ext}`;
    const ok = await downloadFile(img.src, path.join(RAW_DIR, fname));
    if (ok) {
      console.log(`  [${downloaded}] ${fname}  ${img.width}×${img.height}  ${img.src.slice(0, 80)}`);
      downloaded++;
    }
  }

  console.log(`\nDownloaded ${downloaded} images to ${RAW_DIR}`);
  console.log("Review them and run: node pick-hero-images.mjs to assign to product slots");

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
