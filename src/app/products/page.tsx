import Link from "next/link";
import { loadData } from "@/lib/admin-data";
import { readyToWear, type Product } from "@/data/products";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Shop | Blessed & Dressed",
  description: "Ready-to-wear suits, shirts, and accessories — luxury craftsmanship at every price.",
};

export default function ProductsPage() {
  const products = loadData<Product[]>("products", readyToWear);
  const settings = loadData<SiteSettings>("site-settings", SITE_DEFAULTS);
  const productsPage = settings.pages?.products ?? {
    heading: "Instant luxury.",
    subtext: "Curated pieces ready to ship — Italian fabrics, corozo buttons, and bespoke finish at accessible prices.",
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] pt-20">

      {/* Page header */}
      <div className="bg-[#1C1C1C] px-6 py-16 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-sans text-[0.58rem] uppercase tracking-[0.28em] text-[#B5975A]">
            Ready to Wear
          </p>
          <h1 className="h1-hero font-display mt-3 font-light leading-[1.06] text-[#F5F0E8]">
            {productsPage.heading}
          </h1>
          <p className="font-sans mt-4 max-w-sm text-[0.8rem] leading-[2] text-[rgba(245,240,232,0.5)]">
            {productsPage.subtext}
          </p>
        </div>
      </div>

      {/* Products grid */}
      <div className="px-6 py-16 lg:px-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-sans mb-8 text-[0.58rem] uppercase tracking-[0.28em] text-[#B5975A]">
            Garments
          </h2>
          <div className="grid gap-0.5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((item) => {
              const totalStock = item.stockBySize.reduce((s, x) => s + x.stock, 0);
              const primaryImage = (item.images && item.images[0]) || item.image;
              return (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="group relative block overflow-hidden bg-[#F5F0E8]"
                >
                  {/* Image */}
                  <div className={`relative overflow-hidden tile-aspect-${((item as { tileAspect?: string }).tileAspect ?? "1/1").replace(/\//g, "-")}`}>
                    <img
                      src={primaryImage}
                      alt={item.name}
                      className="h-full w-full object-cover brightness-[0.88] transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Tag */}
                    <span className="absolute left-4 top-4 bg-[rgba(17,16,16,0.45)] px-[9px] py-[3px] font-sans text-[0.54rem] uppercase tracking-[0.17em] text-[rgba(245,240,232,0.85)]">
                      {item.tag}
                    </span>
                    {/* Stock badge */}
                    {totalStock === 0 && (
                      <span className="absolute right-4 top-4 bg-[#EF4444]/90 px-[9px] py-[3px] font-sans text-[0.54rem] uppercase tracking-[0.12em] text-white">
                        Sold Out
                      </span>
                    )}
                    {totalStock > 0 && totalStock <= 5 && (
                      <span className="absolute right-4 top-4 bg-[#F59E0B]/90 px-[9px] py-[3px] font-sans text-[0.54rem] uppercase tracking-[0.12em] text-white">
                        Low Stock
                      </span>
                    )}
                    {/* Thumbnail strip */}
                    {item.images && item.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 flex gap-1">
                        {item.images.slice(1, 4).map((img, i) => (
                          <div key={i} className="h-8 w-8 overflow-hidden rounded border border-white/20 bg-black/20">
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="border-b border-[#E2DBD0] px-6 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-[1.25rem] font-normal leading-tight text-[#1C1C1C] group-hover:text-[#B5975A] transition-colors duration-200">
                          {item.name}
                        </h3>
                        <p className="font-sans mt-1 text-[0.69rem] leading-[1.8] text-[#6B6560]">
                          {item.subtitle}
                        </p>
                      </div>
                      <span className="font-display shrink-0 text-[1.3rem] font-light text-[#1C1C1C]">
                        ${item.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Size dots */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.stockBySize.slice(0, 8).map((s) => (
                        <span
                          key={s.size}
                          className={`border font-sans text-[0.52rem] tracking-[0.08em] px-[7px] py-[2px] ${
                            s.stock === 0
                              ? "border-[#E2DBD0] text-[#6B6560] opacity-40 line-through"
                              : "border-[#E2DBD0] text-[#6B6560]"
                          }`}
                        >
                          {s.size}
                        </span>
                      ))}
                      {item.stockBySize.length > 8 && (
                        <span className="font-sans text-[0.52rem] text-[#B5975A]">
                          +{item.stockBySize.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accessories cross-link */}
      <div className="bg-[#F5F0E8] px-6 py-16 text-center lg:px-20">
        <div className="mx-auto max-w-xl space-y-5">
          <p className="font-sans text-[0.58rem] uppercase tracking-[0.3em] text-[#B5975A]">
            Complete the look
          </p>
          <h2 className="h2-section font-display font-light leading-[1.1] text-[#1C1C1C]">
            Shop Accessories.
          </h2>
          <p className="font-sans text-[0.79rem] leading-[2] text-[#6B6560]">
            Silk ties, pocket squares, leather shoes and more — every finishing detail.
          </p>
          <Link
            href="/accessories"
            className="btn-gold-home btn-pad-lg inline-block font-sans text-[0.65rem] font-medium uppercase tracking-[0.18em] no-underline transition-colors"
          >
            Browse Accessories
          </Link>
        </div>
      </div>

      {/* Builder CTA */}
      <div className="bg-[#1C1C1C] px-6 py-16 text-center lg:px-20">
        <div className="mx-auto max-w-xl space-y-5">
          <p className="font-sans text-[0.58rem] uppercase tracking-[0.3em] text-[#B5975A]">
            Want it bespoke?
          </p>
          <h2 className="h2-section font-display font-light leading-[1.1] text-[#F5F0E8]">
            Build yours from scratch.
          </h2>
          <p className="font-sans text-[0.79rem] leading-[2] text-[rgba(245,240,232,0.45)]">
            Choose your fabric, lapel, lining, and monogram. Every measurement, yours.
          </p>
          <Link
            href="/builder"
            className="btn-gold-home btn-pad-lg inline-block font-sans text-[0.65rem] font-medium uppercase tracking-[0.18em] no-underline transition-colors"
          >
            Start Building
          </Link>
        </div>
      </div>
    </main>
  );
}
