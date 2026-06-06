import Link from "next/link";
import { loadData } from "@/lib/admin-data";
import { builderProducts } from "@/data/builder";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";

export const dynamic = 'force-dynamic';

type BuilderCard = { id: string; label: string; description: string; image: string };

export default function BuilderIndexPage() {
  const settings = loadData<SiteSettings>("site-settings", SITE_DEFAULTS);
  const builderPageSettings = settings.pages?.builder;
  const heading = builderPageSettings?.heading ?? "Begin your tailored journey.";
  const subtext = builderPageSettings?.subtext ?? "Choose a garment, select premium fabrics, and personalize every detail through our 7-step bespoke process.";
  const cards: BuilderCard[] = builderPageSettings?.cards?.length ? builderPageSettings.cards : builderProducts;

  return (
    <main className="bg-background min-h-screen pt-20 text-foreground">
      {/* Hero */}
      <section className="bg-builder-hero relative border-b border-gold/20 px-6 py-20 text-center lg:px-12">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">The Atelier</p>
        <h1
          className="font-display mx-auto mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-foreground md:text-5xl"
        >
          {heading}
        </h1>
        <p className="font-sans mt-5 mx-auto max-w-xl text-base leading-[1.7] text-muted-dark">
          {subtext}
        </p>
      </section>

      {/* Product grid */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-2">
          {cards.map((item) => (
            <Link
              key={item.id}
              href={`/builder/${item.id}`}
              className="group relative overflow-hidden rounded-[2rem] border border-border-accent bg-surface-strong shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_8px_36px_rgba(0,0,0,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:translate-y-0"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-background">
                <img
                  src={item.image}
                  alt={item.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/70 via-surface-deep/20 to-transparent" />
                <div className="absolute inset-0 bg-background/15 mix-blend-multiply" />
              </div>

              <div className="p-8">
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">{item.label}</p>
                <h2 className="font-display mt-3 text-2xl font-semibold leading-snug tracking-[-0.02em] text-foreground">
                  {item.description}
                </h2>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/60 px-5 py-2.5 text-sm font-semibold text-gold transition-[border-color,background] duration-200 group-hover:border-gold group-hover:bg-gold/10">
                  <span className="font-sans">Start designing</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Process strip */}
        <div className="mt-16 rounded-[2rem] border border-border-accent bg-surface-strong p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">The 7-Step Process</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "1 – 2", label: "Product & Fabric", detail: "Choose your garment and select from our curated fabric library." },
              { n: "3 – 4", label: "Style & Embroidery", detail: "Configure collar, lapel, pockets, and add personal monograms." },
              { n: "5 – 6", label: "Fit & Posture", detail: "Enter your measurements and posture adjustments for a perfect fit." },
              { n: "7", label: "Review & Order", detail: "Confirm every detail, see your price, and place your bespoke order." },
            ].map((s) => (
              <div key={s.n} className="space-y-2">
                <span className="font-sans text-xs font-semibold text-gold">Step {s.n}</span>
                <p className="font-display text-base font-semibold text-foreground">{s.label}</p>
                <p className="font-sans text-xs leading-[1.7] text-muted-dark">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
