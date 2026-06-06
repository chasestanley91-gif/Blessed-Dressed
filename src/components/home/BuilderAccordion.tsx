"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AccordionItem } from "@/data/site-settings";

const STEPS = [
  {
    num: "01",
    label: "Select a product",
    desc: "Suit, shirt, trousers, or waistcoat.",
    img: "/images/builder-heroes/suit-2pc.jpg",
  },
  {
    num: "02",
    label: "Choose your fabric",
    desc: "Italian mill selections — S120 to S150.",
    img: "/images/builder-heroes/sport-coat.jpg",
  },
  {
    num: "03",
    label: "Customize design",
    desc: "Lapels, pockets, lining, and vents.",
    img: "/images/factory/kute/jacket/Lining_Body_lining/072D__Artistic_Lining_Placement.png",
  },
  {
    num: "04",
    label: "Add monogram",
    desc: "Thread color, font, and placement.",
    img: "/images/factory/kute/jacket/Lapel_Handmade_lapel_buttonhole/019H__Open-minded_and_inclusive_handmade_buttonhole_each_keyhole_is_different_6_kinds_of_thread_colors_are_in_turn_-.jpg",
  },
  {
    num: "05",
    label: "Enter measurements",
    desc: "Standard sizing or fully custom.",
    img: "/images/builder-heroes/shirt.jpg",
  },
  {
    num: "06",
    label: "Posture adjustments",
    desc: "Fit tuning for your exact stance.",
    img: "/images/builder-heroes/vest.jpg",
  },
  {
    num: "07",
    label: "Review and order",
    desc: "Confirm every detail before placing.",
    img: "/images/builder-heroes/suit-2pc.jpg",
  },
];

export default function BuilderAccordion({ initialSteps }: { initialSteps?: AccordionItem[] }) {
  const [active, setActive] = useState<number>(0);
  const [steps] = useState<AccordionItem[]>(initialSteps?.length ? initialSteps : STEPS);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setIsEditMode(new URLSearchParams(window.location.search).get("__edit") === "1");
  }, []);

  return (
    <section className="bg-[#1C1C1C] px-6 py-32 md:py-40 lg:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="flex items-center gap-3 font-sans text-[0.58rem] uppercase tracking-[0.28em] text-[#B5975A]/70">
              <span className="inline-block h-px w-6 shrink-0 bg-[#B5975A]" />
              The Atelier
            </p>
            <h2 className="h2-section font-display font-light leading-[1.12] text-[#F5F0E8]">
              7 steps to your{" "}
              <em className="italic text-[#6B6560]">perfect garment.</em>
            </h2>
          </div>
          <Link
            href="/builder"
            className="btn-gold-home btn-pad-lg shrink-0 font-sans text-[0.65rem] font-medium uppercase tracking-[0.18em] no-underline transition-colors"
          >
            Start Building
          </Link>
        </div>

        {/* Accordion slices */}
        <div className="flex h-[520px] gap-0.5 overflow-hidden">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`accordion-slice group relative cursor-pointer overflow-hidden ${active === i ? "flex-[4_0_0%]" : "flex-[0.5_0_0%]"}`}
              onMouseEnter={() => setActive(i)}
              onClick={isEditMode ? () => {
                window.parent.postMessage({ type: "bd-edit-image", section: "accordion", index: i }, "*");
              } : undefined}
              title={isEditMode ? "Click to edit this step's image" : undefined}
            >
              {/* Background image */}
              <img
                src={step.img}
                alt={step.label}
                className="img-darken-strong absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(17,16,16,0.92)] via-[rgba(17,16,16,0.3)] to-transparent" />

              {/* Collapsed: vertical step number */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${active === i ? "opacity-0" : "opacity-100"}`}
              >
                <p className="text-vertical-rl font-display text-[0.65rem] font-light text-[rgba(245,240,232,0.35)]">
                  {step.num}
                </p>
              </div>

              {/* Edit mode badge */}
              {isEditMode && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 rounded-full bg-gold px-2 py-0.5 font-sans text-[8px] font-semibold uppercase tracking-[0.15em] text-background opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Edit Image
                </div>
              )}

              {/* Expanded: full content */}
              <div
                className={`accordion-content absolute bottom-0 left-0 right-0 p-7 ${active === i ? "translate-y-0 opacity-100" : "translate-y-[10px] opacity-0"}`}
              >
                <p className="mb-1 font-sans text-[0.55rem] uppercase tracking-[0.22em] text-[#B5975A]">
                  {step.num}
                </p>
                <h3 className="font-display text-[1.45rem] font-light leading-[1.15] text-[#F5F0E8]">
                  {step.label}
                </h3>
                <p className="mt-2 font-sans text-[0.72rem] leading-[1.8] text-[rgba(245,240,232,0.55)]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
