"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TESTIMONIALS = [
  {
    stars: 5,
    quote:
      "The fit is unlike anything I've worn before. Ordered a 3-piece for my wedding and the detail was immaculate.",
    author: "Marcus W.",
    role: "Groom · Houston, TX",
  },
  {
    stars: 5,
    quote:
      "Faith-forward, quality first. Every Sunday I receive compliments. This brand just gets it.",
    author: "David O.",
    role: "Pastor · Atlanta, GA",
  },
  {
    stars: 5,
    quote:
      "Shirts came back perfectly tailored. The monogram on the cuff was a beautiful touch.",
    author: "James T.",
    role: "Business Owner · London, UK",
  },
];

export default function TestimonialsReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [current, setCurrent] = useState(0);

  const ANCHOR = "Worn with purpose.";
  const words = ANCHOR.split(" ");

  useGSAP(
    () => {
      const validRefs = wordRefs.current.filter(Boolean);
      if (!validRefs.length) return;

      gsap.fromTo(
        validRefs,
        { opacity: 0.1 },
        {
          opacity: 1,
          stagger: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            end: "top 20%",
            scrub: 1.2,
          },
        }
      );
    },
    { scope: containerRef }
  );

  function prev() {
    setCurrent((c) => (c === 0 ? TESTIMONIALS.length - 1 : c - 1));
  }
  function next() {
    setCurrent((c) => (c === TESTIMONIALS.length - 1 ? 0 : c + 1));
  }

  const t = TESTIMONIALS[current];

  return (
    <section
      ref={containerRef}
      className="bg-[#1C1C1C] px-6 py-32 md:py-40 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Scrubbing headline */}
        <div className="mb-20 text-center">
          <p className="flex items-center justify-center gap-3 font-sans text-[0.58rem] uppercase tracking-[0.28em] text-[#B5975A]/70">
            <span className="inline-block h-px w-6 shrink-0 bg-[#B5975A]" />
            Client Stories
          </p>
          <h2 className="h2-section mt-4 font-display font-light leading-[1.12] text-[#F5F0E8]">
            {words.map((word, i) => (
              <span
                key={i}
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                className="inline-block opacity-[0.1]"
              >
                {word}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </h2>
        </div>

        {/* Testimonial carousel */}
        <div className="grid gap-12 lg:grid-cols-[1fr_480px]">
          {/* Left: large quote */}
          <div className="flex flex-col justify-center border-t-2 border-[rgba(181,151,90,0.2)] pt-8">
            <p className="mb-4 font-sans text-[0.78rem] tracking-[2px] text-[#B5975A]">
              {"★".repeat(t.stars)}
            </p>
            <p className="font-display text-[1.55rem] font-light italic leading-[1.6] text-[#F5F0E8]">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-7">
              <p className="font-sans text-[0.59rem] uppercase tracking-[0.14em] text-[#B5975A]">
                {t.author}
              </p>
              <p className="mt-1 font-sans text-[0.57rem] text-[rgba(245,240,232,0.28)]">
                {t.role}
              </p>
            </div>
          </div>

          {/* Right: controls + indicator */}
          <div className="flex flex-col justify-between">
            {/* Step indicators */}
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-px transition-[width,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5975A] ${current === i ? "w-8 bg-[#B5975A]" : "w-4 bg-[rgba(181,151,90,0.25)]"}`}
                />
              ))}
            </div>

            {/* Prev/Next */}
            <div className="flex items-center gap-4 pt-8">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="flex h-11 w-11 items-center justify-center border border-[rgba(181,151,90,0.3)] text-[#B5975A] transition-colors hover:border-[#B5975A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5975A] active:scale-[0.98]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M11 7H3M7 3L3 7l4 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="flex h-11 w-11 items-center justify-center border border-[rgba(181,151,90,0.3)] text-[#B5975A] transition-colors hover:border-[#B5975A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5975A] active:scale-[0.98]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 7h8M7 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="font-sans text-[0.58rem] uppercase tracking-[0.14em] text-[rgba(245,240,232,0.25)]">
                {current + 1} / {TESTIMONIALS.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
