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

      // The store is configured with PRIVATE access, so the blob URL is not
      // world-readable: an unauthenticated fetch returns 403 and every load
      // silently fell back to the bundled sample data. The token has to travel
      // with the read. (Keeping the store private is deliberate — these
      // documents hold customer names, emails, phones and addresses.)
      const res = await fetch(latest.url, {
        cache: "no-store",
        headers: { authorization: `Bearer ${BLOB_TOKEN}` },
      });
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
        // Must match the store's configured access. Writing "public" to a
        // private store throws BlobError("Cannot use public access on a
        // private store") — which is what broke every admin save.
        access: "private",
        addRandomSuffix: false,
        // These documents are replaced in place on every admin save. Without
        // this the SDK rejects the second write of any key with "This blob
        // already exists", so every edit after the first one 500'd.
        allowOverwrite: true,
        token: BLOB_TOKEN,
        contentType: "application/json",
      });
    } catch (err) {
      // Rethrow rather than swallow. Returning normally here reported success
      // to the caller while the admin's edit was dropped — the write is the
      // whole point of the call, so a failure must reach the route and become
      // a 5xx the operator can see.
      console.error(`saveDataAsync(${filename}) failed:`, err);
      throw err;
    }
    return;
  }
  saveData(filename, data);
}
