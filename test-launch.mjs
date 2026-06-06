import puppeteer from 'puppeteer-core';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\149.0.4022.52\\msedge.exe';
try {
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: 'shell',
    dumpio: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--user-data-dir=C:\\Temp\\edge-puppeteer-test'],
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 10000 });
  console.log('Title:', await page.title());
  await browser.close();
  console.log('SUCCESS');
} catch(e) {
  console.error('FAIL:', e.message.substring(0, 400));
}
