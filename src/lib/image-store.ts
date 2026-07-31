import { join, normalize, dirname, sep } from "path";

// Binary image persistence for the admin image tools.
//
// These used to call writeFileSync into public/images directly. On Vercel the
// Lambda filesystem is read-only, so every admin upload/import threw EROFS and
// the feature was dead in production. Mirrors the loadDataAsync/saveDataAsync
// split in admin-data.ts: Vercel Blob in production, filesystem locally.

const IS_VERCEL = !!process.env.VERCEL;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export class ImagePathError extends Error {}

/**
 * Resolve a caller-supplied relative path against public/images, rejecting
 * traversal.
 *
 * The previous inline check was `resolved.startsWith(publicImages)`, which a
 * sibling directory defeats: `../imagesEVIL/x` resolves to
 * `<cwd>/public/imagesEVIL/x`, and that string does start with
 * `<cwd>/public/images`. Requiring the separator closes it.
 */
export function resolveImagePath(relPath: string): { diskPath: string; key: string } {
  const publicImages = join(process.cwd(), "public", "images");
  const diskPath = normalize(join(publicImages, relPath));
  if (diskPath !== publicImages && !diskPath.startsWith(publicImages + sep)) {
    throw new ImagePathError("Invalid path");
  }
  const key = diskPath.slice(publicImages.length + 1).split(sep).join("/");
  return { diskPath, key };
}

/**
 * Persist image bytes and return the URL the app should store/serve.
 * Blob returns an absolute URL; local dev returns a `/images/...` path.
 */
export async function saveImageAsset(
  relPath: string,
  bytes: Buffer,
  contentType?: string
): Promise<string> {
  const { diskPath, key } = resolveImagePath(relPath);

  if (IS_VERCEL && BLOB_TOKEN) {
    const { put } = await import("@vercel/blob");
    const result = await put(`images/${key}`, bytes, {
      access: "public",
      addRandomSuffix: false,
      token: BLOB_TOKEN,
      ...(contentType ? { contentType } : {}),
    });
    return result.url;
  }

  const { writeFileSync, mkdirSync } = await import("fs");
  mkdirSync(dirname(diskPath), { recursive: true });
  writeFileSync(diskPath, bytes);
  return `/images/${key}`;
}
