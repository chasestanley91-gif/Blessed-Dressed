"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SITE_DEFAULTS } from "@/data/site-settings";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type BentoSettings = NonNullable<typeof SITE_DEFAULTS.bento>;

export default function BentoFeatures({ initialBento }: { initialBento?: BentoSettings }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bento] = useState<BentoSettings>({ ...SITE_DEFAULTS.bento!, ...initialBento });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsEditMode(new URLSearchParams(window.location.search).get("__edit") === "1");
  }, []);

  useGSAP(
    () => {
      const cards = containerRef.current?.querySelectorAll("[data-bento]");
      if (!cards) return;
      cards.forEach((card, i) => {
        gsap.from(card, {
          scale: 0.93,
          opacity: 0,
          duration: 0.8,
          delay: i * 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            once: true,
          },
        });
      });
    },
    { scope: containerRef }
  );

  const headingLines = (bento.cardAHeading ?? "Italian mill fabrics,\nS120 to S150.").split("\n");

  return (
    <section className="bg-[#FAF8F3] px-6 py-32 md:py-40 lg:px-20">
      <div ref={containerRef} className="mx-auto max-w-7xl">
        {/* Section label */}
        <div className="mb-12 space-y-4">
          <p className="flex items-center gap-3 font-sans text-[0.58rem] uppercase tracking-[0.28em] text-[#B5975A]">
            <span className="inline-block h-px w-6 shrink-0 bg-[#B5975A]" />
            What makes it different
          </p>
          <h2 className="h2-section font-display font-light leading-[1.12] text-[#1C1C1C]">
            Craft that goes{" "}
            <em className="italic text-[#6B6560]">all the way through.</em>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid auto-rows-[260px] grid-cols-4 grid-flow-dense gap-0.5">
          {/* Card A — large feature image */}
          <div
            data-bento
            className={`group relative col-span-2 row-span-2 overflow-hidden${isEditMode ? " cursor-pointer" : ""}`}
            onClick={isEditMode ? () => {
              window.parent.postMessage({ type: "bd-edit-image", section: "bento", index: 0 }, "*");
            } : undefined}
            title={isEditMode ? "Click to edit this image" : undefined}
          >
            {isEditMode && (
              <div className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-gold px-3 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-background opacity-0 transition-opacity group-hover:opacity-100">
                Edit Image
              </div>
            )}
            <img
              src={bento.cardAImage}
              alt="Premium Italian fabric"
              className="img-darken-mid h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(17,16,16,0.9)] via-[rgba(17,16,16,0.2)] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="mb-1 font-sans text-[0.55rem] uppercase tracking-[0.22em] text-[#B5975A]">
                {bento.cardALabel ?? "Materials"}
              </p>
              <h3 className="font-display text-[1.85rem] font-light leading-[1.15] text-[#F5F0E8]">
                {headingLines.map((line, i) => (
                  <span key={i}>{line}{i < headingLines.length - 1 && <br />}</span>
                ))}
              </h3>
              <p className="mt-3 font-sans text-[0.72rem] leading-[1.9] text-[rgba(245,240,232,0.55)]">
                {bento.cardABody ?? "Marzotto. Huddersfield. Hardy Minnis. Vitale Barberis Canonico. Every cloth selected for drape, durability, and character."}
              </p>
            </div>
          </div>

          {/* Card B — monogram */}
          <div
            data-bento
            className="col-span-1 row-span-1 flex flex-col justify-between bg-[#1A2744] p-7"
          >
            <div className="flex h-10 w-10 items-center justify-center border border-[#B5975A]/30">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 1v16M1 9h16" stroke="#B5975A" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-[#B5975A]">
                Included
              </p>
              <h3 className="mt-1 font-display text-[1.4rem] font-light leading-[1.2] text-[#F5F0E8]">
                Monogram
                <br />
                embroidery.
              </h3>
            </div>
          </div>

          {/* Card C — production time */}
          <div
            data-bento
            className="col-span-1 row-span-1 flex flex-col justify-between bg-[#F5F0E8] p-7"
          >
            <p className="font-display text-[2.4rem] font-light leading-none text-[#1C1C1C]">
              4–6
              <span className="block font-sans text-[0.6rem] uppercase tracking-[0.18em] text-[#6B6560]">
                week production
              </span>
            </p>
            <p className="font-sans text-[0.7rem] leading-[1.85] text-[#6B6560]">
              From order confirmation to delivery at your door.
            </p>
          </div>

          {/* Card D — faith tagline */}
          <div
            data-bento
            className="col-span-2 row-span-1 flex items-end justify-between bg-[#1C1C1C] p-7"
          >
            <div>
              <p className="font-sans text-[0.55rem] uppercase tracking-[0.22em] text-[#B5975A]">
                Our philosophy
              </p>
              <h3 className="mt-1 font-display text-[1.4rem] font-light italic leading-[1.2] text-[#F5F0E8]">
                &ldquo;{bento.faithQuote ?? "The LORD shall make thee the head, and not the tail."}&rdquo;
              </h3>
            </div>
            <p className="shrink-0 font-sans text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(245,240,232,0.22)]">
              {bento.faithRef ?? "Deut. 28:13"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
