/**
 * The site's canonical origin, in one place.
 *
 * `metadataBase`, the sitemap, robots.txt, the Stripe return URLs and the
 * transactional emails were each deriving this independently — two of them
 * hardcoded the Vercel preview domain — so a custom domain would have produced
 * canonical tags pointing at one host and checkout redirects at another.
 *
 * Trailing slashes are stripped so callers can always join with a leading-slash
 * path without producing a double slash.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  "http://localhost:3000"
).replace(/\/+$/, "");

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
