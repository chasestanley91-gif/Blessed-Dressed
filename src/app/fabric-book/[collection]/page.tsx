import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadData } from "@/lib/admin-data";
import FabricCard from "../FabricCard";

export const dynamic = "force-dynamic";

interface FabricEntry {
  id: string;
  label: string;
  detail: string;
  premium: boolean;
  collection: string;
  swatchImage: string;
  stickerImage: string;
}

const COLLECTION_META: Record<
  string,
  {
    name: string;
    subtitle: string;
    description: string;
    heroImage: string;
    filter: string;
  }
> = {
  regency: {
    name: "Harrisons Regency",
    subtitle: "280gm · 9oz All Wool · Made in England",
    description:
      "Each cloth is photographed directly from the Harrisons of Edinburgh Regency sample book. Tap any swatch to flip and reveal the fabric identification sticker. Then commission your bespoke garment.",
    heroImage: "/images/fabrics/photos/regency-001.jpg",
    filter: "Harrisons Regency",
  },
  isca: {
    name: "ISCA Collection",
    subtitle: "230gm · 7.5oz · 55% Linen / 45% Wool · Made in England",
    description:
      "Linen-wool blend suiting cloths photographed from the ISCA sample book. 55% linen, 45% wool — breathable, beautifully textured, and available for bespoke warm-weather commissions.",
    heroImage: "/images/fabrics/photos/isca-linen-blend-001.jpg",
    filter: "ISCA",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const meta = COLLECTION_META[collection];
  if (!meta) return { title: "Fabric Book — Blessed & Dressed" };
  return {
    title: `${meta.name} — Fabric Book`,
    description: meta.description,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  const meta = COLLECTION_META[collection];
  if (!meta) notFound();

  const allFabrics = loadData<FabricEntry[]>("fabric-book", []);
  const fabrics = allFabrics.filter((f) => f.collection === meta.filter);

  return (
    <main className="min-h-screen bg-background pt-20">
      {/* ── Hero ── */}
      <section className="relative flex h-[55vh] min-h-[420px] items-end overflow-hidden">
        <img
          src={meta.heroImage}
          alt={meta.name}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 lg:px-12">
          {/* Breadcrumb */}
          <Link
            href="/fabric-book"
            className="font-sans mb-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#6B6560] transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Fabric Book
          </Link>

          <p className="font-sans text-[10px] uppercase tracking-[0.45em] text-gold">
            {meta.subtitle}
          </p>
          <h1 className="font-display mt-3 text-5xl font-semibold tracking-[-0.03em] text-foreground md:text-7xl">
            {meta.name}
          </h1>
        </div>
      </section>

      {/* ── Instruction bar ── */}
      <div className="border-y border-gold/10 bg-surface/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-3 lg:px-12">
          <p className="font-sans text-center text-[10px] uppercase tracking-[0.3em] text-[#6B6560]">
            Tap any swatch to flip · flip back shows sticker · tap &ldquo;Commission&rdquo; to build
          </p>
        </div>
      </div>

      {/* ── Fabric grid ── */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold">
              {collection === "regency" ? "Fine Wool Suiting" : "55% Linen / 45% Wool"}
            </p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-foreground">
              {meta.name}
            </h2>
          </div>
          <p className="font-sans text-sm text-[#6B6560]">
            {fabrics.length} fabrics
          </p>
        </div>

        {fabrics.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {fabrics.map((fabric) => (
              <FabricCard key={fabric.id} {...fabric} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-px w-12 bg-gold/30 mb-6" />
            <p className="font-sans text-sm text-[#6B6560]">
              Fabric collection loading…
            </p>
          </div>
        )}
      </section>

      {/* ── CTA bridge ── */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-12">
        <div className="relative overflow-hidden rounded-3xl border border-gold/15 bg-surface p-12 text-center shadow-[0_4px_32px_rgba(0,0,0,0.45)]">
          <p className="font-sans text-[10px] uppercase tracking-[0.42em] text-gold">
            Bespoke Atelier
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-[-0.02em] text-foreground">
            Ready to commission your cloth?
          </h2>
          <p className="font-sans mx-auto mt-4 max-w-md text-sm leading-[1.7] text-muted-dark">
            Flip any swatch above and tap &ldquo;Commission this fabric&rdquo; to select your
            garment and start your bespoke order.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/builder"
              className="font-sans inline-flex items-center gap-3 rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-background shadow-[0_2px_16px_rgba(212,175,55,0.3)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#09141e]"
            >
              Start bespoke order
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <Link
              href="/fabric-book"
              className="font-sans inline-flex items-center gap-2 rounded-full border border-gold/20 px-6 py-3.5 text-sm text-muted-dark transition-[border-color,color] duration-150 hover:border-gold/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#09141e]"
            >
              ← Other collections
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
