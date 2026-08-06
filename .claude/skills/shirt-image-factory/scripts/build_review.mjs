// build_review.mjs — THE canonical review-gallery builder (role-based schema).
// Rebuilds <site_root>/public/images/review.html with field-scoped cards and
// per-image decisions, plus a deterministic mapping audit report.
//
// Cards are keyed garment|fieldId|optionId (NOT garment|id) so option ids reused
// across fields (e.g. stitch-01-top in collar/cuff/placket stitching) each get
// their own card with their own field-scoped tech pack and images.
//
// Run: node build_review.mjs <site_root>   (site_root defaults to cwd)
// Supersedes the photos[]/illustration-schema build_review.py — decisions export
// as format 3; apply with apply_review.py (accepts formats 3, 2 and legacy).

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const IMG = path.join(ROOT, 'public', 'images');
const CATALOG_DIR = path.join(ROOT, 'data-store', 'options');
const CATALOGS = ['shirt', 'sport-coat', 'suit-2pc', 'suit-3pc', 'trousers', 'vest'];

const groupOf = (catalog, sectionId) => {
  if (catalog === 'shirt') return 'shirt';
  if (catalog === 'trousers') return 'trousers';
  if (catalog === 'vest') return 'vest';
  if (/^Trousers-/.test(sectionId)) return 'trousers';
  if (/^Vest-/.test(sectionId)) return 'vest';
  return 'jacket';
};
const GEN_DIR = { shirt: 'shirt', jacket: 'jacket', trousers: 'trousers', vest: 'vest' };

const normAlnum = s => String(s).toLowerCase()
  .replace(/(\d)\.0(\D|$)/g, '$1$2')   // "5.0 cm" ≡ "5cm"
  .replace(/(\d)\.(\d)/g, '$1$2')      // "2.5" ≡ "25"
  .replace(/[^a-z0-9]/g, '');
// strip extension, trailing epoch timestamps, -src markers and -vN version suffixes
const stemOf = f => path.basename(f).replace(/\.[a-z0-9]+$/i, '')
  .replace(/-\d{12,}$/, '').replace(/-src$/, '');
const baseIdOf = stem => stem.replace(/-v\d+[a-z0-9-]*$/i, '');

// normalize a catalog src ("/images/foo/bar.png") to a path relative to public/images
const rel = src => src.replace(/^\/images\//, '').replace(/^\//, '');
const isRemote = src => /^https?:\/\//i.test(src);
const existsLocal = p => fs.existsSync(path.join(IMG, p));

// ---------------------------------------------------------------- load catalogs
const cards = new Map();
const fieldIdSet = new Set();
for (const cat of CATALOGS) {
  const data = JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, cat + '.json'), 'utf8'));
  for (const sec of data.sections) {
    for (const field of sec.fields) {
      fieldIdSet.add(field.id);
      for (const o of field.options || []) {
        const g = groupOf(cat, sec.id);
        const key = `${g}|${field.id}|${o.id}`;
        let c = cards.get(key);
        if (!c) {
          c = {
            key, garment: g, sectionId: sec.id.replace(/^(Trousers|Vest)-/, ''),
            section: sec.label, fieldId: field.id, field: field.label || field.id,
            id: o.id, label: o.label, products: [], refs: []
          };
          cards.set(key, c);
        }
        c.products.push(cat);
        const add = (src, role) => { if (src) c.refs.push({ src, role, from: cat }); };
        add(o.techpackIllustration, 'techpack');
        add(o.image, 'builder');
        add(o.aiImage, 'ai');
        add(o.realImage, 'real');
        for (const u of o.images || []) add(u, 'candidate');
      }
    }
  }
}

// ------------------------------------------------- disk techpacks (field-aware)
const techpackMapPath = path.join(IMG, 'techpacks', 'techpack-map.json');
const techpackMap = fs.existsSync(techpackMapPath)
  ? JSON.parse(fs.readFileSync(techpackMapPath, 'utf8')) : {};
