// scrape-inspect.mjs — inspects the factory site page structure
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
const SUIT_URL = "http://mtm.baoxiniao.co/eis/measureOrder/international/personal/create_v3_order?kunnr=0000030068&category=BB&categoryName=Men%27s%2520suit%2520jackets&sexty=1";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Login
  await page.goto("http://mtm.baoxiniao.co/eis/login", { waitUntil: "networkidle2" });
  const uf = await page.$('input[type="text"]');
  const pf = await page.$('input[type="password"]');
  await uf.type(USER);
  await pf.type(PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  console.log("Logged in:", page.url());

  // Go to suit page
  await page.goto(SUIT_URL, { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(4000);

  // Screenshot at different scroll positions
  await page.screenshot({ path: path.join(OUT_DIR, "inspect-01-top.png") });

  // Dump the DOM summary
  const domInfo = await page.evaluate(() => {
    const info = {
      title: document.title,
      url: location.href,
      buttons: Array.from(document.querySelectorAll("button")).map((b) => ({
        text: b.textContent.trim().slice(0, 50),
        classes: b.className,
        id: b.id,
      })),
      imgs: Array.from(document.querySelectorAll("img")).slice(0, 20).map((img) => ({
        src: img.src.slice(0, 100),
        alt: img.alt,
        classes: img.className,
        parentClass: img.parentElement?.className ?? "",
        w: img.naturalWidth,
        h: img.naturalHeight,
      })),
      clickableElements: Array.from(document.querySelectorAll("[class*='step'], [class*='next'], [class*='fabric'], [class*='item'], [class*='card']"))
        .slice(0, 20).map((el) => ({
          tag: el.tagName,
          text: el.textContent.trim().slice(0, 40),
          classes: el.className.slice(0, 80),
        })),
    };
    return info;
  });

  writeFileSync(path.join(OUT_DIR, "inspect-dom.json"), JSON.stringify(domInfo, null, 2));
  console.log("Buttons found:", domInfo.buttons.length);
  console.log("Images found:", domInfo.imgs.length);
  console.log("Buttons:", JSON.stringify(domInfo.buttons, null, 2));
  console.log("Top imgs:", JSON.stringify(domInfo.imgs.slice(0, 5), null, 2));
  console.log("Clickable:", JSON.stringify(domInfo.clickableElements.slice(0, 10), null, 2));

  // Wait longer for lazy images
  await sleep(3000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, "inspect-02-mid.png") });

  await browser.close();
  console.log("Done — check factory-screenshots/inspect-*.png and inspect-dom.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
