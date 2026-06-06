import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const errors = [];
const hydrationErrors = [];
page.on('console', msg => {
  const t = msg.type();
  const text = msg.text();
  if (t === 'error') errors.push(text);
  if (text.includes('hydrat') || text.includes('Hydrat')) hydrationErrors.push(text);
});
page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

// Check for any fixed/absolute elements that might be covering the nav area
const overlays = await page.evaluate(() => {
  const results = [];
  const elements = document.querySelectorAll('*');
  for (const el of elements) {
    const style = window.getComputedStyle(el);
    const pos = style.position;
    const z = parseInt(style.zIndex) || 0;
    const pe = style.pointerEvents;
    if ((pos === 'fixed' || pos === 'absolute') && z > 100 && pe !== 'none') {
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 50) {
        results.push({
          tag: el.tagName,
          id: el.id,
          class: el.className.substring(0, 80),
          z,
          pos,
          rect: { top: rect.top, left: rect.left, w: rect.width, h: rect.height }
        });
      }
    }
  }
  return results;
});

// Check the element actually at the nav CTA button position
const ctaPos = await page.evaluate(() => {
  const cta = document.querySelector('header a.rounded-full');
  if (!cta) return null;
  const rect = cta.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const topEl = document.elementFromPoint(cx, cy);
  return {
    ctaHref: cta.getAttribute('href'),
    ctaRect: { top: rect.top, left: rect.left, w: rect.width, h: rect.height },
    topElementTag: topEl?.tagName,
    topElementText: topEl?.textContent?.trim().substring(0, 50),
    topElementIs: topEl === cta || cta.contains(topEl) ? 'CTA ITSELF' : 'SOMETHING ELSE',
    pointerEvents: window.getComputedStyle(cta).pointerEvents,
  };
});

// Check for React hydration by seeing if event handlers are attached
const hasReactHandlers = await page.evaluate(() => {
  const cta = document.querySelector('a[href="/consultation"]');
  if (!cta) return 'no CTA found';
  // React attaches handlers to root, not elements
  const root = document.getElementById('__next') || document.body;
  const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactEvents'));
  return fiberKey ? 'React handlers present on root: ' + fiberKey : 'No React fiber found';
});

console.log('JS errors:', JSON.stringify(errors, null, 2));
console.log('High z-index overlays:', JSON.stringify(overlays, null, 2));
console.log('Element at CTA position:', JSON.stringify(ctaPos, null, 2));
console.log('React hydration check:', hasReactHandlers);

await browser.close();
