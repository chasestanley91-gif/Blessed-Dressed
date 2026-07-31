import type { Metadata } from "next";

/**
 * `cart/page.tsx` is a client component, so it cannot export `metadata` itself.
 * This layout exists solely to keep the cart out of the index: its content is
 * per-visitor and worthless as a search result, but it was fully crawlable.
 */
export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
