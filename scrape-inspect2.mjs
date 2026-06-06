// scrape-inspect2.mjs — intercepts network requests and checks for iframes
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

  // Intercept ALL network requests
  const requests = [];
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (!url.includes("font") && !url.includes(".png") && !url.includes(".jpg") && !url.includes(".gif") && !url.includes(".ico") && !url.includes(".css")) {
      requests.push({ method: req.method(), url: url.slice(0, 200) });
    }
    req.continue();
  });

  const responses = [];
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/eis/") && !url.includes(".png") && !url.includes(".jpg") && !url.includes(".css") && !url.includes(".js")) {
      try {
        const text = await res.text();
        if (text.length < 50000) {
          responses.push({ url: url.slice(0, 200), status: res.status(), body: text.slice(0, 500) });
        }
      } catch (_) {}
    }
  });

  // Login
  await page.goto("http://mtm.baoxiniao.co/eis/login", { waitUntil: "networkidle2" });
  const uf = await page.$('input[type="text"]');
  const pf = await page.$('input[type="password"]');
  await uf.type(USER);
  await pf.type(PASS);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  console.log("Logged in:", page.url());

  requests.length = 0;
  responses.length = 0;

  // Navigate to suit page
  await page.goto(SUIT_URL, { waitUntil: "networkidle2", timeout: 45000 });
  await sleep(5000);

  // Check for iframes
  const frames = page.frames();
  console.log(`\nFrames found: ${frames.length}`);
  for (const frame of frames) {
    console.log(`  Frame URL: ${frame.url()}`);
    const frameImgs = await frame.evaluate(() => {
      return document.querySelectorAll("img").length + " imgs, " + document.querySelectorAll("button").length + " btns";
    }).catch(() => "inaccessible");
    console.log(`  Frame content: ${frameImgs}`);

    if (frame.url() !== page.url()) {
      await frame.screenshot({ path: path.join(OUT_DIR, `inspect-frame-${frames.indexOf(frame)}.png`) }).catch(() => {});
    }
  }

  // Screenshot main page
  await page.screenshot({ path: path.join(OUT_DIR, "inspect2-main.png"), fullPage: true });

  // Log API calls
  console.log(`\nAPI requests (${requests.length} total):`);
  requests.slice(0, 30).forEach((r) => console.log(`  ${r.method} ${r.url}`));

  console.log(`\nAPI responses (${responses.length} total):`);
  responses.slice(0, 15).forEach((r) => console.log(`  [${r.status}] ${r.url}\n    ${r.body.slice(0, 150)}`));

  writeFileSync(path.join(OUT_DIR, "inspect2-requests.json"), JSON.stringify(requests, null, 2));
  writeFileSync(path.join(OUT_DIR, "inspect2-responses.json"), JSON.stringify(responses, null, 2));

  await browser.close();
  console.log("\nDone. Check inspect2-*.png and JSON files.");
}

main().catch((e) => { console.error(e); process.exit(1); });
