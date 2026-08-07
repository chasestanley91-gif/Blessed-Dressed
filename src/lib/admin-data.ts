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

/**
 * Short-lived read cache.
 *
 * Every public page is force-dynamic with staleTimes:0, so each request used to
 * re-read every store it touches — and one Blob read is three network calls
 * (list -> head -> fetch). A single homepage view pulls site-settings, theme,
 * content, products, collections and accessories: roughly 18 Blob operations
 * PER VISITOR. That is what exhausted the Hobby plan's 10 GB monthly transfer
 * allowance and got the store suspended, with only 1.73 MB of data stored.
 *
 * A 60-second TTL collapses that to at most one read per store per minute per
 * running instance — a ~99% reduction — while keeping the storefront fresh
 * enough that an admin edit is visible almost immediately. saveDataAsync
 * invalidates the key it writes, so the operator's OWN next read is never
 * stale; the TTL only affects other visitors, and only for up to a minute.
 */
const READ_TTL_MS = 60_000;
const readCache = new Map<string, { at: number; value: unknown }>();

function cacheGet<T>(key: string): T | undefined {
  const hit = readCache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > READ_TTL_MS) { readCache.delete(key); return undefined; }
  return hit.value as T;
}

export async function loadDataAsync<T>(filename: string, fallback: T): Promise<T> {
  if (IS_VERCEL && BLOB_TOKEN) {
    const cached = cacheGet<T>(filename);
    if (cached !== undefined) return cached;
    try {
      // Dynamic import so the package isn't required for local dev
      const { list, head } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `data/${filename}.json`, token: BLOB_TOKEN });
      if (blobs.length === 0) return loadData(filename, fallback);

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
      if (!res.ok) return loadData(filename, fallback);
      const value = (await res.json()) as T;
      readCache.set(filename, { at: Date.now(), value });
      return value;
    } catch {
      // Blob can be unreachable for reasons that have nothing to do with the
      // data: a suspended store (billing inactive), a quota trip, an outage.
      // Falling straight to the bundled sample data made the storefront look
      // wiped — the builder lost every illustration and the fabric list
      // reverted to placeholders. The committed data-store/options/*.json ARE
      // deployed, so read those first: the real catalog, minus only the edits
      // made in the admin since the last commit.
      return loadData(filename, fallback);
    }
  }
  return loadData(filename, fallback);
}

export async function saveDataAsync<T>(filename: string, data: T): Promise<void> {
  // Drop the cached copy first, so a failed write can never leave a stale value
  // being served as if the save had succeeded.
  readCache.delete(filename);
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