const diskTechpacks = new Map(); // "<garment>/<fieldDir>" -> [files]
const tpRoot = path.join(IMG, 'techpacks');
if (fs.existsSync(tpRoot)) {
  for (const g of fs.readdirSync(tpRoot)) {
    const gDir = path.join(tpRoot, g);
    if (!fs.statSync(gDir).isDirectory()) continue;
    for (const fdir of fs.readdirSync(gDir)) {
      const fDir = path.join(gDir, fdir);
      if (!fs.statSync(fDir).isDirectory()) continue;
      diskTechpacks.set(`${g}/${fdir}`,
        fs.readdirSync(fDir).map(f => `techpacks/${g}/${fdir}/${f}`));
    }
  }
}

// ------------------------------------------------------------- generated files
const genFiles = new Map(); // relative path -> {dir, baseId}
for (const dir of Object.values(GEN_DIR)) {
  const d = path.join(IMG, 'generated', dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    const p = `generated/${dir}/${f}`;
    genFiles.set(p, { dir, baseId: baseIdOf(stemOf(f)) });
  }
}

// ----------------------------------------------------------- assemble images
const md5cache = new Map();
const md5 = p => {
  if (!md5cache.has(p)) {
    try { md5cache.set(p, crypto.createHash('md5').update(fs.readFileSync(path.join(IMG, p))).digest('hex').slice(0, 10)); }
    catch { md5cache.set(p, null); }
  }
  return md5cache.get(p);
};

const claimedGen = new Set();
const pathOwners = new Map(); // local path -> Set(cardKey)

const nameMatches = (p, c) => {
  const nb = normAlnum(baseIdOf(stemOf(p)));
  const ni = normAlnum(c.id), nl = normAlnum(c.label);
  return (ni && (nb.includes(ni) || ni.includes(nb))) ||
         (nl && nl.length >= 3 && (nb.includes(nl) || nl.includes(nb)));
};

for (const c of cards.values()) {
  const imgs = new Map(); // src -> entry
  const put = (src, role, flags = []) => {
    if (!src) return;
    const remote = isRemote(src);
    const p = remote ? src : rel(src);
    let e = imgs.get(p);
    if (!e) {
      e = { src: p, roles: [], flags: [], remote };
      imgs.set(p, e);
    }
    if (!e.roles.includes(role)) e.roles.push(role);
    for (const f of flags) if (!e.flags.includes(f)) e.flags.push(f);
  };

  // 1. catalog-referenced images
  for (const r of c.refs) put(r.src, r.role);

  // 2. field-matched disk techpack (shirt techpacks live under techpacks/<g>/<fieldId>/)
  const fieldTps = diskTechpacks.get(`${c.garment}/${c.fieldId}`) || [];
  for (const tp of fieldTps) if (nameMatches(tp, c)) put(tp, 'techpack');
  // techpack-map fallback — field-scoped key wins (ids repeat across fields, e.g.
  // stitch-01-amf on both collar and cuff); legacy 2-part key otherwise. Flag when
  // the resolved pack sits in a different field's folder.
  const mapped = techpackMap[`${c.garment}|${c.fieldId}|${c.id}`]
    || techpackMap[`${c.garment}|${c.id}`];
  if (mapped && !imgs.has(mapped)) {
    const mDir = mapped.split('/')[2];
    put(mapped, 'techpack', mDir && mDir !== c.fieldId ? [`from ${mDir} folder`] : []);
  }

  // 3. generated photos for this garment + id (all versions)
  for (const [p, info] of genFiles) {
    if (info.baseId === c.id && info.dir === GEN_DIR[c.garment]) put(p, 'generated');
  }

  c.images = [...imgs.values()];
  for (const e of c.images) {
    if (e.remote) { e.flags.push('remote'); continue; }
    if (!existsLocal(e.src)) { e.flags.push('missing'); continue; }
    if (e.src.startsWith('generated/')) {
      claimedGen.add(e.src);
      const gdir = e.src.split('/')[1];
      if (gdir !== GEN_DIR[c.garment]) e.flags.push(`in generated/${gdir}`);
    }
    // filename vs id/label check — only for convention dirs (not factory/, techpacks/)
    const top = e.src.split('/')[0];
    if (top !== 'factory' && top !== 'techpacks' && !nameMatches(e.src, c)) {
      e.flags.push('name≠id');
    }
    // image sitting in another field's folder
    const dirSeg = e.src.split('/')[0];
    if (fieldIdSet.has(dirSeg) && dirSeg !== c.fieldId) e.flags.push(`in ${dirSeg}/`);
    if (!pathOwners.has(e.src)) pathOwners.set(e.src, new Set());
    pathOwners.get(e.src).add(c.key);
  }
  delete c.refs;
}

