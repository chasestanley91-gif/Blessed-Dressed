import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * There was no robots.txt, so /admin, /cart and /checkout were all fair game for
 * a crawler. The admin routes redirect unauthenticated visitors, but a crawler
 * still spends budget on them and the URLs still surface in results.
 *
 * `/api/` is disallowed wholesale: nothing under it is a page, and several
 * routes are mutating.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/cart", "/checkout"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
