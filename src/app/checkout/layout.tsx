import type { Metadata } from "next";

/**
 * `checkout/page.tsx` is a client component, so it cannot export `metadata`
 * itself. Checkout must never be indexed — the page collects name, address and
 * contact details, and a crawled copy in a search result is a privacy problem
 * as much as an SEO one.
 */
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
