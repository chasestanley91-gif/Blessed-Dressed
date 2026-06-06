"use client";

import { useState, useEffect } from "react";

type Measurement = {
  key: string;
  label: string;
  how: string;
  tip?: string;
  image?: string;
};

type Tab = "jacket" | "shirt" | "trousers";
type GuideType = "body" | "finished";

// ─── FINISHED measurements (measuring a flat garment) — photos from PDF ──────

const FINISHED_JACKET: Measurement[] = [
  { key: "chest",        label: "Chest",               image: "/images/measuring-guide/page-07.jpg", how: "Lay the jacket flat. Fold the front overlap without a gap. Measure horizontally from the left armhole bottom to the right. Double = finished chest." },
  { key: "stomach",      label: "Stomach",             image: "/images/measuring-guide/page-09.jpg", how: "Jacket flat. Find the narrowest part of the stomach. Measure across. Double = finished stomach." },
  { key: "seat",         label: "Seat",                image: "/images/measuring-guide/page-10.jpg", how: "Find the seat and lay it flat. Double the half-measurement = finished seat. Side-vent jackets: overlap the vent 6 cm." },
  { key: "bicep",        label: "Bicep",               image: "/images/measuring-guide/page-11.jpg", how: "Lay the bicep area flat. Tape from left armhole bottom to right, parallel with the thread. Double = finished bicep." },
  { key: "sleeve",       label: "Sleeve Length",       image: "/images/measuring-guide/page-12.jpg", how: "Hang or place on mannequin. Tape from the shoulder point to the centre of the cuff. Keep shoulder flat.", tip: "Measure both sleeves — they often differ." },
  { key: "back_length",  label: "Back Length",         image: "/images/measuring-guide/page-13.jpg", how: "Hung or flat: measure vertically from the top of the back neck (central seam) straight down to the bottom hem." },
  { key: "shoulder",     label: "Shoulder Width",      image: "/images/measuring-guide/page-14.jpg", how: "Back side up, no wrinkles. Measure from left shoulder point, across the central seam, to right shoulder point." },
  { key: "front_length", label: "Front Length",        image: "/images/measuring-guide/page-15.jpg", how: "Hung or flat: measure vertically from the neck-shoulder point down to the hem." },
  { key: "first_button", label: "First Button Stance", image: "/images/measuring-guide/page-16.jpg", how: "Measure from the neck-shoulder point (A) diagonally to the lapel fold at the first button (B)." },
];

const FINISHED_SHIRT: Measurement[] = [
  { key: "collar",       label: "Collar (Neck)",   image: "/images/measuring-guide/page-35.jpg", how: "Open the collar. Measure from the centre of the button to the far end of the buttonhole on the under collar.", tip: "This is your finished collar size (e.g. 15.5\")." },
  { key: "chest",        label: "Chest",           image: "/images/measuring-guide/page-36.jpg", how: "Shirt flat, buttons fastened. Measure at the bottom of the armhole, straight across left to right. Double = finished chest." },
  { key: "stomach",      label: "Stomach / Waist", image: "/images/measuring-guide/page-37.jpg", how: "Shirt flat and fastened. Find the narrowest waist part and measure across. Double = finished stomach." },
  { key: "seat",         label: "Seat",            image: "/images/measuring-guide/page-38.jpg", how: "Shirt flat and fastened. Measure between the bottom of the two side seams. Double = finished seat." },
  { key: "bicep",        label: "Bicep",           image: "/images/measuring-guide/page-39.jpg", how: "Sleeve flat. Measure vertically from the armhole bottom to the bicep line. Double = finished bicep." },
  { key: "sleeve",       label: "Sleeve Length",   image: "/images/measuring-guide/page-40.jpg", how: "Shirt flat. Measure from the top of the sleeve to the bottom of the cuff along the sleeve seam.", tip: "Measure both sleeves — most people differ by 1–2 cm." },
  { key: "cuff",         label: "Cuff / Wrist",    image: "/images/measuring-guide/page-41.jpg", how: "Cuff flat and open. Place tape at the joint of cuff and sleeve; measure the distance between cuff edges." },
  { key: "shoulder",     label: "Shoulder Width",  image: "/images/measuring-guide/page-42.jpg", how: "Shirt flat, back up. Tape 4 cm behind the front shoulder seam; measure from left to right shoulder point." },
  { key: "back_length",  label: "Back Length",     image: "/images/measuring-guide/page-43.jpg", how: "Measure vertically from the back centre neckline straight down to the bottom hem.", tip: "For a tucked shirt, add 15–20 cm." },
];

