import type { ProductDesignConfig } from "./types";

/**
 * Lazy loader for the bundled catalog fallback.
 *
 * The builder page and store previously imported `allProductDesigns`
 * statically, which shipped every bundled catalog (~275 KB of source) in the
 * builder's first-load chunk even though the page fetches the live config
 * from /api/options. This loader moves the bundled data into its own async
 * chunk. Fallback SEMANTICS are unchanged — only the transport differs: the
 * chunk is preloaded at page-module evaluation, and the page re-runs the
 * price calc when it lands (closing the deep-share-link race).
 *
 * Server code (API routes, lib/pricing) keeps importing "@/data/options"
 * statically — there is no bundle cost on the server.
 */

let cache: Record<string, ProductDesignConfig> | null = null;
let pending: Promise<Record<string, ProductDesignConfig>> | null = null;

export function loadBundledDesigns(): Promise<Record<string, ProductDesignConfig>> {
  if (cache) return Promise.resolve(cache);
  pending ??= import("./index").then((m) => (cache = m.allProductDesigns));
  return pending;
}

/** Synchronous view of the cache — null until the chunk has arrived. */
export function bundledDesignsSync(): Record<string, ProductDesignConfig> | null {
  return cache;
}
