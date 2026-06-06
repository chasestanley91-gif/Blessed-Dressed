"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const GARMENTS = [
  { id: "suit-2pc",   label: "2-Piece Suit",   price: "from $599" },
  { id: "suit-3pc",   label: "3-Piece Suit",   price: "from $749" },
  { id: "trousers",   label: "Dress Trousers", price: "from $199" },
  { id: "shirt",      label: "Bespoke Shirt",  price: "from $100" },
  { id: "vest",       label: "Waistcoat",      price: "from $249" },
  { id: "sport-coat", label: "Sport Coat",     price: "from $449" },
];

export const BUILDER_FABRIC_KEY = "builder-pending-fabric";

export interface FabricPayload {
  id: string;
  label: string;
  detail: string;
  premium: boolean;
  image: string;
}

interface FabricCardProps {
  id: string;
  label: string;
  detail: string;
  collection: string;
  premium: boolean;
  swatchImage: string;
  stickerImage: string;
}

function ProductModal({
  fabric,
  onClose,
}: {
  fabric: FabricPayload;
  onClose: () => void;
}) {
  const router = useRouter();

  function selectGarment(garmentId: string) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(BUILDER_FABRIC_KEY, JSON.stringify(fabric));
    }
    onClose();
    router.push(`/builder/${garmentId}`);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-surface-deep/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl border border-gold/15 bg-surface shadow-[0_-8px_48px_rgba(0,0,0,0.7)] sm:rounded-3xl sm:shadow-[0_8px_48px_rgba(0,0,0,0.7)]">
        <div className="h-[3px] w-full rounded-t-3xl bg-[#C0392B]" />
        <div className="px-7 pb-8 pt-6">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gold/20 sm:hidden" />
          <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-gold/70">
            Commission with
          </p>
          <h2 className="font-display mt-2 text-xl font-semibold tracking-[-0.02em] text-foreground">
            {fabric.label}
          </h2>
          <p className="font-sans mt-1 text-xs text-[#6B6560]">
            Select a garment to begin your bespoke order
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {GARMENTS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGarment(g.id)}
                className="flex flex-col items-center rounded-xl border border-gold/10 bg-background px-3 py-4 text-center transition-[border-color,background-color] duration-150 hover:border-gold/35 hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <span className="font-sans text-[11px] font-semibold text-foreground">
                  {g.label}
                </span>
                <span className="font-sans mt-1 text-[9px] text-[#6B6560]">
                  {g.price}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl border border-border-accent py-2.5 font-sans text-xs text-[#6B6560] transition-colors hover:border-gold/20 hover:text-muted-dark focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function FabricCard({
  id,
  label,
  detail,
  collection,
  premium,
  swatchImage,
  stickerImage,
}: FabricCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fabricPayload: FabricPayload = {
    id,
    label,
    detail,
    premium,
    image: swatchImage,
  };

  return (
    <>
      {/* Flip scene — no role="button" to avoid nested-interactive issue */}
      <div
        className="flip-scene cursor-pointer select-none"
        onClick={() => setFlipped((v) => !v)}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && setFlipped((v) => !v)
        }
        tabIndex={0}
        aria-label={`${label} — press Enter to reveal details`}
      >
        <div className={`flip-inner relative aspect-[4/5] w-full${flipped ? " is-flipped" : ""}`}>

          {/* ── Front face ── */}
          <div className="flip-face absolute inset-0 overflow-hidden rounded-2xl border border-gold/10 bg-surface shadow-[0_4px_24px_rgba(0,0,0,0.55)] transition-[border-color] duration-300 hover:border-gold/30">
            <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[#C0392B]" />
            <img src={swatchImage} alt={label} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-surface-deep via-surface-deep/65 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold/70">
                {collection}
              </p>
              <p className="font-display mt-1 text-[15px] font-semibold leading-tight text-foreground">
                {label}
              </p>
              <p className="font-sans mt-2 text-[9px] tracking-wide text-[#6B6560]">
                Tap to reveal →
              </p>
            </div>
          </div>

          {/* ── Back face ── */}
          <div className="flip-face-back absolute inset-0 overflow-hidden rounded-2xl border border-gold/15 bg-surface shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[#C0392B]" />
            <img
              src={stickerImage}
              alt={`${label} — identification sticker`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-surface-deep/60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-5 h-px w-8 bg-gold/40" />
              <p className="font-sans text-[9px] uppercase tracking-[0.42em] text-gold/75">
                Harrisons of Edinburgh
              </p>
              <p className="font-display mt-3 text-2xl font-semibold tracking-[-0.02em] text-foreground">
                {label}
              </p>
              <div className="mt-4 h-px w-8 bg-gold/35" />
              <p className="font-sans mt-4 max-w-[170px] text-[11px] leading-[1.8] text-muted-dark">
                {detail}
              </p>
              {/* Commission button — stopPropagation prevents card flip */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(true);
                }}
                className="mt-5 rounded-full bg-gold px-5 py-2 font-sans text-[11px] font-semibold text-background shadow-[0_2px_12px_rgba(212,175,55,0.3)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#09141e]"
              >
                Commission this fabric →
              </button>
              <p className="font-sans mt-3 text-[9px] tracking-wide text-[#6B6560]">
                ← Tap card to flip back
              </p>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          fabric={fabricPayload}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
