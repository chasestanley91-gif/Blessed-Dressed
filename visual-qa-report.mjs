import fs from 'fs';
import path from 'path';

const ROOT = path.resolve();
const INVENTORY_FILE = path.join(ROOT, 'visual-qa', 'inventory.json');
const OUTPUT_FILE = path.join(ROOT, 'visual-qa', 'report.json');
const OUTPUT_MARKDOWN = path.join(ROOT, 'visual-qa', 'report.md');

function loadInventory() {
  if (!fs.existsSync(INVENTORY_FILE)) {
    throw new Error(`Inventory file not found: ${INVENTORY_FILE}`);
  }
  return JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf8'));
}

function getAspectRatio(width, height) {
  if (!width || !height) return null;
  return width / height;
}

function safeNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}

function classifyContext(context, entry) {
  const ctx = (context || '').toString().toLowerCase();
  if (ctx.includes('hero') || ctx.includes('banner')) return 'hero';
  if (ctx.includes('fabric') || ctx.includes('swatch') || ctx.includes('code')) return 'fabric';
  if (ctx.includes('product') || ctx.includes('card') || ctx.includes('collection') || ctx.includes('tile')) return 'product';
  if (entry.type === 'background') return 'background';
  return 'unknown';
}

function makeIssue(entry, page, severity, title, detail) {
  return {
    page: page.path,
    url: page.url,
    screenshot: page.screenshot,
    ordinal: entry.ordinal,
    src: entry.src,
    type: entry.type,
    context: classifyContext(entry.context, entry),
    title,
    detail,
    severity,
  };
}

function analyzeImage(entry, page) {
  const issues = [];
  const naturalWidth = safeNumber(entry.naturalWidth);
  const naturalHeight = safeNumber(entry.naturalHeight);
  const displayWidth = safeNumber(entry.displayWidth);
  const displayHeight = safeNumber(entry.displayHeight);
  const displayArea = safeNumber(entry.area);
  const context = classifyContext(entry.context, entry);

  if (!entry.alt && entry.type === 'img') {
    issues.push(makeIssue(entry, page, 'warning', 'Missing alt text', 'This image has no alt attribute, which is important for accessibility and content quality.'));
  }

  if (displayArea && displayArea < 20000) {
    issues.push(makeIssue(entry, page, 'info', 'Very small display size', `Displayed size is only ${displayWidth}×${displayHeight}, which may render poorly or be too small for its container.`));
  }

  if (naturalWidth && naturalHeight && displayWidth && displayHeight) {
    const resolutionRatioWidth = displayWidth / naturalWidth;
    const resolutionRatioHeight = displayHeight / naturalHeight;
    const upscale = resolutionRatioWidth > 1.05 || resolutionRatioHeight > 1.05;
    const downsample = resolutionRatioWidth < 0.9 || resolutionRatioHeight < 0.9;

    if (upscale) {
      issues.push(makeIssue(entry, page, 'warning', 'Low-resolution image', `The image is displayed larger than its natural size (${naturalWidth}×${naturalHeight}), which can cause blur.`));
    }
    if (downsample && displayArea > 50000) {
      issues.push(makeIssue(entry, page, 'info', 'Potential overzoom', `The image is displayed smaller than its native resolution. This may indicate a crop or heavy zoom inside a larger source image.`));
    }

    const naturalRatio = getAspectRatio(naturalWidth, naturalHeight);
    const displayRatio = getAspectRatio(displayWidth, displayHeight);

    if (naturalRatio && displayRatio) {
      const ratioDelta = Math.abs(displayRatio - naturalRatio) / naturalRatio;
      if (ratioDelta > 0.35) {
        issues.push(makeIssue(entry, page, 'warning', 'Aspect ratio mismatch', `Displayed aspect ratio ${displayRatio.toFixed(2)} differs considerably from natural ratio ${naturalRatio.toFixed(2)}.`));
      }
    }

    if (context === 'fabric') {
      const ratio = displayRatio;
      if (ratio && (ratio < 0.75 || ratio > 1.4)) {
        issues.push(makeIssue(entry, page, 'warning', 'Fabric image shape issue', `Fabric images should generally be near square or gently rectangular; current display ratio is ${ratio.toFixed(2)}.`));
      }
    }

    if (context === 'hero') {
      if (displayWidth && displayHeight && displayWidth / displayHeight < 1.25) {
        issues.push(makeIssue(entry, page, 'info', 'Hero image may be too tall', `Hero images usually benefit from a wider layout; current display ratio is ${displayRatio?.toFixed(2)}.`));
      }
    }
  }

  if (entry.type === 'background' && !entry.src) {
    issues.push(makeIssue(entry, page, 'info', 'Background image missing source', 'A CSS background image was detected but no source URL was captured.'));
  }

  if (context === 'unknown' && entry.area > 180000) {
    issues.push(makeIssue(entry, page, 'info', 'Large image with unknown context', 'This large image has no inferred context label, which makes its role on the page unclear for visual QA.'));
  }

  return issues;
}