const FINISHED_TROUSERS: Measurement[] = [
  { key: "waist",   label: "Waist",              image: "/images/measuring-guide/page-21.jpg", how: "Flat, no wrinkles, front/back waistband aligned, button fastened. Measure along the top waistband. Double = finished waist." },
  { key: "seat",    label: "Seat",               image: "/images/measuring-guide/page-22.jpg", how: "Seat and waist flat, pleats unfolded, zip half up. Measure 2 cm above the placket bottom stitch, parallel to waistband. Double = finished seat." },
  { key: "thigh",   label: "Thigh",              image: "/images/measuring-guide/page-23.jpg", how: "Fold along crease line. Measure 1 inch under crotch bottom. Double = finished thigh." },
  { key: "rise",    label: "Rise (U-rise)",       image: "/images/measuring-guide/page-24.jpg", how: "Crotch flat. Measure from centre front top waist down to the crotch crossing and up to centre back top waist.", tip: "Longer rise = high-waisted; shorter = hip-worn." },
  { key: "length",  label: "Pant Length",        image: "/images/measuring-guide/page-25.jpg", how: "Trouser flat. Measure from the top waistband along the side seam down to the bottom hem." },
  { key: "knee",    label: "Knee Width",         image: "/images/measuring-guide/page-26.jpg", how: "Fold along crease. Measure 5 cm above the half inseam. Double = finished knee." },
  { key: "bottom",  label: "Leg Opening",        image: "/images/measuring-guide/page-27.jpg", how: "Lay flat. Measure the width of the bottom opening. Double = finished leg opening.", tip: "Slim: 14–16 cm · Classic: 18–20 cm · Wide: 22 cm+" },
];

// ─── BODY measurements (measuring directly on the person) — photos from MTM guide

const BODY_JACKET: Measurement[] = [
  { key: "height",    label: "Height",           how: "Stand straight without shoes against a wall. Measure from the floor to the top of the head." },
  { key: "weight",    label: "Weight",           how: "Current weight in kg or lbs. Helps with silhouette and padding recommendations." },
  { key: "chest",     label: "Chest",            image: "/images/body-guide/chest.jpg",         how: "Under the armhole, tape around the fullest part of the chest with arms relaxed at your sides. Keep the tape parallel to the floor.", tip: "Wear the shirt you plan to wear under the jacket. Your tailor adds 8–16 cm ease." },
  { key: "stomach",   label: "Stomach / Waist",  image: "/images/body-guide/stomach.jpg",       how: "Approximately 2 cm above the belly button, at the natural waist. Keep the tape comfortably snug." },
  { key: "belly",     label: "Belly (Lower)",    image: "/images/body-guide/belly.jpg",         how: "Around the fullest part of the lower abdomen, below the belly button. Needed if larger than the stomach." },
  { key: "seat",      label: "Seat",             image: "/images/body-guide/seat.jpg",          how: "Around the fullest part of the seat with feet together. Keep the tape parallel to the floor and hips level." },
  { key: "shoulder",  label: "Shoulder Width",   image: "/images/body-guide/shoulder.jpg",      how: "Across the back from one neck-shoulder point to the other. This is narrower than shoulder end to shoulder end.", tip: "The neck-shoulder point is where your neck meets the shoulder slope." },
  { key: "back_width",label: "Back Width",       image: "/images/body-guide/shoulder.jpg",      how: "Across the upper back from shoulder end point to shoulder end point, at the broadest part." },
  { key: "bicep",     label: "Bicep",            image: "/images/body-guide/bicep.jpg",         how: "Flex the arm slightly. Tape around the fullest part of the upper arm. Tailor adds ~5 cm ease." },
  { key: "cuff",      label: "Wrist",            image: "/images/body-guide/wrist.jpg",         how: "Around the wrist bone." },
  { key: "left_sleeve",  label: "Left Sleeve",   image: "/images/body-guide/sleeve.jpg",        how: "Arm slightly bent. From the shoulder end point to the wrist bone.", tip: "Measure both arms — they often differ by 1–2 cm." },
  { key: "right_sleeve", label: "Right Sleeve",  image: "/images/body-guide/sleeve.jpg",        how: "Same as the left sleeve, measured on the right arm." },
  { key: "back_length",  label: "Back Length",   image: "/images/body-guide/back-length.jpg",   how: "From the 7th cervical vertebra (the prominent bone at the base of the neck) straight down the spine to the desired jacket hem." },
  { key: "front_length", label: "Front Length",  image: "/images/body-guide/chest-back.jpg",    how: "From the neck-shoulder point, down the front of the body, to the desired hem." },
  { key: "first_button", label: "First Button Stance", how: "From the neck-shoulder point diagonally to where the first lapel button should land. Determines how the jacket opens visually." },
];

