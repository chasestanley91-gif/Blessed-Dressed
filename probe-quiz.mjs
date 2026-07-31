import puppeteer from 'puppeteer-core';
const EDGE = String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto('http://localhost:3000/builder/suit-2pc', { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(4000);
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().includes('Continue') && x.offsetParent); if (b) b.click(); });
await sleep(2000);

const probe = await page.evaluate(() => {
  const headers = [...document.querySelectorAll('*')]
    .filter((e) => e.children.length === 0 && /^\d+\s*of\s*\d+$/i.test((e.textContent || '').trim()))
    .map((e) => ({ y: Math.round(e.getBoundingClientRect().top + window.scrollY), label: e.textContent.trim(), question: e.parentElement ? e.parentElement.textContent.trim().slice(0, 90) : '' }));
  const btns = [...document.querySelectorAll('button')].filter((b) => b.offsetParent)
    .map((b) => ({ y: Math.round(b.getBoundingClientRect().top + window.scrollY), t: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 55) }));
  return { headers, buttons: btns };
});
console.log(JSON.stringify(probe, null, 1));
await browser.close();
