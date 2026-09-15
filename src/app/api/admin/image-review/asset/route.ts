import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { saveImageAsset, ImagePathError } from "@/lib/image-store";

const STORE = join(process.cwd(), "data-store");
const OVERLAY_FILE = join(STORE, "image-review-overlays.json");
const SAFE = /^[a-z0-9][a-z0-9._-]*$/i;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const MAX_BYTES = 20 * 1024 * 1024;

type Kind = "drawing" | "reference" | "photo";

function isAllowedImage(type: string, ext: string) {
  if (type && type !== "application/octet-stream") return ALLOWED.has(type);
  return ALLOWED_EXT.has(ext);
}

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
  if (!product || !sectionId || !fieldId || !optionId) throw new Error("bad craftId");
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
  if (!hit) throw new Error("craft not found in catalog");
  writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

function patchOverlay(craftId: string, fn: (c: Record<string, unknown>) => void) {
  const all = readJson<Record<string, Record<string, unknown>>>(OVERLAY_FILE, {});
  const row = all[craftId] ?? {};
  fn(row);
  all[craftId] = row;
  mkdirSync(STORE, { recursive: true });
  writeFileSync(OVERLAY_FILE, JSON.stringify(all, null, 1) + "\n", "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const craftId = String(form.get("craftId") || "");
    const kind = String(form.get("kind") || "") as Kind;
    const parts = craftId.split("|");
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    if (parts.length !== 4 || !SAFE.test(parts[0]) || !SAFE.test(parts[3])) {
      return NextResponse.json({ error: "Invalid craft" }, { status: 400 });
    }
    if (kind !== "drawing" && kind !== "reference" && kind !== "photo") {
      return NextResponse.json({ error: "kind must be drawing, reference, or photo" }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!isAllowedImage(file.type, ext)) {
      return NextResponse.json({ error: `Not an image we can use (${file.type || ext || "unknown"})` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
    }

    const [product, , , optionId] = parts;
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha1 = createHash("sha1").update(bytes).digest("hex");

    let rel: string;
    if (kind === "drawing") rel = `blueprints/owner/${product}/${optionId}/drawing-${stamp}.${ext || "jpg"}`;
    else if (kind === "reference") rel = `review-refs/${product}/${optionId}/${stamp}.${ext || "jpg"}`;
    else rel = `review/${product}__${optionId}__owner-${stamp}.${ext || "jpg"}`;

    const path = await saveImageAsset(rel, bytes, file.type || undefined);

    if (kind === "drawing") {
      patchOption(craftId, (o) => {
        o.illustration = path;
        o.image = path;
        o.illustrationStatus = "drawing";
      });
      patchOverlay(craftId, (c) => {
        c.drawing = { path, status: "owner-uploaded", exists: true };
      });
    } else if (kind === "reference") {
      patchOverlay(craftId, (c) => {
        const refs = Array.isArray(c.references) ? c.references : [];
        refs.push({ path, bytes: file.size });
        c.references = refs;
      });
    } else {
      patchOption(craftId, (o) => {
        const photos = Array.isArray(o.photos) ? o.photos.filter((p) => typeof p === "string") : [];
        if (!photos.includes(path)) photos.push(path);
        o.photos = photos;
      });
      patchOverlay(craftId, (c) => {
        const photos = Array.isArray(c.photos) ? c.photos : [];
        photos.push({ path, sha1, sources: ["owner-upload"], verdict: "approved", preTicked: true });
        c.photos = photos;
      });
    }

    return NextResponse.json({ ok: true, path, sha1, kind });
  } catch (err) {
    if (err instanceof ImagePathError) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    console.error("image-review asset upload error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
