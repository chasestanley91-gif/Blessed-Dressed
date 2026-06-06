import Link from "next/link";
import { loadData } from "@/lib/admin-data";
import { collections, type Collection } from "@/data/collections";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";

export const dynamic = 'force-dynamic';

export default function CollectionsPage() {
  const settings = loadData<SiteSettings>("site-settings", SITE_DEFAULTS);
  const collectionsData = loadData<Collection[]>("collections", collections);
  const collectionsPage = settings.pages?.collections ?? {
    heading: "Curated capsules for every occasion.",
    subtext: "Editorial curation for winter ateliers, heritage capsules, and elevated classics — each collection a complete wardrobe story.",
  };

  return (
    <main className="bg-collections min-h-screen pt-20 text-foreground">

      {/* Hero */}
      <section className="relative border-b border-gold/20 px-6 py-20 text-center lg:px-12">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Seasonal Collections</p>
        <h1 className="font-display mx-auto mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-foreground md:text-5xl">
          {collectionsPage.heading}
        </h1>
        <p className="font-sans mt-5 mx-auto max-w-xl text-base leading-[1.7] text-muted-dark">
          {collectionsPage.subtext}
        </p>
      </section>

      {/* Collections grid */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {collectionsData.map((collection, i) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="group relative overflow-hidden rounded-[2rem] border border-border-accent bg-surface-strong shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_8px_36px_rgba(0,0,0,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:translate-y-0"
            >
              <div className={`relative overflow-hidden bg-background ${i === 0 ? "aspect-[21/9]" : "aspect-[16/9]"}`}>
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/80 via-surface-deep/20 to-transparent" />
                <div className="absolute inset-0 bg-background/10 mix-blend-multiply" />
                {i === 0 && (
                  <div className="absolute top-5 left-6">
                    <span className="font-sans rounded-full border border-gold/50 bg-gold/15 px-3 py-1 text-xs text-gold">
                      Featured
                    </span>
                  </div>
                )}
              </div>

              <div className="p-8">
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">{collection.title}</p>
                <h2 className="font-display mt-3 text-2xl font-semibold leading-snug tracking-[-0.02em] text-foreground">
                  {collection.banner}
                </h2>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-2.5 text-sm font-semibold text-gold transition-[border-color,background] duration-200 group-hover:border-gold group-hover:bg-gold/10">
                  <span className="font-sans">Explore collection</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bespoke bridge */}
        <div className="mt-16 rounded-[2rem] border border-gold/15 bg-surface-strong p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Bespoke atelier</p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-[-0.02em] text-foreground">
            Prefer something entirely your own?
          </h2>
          <p className="font-sans mt-4 mx-auto max-w-lg text-sm leading-[1.7] text-muted-dark">
            Commission a fully bespoke piece through our 7-step atelier process — every measurement, fabric, and detail crafted to your specification.
          </p>
          <Link
            href="/builder"
            className="font-sans mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-background transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong"
          >
            Start your bespoke order
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
