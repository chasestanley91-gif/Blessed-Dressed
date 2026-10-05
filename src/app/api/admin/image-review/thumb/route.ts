import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { resolveImagePath, ImagePathError } from "@/lib/image-store";

export const runtime = "nodejs";

const CACHE = join(process.cwd(), ".next", "cache", "review-thumbs");

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("path") || "";
  const w = Math.min(1600, Math.max(80, Number(req.nextUrl.searchParams.get("w") || "400") || 400));
  if (!raw.startsWith("/images/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  try {
    const { diskPath } = resolveImagePath(raw.slice("/images/".length));
    if (!existsSync(diskPath)) {
      return NextResponse.json({ error: "Missing" }, { status: 404 });
    }
    const key = createHash("sha1").update(`${diskPath}|${w}`).digest("hex");
    const cached = join(CACHE, `${key}.webp`);
    if (!existsSync(cached)) {
      mkdirSync(CACHE, { recursive: true });
      const buf = await sharp(readFileSync(diskPath), { failOn: "none" })
        .rotate()
        .resize({ width: w, height: w, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 72 })
        .toBuffer();
      writeFileSync(cached, buf);
    }
    const body = readFileSync(cached);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    if (err instanceof ImagePathError) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    console.error("review thumb error:", err);
    return NextResponse.json({ error: "Thumb failed" }, { status: 500 });
  }
}
