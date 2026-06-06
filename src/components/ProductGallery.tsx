"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-border-accent bg-surface-strong shadow-[0_8px_36px_rgba(0,0,0,0.5)]">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={images[0]} alt={alt} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/50 via-transparent to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="overflow-hidden rounded-[2rem] border border-border-accent bg-surface-strong shadow-[0_8px_36px_rgba(0,0,0,0.5)]">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={images[active]}
            alt={`${alt} — photo ${active + 1}`}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/50 via-transparent to-transparent" />
          {/* Prev / next arrows */}
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border-accent bg-background/80 text-muted-dark backdrop-blur-sm transition-colors hover:border-gold/50 hover:text-gold"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setActive((a) => (a + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border-accent bg-background/80 text-muted-dark backdrop-blur-sm transition-colors hover:border-gold/50 hover:text-gold"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* Counter pill */}
          <div className="absolute bottom-3 right-3 rounded-full border border-border-accent bg-background/80 px-2.5 py-1 font-sans text-[10px] text-muted-dark backdrop-blur-sm">
            {active + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            aria-label={`View photo ${i + 1}`}
            onClick={() => setActive(i)}
            className={`shrink-0 h-16 w-16 overflow-hidden rounded-xl border transition-colors ${
              active === i
                ? "border-gold shadow-[0_0_0_1px_#D4AF37]"
                : "border-border-accent opacity-60 hover:opacity-100 hover:border-gold/40"
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
