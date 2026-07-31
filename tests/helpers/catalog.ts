import type { APIRequestContext } from "@playwright/test";

/**
 * Catalog helpers shared by the e2e specs.
 *
 * Everything here derives its expectations from what the running app actually
 * serves. Nothing hardcodes counts, labels or ids, so the suite keeps its
 * meaning when the merchandising team edits the catalog.
 */

/** Builder routes. Structural (they are URLs), not merchandising data. */
export const BUILDER_PRODUCTS = [
  "shirt",
  "trousers",
  "suit-2pc",
  "suit-3pc",
  "sport-coat",
  "vest",
] as const;

export type BuilderProduct = (typeof BUILDER_PRODUCTS)[number];

/**
 * Walk an arbitrary option-config payload and collect every local `image` path.
 * The config nests as product → sections[] → fields[] → options[], and some
 * options carry nested variants, so a structural recursion is safer than
 * hand-walking a shape that changes as the catalog grows.
 */
export function collectOptionImages(node: unknown, out = new Set<string>()): Set<string> {
  if (node === null || typeof node !== "object") return out;

  if (Array.isArray(node)) {
    for (const child of node) collectOptionImages(child, out);
    return out;
  }

  const record = node as Record<string, unknown>;
  const image = record.image;
  // Only local, app-served paths. Remote CDN URLs are a separate concern.
  if (typeof image === "string" && image.startsWith("/")) out.add(image);

  for (const value of Object.values(record)) collectOptionImages(value, out);
  return out;
}

/**
 * The thumbnail `OptionCard` actually paints, per option.
 *
 * The component's precedence is `realImage ?? aiImage ?? images[0] ?? image`
 * (src/app/builder/[product]/page.tsx), so the catalog's `image` field is NOT
 * necessarily what a customer sees. This mirrors that precedence exactly, which
 * is what lets a test reason about delivered bytes rather than intended ones.
 */
export function collectRenderedThumbnails(node: unknown, out = new Set<string>()): Set<string> {
  if (node === null || typeof node !== "object") return out;

  if (Array.isArray(node)) {
    for (const child of node) collectRenderedThumbnails(child, out);
    return out;
  }

  const record = node as Record<string, unknown>;
  const isOption = typeof record.id === "string" && typeof record.label === "string";

  if (isOption) {
    const images = Array.isArray(record.images) ? record.images : [];
    const thumb =
      (typeof record.realImage === "string" ? record.realImage : undefined) ??
      (typeof record.aiImage === "string" ? record.aiImage : undefined) ??
      (typeof images[0] === "string" ? (images[0] as string) : undefined) ??
      (typeof record.image === "string" ? record.image : undefined);
    if (thumb) out.add(thumb);
  }

  for (const value of Object.values(record)) collectRenderedThumbnails(value, out);
  return out;
}

/** Every thumbnail the builder paints across the whole catalog, local or remote. */
export async function fetchAllRenderedThumbnails(
  request: APIRequestContext
): Promise<string[]> {
  const all = new Set<string>();
  for (const product of BUILDER_PRODUCTS) {
    const res = await request.get(`/api/options/${product}`);
    if (!res.ok()) throw new Error(`/api/options/${product} returned ${res.status()}`);
    for (const thumb of collectRenderedThumbnails(await res.json())) all.add(thumb);
  }
  return [...all].sort();
}

/** Every local option image the app serves for one builder product. */
export async function fetchOptionImages(
  request: APIRequestContext,
  productId: string
): Promise<Set<string>> {
  const res = await request.get(`/api/options/${productId}`);
  if (!res.ok()) {
    throw new Error(`/api/options/${productId} returned ${res.status()}`);
  }
  return collectOptionImages(await res.json());
}

/** Every local option image the app serves across the whole builder catalog. */
export async function fetchAllOptionImages(request: APIRequestContext): Promise<string[]> {
  const all = new Set<string>();
  for (const product of BUILDER_PRODUCTS) {
    for (const image of await fetchOptionImages(request, product)) all.add(image);
  }
  return [...all].sort();
}

/** Run `task` over `items` with bounded concurrency. Keeps asset sweeps quick. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await task(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export const KB = 1024;