function generateReport(inventory) {
  const allIssues = [];
  const summary = {
    pages: inventory.pages.length,
    images: 0,
    issues: 0,
    lowResolution: 0,
    missingAlt: 0,
    smallDisplay: 0,
    aspectMismatch: 0,
    contextUnknown: 0,
  };

  for (const page of inventory.pages) {
    for (const image of page.images || []) {
      summary.images += 1;
      const imageIssues = analyzeImage(image, page);
      for (const issue of imageIssues) {
        allIssues.push(issue);
        summary.issues += 1;
        if (issue.title.includes('alt')) summary.missingAlt += 1;
        if (issue.title.includes('Low-resolution')) summary.lowResolution += 1;
        if (issue.title.includes('small display')) summary.smallDisplay += 1;
        if (issue.title.includes('Aspect ratio') || issue.title.includes('shape issue')) summary.aspectMismatch += 1;
        if (issue.title.includes('unknown context')) summary.contextUnknown += 1;
      }
    }
  }

  return { metadata: inventory, summary, issues: allIssues };
}

function writeReport(report) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

  const lines = [];
  lines.push('# Visual QA Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Pages scanned: ${report.summary.pages}`);
  lines.push(`- Images analyzed: ${report.summary.images}`);
  lines.push(`- Issues found: ${report.summary.issues}`);
  lines.push(`  - Missing alt text: ${report.summary.missingAlt}`);
  lines.push(`  - Low-resolution images: ${report.summary.lowResolution}`);
  lines.push(`  - Small display images: ${report.summary.smallDisplay}`);
  lines.push(`  - Aspect ratio issues: ${report.summary.aspectMismatch}`);
  lines.push(`  - Unknown context large images: ${report.summary.contextUnknown}`);
  lines.push('');
  lines.push('## Top Issues');
  lines.push('');

  const sorted = [...report.issues].sort((a, b) => {
    const severityRank = { critical: 0, warning: 1, info: 2 };
    return severityRank[a.severity] - severityRank[b.severity] || a.page.localeCompare(b.page) || a.ordinal - b.ordinal;
  });

  for (const issue of sorted.slice(0, 50)) {
    lines.push(`### [${issue.severity.toUpperCase()}] ${issue.title}`);
    lines.push('');
    lines.push(`- Page: ${issue.page}`);
    lines.push(`- Image source: ${issue.src}`);
    lines.push(`- Detail: ${issue.detail}`);
    lines.push(`- Context: ${issue.context}`);
    if (issue.screenshot) lines.push(`- Page screenshot: ${issue.screenshot}`);
    lines.push('');
  }

  fs.writeFileSync(OUTPUT_MARKDOWN, lines.join('\n'));
}

function run() {
  const inventory = loadInventory();
  const report = generateReport(inventory);
  writeReport(report);
  console.log(`Visual QA report written to ${OUTPUT_FILE} and ${OUTPUT_MARKDOWN}`);
  console.log(`Found ${report.summary.issues} issues across ${report.summary.pages} pages.`);
}

run();
