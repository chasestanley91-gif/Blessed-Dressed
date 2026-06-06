// kute-explore.mjs — login to kutetailor.net and explore the startDesign page
import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "factory-screenshots", "kute");

const USER = "LABDP";
const PASS = "Badslag91";
const EDGE_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "https://www.kutetailor.net";

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: false,
    args: ["--no-sandbox", "--window-size=1400,900", "--window-position=0,0"],
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();

    // Capture all XHR/fetch responses for analysis
    const captured = [];
    page.on("response", async res => {
      const url = res.url();
      const ct = res.headers()["content-type"] || "";
      if (ct.includes("json") && !url.includes("webpack") && !url.includes("hot-update")) {
        try {
          const body = await res.text();
          if (body.length < 200000) {
            captured.push({ url, status: res.status(), body: body.slice(0, 2000) });
          }
        } catch(_) {}
      }
    });

    // Login
    console.log("Navigating to login...");
    await page.goto(`${BASE}/system/login?redirect=%2FstartDesign`, { waitUntil: "networkidle2", timeout: 30000 });
    await page.screenshot({ path: path.join(OUT_DIR, "01-login.png") });
    console.log("Login page URL:", page.url());

    // Dump login form fields
    const loginForm = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input")).map(i => ({
        type: i.type, name: i.name, id: i.id, placeholder: i.placeholder, className: i.className.slice(0,40)
      }));
      const buttons = Array.from(document.querySelectorAll("button, input[type=submit]")).map(b => ({
        type: b.type, text: b.textContent.trim().slice(0,50), name: b.name, id: b.id
      }));
      return { inputs, buttons };
    });
    console.log("Login form inputs:", JSON.stringify(loginForm.inputs));
    console.log("Login form buttons:", JSON.stringify(loginForm.buttons));

    // Fill login form
    const usernameField = loginForm.inputs.find(i => i.type === "text" || i.name?.toLowerCase().includes("user") || i.name?.toLowerCase().includes("account") || i.id?.toLowerCase().includes("user"));
    const passwordField = loginForm.inputs.find(i => i.type === "password");

    if (usernameField) {
      const sel = usernameField.id ? `#${usernameField.id}` : usernameField.name ? `input[name="${usernameField.name}"]` : 'input[type="text"]';
      await page.type(sel, USER);
      console.log("Typed username into:", sel);
    } else {
      await page.type('input[type="text"]', USER);
    }

    if (passwordField) {
      const sel = passwordField.id ? `#${passwordField.id}` : passwordField.name ? `input[name="${passwordField.name}"]` : 'input[type="password"]';
      await page.type(sel, PASS);
      console.log("Typed password into:", sel);
    }

    await page.screenshot({ path: path.join(OUT_DIR, "02-login-filled.png") });

    // Submit
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    await delay(2000);
    console.log("After login URL:", page.url());
    await page.screenshot({ path: path.join(OUT_DIR, "03-after-login.png") });

    // Check if still on login page
    if (page.url().includes("login")) {
      console.log("Still on login page — trying button click");
      await page.evaluate(() => {
        const btn = document.querySelector("button[type=submit]") ||
                    document.querySelector("input[type=submit]") ||
                    Array.from(document.querySelectorAll("button")).find(b => /login|sign in|submit/i.test(b.textContent));
        if (btn) btn.click();
      });
      await delay(3000);
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {});
      console.log("After button click URL:", page.url());
      await page.screenshot({ path: path.join(OUT_DIR, "04-after-button.png") });
    }

    // Navigate to startDesign
    if (!page.url().includes("startDesign") && !page.url().includes("design")) {
      console.log("Navigating to startDesign...");
      await page.goto(`${BASE}/startDesign`, { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
      await delay(2000);
      console.log("startDesign URL:", page.url());
      await page.screenshot({ path: path.join(OUT_DIR, "05-startDesign.png") });
    }

    // Explore page structure
    const pageInfo = await page.evaluate(() => {
      // Look for garment category links/buttons
      const allLinks = Array.from(document.querySelectorAll("a, button, [onclick], [data-category], [data-type]"))
        .filter(el => el.offsetParent !== null)
        .slice(0, 30)
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().slice(0, 60),
          href: el.href || "",
          onclick: el.getAttribute("onclick")?.slice(0, 60) || "",
          dataAttrs: Array.from(el.attributes)
            .filter(a => a.name.startsWith("data-"))
            .reduce((acc, a) => { acc[a.name] = a.value; return acc; }, {}),
        }));

      // Look for garment type selectors
      const garmentKeywords = ["suit", "jacket", "trouser", "shirt", "vest", "coat", "blazer", "pant"];
      const garmentEls = Array.from(document.querySelectorAll("*"))
        .filter(el => {
          const t = el.textContent.trim().toLowerCase();
          return garmentKeywords.some(k => t === k || t === k + "s") && el.children.length === 0;
        })
        .slice(0, 20)
        .map(el => ({ tag: el.tagName, text: el.textContent.trim(), class: el.className?.slice(0,60) }));

      return {
        title: document.title,
        url: location.href,
        allLinks: allLinks.slice(0, 20),
        garmentEls,
        bodyText: document.body.innerText.slice(0, 500),
      };
    });

    console.log("\nPage title:", pageInfo.title);
    console.log("URL:", pageInfo.url);
    console.log("Body text sample:", pageInfo.bodyText);
    console.log("\nLinks/buttons (first 20):", JSON.stringify(pageInfo.allLinks, null, 2));
    console.log("\nGarment elements:", JSON.stringify(pageInfo.garmentEls, null, 2));

    // Save API responses captured so far
    writeFileSync(path.join(OUT_DIR, "api-responses.json"), JSON.stringify(captured, null, 2));
    console.log(`\nCaptured ${captured.length} API responses → api-responses.json`);

    // Wait for further manual exploration
    console.log("\n=== BROWSER STAYS OPEN FOR INSPECTION ===");
    await delay(30000);

  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
