// scrape-factory.mjs — navigates to design step and scrapes all option images
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots");
mkdirSync(OUT_DIR, { recursive: true });

const USER = process.env.FACTORY_USER || "";
const PASS = process.env.FACTORY_PASS || "";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const CATEGORIES = [
  {
    label: "suit-jacket",
    url: "http://mtm.baoxiniao.co/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=BB&categoryName=Men%27s%2520suit%2520jackets&sexty=1",
  },
  {
    label: "shirt",
    url: "http://mtm.baoxiniao.co/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=BS&categoryName=Men%27s%2520dress%2520shirts&sexty=1",
  },
  {
    label: "trousers",
    url: "http://mtm.baoxiniao.co/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=BT&categoryName=Men%27s%2520trousers&sexty=1",
  },
  {
    label: "vest",
    url: "http://mtm.baoxiniao.co/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=BV&categoryName=Men%27s%2520vest&sexty=1",
  },
];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function login(page) {
  console.log("  → Going to login page…");
  await page.goto("http://mtm.baoxiniao.co/eis/login", { waitUntil: "networkidle2", timeout: 30000 });

  const userField = await page.$('input[type="text"], input[name*="login"], input[name*="user"]');
  const passField = await page.$('input[type="password"]');
  if (!userField || !passField) {
    await page.screenshot({ path: path.join(OUT_DIR, "00-login-failed.png") });
    console.error("  ✗ Login fields not found");
    return false;
  }
  await userField.click({ clickCount: 3 });
  await userField.type(USER);
  await passField.click({ clickCount: 3 });
  await passField.type(PASS);
  await page.keyboard.press("Enter");
  try { await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }); } catch (_) {}
  const ok = !page.url().includes("login");
  console.log(ok ? `  ✓ Logged in (${page.url()})` : "  ✗ Login failed");
  return ok;
}

async function goToDesignStep(page, url, label) {
  console.log(`\n[${label}] Loading fabric step…`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(3000); // let JS render

  // Wait for fabric thumbnails to appear
  await page.waitForSelector("img", { timeout: 15000 }).catch(() => {});
  await sleep(2000);

  // Click the first fabric thumbnail
  const firstFabric = await page.$('.fabric-item, .item-box, [class*="fabric"] img, .card img, .goods-img');
  if (firstFabric) {
    await firstFabric.click();
    console.log(`  ✓ Clicked first fabric`);
    await sleep(1500);
  } else {
    console.log(`  ⚠ No fabric thumbnail found, trying Next Step anyway`);
  }

  // Click NEXT STEP button
  const nextBtn = await page.$('button.next-step, .next-step, button:has-text("NEXT"), [class*="next"] button, .step-btn');
  let clicked = false;
  if (nextBtn) {
    await nextBtn.click();
    clicked = true;
  } else {
    // Try finding any button with "NEXT" text
    const btns = await page.$$("button");
    for (const btn of btns) {
      const txt = await page.evaluate((el) => el.textContent, btn);
      if (txt && /next|step 2|design/i.test(txt)) {
        await btn.click();
        clicked = true;
        break;
      }
    }
  }

  if (clicked) {
    console.log(`  ✓ Clicked Next Step`);
    await sleep(3000);
    try { await page.waitForNetworkIdle({ timeout: 10000 }); } catch (_) {}
    await sleep(2000);
  } else {
    console.log(`  ⚠ Could not find Next Step button`);
  }

  await page.screenshot({ path: path.join(OUT_DIR, label, "01-design-step.png"), fullPage: true });
  return clicked;
}

async function scrapeDesignOptions(page, label) {
  const catDir = path.join(OUT_DIR, label);
  mkdirSync(catDir, { recursive: true });

  console.log(`  Scraping design options…`);

  // Find all expandable section headers and click them open
  const sectionHeaders = await page.$$('[class*="title"], [class*="header"], [class*="section-name"], h3, h4');
  console.log(`  Found ${sectionHeaders.length} potential section headers`);

  // Click each section open and screenshot
  let sectionIdx = 0;
  for (const header of sectionHeaders) {
    try {
      const txt = await page.evaluate((el) => el.textContent?.trim(), header);
      if (!txt || txt.length > 100 || txt.length < 2) continue;
      await header.click();
      await sleep(800);
      const safeName = txt.replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "-").slice(0, 40);
      const shotPath = path.join(catDir, `section-${String(sectionIdx).padStart(2, "0")}-${safeName}.png`);
      await page.screenshot({ path: shotPath });
      sectionIdx++;
    } catch (_) {}
  }

  // Full-page screenshot of all design options
  await page.screenshot({ path: path.join(catDir, "99-full-design-page.png"), fullPage: true });

  // Collect ALL images now visible on page
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("img"))
      .map((img) => {
        const rect = img.getBoundingClientRect();
        const parent = img.closest(".item, .option, li, td, [class*='option'], [class*='tile'], [class*='item']");
        return {
          src: img.src,
          alt: img.alt,
          w: img.naturalWidth,
          h: img.naturalHeight,
          label: parent?.querySelector("[class*='name'], [class*='label'], span, p")?.textContent?.trim() ?? "",
          parentText: parent?.textContent?.trim()?.slice(0, 60) ?? "",
        };
      })
      .filter((i) => i.src && !i.src.startsWith("data:") && i.w > 20 && i.h > 20);
  });

  console.log(`  Found ${imgs.length} images to download`);
  const manifest = [];
  let count = 0;

  for (const { src, alt, label: optLabel, parentText, w, h } of imgs) {
    try {
      const buffer = await page.evaluate(async (s) => {
        const r = await fetch(s, { credentials: "include" });
        const ab = await r.arrayBuffer();
        return Array.from(new Uint8Array(ab));
      }, src);
      const ext = src.split("?")[0].split(".").pop() || "jpg";
      const name = (optLabel || alt || parentText || String(count)).replace(/[^a-zA-Z0-9\-_]/g, "_").slice(0, 40);
      const fname = `${String(count + 1).padStart(3, "0")}-${name}.${ext}`;
      writeFileSync(path.join(catDir, fname), Buffer.from(buffer));
      manifest.push({ fname, src, alt, label: optLabel, parentText, w, h });
      count++;
    } catch (_) {}
  }

  writeFileSync(path.join(catDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`  ✓ Saved ${count} images`);
}

async function main() {
  if (!USER || !PASS) {
    console.error("Set FACTORY_USER and FACTORY_PASS env vars");
    process.exit(1);
  }
  console.log("scrape-factory: starting\n");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  if (!(await login(page))) {
    await browser.close();
    process.exit(1);
  }

  for (const cat of CATEGORIES) {
    mkdirSync(path.join(OUT_DIR, cat.label), { recursive: true });
    await goToDesignStep(page, cat.url, cat.label);
    await scrapeDesignOptions(page, cat.label);
  }

  await browser.close();
  console.log(`\n✓ Done. Output: ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