// 4. unclaimed generated files: try cross-garment attach by id, else orphan
const byGarmentId = new Map();
for (const c of cards.values()) {
  const k = c.id;
  if (!byGarmentId.has(k)) byGarmentId.set(k, []);
  byGarmentId.get(k).push(c);
}
const orphans = [];
for (const [p, info] of genFiles) {
  if (claimedGen.has(p)) continue;
  const owners = byGarmentId.get(info.baseId) || [];
  if (owners.length) {
    for (const c of owners) {
      c.images.push({
        src: p, roles: ['generated'], remote: false,
        flags: [`in generated/${info.dir}`, 'unreferenced'],
      });
      if (!pathOwners.get(p)) pathOwners.set(p, new Set());
      pathOwners.get(p).add(c.key);
    }
  } else orphans.push(p);
}

// 5. shared flags + identical-content merge within a card
for (const c of cards.values()) {
  // merge identical-content local files inside one card
  const byHash = new Map();
  c.images = c.images.filter(e => {
    if (e.remote || e.flags.includes('missing')) return true;
    const h = md5(e.src);
    if (!h) return true;
    const prev = byHash.get(h);
    if (prev) {
      prev.aka = prev.aka || [];
      prev.aka.push(e.src);
      for (const r of e.roles) if (!prev.roles.includes(r)) prev.roles.push(r);
      for (const f of e.flags) if (!prev.flags.includes(f)) prev.flags.push(f);
      return false;
    }
    byHash.set(h, e);
    return true;
  });
  for (const e of c.images) {
    const owners = pathOwners.get(e.src);
    if (owners && owners.size > 1) {
      const others = [...owners].filter(k => k !== c.key)
        .map(k => cards.get(k)).filter(Boolean)
        .map(o => `${o.garment} ${o.field} · ${o.label}`);
      e.flags.push(`also on ${owners.size - 1}: ${[...new Set(others)].slice(0, 3).join(', ')}`);
      e.shared = owners.size;
    }
  }
  // stable ordering: techpack, builder, generated (by name), ai, real, candidates
  const rank = e =>
    e.roles.includes('techpack') ? 0 :
    e.roles.includes('builder') ? 1 :
    e.roles.includes('generated') ? 2 :
    e.roles.includes('ai') ? 3 :
    e.roles.includes('real') ? 4 : 5;
  c.images.sort((a, b) => rank(a) - rank(b) || a.src.localeCompare(b.src));
}

