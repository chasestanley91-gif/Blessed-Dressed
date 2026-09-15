import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const STORE = join(process.cwd(), "data-store");
const OVERLAY_FILE = join(STORE, "image-review-overlays.json");
const LOG_FILE = join(STORE, "image-review-decisions-log.json");

function readJson<T>(p: string, fallback: T): T {
  try {
    if (!existsSync(p)) return fallback;
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function patchOption(craftId: string, fn: (o: Record<string, unknown>) => void) {
  const [product, sectionId, fieldId, optionId] = craftId.split("|");
  const file = join(STORE, "options", `${product}.json`);
  const cfg = JSON.parse(readFileSync(file, "utf8")) as {
    sections?: { id: string; fields?: { id: string; options?: Record<string, unknown>[] }[] }[];
  };
  let hit = false;
  for (const s of cfg.sections ?? []) {
    if (s.id !== sectionId) continue;
    for (const f of s.fields ?? []) {
      if (f.id !== fieldId) continue;
      for (const o of f.options ?? []) {
        if (o.id !== optionId) continue;
        fn(o);
        hit = true;
      }
    }
  }
  if (!hit) throw new Error(`craft not found: ${craftId}`);
  writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      fromCraftId?: string;
      toCraftId?: string;
      path?: string;
      sha1?: string;
    };
    const fromId = String(body.fromCraftId || "");
    const toId = String(body.toCraftId || "");
    const photoPath = String(body.path || "");
    const sha1 = String(body.sha1 || "");
    if (!fromId.includes("|") || !toId.includes("|") || fromId === toId) {
      return NextResponse.json({ error: "Pick a different craft to move to." }, { status: 400 });
    }
    if (!photoPath.startsWith("/images/")) {
      return NextResponse.json({ error: "Can only move a local photo." }, { status: 400 });
    }

    patchOption(fromId, (o) => {
      o.photos = (Array.isArray(o.photos) ? o.photos : []).filter((p) => p !== photoPath);
    });
    patchOption(toId, (o) => {
      const photos = Array.isArray(o.photos) ? o.photos.filter((p) => typeof p === "string") : [];
      if (!photos.includes(photoPath)) photos.push(photoPath);
      o.photos = photos;
    });

    const overlays = readJson<Record<string, Record<string, unknown>>>(OVERLAY_FILE, {});
    const from = overlays[fromId] ?? {};
    const removed = Array.isArray(from.removedSha1) ? from.removedSha1 : [];
    if (sha1 && !removed.includes(sha1)) removed.push(sha1);
    from.removedSha1 = removed;
    from.photos = (Array.isArray(from.photos) ? from.photos : []).filter((p) => (p as { sha1?: string }).sha1 !== sha1);
    overlays[fromId] = from;

    const to = overlays[toId] ?? {};
    const photos = Array.isArray(to.photos) ? to.photos : [];
    photos.push({ path: photoPath, sha1, sources: ["moved"], verdict: "unreviewed", preTicked: false });
    to.photos = photos;
    overlays[toId] = to;
    mkdirSync(STORE, { recursive: true });
    writeFileSync(OVERLAY_FILE, JSON.stringify(overlays, null, 1) + "\n", "utf8");

    const log = readJson<unknown[]>(LOG_FILE, []);
    log.push({
      event: "moved",
      fromCraftId: fromId,
      toCraftId: toId,
      imagePath: photoPath,
      imageSha1: sha1 || undefined,
      decidedAt: new Date().toISOString(),
    });
    writeFileSync(LOG_FILE, JSON.stringify(log, null, 1), "utf8");

    return NextResponse.json({ ok: true, fromCraftId: fromId, toCraftId: toId });
  } catch (err) {
    console.error("move photo error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Move failed" }, { status: 500 });
  }
}
