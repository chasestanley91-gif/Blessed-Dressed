"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import type { SiteSettings } from "@/data/site-settings";

gsap.registerPlugin(useGSAP);

type HeroProps = SiteSettings["hero"];

export default function HeroSection({ hero }: { hero: HeroProps }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const pricesRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(eyebrowRef.current, { y: 18, opacity: 0, duration: 0.7 })
        .from(headingRef.current, { y: 32, opacity: 0, duration: 1.0 }, "-=0.45")
        .from(subRef.current, { y: 20, opacity: 0, duration: 0.8 }, "-=0.55")
        .from(quoteRef.current, { y: 16, opacity: 0, duration: 0.7 }, "-=0.5")
        .from(ctasRef.current, { y: 16, opacity: 0, duration: 0.7 }, "-=0.45")
        .from(pricesRef.current, { y: 14, opacity: 0, duration: 0.65 }, "-=0.4")
        .from(
          imageRef.current,
          { scale: 0.96, opacity: 0, duration: 1.2, ease: "power2.out" },
          "<-0.5"
        );
    },
    { scope: containerRef }
  );

  const [p1, p2, p3] = [
    hero.priceItems[0],
    hero.priceItems[1],
    hero.priceItems[2],
  ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] bg-[#FAF8F3] overflow-hidden"
    >
      <div className="grid min-h-[100dvh] lg:grid-cols-2">
        {/* Left: copy */}
        <div className="flex flex-col justify-center px-8 py-24 md:px-14 lg:px-16 xl:px-20">
          <p
            ref={eyebrowRef}
            className="mb-6 flex items-center gap-2 font-sans text-[0.61rem] uppercase tracking-[0.28em] text-[#B5975A]"
          >
            <span className="inline-block h-px w-5 bg-[#B5975A]" />
            {hero.eyebrow}
          </p>

          <h1
            ref={headingRef}
            className="h1-hero font-display font-light leading-[1.06] text-[#1C1C1C]"
          >
            {hero.headline}
            <br />
            <em className="italic text-[#B5975A]">{hero.headlineEm}</em>
            <br />
            {hero.headlineSuffix}
          </h1>

          <p
            ref={subRef}
            className="mt-6 max-w-sm font-sans text-[0.8rem] leading-[2] text-[#6B6560]"
          >
            {hero.subheadline}
          </p>

          <p
            ref={quoteRef}
            className="mb-9 mt-3 font-display text-[0.92rem] italic text-[#B5975A] opacity-75"
          >
            &ldquo;{hero.quote}&rdquo; &mdash; {hero.quoteRef}
          </p>

          <div ref={ctasRef} className="mb-10 flex flex-wrap gap-3">
            <Link
              href={hero.ctaPrimaryLink}
              className="btn-gold-home btn-pad-lg font-sans text-[0.65rem] font-medium uppercase tracking-[0.18em] no-underline transition-colors"
            >
              {hero.ctaPrimaryText}
            </Link>
            <Link
              href={hero.ctaSecondaryLink}
              className="btn-outline-home btn-pad-sm inline-flex items-center gap-2 border border-[#E2DBD0] font-sans text-[0.65rem] uppercase tracking-[0.13em] text-[#1C1C1C] no-underline transition-colors"
            >
              {hero.ctaSecondaryText}
            </Link>
          </div>

          {/* Price grid */}
          <div
            ref={pricesRef}
            className="grid max-w-xs grid-cols-3 border border-[#E2DBD0]"
          >
            <div className="flex flex-col items-center gap-[3px] border-r border-[#E2DBD0] p-4 text-center">
              <span className="font-sans text-[0.56rem] uppercase tracking-[0.15em] text-[#6B6560]">
                {p1?.label}
              </span>
              <span className="font-display text-[1.6rem] font-normal leading-none text-[#1C1C1C]">
                {p1?.value}
              </span>
              <span className="font-sans text-[0.57rem] text-[#6B6560]">
                {p1?.sub}
              </span>
            </div>
            <div className="flex flex-col items-center gap-[3px] border-x border-[#E2DBD0] p-4 text-center">
              <span className="font-sans text-[0.56rem] uppercase tracking-[0.15em] text-[#6B6560]">
                {p2?.label}
              </span>
              <span className="font-display text-[1.6rem] font-normal leading-none text-[#1C1C1C]">
                {p2?.value}
              </span>
              <span className="font-sans text-[0.57rem] text-[#6B6560]">
                {p2?.sub}
              </span>
            </div>
            <div className="flex flex-col items-center gap-[3px] bg-[rgba(181,151,90,0.08)] p-4 text-center">
              <span className="font-sans text-[0.56rem] uppercase tracking-[0.15em] text-[#6B6560]">
                {p3?.label}
              </span>
              <span className="font-display text-[1.6rem] font-normal leading-none text-[#B5975A]">
                {p3?.value}
              </span>
              <span className="font-sans text-[0.57rem] text-[#6B6560]">
                {p3?.sub}
              </span>
            </div>
          </div>
        </div>

        {/* Right: hero image */}
        <div
          ref={imageRef}
          className="relative hidden min-h-[100dvh] overflow-hidden lg:block"
        >
          <img
            src={hero.image}
            alt="Bespoke suit on display"
            className="img-darken-slight hero-img h-full w-full object-cover"
            style={{ "--hero-obj-pos": hero.imagePosition || "center top" } as React.CSSProperties}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F3]/25 to-transparent" />
        </div>
      </div>
    </section>
  );
}
