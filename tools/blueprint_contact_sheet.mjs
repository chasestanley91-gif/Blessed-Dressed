#!/usr/bin/env node
/**
 * blueprint_contact_sheet.mjs — lay a supplier category out as one numbered grid
 * so the drawings can actually be compared, then decided on.
 *
 * repoint_supplier_blueprints.mjs deliberately refuses to fuzzy-match: the
 * catalog names options in Blessed & Dressed's own vocabulary ("Slanted Flap
 * 4.0 cm") and the supplier names drawings in its own ("02A1__Regular_slanted"),
 * so nothing but a human looking at both pictures can settle most pairings. That
 * is the correct answer — a plausible-but-wrong blueprint is invisible to
 * garment-image-qc, which scores fidelity TO the blueprint — but it is only
 * workable if the drawings can be seen side by side at a glance.
 *
 * Each tile is numbered and captioned with its supplier code, and the index
 * printed to stdout maps number -> file, so a decision can be recorded as a
 * number and resolved back to a path without ambiguity.
 *
 * USAGE
 *   node tools/blueprint_contact_sheet.mjs jacket/Lapel_Lapel_Style
 *   node tools/blueprint_contact_sheet.mjs jacket/Pocket_Lower_Lower_pocket --cols=6
 *   node tools/blueprint_contact_sheet.mjs --list
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const FACTORY = path.join(REPO, 'public', 'images', 'factory');
const OUT_DIR = path.join(REPO, 'public', 'images', 'reports', 'contact-sheets');

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter((a) => a.startsWith('--')).map((a) => {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    return [m[1], m[2] === undefined ? true : m[2]];
  })
);
const target = argv.find((a) => !a.startsWith('--'));
const COLS = Number(flags.cols) > 0 ? Number(flags.cols) : 5;
const TILE = Number(flags.tile) > 0 ? Number(flags.tile) : 300;
const CAPTION = 34;

const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');

function categories() {
  const out = [];
  if (!fs.existsSync(FACTORY)) return out;
  for (const supplier of fs.readdirSync(FACTORY)) {
    const sd = path.join(FACTORY, supplier);
    if (!fs.statSync(sd).isDirectory()) continue;
    for (const garment of fs.readdirSync(sd)) {
      const gd = path.join(sd, garment);
      if (!fs.existsSync(gd) || !fs.statSync(gd).isDirectory()) continue;
      for (const cat of fs.readdirSync(gd)) {
        const cd = path.join(gd, cat);
        if (!fs.existsSync(cd) || !fs.statSync(cd).isDirectory()) continue;
        const files = fs.readdirSync(cd).filter((f) => fs.statSync(path.join(cd, f)).isFile());
        if (files.length) out.push({ supplier, garment, category: cat, key: `${garment}/${cat}`, dir: cd, files });
      }
    }
  }
  return out;
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

async function main() {
  const cats = categories();

  if (flags.list || !target) {
    console.log('Supplier categories with drawings:\n');
    for (const c of cats.sort((a, b) => b.files.length - a.files.length)) {
      console.log(`  ${String(c.files.length).padStart(3)}  ${c.key}   (${c.supplier})`);
    }
    console.log(`\nUsage: node tools/blueprint_contact_sheet.mjs <garment/Category>`);
    return 0;
  }

  const matches = cats.filter((c) => c.key === target || c.key.toLowerCase() === String(target).toLowerCase());
  if (!matches.length) {
    console.error(`No category "${target}". Run --list.`);
    return 1;
  }

  const { default: sharp } = await import('sharp');

  for (const cat of matches) {
    const files = cat.files.slice().sort();
    const rows = Math.ceil(files.length / COLS);
    const W = COLS * TILE;
    const H = rows * (TILE + CAPTION);

    const composites = [];
    const index = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const abs = path.join(cat.dir, file);
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const stem = file.replace(/\.[^.]+$/, '');
      const parts = stem.split('__');
      const code = parts.length > 1 ? parts[0] : '';
      const name = (parts.length > 1 ? parts.slice(1).join('__') : stem).replace(/_/g, ' ');

      let tile;
      try {
        tile = await sharp(abs)
          .resize(TILE - 8, TILE - 8, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .png()
          .toBuffer();
      } catch {
        continue; // unreadable file: skip rather than abort the sheet
      }
      composites.push({ input: tile, left: col * TILE + 4, top: row * (TILE + CAPTION) + 4 });

      const caption = `<svg width="${TILE}" height="${CAPTION}">
        <rect width="${TILE}" height="${CAPTION}" fill="#111"/>
        <text x="6" y="14" font-family="monospace" font-size="13" fill="#fff">[${i + 1}] ${escapeXml(code)}</text>
        <text x="6" y="28" font-family="monospace" font-size="11" fill="#bbb">${escapeXml(name.slice(0, 40))}</text>
      </svg>`;
      composites.push({ input: Buffer.from(caption), left: col * TILE, top: row * (TILE + CAPTION) + TILE });
      index.push({ n: i + 1, code, name, path: rel(abs) });
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, `${cat.key.replace(/\//g, '__')}.png`);
    await sharp({ create: { width: W, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } } })
      .composite(composites)
      .png()
      .toFile(outPath);

    console.log(`\n${cat.key}  —  ${index.length} drawing(s)`);
    for (const e of index) console.log(`  [${String(e.n).padStart(2)}] ${(e.code || '—').padEnd(6)} ${e.name}`);
    console.log(`  sheet: ${rel(outPath)}`);
  }
  return 0;
}

main().then((c) => process.exit(c));
