import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { loadData } from "@/lib/admin-data";
import { readyToWear, type Product } from "@/data/products";
import { accessories, type Accessory } from "@/data/accessories";
import { collections, type Collection } from "@/data/collections";
import lazyLoad from 'next/dynamic';
const HeroSection = lazyLoad(() => import('@/components/home/HeroSection'));
const TestimonialsReveal = lazyLoad(() => import('@/components/home/TestimonialsReveal'));
const PinnedCraft = lazyLoad(() => import('@/components/home/PinnedCraft'));
const BentoFeatures = lazyLoad(() => import('@/components/home/BentoFeatures'));
const BuilderAccordion = lazyLoad(() => import('@/components/home/BuilderAccordion'));
import EditableSection from "@/components/EditableSection";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";

export const dynamic = 'force-dynamic';

/* ── Section label (gold line + small caps) ───────────────────── */
function SL({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`flex items-center gap-3 font-sans text-[0.58rem] uppercase tracking-[0.28em] ${light ? "text-[#B5975A]/70" : "text-[#B5975A]"}`}>
      <span className="inline-block h-px w-6 shrink-0 bg-[#B5975A]" />
      {children}
    </p>
  );
}

function Wrap({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <EditableSection id={id} label={label}>{children}</EditableSection>;
}

export default function Home() {
  noStore();
  const settings = loadData<SiteSettings>("site-settings", SITE_DEFAULTS);
  const products = loadData<Product[]>("products", readyToWear);
  const accessoriesData = loadData<Accessory[]>("accessories", accessories);
  const collectionsData = loadData<Collection[]>("collections", collections);

  const vis = settings.sections;
  const marqueeItems = settings.marquee;
  const marqueeList = [...marqueeItems, ...marqueeItems];

  return (
    <main className="overflow-x-hidden w-full max-w-full">

      {vis.hero && (
        <Wrap id="hero" label="Hero">
          <HeroSection hero={settings.hero} />
        </Wrap>
      )}

      {vis.marquee && (
        <Wrap id="marquee" label="Marquee Band">
          <div className="overflow-hidden bg-[#1C1C1C] py-[11px]">
            <div className="marquee-track">
              {marqueeList.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-5 px-5 font-sans text-[0.56rem] uppercase tracking-[0.2em] text-[rgba(245,240,232,0.34)]"
                >
                  {item}
                  <span className="inline-block h-[3px] w-[3px] rounded-full bg-[#B5975A] opacity-50" />
                </span>
              ))}
            </div>
          </div>
        </Wrap>
      )}

      {vis.bento && (
        <Wrap id="bento" label="Features">
          <BentoFeatures initialBento={settings.bento} />
        </Wrap>
      )}

      {vis.builder && (
        <Wrap id="builder" label="Builder Accordion">
          <BuilderAccordion initialSteps={settings.accordion?.items} />
        </Wrap>
      )}

      {vis.craft && (
        <Wrap id="craft" label="Craft Section">
          <PinnedCraft initialCrafts={settings.craftItems} />
        </Wrap>
      )}

      {/* ── SEASONAL COLLECTIONS ─────────────────────────────────── */}
      {vis.collections && (
        <Wrap id="collections" label="Collections">
          <section className="bg-[#F5F0E8] px-6 py-32 md:py-40 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-4">
                  <SL>Seasonal Collections</SL>
                  <h2 className="h2-section font-display font-light leading-[1.12] text-[#1C1C1C]">
                    Curated looks{" "}
                    <em className="italic text-[#6B6560]">for the season.</em>
                  </h2>
                </div>
                <Link href="/collections" className="shrink-0 font-sans text-[0.65rem] uppercase tracking-[0.13em] text-[#B5975A] no-underline">
                  View all collections →
                </Link>
              </div>
              <div className="grid gap-0.5 xl:grid-cols-2">
                {collectionsData.map((col) => (
                  <Link key={col.slug} href={`/collections/${col.slug}`}
                    className="aspect-collection group relative block overflow-hidden"
                  >
                    <img
                      src={col.image}
                      alt={col.title}
                      className="h-full w-full object-cover brightness-[0.75] transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(17,16,16,0.85)] via-[rgba(17,16,16,0.2)] to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-7">
                      <SL>{col.title}</SL>
                      <h3 className="font-display mt-2 text-2xl font-light leading-[1.2] text-[#F5F0E8]">
                        {col.banner}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </Wrap>
      )}

      {vis.testimonials && (
        <Wrap id="testimonials" label="Testimonials">
          <TestimonialsReveal />
        </Wrap>
      )}

      {/* ── READY TO WEAR ─────────────────────────────────────────── */}
      {vis.rtw && (
        <Wrap id="rtw" label="Ready to Wear">
          <section className="bg-[#FAF8F3] px-6 py-32 md:py-40 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-4">
                  <SL>Ready to Wear</SL>
                  <h2 className="h2-section font-display font-light leading-[1.12] text-[#1C1C1C]">
                    Ready to wear, <em className="italic text-[#6B6560]">made to impress.</em>
                  </h2>
                </div>
                <Link href="/products" className="shrink-0 font-sans text-[0.65rem] uppercase tracking-[0.13em] text-[#B5975A] no-underline">
                  Shop all →
                </Link>
              </div>
              <div className="grid gap-0.5 md:grid-cols-2">
                {products.map((item) => (
                  <article key={item.id} className="group overflow-hidden bg-[#F5F0E8]">
                    <div className="relative h-72 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover brightness-[0.88] transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 bg-[rgba(17,16,16,0.45)] px-[9px] py-[3px] font-sans text-[0.54rem] uppercase tracking-[0.17em] text-[rgba(245,240,232,0.8)]">
                        {item.tag}
                      </span>
                    </div>
                    <div className="border-b border-[#E2DBD0] px-6 py-6">
                      <h3 className="font-display text-[1.5rem] font-normal text-[#1C1C1C]">{item.name}</h3>
                      <p className="font-sans mt-1 text-[0.69rem] leading-[1.88] text-[#6B6560]">{item.subtitle}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-display text-[1.4rem] font-light text-[#1C1C1C]">${item.price}</span>
                        <Link
                          href={`/products/${item.id}`}
                          className="btn-dark-home btn-pad-rtw font-sans text-[0.62rem] font-medium uppercase tracking-[0.15em] no-underline transition-colors"
                        >
                          Shop Now
                        </Link>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.stockBySize.map((s) => (
                          <span
                            key={s.size}
                            className={`border border-[#E2DBD0] font-sans text-[0.57rem] tracking-[0.08em] px-[9px] py-[3px] ${
                              s.stock === 0 ? "opacity-50 text-[#6B6560]" : s.stock <= 2 ? "text-[#B5975A]" : "text-[#6B6560]"
                            }`}
                          >
                            {s.size} · {s.stock === 0 ? "Sold out" : s.stock <= 2 ? "Low stock" : `${s.stock} left`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </Wrap>
      )}

      {/* ── ACCESSORIES ───────────────────────────────────────────── */}
      {vis.accessories && (
        <Wrap id="accessories" label="Accessories">
          <section className="bg-[#F5F0E8] px-6 py-32 md:py-40 lg:px-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-4">
                  <SL>Accessories</SL>
                  <h2 className="h2-section font-display font-light leading-[1.12] text-[#1C1C1C]">
                    Finishing pieces, <em className="italic text-[#6B6560]">chosen with care.</em>
                  </h2>
                </div>
                <Link href="/products?category=accessories" className="shrink-0 font-sans text-[0.65rem] uppercase tracking-[0.13em] text-[#B5975A] no-underline">
                  Shop accessories →
                </Link>
              </div>
              <div className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
                {accessoriesData.map((item) => (
                  <article key={item.id} className="group overflow-hidden bg-[#FAF8F3]">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover brightness-[0.85] transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="border-b border-[#E2DBD0] px-5 py-5">
                      <h3 className="font-display text-[1.25rem] font-normal text-[#1C1C1C]">{item.name}</h3>
                      <p className="font-sans mt-1 mb-4 text-[0.65rem] text-[#6B6560]">${item.price}</p>
                      <Link
                        href={`/products/${item.id}`}
                        className="btn-outline-home btn-pad-acc inline-block border border-[#E2DBD0] font-sans text-[0.61rem] uppercase tracking-[0.13em] text-[#1C1C1C] no-underline transition-colors"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </Wrap>
      )}

      {/* ── CLOSING CTA ───────────────────────────────────────────── */}
      {vis.cta && (
        <Wrap id="cta" label="Closing CTA">
          <section className="bg-[#1C1C1C] px-6 py-32 text-center md:py-40 lg:px-20">
            <div className="mx-auto max-w-2xl space-y-6">
              <p className="font-sans text-[0.58rem] uppercase tracking-[0.3em] text-[#B5975A]">✝ Blessed &amp; Dressed</p>
              <h2 className="h2-cta font-display font-light leading-[1.1] text-[#F5F0E8]">
                Made to your <em className="italic">exact measurements.</em>
              </h2>
              <p className="font-sans mx-auto max-w-sm text-[0.79rem] leading-[2] text-[rgba(245,240,232,0.45)]">
                Pair your bespoke suit with a hand-selected tie, pocket square, and shoes for
                a complete, elevated presentation.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/builder"
                  className="btn-gold-home btn-pad-xl font-sans text-[0.65rem] font-medium uppercase tracking-[0.18em] no-underline transition-colors"
                >
                  Start Bespoke Order
                </Link>
                <Link
                  href="/products?category=accessories"
                  className="btn-outline-light-home btn-pad-md inline-flex items-center gap-2 border border-[rgba(245,240,232,0.22)] font-sans text-[0.65rem] uppercase tracking-[0.13em] text-[#F5F0E8] no-underline transition-colors"
                >
                  Shop Accessories
                </Link>
              </div>
              <p className="font-display mx-auto max-w-xs pt-3 text-[0.92rem] italic leading-[1.6] text-[#B5975A] opacity-60">
                &ldquo;The LORD shall make thee the head, and not the tail.&rdquo;
                <span className="mt-[6px] block font-sans text-[0.55rem] not-italic uppercase tracking-[0.12em] text-[rgba(245,240,232,0.25)]">
                  — Deuteronomy 28:13
                </span>
              </p>
            </div>
          </section>
        </Wrap>
      )}

    </main>
  );
}
