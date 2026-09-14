import type { MetadataRoute } from "next";
import { loadDataAsync } from "@/lib/admin-data";
import { builderProducts } from "@/data/builder";
import { SITE_URL } from "@/lib/site-url";

/**
 * There was no sitemap, so every product, collection and builder route relied on
 * being discovered by crawl alone.
 *
 * The dynamic entries are read from the SAME store the pages render from
 * (`loadDataAsync`, i.e. Vercel Blob in production), so a sitemap can never
 * advertise a product the storefront does not actually serve. Cart, checkout and
 * admin are deliberately absent — see robots.ts.
 */

type Listed = { id?: string; slug?: string; updatedAt?: string; active?: boolean };

/** `name` is the store key, without the .json suffix loadDataAsync appends. */
async function listed(name: string): Promise<Listed[]> {
  try {
    const data = await loadDataAsync<unknown>(name, []);
    if (Array.isArray(data)) return data as Listed[];
    if (data && typeof data === "object") {
      const arr = (data as Record<string, unknown>).items ?? Object.values(data)[0];
      if (Array.isArray(arr)) return arr as Listed[];
    }
  } catch {
    // A sitemap must never be the thing that takes the site down. An unreadable
    // store degrades to the static routes rather than throwing.
  }
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/builder`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/fabric-book`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/accessories`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/consultation`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/wardrobe-questionnaire`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];

  const builderRoutes: MetadataRoute.Sitemap = builderProducts.map((p) => ({
    url: `${SITE_URL}/builder/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const [products, collections] = await Promise.all([
    listed("products.json"),
    listed("collections.json"),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.active !== false && (p.id || p.slug))
    .map((p) => ({
      url: `${SITE_URL}/products/${p.id ?? p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const collectionRoutes: MetadataRoute.Sitemap = collections
    .filter((c) => c.slug || c.id)
    .map((c) => ({
      url: `${SITE_URL}/collections/${c.slug ?? c.id}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...builderRoutes, ...productRoutes, ...collectionRoutes];
}
