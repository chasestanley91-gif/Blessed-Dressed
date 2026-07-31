import { NextRequest, NextResponse } from "next/server";
import { readdirSync, existsSync } from "fs";
import { join, extname, normalize } from "path";

const SITE_DIRS = ["builder-heroes", "collections", "products", "uploads"];
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".jfif"]);
const MAX_PER_DIR = 500;

export async function GET(req: NextRequest) {
  const publicImages = join(process.cwd(), "public", "images");
  const images: { path: string; dir: string; name: string }[] = [];

  // Optional ?dirs=a,b/c — scan those folders instead of the site defaults.
  const dirsParam = req.nextUrl.searchParams.get("dirs");
  const dirs = dirsParam
    ? dirsParam.split(",").map((d) => d.trim()).filter(Boolean)
    : SITE_DIRS;

  for (const dir of dirs) {
    const dirPath = normalize(join(publicImages, dir));
    if (!dirPath.startsWith(publicImages)) continue;
    if (!existsSync(dirPath)) continue;
    try {
      const files = readdirSync(dirPath);
      let count = 0;
      for (const file of files) {
        if (count >= MAX_PER_DIR) break;
        if (IMAGE_EXTS.has(extname(file).toLowerCase())) {
          images.push({
            path: `/images/${dir}/${file}`,
            dir,
            name: file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          });
          count++;
        }
      }
    } catch {
      // skip unreadable dir
    }
  }

  return NextResponse.json({ images });
}
