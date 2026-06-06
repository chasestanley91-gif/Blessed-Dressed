import type { Metadata } from "next";
import Link from "next/link";
import { loadData } from "@/lib/admin-data";

export const metadata: Metadata = {
  title: "Fabric Book — Blessed & Dressed",
  description:
    "Browse the Harrisons Regency and ISCA linen collections — premium fabrics for bespoke suiting.",
};

export const dynamic = "force-dynamic";

interface FabricEntry {
  id: string;
  collection: string;
}

const COLLECTIONS = [
  {
    slug: "regency",
    name: "Harrisons Regency",
    subtitle: "Fine Wool Suiting",
    description:
      "280gm 9oz All Wool — Made in England. The Regency collection from Harrisons of Edinburgh presents a definitive range of pure wool suiting cloths, each bound in the iconic red sample book.",
    specs: "280gm · 9oz · All Wool · Made in England",
    coverImage: "/images/fabrics/photos/regency-001.jpg",
    accentClass: "bg-[#C0392B]",
    filter: "Harrisons Regency",
  },
  {
    slug: "isca",
    name: "ISCA Collection",
    subtitle: "Premium Linen Blend",
    description:
      "A curated selection of 55% linen / 45% wool suiting cloths — breathable, beautifully textured, and ideal for warm-weather bespoke commissions.",
    specs: "230gm · 7.5oz · 55% Linen / 45% Wool · Made in England",
    coverImage: "/images/fabrics/photos/isca-linen-blend-001.jpg",
    accentClass: "bg-gold",
    filter: "ISCA",
  },
];

export default function FabricBookPage() {
  const fabrics = loadData<FabricEntry[]>("fabric-book", []);

  const counts = COLLECTIONS.reduce<Record<string, number>>((acc, col) => {
    acc[col.slug] = fabrics.filter((f) => f.collection === col.filter).length;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-background pt-20">
      {/* ── Page header ── */}
      <section className="mx-auto max-w-7xl px-6 pb-12 pt-16 lg:px-12">
        <p className="font-sans text-[10px] uppercase tracking-[0.45em] text-gold">
          Atelier Fabric Book
        </p>
        <h1 className="font-display mt-4 text-5xl font-semibold tracking-[-0.03em] text-foreground md:text-6xl">
          Choose your cloth.
        </h1>
        <p className="font-sans mt-4 max-w-lg text-sm leading-[1.7] text-muted-dark">
          Two premium cloth books — each swatch hand-photographed from the
          original sample. Tap to explore, flip to identify, then commission
          your bespoke garment.
        </p>
      </section>

      {/* ── Collection cards ── */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-2">
          {COLLECTIONS.map((col) => (
            <Link
              key={col.slug}
              href={`/fabric-book/${col.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-gold/10 bg-surface shadow-[0_4px_32px_rgba(0,0,0,0.5)] transition-[border-color,transform] duration-300 hover:border-gold/25 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* Top accent line */}
              <div className={`h-[3px] w-full flex-shrink-0 ${col.accentClass}`} />

              {/* Cover image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <img
                  src={col.coverImage}
                  alt={`${col.name} sample book`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09141e] via-[#09141e]/20 to-transparent" />

                {/* Fabric count badge */}
                {counts[col.slug] > 0 && (
                  <div className="absolute right-5 top-5 rounded-full bg-background/80 px-3 py-1 backdrop-blur-sm border border-gold/20">
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold">
                      {counts[col.slug]} fabrics
                    </span>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col p-8">
                <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gold">
                  {col.subtitle}
                </p>
                <h2 className="font-display mt-3 text-2xl font-semibold tracking-[-0.02em] text-foreground">
                  {col.name}
                </h2>
                <p className="font-sans mt-3 text-sm leading-[1.7] text-muted-dark">
                  {col.description}
                </p>

                {/* Spec chips */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {col.specs.split(" · ").map((spec) => (
                    <span
                      key={spec}
                      className="rounded-full border border-gold/15 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-[#6B6560]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* CTA row */}
                <div className="mt-8 flex items-center justify-between">
                  <span className="font-sans text-sm font-semibold text-gold transition-opacity group-hover:opacity-80">
                    Browse collection →
                  </span>
                  {counts[col.slug] > 0 && (
                    <span className="font-sans text-xs text-[#6B6560]">
                      {counts[col.slug]} swatches available
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-10 text-center font-sans text-xs leading-[1.7] text-[#6B6560]">
          Each swatch is photographed from the original Harrisons sample book.
          Flip any card to see the fabric identification sticker.
        </p>
      </section>
    </main>
  );
}
