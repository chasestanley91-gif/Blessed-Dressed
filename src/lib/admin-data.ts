import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const STORE_DIR = join(process.cwd(), "data-store");

// ─── Synchronous filesystem helpers (used by server components & local dev) ──

export function loadData<T>(filename: string, fallback: T): T {
  try {
    const p = join(STORE_DIR, `${filename}.json`);
    if (!existsSync(p)) return fallback;
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function saveData<T>(filename: string, data: T): void {
  const p = join(STORE_DIR, `${filename}.json`);
  mkdirSync(
    join(
      STORE_DIR,
      filename.includes("/") ? filename.split("/").slice(0, -1).join("/") : "."
    ),
    { recursive: true }
  );
  writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

// ─── Async helpers — use Vercel Blob in production, filesystem locally ────────
//
// On Vercel the Lambda filesystem is read-only at runtime, so admin writes
// (site settings, image overrides, orders, etc.) go to Vercel Blob Storage.
// Locally we keep using the fast synchronous filesystem helpers.
//
// To enable Blob Storage:
//   1. `npm install @vercel/blob`
//   2. In Vercel dashboard → Storage → Create Blob Store → link to project
//      (the BLOB_READ_WRITE_TOKEN env var is added automatically)

const IS_VERCEL = !!process.env.VERCEL;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export async function loadDataAsync<T>(filename: string, fallback: T): Promise<T> {
  if (IS_VERCEL && BLOB_TOKEN) {
    try {
      // Dynamic import so the package isn't required for local dev
      const { list, head } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `data/${filename}.json`, token: BLOB_TOKEN });
      if (blobs.length === 0) return fallback;

      // Sort by uploadedAt descending — take the latest blob
      const latest = blobs.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0];

      // Verify it actually exists (head returns metadata)
      await head(latest.url, { token: BLOB_TOKEN });

      const res = await fetch(latest.url, { cache: "no-store" });
      if (!res.ok) return fallback;
      return (await res.json()) as T;
    } catch {
      return fallback;
    }
  }
  return loadData(filename, fallback);
}

export async function saveDataAsync<T>(filename: string, data: T): Promise<void> {
  if (IS_VERCEL && BLOB_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const body = JSON.stringify(data, null, 2);
      await put(`data/${filename}.json`, body, {
        access: "public",
        addRandomSuffix: false,
        token: BLOB_TOKEN,
        contentType: "application/json",
      });
    } catch (err) {
      console.error(`saveDataAsync(${filename}) failed:`, err);
    }
    return;
  }
  saveData(filename, data);
}
