import { NextRequest, NextResponse } from "next/server";
import { readdirSync, existsSync, readFileSync } from "fs";
import { join, extname, normalize } from "path";

const SITE_DIRS = ["builder-heroes", "collections", "products", "uploads"];
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".jfif"]);
const MAX_PER_DIR = 2000;
const IMAGE_KEYS = ["image", "aiImage", "realImage", "illustration", "techpackIllustration"] as const;

export async function GET(req: NextRequest) {
  const publicImages = join(process.cwd(), "public", "images");
  const images: { path: string; dir: string; name: string }[] = [];
  const seen = new Set<string>();

  function add(path: string, dir: string) {
    if (seen.has(path)) return;
    seen.add(path);
    const file = path.split("/").pop() ?? path;
    images.push({
      path,
      dir,
      name: file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
    });
  }

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
          add(`/images/${dir}/${file}`, dir);
          count++;
        }
      }
    } catch {
      // skip unreadable dir
    }
  }

  // Vercel excludes public/images from the function bundle (size limit).
  // When a requested folder is not on disk, still list every catalog path
  // in that folder so the editor picker is not empty. The CDN still serves
  // the files; we only need their paths here.
  const missingDirs = dirs.filter((dir) => {
    const dirPath = normalize(join(publicImages, dir));
    return dirPath.startsWith(publicImages) && !existsSync(dirPath);
  });
  if (missingDirs.length) {
    const prefixes = missingDirs.map((d) => `/images/${d}/`);
    const optionsDir = join(process.cwd(), "data-store", "options");
    if (existsSync(optionsDir)) {
      for (const file of readdirSync(optionsDir).filter((f) => f.endsWith(".json"))) {
        let data: unknown;
        try {
          data = JSON.parse(readFileSync(join(optionsDir, file), "utf8"));
        } catch {
          continue;
        }
        walkCatalog(data, (value) => {
          if (typeof value !== "string" || !value.startsWith("/images/")) return;
          const dir = missingDirs.find((d, i) => value.startsWith(prefixes[i]));
          if (dir) add(value.split("?")[0], dir);
        });
      }
    }
  }

  return NextResponse.json({ images });
}

function walkCatalog(node: unknown, visit: (value: unknown) => void) {
  if (Array.isArray(node)) {
    for (const item of node) walkCatalog(item, visit);
    return;
  }
  if (!node || typeof node !== "object") return;
  const rec = node as Record<string, unknown>;
  for (const key of IMAGE_KEYS) visit(rec[key]);
  const photos = rec.photos;
  if (Array.isArray(photos)) for (const p of photos) visit(p);
  const extra = rec.images;
  if (Array.isArray(extra)) for (const p of extra) visit(p);
  for (const value of Object.values(rec)) {
    if (value && typeof value === "object") walkCatalog(value, visit);
  }
}
