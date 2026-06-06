"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import type { CraftItem } from "@/data/site-settings";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CRAFTS = [
  {
    num: "01",
    label: "Full canvas construction",
    desc: "The inner structure of every suit jacket is hand-padded to your chest, not fused. It drapes, breathes, and improves with wear.",
    img: "/images/half/half-canvas-Half+canvas+Made+Suits.webp",
  },
  {
    num: "02",
    label: "Corozo nut buttons",
    desc: "Sourced from the tagua palm. Each button has a unique grain pattern. Lighter and more durable than plastic — and dignified.",
    img: "/images/factory/kute/jacket/Bttn_Thread_Button_Choice/0632__Nut_buttons.jpg",
  },
  {
    num: "03",
    label: "Hand-stitched details",
    desc: "Pick stitching, buttonholes, and edge finishing applied by hand at every stage of construction.",
    img: "/images/factory/kute/jacket/Lapel_Handmade_lapel_buttonhole/019H__Open-minded_and_inclusive_handmade_buttonhole_each_keyhole_is_different_6_kinds_of_thread_colors_are_in_turn_-.jpg",
  },
  {
    num: "04",
    label: "Monogram embroidery",
    desc: "Your initials rendered in fine thread. Placed inside the cuff, the chest pocket, or the collar — wherever you prefer.",
    img: "/images/factory/kute/jacket/Lining_Body_lining/072D__Artistic_Lining_Placement.png",
  },
];

export default function PinnedCraft({ initialCrafts }: { initialCrafts?: CraftItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [crafts] = useState<CraftItem[]>(initialCrafts?.length ? initialCrafts : CRAFTS);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsEditMode(new URLSearchParams(window.location.search).get("__edit") === "1");
  }, []);

  useGSAP(
    () => {
      const cards = rightRef.current?.querySelectorAll("[data-craft-card]");
      if (!cards || !leftRef.current || !containerRef.current) return;

      /* Pin the left column while the right scrolls */
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: leftRef.current,
        pinSpacing: false,
      });

      /* Skip scroll animations in edit mode — show everything at full opacity */
      const editMode = new URLSearchParams(window.location.search).get("__edit") === "1";
      if (editMode) return;

      /* Image scale + fade for each card */
      cards.forEach((card) => {
        const img = card.querySelector("img");
        if (!img) return;
        gsap.fromTo(
          img,
          { scale: 0.82, opacity: 0.2 },
          {
            scale: 1.0,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              end: "top 20%",
              scrub: 0.8,
            },
          }
        );
        const text = card.querySelector("[data-craft-text]");
        if (text) {
          gsap.fromTo(
            text,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.85,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 75%",
                once: true,
              },
            }
          );
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative bg-[#F5F0E8] px-6 py-0 lg:px-0"
    >
      <div className="mx-auto grid max-w-[100%] lg:grid-cols-[400px_1fr]">
        {/* Left: pinned title */}
        <div
          ref={leftRef}
          className="flex h-[100dvh] flex-col justify-center bg-[#F5F0E8] px-8 py-16 md:px-14 lg:px-16 xl:px-20"
        >
          <p className="mb-5 flex items-center gap-3 font-sans text-[0.58rem] uppercase tracking-[0.28em] text-[#B5975A]">
            <span className="inline-block h-px w-6 shrink-0 bg-[#B5975A]" />
            Craftsmanship
          </p>
          <h2 className="h2-section font-display font-light leading-[1.12] text-[#1C1C1C]">
            Details that
            <br />
            <em className="italic text-[#6B6560]">speak quietly.</em>
          </h2>
          <p className="mt-5 max-w-[260px] font-sans text-[0.79rem] leading-[2] text-[#6B6560]">
            Every garment is built by hand in ways that may not be visible —
            but that you will feel every time you put it on.
          </p>
          <Link
            href="/builder"
            className="mt-9 inline-flex w-fit items-center gap-2 font-sans text-[0.65rem] uppercase tracking-[0.18em] text-[#B5975A] no-underline"
          >
            Build yours
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 7h8M7 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {/* Right: scrolling craft cards */}
        <div ref={rightRef} className="pt-[15vh]">
          {crafts.map((craft, i) => (
            <div
              key={craft.num}
              data-craft-card
              className={`group relative mb-4 overflow-hidden${isEditMode ? " cursor-pointer" : ""}`}
              onClick={isEditMode ? () => {
                window.parent.postMessage({ type: "bd-edit-image", section: "craft", index: i }, "*");
              } : undefined}
              title={isEditMode ? "Click to edit this craft panel" : undefined}
            >
              {/* Edit badge shown on hover in edit mode */}
              {isEditMode && (
                <div className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-gold px-3 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-background opacity-0 transition-opacity group-hover:opacity-100">
                  Edit Image
                </div>
              )}

              {/* Full-bleed image */}
              <div className="h-[70vh] overflow-hidden">
                <img
                  src={craft.img}
                  alt={craft.label}
                  className="img-darken-light h-full w-full object-cover object-center"
                />
              </div>

              {/* Text overlay */}
              <div
                data-craft-text
                className="absolute bottom-0 left-0 right-0 p-8"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(17,16,16,0.85)] via-[rgba(17,16,16,0.1)] to-transparent" />
                <div className="relative z-10">
                  <p className="mb-1 font-sans text-[0.55rem] uppercase tracking-[0.22em] text-[#B5975A]">
                    {craft.num}
                  </p>
                  <h3 className="font-display text-[1.65rem] font-light leading-[1.18] text-[#F5F0E8]">
                    {craft.label}
                  </h3>
                  <p className="mt-2 max-w-lg font-sans text-[0.72rem] leading-[1.9] text-[rgba(245,240,232,0.55)]">
                    {craft.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {/* Bottom breathing room */}
          <div className="h-[15vh]" />
        </div>
      </div>
    </section>
  );
}