const BODY_SHIRT: Measurement[] = [
  { key: "height",     label: "Height",           how: "Stand straight without shoes. Measure from the floor to the top of the head." },
  { key: "neck",       label: "Neck",             image: "/images/body-guide/neck-front.jpg",   how: "Horizontal tape around the middle of the neck, approximately 3 cm above the 7th cervical vertebra. Allow 1 finger of ease.", tip: "This becomes your collar size. If you already know it (e.g. 15.5\"), just use that." },
  { key: "chest",      label: "Chest",            image: "/images/body-guide/chest.jpg",        how: "Under the armpits, around the fullest part of the chest. Arms down, tape parallel to the floor.", tip: "Your tailor adds 6–16 cm ease depending on your preferred fit." },
  { key: "stomach",    label: "Stomach / Waist",  image: "/images/body-guide/stomach.jpg",      how: "Around the natural waist, approximately 2 cm above the belly button." },
  { key: "belly",      label: "Belly (Lower)",    image: "/images/body-guide/belly.jpg",        how: "Around the fullest part of the lower abdomen. Include only if larger than the stomach." },
  { key: "seat",       label: "Seat",             image: "/images/body-guide/seat-side.jpg",    how: "Around the fullest part of the seat, for shirts worn tucked in." },
  { key: "shoulder",   label: "Back Shoulder",    image: "/images/body-guide/shoulder.jpg",     how: "Across the upper back from one shoulder end point to the other. The shoulder end is where the shoulder slope meets the arm." },
  { key: "bicep",      label: "Bicep",            image: "/images/body-guide/bicep.jpg",        how: "Around the fullest part of the upper arm, arm relaxed." },
  { key: "left_wrist", label: "Left Wrist",       image: "/images/body-guide/wrist.jpg",       how: "Around the left wrist bone." },
  { key: "right_wrist",label: "Right Wrist",      image: "/images/body-guide/wrist.jpg",       how: "Around the right wrist bone." },
  { key: "left_sleeve",  label: "Left Sleeve",    image: "/images/body-guide/sleeve.jpg",      how: "From the shoulder end point, over the slightly bent elbow, to the wrist bone.", tip: "Bend the arm at 90° for the most accurate reading." },
  { key: "right_sleeve", label: "Right Sleeve",   image: "/images/body-guide/sleeve.jpg",      how: "Same as left sleeve on the right arm." },
  { key: "nape_to_waist",label: "Nape to Waist",  image: "/images/body-guide/nape-waist.jpg",  how: "From the 7th cervical vertebra straight down the spine to the natural waist." },
  { key: "back_length",  label: "Back Length",    image: "/images/body-guide/back-length.jpg", how: "From the 7th cervical vertebra to the desired shirt hem.", tip: "Add 15–20 cm for a tucked shirt." },
];

const BODY_TROUSERS: Measurement[] = [
  { key: "waist",   label: "Waist",        image: "/images/body-guide/trouser-waist.jpg", how: "Around the waist at the exact point where you want the trousers to sit — this may differ from your natural waist." },
  { key: "seat",    label: "Seat / Hip",   image: "/images/body-guide/trouser-seat.jpg",  how: "Around the fullest part of the seat with feet together. Tape passes over the hip bones, parallel to the floor." },
  { key: "thigh",   label: "Thigh",        image: "/images/body-guide/thigh.jpg",         how: "Around the fullest part of the upper thigh on one leg, just below the crotch." },
  { key: "rise",    label: "Rise",         image: "/images/body-guide/rise.jpg",          how: "Sit on a hard chair. Measure from the waistband down the side seam to the seat of the chair.", tip: "Alternatively: stand and measure from the waist to the crotch point along the inside leg." },
  { key: "inseam",  label: "Inseam",       image: "/images/body-guide/inseam.jpg",        how: "From the crotch point straight down the inside of the leg to the desired hem length." },
  { key: "outseam", label: "Outseam",      image: "/images/body-guide/outseam.jpg",       how: "From the waist down the outside of the leg to the desired hem." },
  { key: "knee",    label: "Knee Width",   image: "/images/body-guide/knee.jpg",          how: "Around the knee with the leg slightly bent, approximately 33 cm below the crotch." },
  { key: "bottom",  label: "Leg Opening",  how: "The desired circumference at the trouser hem.", tip: "Slim: 14–16 cm · Classic: 18–20 cm · Wide leg: 22 cm+" },
  { key: "calf",    label: "Calf",         how: "Around the fullest part of the calf. Used for wider-leg and heritage trouser styles." },
];

