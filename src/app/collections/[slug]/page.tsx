import { Metadata } from "next";
import Link from "next/link";
import { loadData } from "@/lib/admin-data";
import { collections, type Collection } from "@/data/collections";
import { readyToWear } from "@/data/products";

export const dynamic = 'force-dynamic';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const liveCollections = loadData<Collection[]>("collections", collections);
  const collection = liveCollections.find((item) => item.slug === slug);
  return {
    title: collection ? `${collection.title} | Blessed & Dressed` : "Collection | Blessed & Dressed",
    description: collection?.banner ?? "Luxury collection details for Blessed & Dressed.",
  };
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collectionsData = loadData<Collection[]>("collections", collections);
  const collection = collectionsData.find((item) => item.slug === slug);

  if (!collection) {
    return (
      <main className="min-h-screen bg-background pt-20 text-foreground px-6 py-12 lg:px-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-border-accent bg-surface-strong p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <p className="font-sans text-lg text-muted-dark">Collection not found.</p>
          <Link
            href="/collections"
            className="font-sans mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            View all collections
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20 text-foreground">

      {/* Hero banner */}
      <section className="relative overflow-hidden">
        <div className="aspect-[21/8] overflow-hidden bg-background">
          <img
            src={collection.image}
            alt={collection.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/90 via-surface-deep/30 to-transparent" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-14 px-6 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.4em] text-gold">{collection.title}</p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-foreground md:text-5xl">
            {collection.banner}
          </h1>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/builder/suit"
              className="font-sans inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-background transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-deep"
            >
              Design a bespoke piece
            </Link>
            <Link
              href="/collections"
              className="font-sans inline-flex items-center justify-center rounded-full border border-foreground/30 px-7 py-3 text-sm font-semibold text-foreground transition-[border-color,background] duration-150 hover:border-gold/50 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Browse all collections
            </Link>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 space-y-16">

        {/* Editorial copy */}
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">The Collection</p>
          <p className="font-display text-2xl font-semibold leading-snug tracking-[-0.02em] text-foreground md:text-3xl">
            A curated capsule built to balance heritage tailoring with elevated modern silhouettes.
          </p>
          <p className="font-sans text-sm leading-[1.7] text-muted-dark">
            Experience luxury materials and bold finishing details — every piece engineered for the gentleman who demands both faith and excellence in his wardrobe.
          </p>
        </div>

        {/* RTW from the collection */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Featured pieces</p>
            <Link href="/#ready-to-wear" className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {readyToWear.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group rounded-[1.5rem] border border-border-accent bg-surface-strong overflow-hidden transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_8px_36px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-background">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/70 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-background/10 mix-blend-multiply" />
                </div>
                <div className="p-6">
                  <p className="font-sans text-xs uppercase tracking-[0.25em] text-gold">{product.tag}</p>
                  <h3 className="font-display mt-2 text-lg font-semibold text-foreground">{product.name}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-xl font-semibold text-foreground">
                      ${product.price.toLocaleString()}
                    </span>
                    <span className="font-sans inline-flex items-center gap-1 text-xs text-gold group-hover:gap-2 transition-[gap] duration-150">
                      Shop
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bespoke upsell strip */}
        <div className="rounded-[2rem] border border-gold/20 bg-surface-strong p-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-gold">Bespoke atelier</p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-[-0.02em] text-foreground md:text-4xl">
            Make it yours.
          </h2>
          <p className="font-sans mt-4 mx-auto max-w-lg text-sm leading-[1.7] text-muted-dark">
            Every piece in this collection is available as a fully bespoke commission — tailored to your measurements through our 7-step atelier process.
          </p>
          <Link
            href="/builder"
            className="font-sans mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-background transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong"
          >
            Begin your bespoke journey
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
