import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const args = { siteRoot: '.', out: null, decisions: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      args.out = argv[++i];
    } else if (!args.decisions) {
      args.decisions = arg;
    } else if (!args.siteRoot || args.siteRoot === '.') {
      args.siteRoot = arg;
    }
  }
  return args;
}

function loadReviewData(siteRoot) {
  const htmlPath = path.join(siteRoot, 'public', 'images', 'review.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/const DATA = (\{[\s\S]*?\});\n(?:const LS|let state)/);
  if (!m) throw new Error('could not find embedded DATA in review.html');
  return JSON.parse(m[1]);
}

function techpackOf(card) {
  for (const image of card.images || []) {
    const paths = [String(image.src || '')].concat((image.aka || []).map((a) => String(a)));
    for (const p of paths) {
      if (p.startsWith('techpacks/')) return p;
    }
  }
  for (const image of card.images || []) {
    if ((image.roles || []).includes('techpack')) return String(image.src);
  }
  return null;
}

function photosOf(card) {
  return (card.images || [])
    .filter((image) => !image.remote && (image.roles || []).includes('generated'))
    .map((image) => String(image.src));
}

function normalizeCards(data) {
  const out = [];
  for (const card of data.cards || []) {
    if ('images' in card) {
      out.push({
        key: card.key || `${card.garment}|${card.fieldId}|${card.id}`,
        garment: card.garment,
        fieldId: card.fieldId || 'misc',
        id: card.id,
        label: card.label || '',
        illustration: techpackOf(card),
        photos: photosOf(card),
      });
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const siteRoot = path.resolve(args.siteRoot || '.');
  const decisionsPath = path.resolve(args.decisions || 'public/images/review-decisions.json');
  const outPath = args.out ? path.resolve(args.out) : path.join(siteRoot, 'public', 'images', 'review-remake-queue.json');

  const cards = normalizeCards(loadReviewData(siteRoot));
  const decisions = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));

  const byGfi = new Map();
  const byGi = new Map();
  const byId = new Map();
  for (const card of cards) {
    byGfi.set(`${card.garment}|${card.fieldId}|${card.id}`, card);
    if (!byGi.has(`${card.garment}|${card.id}`)) byGi.set(`${card.garment}|${card.id}`, []);
    byGi.get(`${card.garment}|${card.id}`).push(card);
    if (!byId.has(card.id)) byId.set(card.id, []);
    byId.get(card.id).push(card);
  }

  const missing = [];

  function targetsFor(row) {
    const fid = row.fieldId || row.category;
    const gfiKey = `${row.garment}|${fid}|${row.id}`;
    if (fid && byGfi.has(gfiKey)) return [byGfi.get(gfiKey)];
    const giKey = `${row.garment}|${row.id}`;
    if (byGi.has(giKey)) return byGi.get(giKey);
    return byId.get(row.id) || [];
  }

  function resolve(rows) {
    const hits = new Map();
    for (const row of rows || []) {
      const targets = targetsFor(row);
      if (!targets.length) {
        missing.push(row.id);
        continue;
      }
      for (const card of targets) {
        const key = card.key;
        if (!hits.has(key)) {
          hits.set(key, {
            garment: card.garment,
            category: card.fieldId,
            id: card.id,
            label: card.label,
            note: row.note || '',
            illustration: card.illustration,
            photos: card.photos,
            fanned_out: targets.length > 1,
            status: 'queued',
          });
        } else {
          const note = row.note || '';
          const existing = hits.get(key);
          if (note && !existing.note.includes(note)) {
            existing.note = [existing.note, note].filter(Boolean).join(' | ');
          }
        }
      }
    }
    return Array.from(hits.values());
  }

  function resolveImageRows(rows) {
    const out = [];
    for (const row of rows || []) {
      const targets = targetsFor(row);
      out.push({
        card: targets[0]?.key || null,
        garment: row.garment,
        fieldId: row.fieldId,
        id: row.id,
        src: row.src,
        roles: row.roles || [],
      });
      if (!targets.length) missing.push(row.id);
    }
    return out;
  }

  const queue = resolve(decisions.remakes || []);
  const discards = resolve(decisions.discards || []);
  const badTechPacks = resolve(decisions.bad_tech_packs || []);
  const imageKeeps = resolveImageRows(decisions.image_keeps || []);
  const imageRejects = resolveImageRows(decisions.image_rejects || []);

  const out = {
    created: new Date().toISOString(),
    source_export: decisions.exported,
    format: decisions.format || 1,
    accepted_count: decisions.accepted_count || 0,
    accepted_keys: decisions.accepted_keys || decisions.accepted_ids || [],
    unreviewed: decisions.unreviewed ?? null,
    remakes: queue,
    discards,
    bad_tech_packs: badTechPacks,
    image_keeps: imageKeeps,
    image_rejects: imageRejects,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log(`accepted: ${out.accepted_count}  |  remakes: ${queue.length}  |  discards: ${discards.length}  |  bad tech packs: ${badTechPacks.length}  |  image verdicts: ${imageKeeps.length} keep / ${imageRejects.length} reject  |  unreviewed: ${out.unreviewed}`);
  if (missing.length) {
    const deduped = [...new Set(missing)].slice(0, 10);
    console.log(`! ${new Set(missing).size} decision ids not found: ${deduped.join(', ')}`);
  }
  console.log(`queue -> ${outPath}`);
}

main();