const TIPS = [
  "Measure with a helper when possible — self-measuring introduces error.",
  "Keep the tape snug but not tight. 1–2 fingers should comfortably slide underneath.",
  "Stand naturally — don't brace, suck in, or push out.",
  "Wear the shirt and undergarments you intend to wear under the finished garment.",
  "Re-measure if a reading feels unusual. Two consistent readings = correct.",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MeasurementRow({ m }: { m: Measurement }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-accent last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-1 py-3.5 text-left hover:bg-background/40 rounded-lg transition-colors"
      >
        <span className="font-sans text-sm font-medium text-foreground">{m.label}</span>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
          className={`shrink-0 text-slate transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true">
          <path d="M2 5l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="px-1 pb-5 space-y-3">
          {m.image && (
            <div className="overflow-hidden rounded-xl border border-border-accent">
              <img src={m.image} alt={`How to measure ${m.label}`} className="w-full object-cover" loading="lazy" />
            </div>
          )}
          <p className="font-sans text-sm leading-relaxed text-[#C9C1B3]">{m.how}</p>
          {m.tip && (
            <div className="flex items-start gap-2 rounded-lg bg-gold/10 border border-gold/20 px-3 py-2">
              <span className="shrink-0 font-sans text-[10px] font-semibold text-gold mt-0.5">TIP</span>
              <p className="font-sans text-xs text-gold/80">{m.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function MeasuringGuide({
  initialTab = "jacket",
  initialGuideType = "finished",
  onClose,
}: {
  initialTab?: Tab;
  initialGuideType?: GuideType;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [guideType, setGuideType] = useState<GuideType>(initialGuideType);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const TABS: { id: Tab; label: string }[] = [
    { id: "jacket",   label: "Jacket & Coat" },
    { id: "shirt",    label: "Shirt" },
    { id: "trousers", label: "Trousers" },
  ];

  const measurements: Measurement[] =
    guideType === "body"
      ? tab === "jacket"   ? BODY_JACKET
        : tab === "shirt"  ? BODY_SHIRT
        : BODY_TROUSERS
      : tab === "jacket"   ? FINISHED_JACKET
        : tab === "shirt"  ? FINISHED_SHIRT
        : FINISHED_TROUSERS;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-background shadow-2xl" role="dialog" aria-label="Measuring guide">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-accent px-6 py-4 shrink-0">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold">Tailoring Guide</p>
            <h2 className="font-display mt-0.5 text-lg font-semibold text-foreground">How to Measure</h2>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-accent text-muted-dark transition-colors hover:border-gold/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label="Close guide">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Guide type toggle — Body vs Finished */}
        <div className="flex gap-1 border-b border-border-accent px-6 py-3 shrink-0">
          <div className="flex gap-1 rounded-xl border border-border-accent bg-surface-strong p-1 w-full">
            {([
              { id: "body"     as const, label: "Body Measurements",     desc: "Measuring yourself" },
              { id: "finished" as const, label: "Finished Measurements", desc: "Measuring a garment" },
            ]).map((g) => (
              <button key={g.id} type="button" onClick={() => setGuideType(g.id)}
                className={`flex-1 rounded-lg py-2 text-center transition-[background,color] duration-150 focus-visible:outline-none ${guideType === g.id ? "bg-gold text-background" : "text-muted-dark hover:text-foreground"}`}>
                <p className={`font-sans text-xs font-semibold ${guideType === g.id ? "" : ""}`}>{g.label}</p>
                <p className={`font-sans text-[10px] ${guideType === g.id ? "text-background/70" : "text-slate"}`}>{g.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Garment type tabs */}
        <div className="flex border-b border-border-accent px-6 shrink-0">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`mr-6 border-b-2 py-3 font-sans text-xs font-semibold uppercase tracking-[0.15em] transition-colors focus-visible:outline-none ${tab === t.id ? "border-gold text-gold" : "border-transparent text-slate hover:text-muted-dark"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {guideType === "body" && (
            <p className="font-sans mb-4 text-xs text-slate">
              How to measure your <strong className="text-muted-dark">body directly</strong>. Stand naturally and use a flexible tape. Your tailor adds ease for comfort and movement.
            </p>
          )}
          {guideType === "finished" && (
            <p className="font-sans mb-4 text-xs text-slate">
              How to measure a <strong className="text-muted-dark">garment laid flat</strong>. Use a tape on the finished piece — these dimensions are used directly with no ease added.
            </p>
          )}

          <div>
            {measurements.map((m) => (
              <MeasurementRow key={m.key} m={m} />
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 rounded-2xl border border-border-accent bg-surface-strong p-5">
            <p className="font-sans mb-3 text-[10px] uppercase tracking-[0.25em] text-gold">General Tips</p>
            <ul className="space-y-2">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  <span className="font-sans text-xs leading-relaxed text-muted-dark">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {guideType === "body" && (
            <div className="mt-4 mb-6 rounded-xl border border-border-accent/60 bg-surface-deep px-4 py-3">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-slate mb-1">Key reference point</p>
              <p className="font-sans text-xs text-muted-dark leading-relaxed">
                The <strong className="text-[#C9C1B3]">7th cervical vertebra</strong> is the prominent bone at the base of your neck where it meets the shoulders. Tilt your head forward slightly to find it — it is the most visible vertebra. Used as the origin for back length, nape-to-waist, and neck measurements.
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
