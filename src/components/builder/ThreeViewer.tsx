"use client";

type Props = {
  product: string;
  fabric?: string;
  fabricImage?: string; // kept for API compatibility, unused in 2D preview
};

// Fabric swatch colors matching the builder palette
const FABRIC_SWATCHES: Record<string, { label: string; color: string }> = {
  "navy-herringbone": { label: "Navy Herringbone", color: "#2A4466" },
  "charcoal-wool": { label: "Charcoal Flannel", color: "#545454" },
  "black-barathea": { label: "Black Barathea", color: "#2C2C2C" },
  "royal-blue-twill": { label: "Royal Blue Twill", color: "#2E55A8" },
  "winter-tweed": { label: "Winter Tweed", color: "#7A6E58" },
  "ivory-silk": { label: "Ivory Silk Blend", color: "#EDE5D8" },
  "cream-linen": { label: "Cream Irish Linen", color: "#D9CEBA" },
  "mid-grey-flannel": { label: "Mid Grey Flannel", color: "#8A9098" },
  "slate-serge": { label: "Slate Serge", color: "#637080" },
  "white-oxford": { label: "White Oxford", color: "#F0EDE8" },
  "sky-poplin": { label: "Sky Blue Poplin", color: "#A0CCEC" },
  "pinstripe-navy": { label: "Navy Pinstripe", color: "#2A3D64" },
};

const PRODUCT_LABELS: Record<string, string> = {
  shirt: "Bespoke Shirt",
  trousers: "Bespoke Trousers",
  "suit-2pc": "2-Piece Suit",
  "suit-3pc": "3-Piece Suit",
  vest: "Bespoke Vest",
  "sport-coat": "Sport Coat",
};

export default function ThreeViewer({ product, fabric }: Props) {
  const swatch = fabric ? FABRIC_SWATCHES[fabric] : null;
  const heroSrc = `/images/builder-heroes/${product}.jpg`;
  const label = PRODUCT_LABELS[product] ?? "Garment";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border-accent bg-background">
      {/* Garment hero photo */}
      <img
        src={heroSrc}
        alt={label}
        className="h-full w-full object-cover object-top brightness-[0.82] transition-all duration-500"
      />

      {/* Dark-to-transparent gradient at bottom for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/85 via-surface-deep/10 to-transparent" />

      {/* Studio Preview badge — top-left */}
      <div className="absolute left-3 top-3">
        <span className="rounded-full border border-gold/40 bg-background/70 px-2.5 py-1 font-sans text-[9px] uppercase tracking-[0.2em] text-gold backdrop-blur-sm">
          Studio Preview
        </span>
      </div>

      {/* Bottom info bar — fabric swatch + names */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-3.5">
        {swatch ? (
          <>
            {/* Color swatch circle */}
            <span
              className="h-5 w-5 shrink-0 rounded-full border border-white/25 shadow"
              style={{ background: swatch.color }}
            />
            <div className="min-w-0">
              <p className="truncate font-sans text-[10px] uppercase tracking-[0.15em] text-gold">
                {swatch.label}
              </p>
              <p className="font-sans text-[10px] text-muted-dark">{label}</p>
            </div>
          </>
        ) : (
          <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-slate">
            Select a fabric to preview
          </p>
        )}
      </div>
    </div>
  );
}
