import Link from "next/link";
import { loadData } from "@/lib/admin-data";
import { accessories, type Accessory } from "@/data/accessories";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accessories | Blessed & Dressed",
  description: "Silk ties, pocket squares, leather shoes and more — finishing pieces for the well-dressed gentleman.",
};

export default function AccessoriesPage() {
  const items = loadData<Accessory[]>("accessories", accessories);
  const settings = loadData<SiteSettings>("site-settings", SITE_DEFAULTS);
  const page = (settings.pages as { accessories?: { heading: string; subtext: string } })?.accessories ?? {
    heading: "The finishing touch.",
    subtext: "Silk ties, pocket squares, leather shoes and more — every detail considered.",
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] pt-20">

      {/* Page header */}
      <div className="bg-[#1C1C1C] px-6 py-16 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-sans text-[0.58rem] uppercase tracking-[0.28em] text-[#B5975A]">
            Accessories
          </p>
          <h1 className="h1-hero font-display mt-3 font-light leading-[1.06] text-[#F5F0E8]">
            {page.heading}
          </h1>
          <p className="font-sans mt-4 max-w-sm text-[0.8rem] leading-[2] text-[rgba(245,240,232,0.5)]">
            {page.subtext}
          </p>
        </div>
      </div>

      {/* Accessories grid */}
      <div className="px-6 py-16 lg:px-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          {items.length === 0 ? (
            <p className="font-sans text-sm text-[#6B6560]">No accessories available yet. Check back soon.</p>
          ) : (
            <div className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="group block overflow-hidden bg-[#F5F0E8]"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover brightness-[0.85] transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="border-b border-[#E2DBD0] px-5 py-5">
                    <h3 className="font-display text-[1.15rem] font-normal text-[#1C1C1C] transition-colors duration-200 group-hover:text-[#B5975A]">
                      {item.name}
                    </h3>
                    <p className="font-sans mt-1 text-[0.65rem] text-[#6B6560]">${item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ready to Wear cross-link */}
      <div className="bg-[#F5F0E8] px-6 py-16 text-center lg:px-20">
        <div className="mx-auto max-w-xl space-y-5">
          <p className="font-sans text-[0.58rem] uppercase tracking-[0.3em] text-[#B5975A]">
            Complete the look
          </p>
          <h2 className="h2-section font-display font-light leading-[1.1] text-[#1C1C1C]">
            Browse Ready to Wear.
          </h2>
          <p className="font-sans text-[0.79rem] leading-[2] text-[#6B6560]">
            Italian-fabric suits, shirts, and trousers — luxury craftsmanship ready to ship.
          </p>
          <Link
            href="/products"
            className="btn-gold-home btn-pad-lg inline-block font-sans text-[0.65rem] font-medium uppercase tracking-[0.18em] no-underline transition-colors"
          >
            Shop Ready to Wear
          </Link>
        </div>
      </div>

    </main>
  );
}
