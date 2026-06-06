import { NextResponse } from "next/server";
import { readdirSync, existsSync } from "fs";
import { join, extname } from "path";

const SITE_DIRS = ["builder-heroes", "collections", "products", "uploads"];
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".jfif"]);

export async function GET() {
  const publicImages = join(process.cwd(), "public", "images");
  const images: { path: string; dir: string; name: string }[] = [];

  for (const dir of SITE_DIRS) {
    const dirPath = join(publicImages, dir);
    if (!existsSync(dirPath)) continue;
    try {
      const files = readdirSync(dirPath);
      for (const file of files) {
        if (IMAGE_EXTS.has(extname(file).toLowerCase())) {
          images.push({
            path: `/images/${dir}/${file}`,
            dir,
            name: file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          });
        }
      }
    } catch {
      // skip unreadable dir
    }
  }

  return NextResponse.json({ images });
}