// ---------------------------------------------------------------- audit report
const all = [...cards.values()];
const flat = [];
for (const c of all) for (const e of c.images) flat.push({ c, e });
const report = {
  built: new Date().toISOString(),
  totals: {
    cards: all.length,
    by_garment: Object.fromEntries(['shirt', 'jacket', 'trousers', 'vest']
      .map(g => [g, all.filter(c => c.garment === g).length])),
    images: flat.length,
    local_images: flat.filter(x => !x.e.remote).length,
    remote_candidates: flat.filter(x => x.e.remote).length,
    cards_with_generated: all.filter(c => c.images.some(e => e.roles.includes('generated'))).length,
    cards_no_local_photo: all.filter(c => !c.images.some(e => !e.remote && !e.roles.includes('techpack') && !e.flags.includes('missing'))).length,
  },
  missing: flat.filter(x => x.e.flags.includes('missing'))
    .map(x => ({ card: x.c.key, src: x.e.src, roles: x.e.roles })),
  name_mismatch: flat.filter(x => x.e.flags.includes('name≠id'))
    .map(x => ({ card: x.c.key, src: x.e.src, roles: x.e.roles })),
  wrong_field_dir: flat.filter(x => x.e.flags.some(f => f.startsWith('in ') && !f.startsWith('in generated/')))
    .map(x => ({ card: x.c.key, src: x.e.src, flags: x.e.flags })),
  cross_garment_generated: flat.filter(x => x.e.flags.some(f => f.startsWith('in generated/')))
    .map(x => ({ card: x.c.key, src: x.e.src, flags: x.e.flags })),
  shared_images: [...pathOwners.entries()].filter(([, s]) => s.size > 1)
    .map(([p, s]) => ({ src: p, cards: [...s] })),
  orphan_generated: orphans.sort(),
};
const reportsDir = path.join(IMG, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
const reportPath = path.join(reportsDir, `mapping-audit-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 1));

// ------------------------------------------------------------------ page data
const pageCards = all.map(c => ({
  key: c.key, garment: c.garment, section: c.section, field: c.field,
  fieldId: c.fieldId, id: c.id, label: c.label,
  products: [...new Set(c.products)],
  ambiguous: (byGarmentId.get(c.id) || []).filter(o => o.garment === c.garment).length > 1,
  images: c.images.map(e => ({
    src: e.src, roles: e.roles, flags: e.flags, remote: e.remote,
    aka: e.aka || undefined,
  })),
})).sort((a, b) => a.garment.localeCompare(b.garment) ||
  a.section.localeCompare(b.section) || a.field.localeCompare(b.field) ||
  a.label.localeCompare(b.label));

const DATA = {
  stats: {
    built: report.built,
    cards: pageCards.length,
    images: report.totals.images,
    flagged: flat.filter(x => x.e.flags.some(f => f !== 'remote')).length,
    by_garment: report.totals.by_garment,
  },
  cards: pageCards,
  orphans,
};

// ------------------------------------------------------------------- html
const HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Blessed &amp; Dressed — Option Image Review v2</title>
<style>
  :root{--ink:#1a1a1a;--muted:#777;--line:#e4e0da;--bg:#faf8f5;--card:#fff;
        --ok:#1e7a3c;--ok-bg:#e6f4ea;--bad:#b3261e;--bad-bg:#fdecea;--gold:#8a6d3b;--warn:#a05a00}
  *{box-sizing:border-box} body{margin:0;font:15px/1.5 Georgia,'Times New Roman',serif;color:var(--ink);background:var(--bg)}
  header{position:sticky;top:0;z-index:9;background:#fff;border-bottom:1px solid var(--line);padding:10px 20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  h1{font-size:16px;margin:0 12px 0 0;letter-spacing:.04em}
  select,input[type=search]{font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:#fff;max-width:210px}
  .btn{font:inherit;font-size:13px;padding:7px 12px;border:1px solid var(--line);border-radius:6px;background:#fff;cursor:pointer}
  .btn:hover{border-color:var(--gold)}
  .btn.primary{background:var(--ink);color:#fff;border-color:var(--ink)}
  #progress{margin-left:auto;font-size:12.5px;color:var(--muted)}
  #bar{height:4px;background:var(--line)} #barfill{height:4px;background:var(--gold);width:0}
  main{max-width:1360px;margin:18px auto;padding:0 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
  .card.accept{outline:3px solid var(--ok)} .card.remake{outline:3px solid var(--bad)}
  .card.discard{outline:3px dashed #999;opacity:.55} .card.badtp{outline:3px solid var(--warn)}
  .imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:1px;background:var(--line)}
  .imgs figure{margin:0;background:#fff;padding:7px 7px 4px;text-align:center;position:relative;display:flex;flex-direction:column}
  .imgs figure.keep{background:var(--ok-bg)} .imgs figure.reject{background:var(--bad-bg)}
  .imgs figure.reject img{opacity:.35}
  .imgs img{max-width:100%;max-height:190px;object-fit:contain;cursor:zoom-in;margin:auto}
  .imgs figcaption{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-top:4px;line-height:1.35}
  .flag{color:var(--warn);font-weight:700;text-transform:none;letter-spacing:0}
  .iv{display:flex;gap:4px;justify-content:center;margin-top:4px}
  .iv button{font:inherit;font-size:11.5px;padding:2px 10px;border:1px solid var(--line);border-radius:5px;background:#fff;cursor:pointer;line-height:1.5}
  .iv .k.on{background:var(--ok);border-color:var(--ok);color:#fff;font-weight:700}
  .iv .x.on{background:var(--bad);border-color:var(--bad);color:#fff;font-weight:700}
  .missing{padding:22px 6px;color:var(--muted);font-size:12px}
  .meta{padding:10px 12px 4px}
  .meta b{font-size:14.5px} .meta .sub{font-size:12px;color:var(--muted)}
  .chip{display:inline-block;font-size:11px;border:1px solid var(--line);border-radius:99px;padding:1px 8px;margin:1px 0 1px 6px;color:var(--muted)}
  .chip.warn{border-color:var(--warn);color:var(--warn)}
  .actions{display:flex;gap:6px;padding:10px 12px 12px;align-items:center}
  .actions .a{flex:1;padding:8px 0;border-radius:6px;border:1px solid var(--line);background:#fff;cursor:pointer;font:inherit;font-size:13px}
  .a.acc.on{background:var(--ok-bg);border-color:var(--ok);color:var(--ok);font-weight:700}
  .a.rem.on{background:var(--bad-bg);border-color:var(--bad);color:var(--bad);font-weight:700}
  .a.dis.on{background:#eee;border-color:#777;color:#444;font-weight:700}
  .a.btp.on{background:#fff4e5;border-color:var(--warn);color:var(--warn);font-weight:700}
  .clr{font-size:11px;color:var(--muted);cursor:pointer;margin-left:6px;text-decoration:underline}
  .note{display:none;padding:0 12px 12px} .note.show{display:block}
  .note input{width:100%;font:inherit;padding:7px;border:1px solid var(--line);border-radius:6px}
  #orphans{max-width:1360px;margin:10px auto 60px;padding:0 20px;font-size:13px;color:var(--muted)}
  #toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 18px;border-radius:8px;opacity:0;transition:.3s;z-index:99}
  #zoom{display:none;position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:50;cursor:zoom-out;align-items:center;justify-content:center}
  #zoom img{max-width:94vw;max-height:94vh;background:#fff}
  #sentinel{height:10px}
  label.cb{font-size:12.5px;white-space:nowrap}
</style></head><body>
<header>
  <h1>B&amp;D — OPTION REVIEW v2</h1>
  <select id="fGarment"><option value="">All garments</option></select>
  <select id="fField"><option value="">All craft fields</option></select>
  <select id="fState">
    <option value="">All states</option><option value="un">Unreviewed</option>
    <option value="accept">Accepted</option><option value="remake">Remake</option>
    <option value="discard">Discarded</option><option value="badtp">Bad tech pack</option>
  </select>
  <label class="cb"><input type="checkbox" id="fFlagged"> flagged images only</label>
  <label class="cb"><input type="checkbox" id="fRemote"> show remote candidates</label>
  <input type="search" id="fSearch" placeholder="search label or id" style="min-width:140px">
  <span id="progress"></span>
  <button class="btn" id="acceptRest">Accept all shown</button>
  <button class="btn primary" id="copyBtn">Copy decisions</button>
  <button class="btn" id="dlBtn">Download decisions.json</button>
</header>
<div id="bar"><div id="barfill"></div></div>
<main id="grid"></main>
<div id="sentinel"></div>
<div id="orphans"></div>
<div id="toast"></div>
<div id="zoom" onclick="this.style.display='none'"><img id="zoomImg"></div>
<script>
const DATA = __DATA__;
const LS = 'bd-review-v2';
let state = JSON.parse(localStorage.getItem(LS) || '{}');
const cards = DATA.cards;
const save = () => localStorage.setItem(LS, JSON.stringify(state));

// ---- one-time migration from v1 (garment|category|id). Only when the option id
// maps to exactly ONE card within the garment — ambiguous ids (stitch-01-top et
// al) were the mismapped ones and need a fresh look with correct images.
(function(){
  if (localStorage.getItem(LS + '-migrated')) return;
  let old = {};
  try { old = JSON.parse(localStorage.getItem('bd-review-v1') || '{}'); } catch(e){}
  if (!Object.keys(old).length) { localStorage.setItem(LS + '-migrated', '1'); return; }
  const perGid = {};
  for (const c of cards){ const k = c.garment + '|' + c.id; perGid[k] = (perGid[k]||0)+1; }
  let n = 0;
  for (const c of cards){
    if (state[c.key]) continue;
    if (perGid[c.garment + '|' + c.id] > 1) continue;
    const og = c.garment === 'jacket' ? 'suit' : c.garment;
    const hit = old[og + '|misc|' + c.id] || old[og + '|trousers|' + c.id] || old[og + '|' + c.id];
    if (hit && hit.v){ state[c.key] = {v: hit.v, note: hit.note || '', img: {}}; n++; }
  }
  localStorage.setItem(LS + '-migrated', '1');
  if (n) { save(); console.log('migrated ' + n + ' v1 decisions'); }
})();

const el = (t, c) => { const e = document.createElement(t); if (c) e.className = c; return e; };
const st = k => state[k] || null;
const setCard = (k, patch) => { state[k] = Object.assign({v: null, note: '', img: {}}, state[k] || {}, patch); save(); };
const imgVerdict = (k, src) => (state[k] && state[k].img && state[k].img[src]) || null;
const setImg = (k, src, v) => {
  const cur = Object.assign({v: null, note: '', img: {}}, state[k] || {});
  if (v === null) delete cur.img[src]; else cur.img[src] = v;
  state[k] = cur; save();
};

const garments = [...new Set(cards.map(c => c.garment))].sort();
garments.forEach(g => fGarment.add(new Option(g, g)));
function fillFields(){
  const g = fGarment.value;
  const cur = fField.value;
  while (fField.options.length > 1) fField.remove(1);
  const fs = [...new Set(cards.filter(c => !g || c.garment === g).map(c => c.section + ' · ' + c.field))].sort();
  fs.forEach(f => fField.add(new Option(f, f)));
  fField.value = [...fField.options].some(o => o.value === cur) ? cur : '';
}
fillFields();

const flagged = e => e.flags.some(f => f !== 'remote');
const srcUrl = s => /^https?:/.test(s) ? s : s;

function figHtml(c, e, i){
  const v = imgVerdict(c.key, e.src);
  const cls = v === 'keep' ? ' keep' : v === 'reject' ? ' reject' : '';
  const flagsHtml = e.flags.length ? '<span class="flag">' + e.flags.join(' · ') + '</span>' : '';
  const roleTxt = e.roles.join('+') + (e.aka ? ' (×' + (e.aka.length + 1) + ' copies)' : '');
  return '<figure class="ph' + cls + '" data-src="' + e.src.replace(/"/g, '&quot;') + '">' +
    '<img loading="lazy" src="' + srcUrl(e.src) + '" onerror="this.replaceWith(Object.assign(document.createElement(\\'div\\'),{className:\\'missing\\',textContent:\\'failed to load\\'}))">' +
    '<figcaption>' + roleTxt + (flagsHtml ? '<br>' + flagsHtml : '') + '</figcaption>' +
    '<div class="iv"><button class="k' + (v === 'keep' ? ' on' : '') + '" title="This image is correct for this option">✓ keep</button>' +
    '<button class="x' + (v === 'reject' ? ' on' : '') + '" title="Wrong image for this option">✗ wrong</button></div></figure>';
}

function buildCard(c){
  const s = st(c.key);
  const card = el('div', 'card' + (s && s.v ? ' ' + s.v : ''));
  card.dataset.k = c.key;
  const showRemote = fRemote.checked;
  const imgs = el('div', 'imgs');
  const list = c.images.filter(e => showRemote || !e.remote);
  imgs.innerHTML = list.length
    ? list.map((e, i) => figHtml(c, e, i)).join('')
    : '<figure><div class="missing">no local images' + (c.images.length ? ' (' + c.images.length + ' remote hidden)' : '') + '</div></figure>';
  imgs.querySelectorAll('figure.ph').forEach(fig => {
    const src = fig.dataset.src;
    const im = fig.querySelector('img');
    if (im) im.onclick = () => { zoomImg.src = im.src; zoom.style.display = 'flex'; };
    const [bk, bx] = fig.querySelectorAll('.iv button');
    const apply = v => {
      setImg(c.key, src, v);
      fig.classList.toggle('keep', v === 'keep');
      fig.classList.toggle('reject', v === 'reject');
      bk.classList.toggle('on', v === 'keep');
      bx.classList.toggle('on', v === 'reject');
      updProgress();
    };
    bk.onclick = () => apply(imgVerdict(c.key, src) === 'keep' ? null : 'keep');
    bx.onclick = () => apply(imgVerdict(c.key, src) === 'reject' ? null : 'reject');
  });
  const meta = el('div', 'meta');
  const nFlag = c.images.filter(flagged).length;
  meta.innerHTML = '<b>' + c.label + '</b>' +
    '<span class="chip">' + c.garment + '</span>' +
    '<span class="chip">' + c.section + ' · ' + c.field + '</span>' +
    (c.ambiguous ? '<span class="chip warn">id in multiple fields</span>' : '') +
    (nFlag ? '<span class="chip warn">' + nFlag + ' flagged</span>' : '') +
    '<div class="sub">' + c.id + ' · ' + c.products.join(', ') + '</div>';
  const act = el('div', 'actions');
  const noteWrap = el('div', 'note' + (s && s.v && s.v !== 'accept' ? ' show' : ''));
  const note = document.createElement('input');
  note.placeholder = "what's wrong? (optional — guides the fix)";
  note.value = (s && s.note) || '';
  note.oninput = () => { setCard(c.key, {v: (st(c.key) && st(c.key).v) || 'remake', note: note.value}); updProgress(); };
  noteWrap.appendChild(note);
  const mk = (cls, txt, v) => {
    const b = el('button', 'a ' + cls + (s && s.v === v ? ' on' : ''));
    b.textContent = txt;
    b.title = ({accept: 'Option imagery is right overall', remake: 'Regenerate the photo',
                discard: 'Drop this option entirely', badtp: 'Tech-pack illustration is wrong/unusable'})[v];
    b.onclick = () => {
      const cur = st(c.key);
      setCard(c.key, {v: cur && cur.v === v ? null : v, note: note.value});
      const nv = st(c.key).v;
      card.className = 'card' + (nv ? ' ' + nv : '');
      act.querySelectorAll('.a').forEach(x => x.classList.remove('on'));
      if (nv) b.classList.add('on');
      noteWrap.classList.toggle('show', !!nv && nv !== 'accept');
      updProgress();
    };
    return b;
  };
  const clr = el('span', 'clr'); clr.textContent = 'clear all';
  clr.onclick = () => { delete state[c.key]; save(); render(); };
  if (s) meta.appendChild(clr);
  act.append(mk('acc', 'Accept', 'accept'), mk('rem', 'Remake', 'remake'),
             mk('dis', 'Discard', 'discard'), mk('btp', 'Bad pack', 'badtp'));
  card.append(imgs, meta, act, noteWrap);
  return card;
}

let queue = [], cursor = 0;
const CHUNK = 60;
function renderChunk(){
  const frag = document.createDocumentFragment();
  const end = Math.min(cursor + CHUNK, queue.length);
  for (; cursor < end; cursor++) frag.appendChild(buildCard(queue[cursor]));
  grid.appendChild(frag);
}
new IntersectionObserver(es => { if (es[0].isIntersecting && cursor < queue.length) renderChunk(); },
  {rootMargin: '1200px'}).observe(sentinel);

function render(){
  grid.innerHTML = '';
  const g = fGarment.value, ff = fField.value, stf = fState.value,
        q = fSearch.value.toLowerCase(), fl = fFlagged.checked;
  queue = cards.filter(c => {
    if (g && c.garment !== g) return false;
    if (ff && (c.section + ' · ' + c.field) !== ff) return false;
    const s = st(c.key);
    if (stf === 'un' && s && s.v) return false;
    if (stf && stf !== 'un' && (!s || s.v !== stf)) return false;
    if (fl && !c.images.some(flagged)) return false;
    if (q && !(c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))) return false;
    return true;
  });
  cursor = 0;
  renderChunk();
  updProgress(queue.length);
}
let lastShown;
function updProgress(shown){
  if (shown !== undefined) lastShown = shown;
  const done = cards.filter(c => st(c.key) && st(c.key).v).length;
  const iv = Object.values(state).reduce((a, s) => a + Object.keys((s && s.img) || {}).length, 0);
  const n = v => Object.values(state).filter(s => s && s.v === v).length;
  progress.textContent = done + '/' + cards.length + ' options · ' + iv + ' image verdicts · ' +
    n('remake') + ' remake · ' + n('discard') + ' discard · ' + n('badtp') + ' bad pack' +
    (lastShown !== undefined ? ' · showing ' + lastShown : '');
  barfill.style.width = (100 * done / Math.max(1, cards.length)) + '%';
}

function decisions(){
  const remakes = [], accepted = [], discards = [], badtps = [],
        image_keeps = [], image_rejects = [];
  for (const c of cards){
    const s = st(c.key);
    if (s){
      const entry = {garment: c.garment, section: c.section, field: c.field,
                     fieldId: c.fieldId, id: c.id, label: c.label, note: s.note || ''};
      if (s.v === 'remake') remakes.push(entry);
      else if (s.v === 'discard') discards.push(entry);
      else if (s.v === 'badtp') badtps.push(entry);
      else if (s.v === 'accept') accepted.push(c.key);
      for (const [src, v] of Object.entries(s.img || {})){
        const e = c.images.find(x => x.src === src);
        const rec = {garment: c.garment, fieldId: c.fieldId, id: c.id, src: src,
                     roles: e ? e.roles : []};
        (v === 'keep' ? image_keeps : image_rejects).push(rec);
      }
    }
  }
  return {exported: new Date().toISOString(), format: 3,
          accepted_count: accepted.length, accepted_keys: accepted,
          remakes: remakes, discards: discards, bad_tech_packs: badtps,
          image_keeps: image_keeps, image_rejects: image_rejects,
          unreviewed: cards.filter(c => !st(c.key) || !st(c.key).v).length};
}
copyBtn.onclick = async () => {
  const d = decisions();
  const compact = Object.assign({}, d);
  delete compact.accepted_keys;
  const text = JSON.stringify(compact, null, 1);
  try { await navigator.clipboard.writeText(text); toastMsg('Copied — paste it to Claude'); }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    toastMsg('Copied — paste it to Claude');
  }
};
dlBtn.onclick = () => {
  const b = new Blob([JSON.stringify(decisions(), null, 2)], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(b);
  a.download = 'decisions.json'; a.click();
};
acceptRest.onclick = () => {
  for (const c of queue) if (!st(c.key) || !st(c.key).v) setCard(c.key, {v: 'accept'});
  render(); toastMsg('Accepted all shown (existing decisions kept)');
};
function toastMsg(t){ toast.textContent = t; toast.style.opacity = 1; setTimeout(() => toast.style.opacity = 0, 2200); }
fGarment.addEventListener('input', () => { fillFields(); render(); });
[fField, fState, fFlagged, fRemote, fSearch].forEach(x => x.addEventListener('input', render));
if (DATA.orphans.length){
  orphans.innerHTML = '<b>' + DATA.orphans.length + ' orphan generated photos</b> (no option matches them): ' + DATA.orphans.join(' · ');
}
render();
</script></body></html>`;

const outPath = path.join(IMG, 'review.html');
const backupPath = path.join(IMG, 'review-v1.html');
if (fs.existsSync(outPath) && !fs.existsSync(backupPath)) fs.copyFileSync(outPath, backupPath);
fs.writeFileSync(outPath, HTML.replace('__DATA__', JSON.stringify(DATA)));

console.log('cards:', DATA.stats.cards, JSON.stringify(DATA.stats.by_garment));
console.log('images total:', report.totals.images,
  '| local:', report.totals.local_images, '| remote candidates:', report.totals.remote_candidates);
console.log('flags — missing:', report.missing.length,
  '| name mismatch:', report.name_mismatch.length,
  '| wrong field dir:', report.wrong_field_dir.length,
  '| cross-garment generated:', report.cross_garment_generated.length,
  '| shared images:', report.shared_images.length,
  '| orphan generated:', report.orphan_generated.length);
console.log('report:', path.relative(ROOT, reportPath));
console.log('review page:', path.relative(ROOT, outPath), '(previous saved as review-v1.html)');
