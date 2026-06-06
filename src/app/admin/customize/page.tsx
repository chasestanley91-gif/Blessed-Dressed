"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { SiteSettings, NavLink, AccordionItem, CraftItem } from "@/data/site-settings";
import { SITE_DEFAULTS } from "@/data/site-settings";
import CropModal from "@/components/admin/CropModal";

/* ─── Font options ─────────────────────────────────────────────── */
const HEADING_FONTS = [
  "Cormorant Garamond",
  "Playfair Display",
  "EB Garamond",
  "Lora",
  "Libre Baskerville",
];
const BODY_FONTS = [
  "Montserrat",
  "Raleway",
  "Open Sans",
  "Lato",
  "Inter",
  "Poppins",
];

type SiteImage = { path: string; dir: string; name: string };
const DIR_LABELS: Record<string, string> = {
  "builder-heroes": "Hero Photos",
  collections: "Collections",
  products: "Products",
  uploads: "Uploaded",
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  marquee: "Marquee Band",
  bento: "Features Grid",
  builder: "Builder Accordion",
  craft: "Craft Section",
  collections: "Collections",
  testimonials: "Testimonials",
  rtw: "Ready to Wear",
  accessories: "Accessories",
  cta: "Closing CTA",
};

/* section id → tab mapping for click-to-select */
const SECTION_TO_TAB: Record<string, string> = {
  hero: "hero",
  marquee: "marquee",
  bento: "bento",
  builder: "accordion",
  craft: "craft",
  collections: "sections",
  testimonials: "sections",
  rtw: "sections",
  accessories: "sections",
  cta: "sections",
};

/* ─── Input primitives ─────────────────────────────────────────── */
const inp =
  "w-full rounded-lg border border-border-accent bg-surface-deep px-3 py-2 font-sans text-xs text-foreground outline-none focus:border-gold transition-colors placeholder:text-dim";
const lbl = "block font-sans text-[10px] uppercase tracking-[0.2em] text-muted-dark mb-1";
const fieldCls = "space-y-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={fieldCls}>
      <p className={lbl}>{label}</p>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <textarea
        className={`${inp} resize-none`}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
  }
  return (
    <input
      type="text"
      className={inp}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      className={inp}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* Editable link list */
function LinkList({
  links,
  onChange,
}: {
  links: NavLink[];
  onChange: (links: NavLink[]) => void;
}) {
  function update(i: number, field: "label" | "href", val: string) {
    const next = links.map((l, idx) =>
      idx === i ? { ...l, [field]: val } : l
    );
    onChange(next);
  }
  function remove(i: number) {
    onChange(links.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...links, { label: "New Link", href: "/" }]);
  }

  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            className={`${inp} flex-1`}
            value={l.label}
            onChange={(e) => update(i, "label", e.target.value)}
            placeholder="Label"
          />
          <input
            type="text"
            className={`${inp} flex-1`}
            value={l.href}
            onChange={(e) => update(i, "href", e.target.value)}
            placeholder="/path"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 text-[#EF4444] hover:opacity-70 text-xs px-1"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="font-sans text-[10px] uppercase tracking-[0.15em] text-gold hover:opacity-70"
      >
        + Add link
      </button>
    </div>
  );
}

/* ─── Tab editors ──────────────────────────────────────────────── */

function TypographyEditor({
  s,
  set,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Heading Font">
        <Select
          value={s.typography.headingFont}
          onChange={(v) =>
            set({ ...s, typography: { ...s.typography, headingFont: v } })
          }
          options={HEADING_FONTS}
        />
        <p
          className="preview-heading mt-2 text-xl leading-tight"
          style={{ "--preview-heading-font": `'${s.typography.headingFont}', serif` } as React.CSSProperties}
        >
          Dressed with <em>intention.</em>
        </p>
      </Field>
      <Field label="Body Font">
        <Select
          value={s.typography.bodyFont}
          onChange={(v) =>
            set({ ...s, typography: { ...s.typography, bodyFont: v } })
          }
          options={BODY_FONTS}
        />
        <p
          className="preview-body mt-2 text-xs leading-relaxed text-muted-dark"
          style={{ "--preview-body-font": `'${s.typography.bodyFont}', sans-serif` } as React.CSSProperties}
        >
          Custom suits, dress pants, and shirts made to your exact measurements.
        </p>
      </Field>
    </div>
  );
}

function NavEditor({
  s,
  set,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
}) {
  const n = s.nav;
  const upd = (patch: Partial<typeof n>) =>
    set({ ...s, nav: { ...n, ...patch } });

  return (
    <div className="space-y-5">
      <Field label="Logo Text">
        <TextInput value={n.logoText} onChange={(v) => upd({ logoText: v })} />
      </Field>
      <Field label="CTA Button Text">
        <TextInput value={n.ctaText} onChange={(v) => upd({ ctaText: v })} />
      </Field>
      <Field label="CTA Button Link">
        <TextInput value={n.ctaLink} onChange={(v) => upd({ ctaLink: v })} />
      </Field>
      <Field label="Nav Links">
        <LinkList links={n.links} onChange={(links) => upd({ links })} />
      </Field>
    </div>
  );
}

/* ─── Focal point picker ───────────────────────────────────────── */
function FocalPointPicker({
  image,
  position,
  onChange,
}: {
  image: string;
  position: string;
  onChange: (pos: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Parse current position into percentages
  const parts = position.split(" ");
  const px = parseFloat(parts[0]) || 50;
  const py = parseFloat(parts[1]) || 50;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current!.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChange(`${x}% ${y}%`);
  }

  return (
    <div className="space-y-1.5">
      <p className={lbl}>Focal Point (click image to set)</p>
      <div
        ref={ref}
        onClick={handleClick}
        className="relative h-36 w-full overflow-hidden rounded-lg border border-border-accent cursor-crosshair select-none"
      >
        <img
          src={image}
          alt="focal point preview"
          className="focal-img h-full w-full object-cover brightness-75"
          style={{ "--focal-pos": position } as React.CSSProperties}
          draggable={false}
        />
        {/* Crosshair dot */}
        <div
          className="focal-dot pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_#000] transition-[left,top]"
          style={{ "--focal-x": `${px}%`, "--focal-y": `${py}%` } as React.CSSProperties}
        />
        {/* Grid overlay */}
        <div className="focal-grid pointer-events-none absolute inset-0" />
      </div>
      <p className="font-sans text-[10px] text-muted-dark">
        Position: {px}% {py}%
      </p>
    </div>
  );
}

/* ─── Image browser ────────────────────────────────────────────── */
function ImageBrowser({
  current,
  onSelect,
  onCrop,
  defaultOpen,
}: {
  current: string;
  onSelect: (path: string) => void;
  onCrop?: (url: string, onSave: (u: string) => void) => void;
  defaultOpen?: boolean;
}) {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(defaultOpen ?? false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/images")
      .then((r) => r.json())
      .then((d: { images: SiteImage[] }) => setImages(d.images))
      .catch(() => {});
  }, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("imagePath", `uploads/${file.name}`);
    try {
      await fetch("/api/admin/upload-image", { method: "POST", body: form });
      // Re-fetch images after upload
      const res = await fetch("/api/admin/images");
      const d: { images: SiteImage[] } = await res.json();
      setImages(d.images);
      onSelect(`/images/uploads/${file.name}`);
      setOpen(false);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const filtered = images.filter(
    (img) =>
      img.name.toLowerCase().includes(search.toLowerCase()) ||
      img.dir.toLowerCase().includes(search.toLowerCase())
  );

  const byDir = filtered.reduce<Record<string, SiteImage[]>>((acc, img) => {
    (acc[img.dir] ??= []).push(img);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {/* Current image + change button */}
      <div className="flex items-center gap-3">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded border border-border-accent">
          <img src={current} alt="current" className="h-full w-full object-cover object-top" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] text-muted-dark truncate">{current}</p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-1 rounded-md bg-border-accent px-3 py-1 font-sans text-[10px] text-foreground hover:bg-gold hover:text-background transition-colors"
          >
            {open ? "Close" : "Change Image"}
          </button>
        </div>
      </div>

      {open && (
        <div className="rounded-lg border border-border-accent bg-surface-deep overflow-hidden">
          {/* Search + upload + crop */}
          <div className="flex gap-2 p-2 border-b border-border-accent">
            <input
              type="text"
              className={`${inp} flex-1 !py-1.5`}
              placeholder="Search images…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="shrink-0 rounded-md bg-gold px-2.5 py-1 font-sans text-[10px] font-semibold text-background hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? "Uploading…" : "↑ Upload"}
            </button>
            {onCrop && current && (
              <button
                type="button"
                onClick={() => { onCrop(current, onSelect); setOpen(false); }}
                className="shrink-0 rounded-md border border-border-accent px-2.5 py-1 font-sans text-[10px] text-muted-dark hover:text-gold hover:border-gold/40 transition-colors whitespace-nowrap"
              >
                Crop
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              aria-label="Upload image file"
              className="sr-only"
              onChange={upload}
            />
          </div>

          {/* Image grid */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-3">
            {Object.entries(byDir).map(([dir, imgs]) => (
              <div key={dir}>
                <p className="font-sans text-[9px] uppercase tracking-[0.15em] text-gold mb-1.5 px-1">
                  {DIR_LABELS[dir] ?? dir}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {imgs.map((img) => (
                    <button
                      key={img.path}
                      type="button"
                      onClick={() => { onSelect(img.path); setOpen(false); }}
                      className={`relative overflow-hidden rounded border-2 transition-colors text-left aspect-[4/3] ${
                        current === img.path
                          ? "border-gold"
                          : "border-transparent hover:border-gold/50"
                      }`}
                      title={img.name}
                    >
                      <img
                        src={img.path}
                        alt={img.name}
                        className="h-full w-full object-cover object-top brightness-75"
                      />
                      {current === img.path && (
                        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[7px] font-bold text-background">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="font-sans text-xs text-dim text-center py-4">No images found</p>
            )}
          </div>
        </div>
      )}

      {/* Custom URL fallback */}
      <div>
        <p className={`${lbl} mb-1`}>Or paste image URL / path</p>
        <TextInput
          value={current}
          onChange={onSelect}
          placeholder="/images/... or https://..."
        />
      </div>
    </div>
  );
}

function HeroEditor({
  s,
  set,
  onCrop,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
  onCrop: (url: string, onSave: (u: string) => void) => void;
}) {
  const h = s.hero;
  const upd = (patch: Partial<typeof h>) =>
    set({ ...s, hero: { ...h, ...patch } });

  function updPrice(i: number, field: "label" | "value" | "sub", val: string) {
    const next = h.priceItems.map((p, idx) =>
      idx === i ? { ...p, [field]: val } : p
    );
    upd({ priceItems: next });
  }

  return (
    <div className="space-y-5">
      <Field label="Eyebrow Text">
        <TextInput value={h.eyebrow} onChange={(v) => upd({ eyebrow: v })} />
      </Field>
      <Field label="Headline">
        <TextInput value={h.headline} onChange={(v) => upd({ headline: v })} placeholder="Dressed with" />
      </Field>
      <Field label="Headline (italic accent)">
        <TextInput value={h.headlineEm} onChange={(v) => upd({ headlineEm: v })} placeholder="intention." />
      </Field>
      <Field label="Headline Suffix">
        <TextInput value={h.headlineSuffix} onChange={(v) => upd({ headlineSuffix: v })} placeholder="Built for you." />
      </Field>
      <Field label="Subheadline">
        <TextInput value={h.subheadline} onChange={(v) => upd({ subheadline: v })} multiline />
      </Field>
      <Field label="Scripture Quote">
        <TextInput value={h.quote} onChange={(v) => upd({ quote: v })} multiline />
      </Field>
      <Field label="Scripture Reference">
        <TextInput value={h.quoteRef} onChange={(v) => upd({ quoteRef: v })} />
      </Field>

      <Field label="Hero Image">
        <ImageBrowser
          current={h.image}
          onSelect={(path) => upd({ image: path })}
          onCrop={onCrop}
        />
      </Field>

      <FocalPointPicker
        image={h.image}
        position={h.imagePosition ?? "50% 50%"}
        onChange={(pos) => upd({ imagePosition: pos })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Primary CTA Text">
          <TextInput value={h.ctaPrimaryText} onChange={(v) => upd({ ctaPrimaryText: v })} />
        </Field>
        <Field label="Primary CTA Link">
          <TextInput value={h.ctaPrimaryLink} onChange={(v) => upd({ ctaPrimaryLink: v })} />
        </Field>
        <Field label="Secondary CTA Text">
          <TextInput value={h.ctaSecondaryText} onChange={(v) => upd({ ctaSecondaryText: v })} />
        </Field>
        <Field label="Secondary CTA Link">
          <TextInput value={h.ctaSecondaryLink} onChange={(v) => upd({ ctaSecondaryLink: v })} />
        </Field>
      </div>

      <div>
        <p className={`${lbl} mb-2`}>Price Grid</p>
        <div className="space-y-3">
          {h.priceItems.map((p, i) => (
            <div key={i} className="rounded-lg border border-border-accent p-3 space-y-2">
              <p className="font-sans text-[9px] uppercase tracking-[0.15em] text-gold">
                Column {i + 1}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className={lbl}>Label</p>
                  <input type="text" className={inp} value={p.label} onChange={(e) => updPrice(i, "label", e.target.value)} />
                </div>
                <div>
                  <p className={lbl}>Value</p>
                  <input type="text" className={inp} value={p.value} onChange={(e) => updPrice(i, "value", e.target.value)} />
                </div>
                <div>
                  <p className={lbl}>Sub</p>
                  <input type="text" className={inp} value={p.sub} onChange={(e) => updPrice(i, "sub", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionsEditor({
  s,
  set,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
}) {
  const secs = s.sections;
  return (
    <div className="space-y-2">
      <p className="font-sans text-[10px] text-muted-dark mb-3">
        Toggle sections on/off on the homepage.
      </p>
      {(Object.keys(SECTION_LABELS) as (keyof typeof secs)[]).map((key) => (
        <label
          key={key}
          className="flex items-center justify-between rounded-lg border border-border-accent px-4 py-3 cursor-pointer hover:border-gold/40 transition-colors"
        >
          <span className="font-sans text-xs text-foreground">{SECTION_LABELS[key]}</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={secs[key]}
              onChange={(e) =>
                set({ ...s, sections: { ...secs, [key]: e.target.checked } })
              }
            />
            <div
              className={`w-9 h-5 rounded-full transition-colors ${
                secs[key] ? "bg-gold" : "bg-border-accent"
              }`}
            />
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                secs[key] ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </label>
      ))}
    </div>
  );
}

function MarqueeEditor({
  s,
  set,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
}) {
  function update(i: number, val: string) {
    const next = s.marquee.map((m, idx) => (idx === i ? val : m));
    set({ ...s, marquee: next });
  }
  function remove(i: number) {
    set({ ...s, marquee: s.marquee.filter((_, idx) => idx !== i) });
  }
  function add() {
    set({ ...s, marquee: [...s.marquee, "New Item"] });
  }

  return (
    <div className="space-y-3">
      <p className="font-sans text-[10px] text-muted-dark">
        These items scroll across the marquee band between sections.
      </p>
      {s.marquee.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            className={`${inp} flex-1`}
            value={item}
            onChange={(e) => update(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 text-[#EF4444] hover:opacity-70 text-xs px-1"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="font-sans text-[10px] uppercase tracking-[0.15em] text-gold hover:opacity-70"
      >
        + Add item
      </button>
    </div>
  );
}

function FooterEditor({
  s,
  set,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
}) {
  const f = s.footer;
  const upd = (patch: Partial<typeof f>) =>
    set({ ...s, footer: { ...f, ...patch } });

  return (
    <div className="space-y-5">
      <Field label="Scripture">
        <TextInput value={f.scripture} onChange={(v) => upd({ scripture: v })} multiline />
      </Field>
      <Field label="Scripture Reference">
        <TextInput value={f.scriptureRef} onChange={(v) => upd({ scriptureRef: v })} />
      </Field>
      <Field label="Brand Tagline">
        <TextInput value={f.tagline} onChange={(v) => upd({ tagline: v })} multiline />
      </Field>
      <Field label="Brand Values">
        <TextInput value={f.values} onChange={(v) => upd({ values: v })} placeholder="Faith · Integrity · Excellence" />
      </Field>
      <Field label="Copyright">
        <TextInput value={f.copyright} onChange={(v) => upd({ copyright: v })} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Field label="Column 1 Title">
            <TextInput value={f.col1Title} onChange={(v) => upd({ col1Title: v })} />
          </Field>
          <div className="mt-3">
            <p className={lbl}>Column 1 Links</p>
            <LinkList links={f.col1Links} onChange={(col1Links) => upd({ col1Links })} />
          </div>
        </div>
        <div>
          <Field label="Column 2 Title">
            <TextInput value={f.col2Title} onChange={(v) => upd({ col2Title: v })} />
          </Field>
          <div className="mt-3">
            <p className={lbl}>Column 2 Links</p>
            <LinkList links={f.col2Links} onChange={(col2Links) => upd({ col2Links })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccordionEditor({
  s,
  set,
  onCrop,
  focusIdx,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
  onCrop: (url: string, onSave: (u: string) => void) => void;
  focusIdx: number | null;
}) {
  const items: AccordionItem[] = s.accordion?.items ?? SITE_DEFAULTS.accordion!.items;
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (focusIdx !== null && itemRefs.current[focusIdx]) {
      itemRefs.current[focusIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusIdx]);

  function updItem(i: number, patch: Partial<AccordionItem>) {
    const next = items.map((item, idx) => idx === i ? { ...item, ...patch } : item);
    set({ ...s, accordion: { items: next } });
  }

  return (
    <div className="space-y-4">
      <p className="font-sans text-[10px] text-muted-dark">
        Edit the 7 steps shown in the bespoke process accordion on the homepage.
        {focusIdx === null && <span className="block mt-1 text-gold">Tip: click any step in the preview to jump to it here.</span>}
      </p>
      {items.map((item, i) => (
        <div
          key={i}
          ref={(el) => { itemRefs.current[i] = el; }}
          className={`rounded-xl border p-4 space-y-3 transition-colors ${focusIdx === i ? "border-gold bg-gold/5" : "border-border-accent bg-surface-deep"}`}
        >
          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-gold">Step {item.num}</p>
          <Field label="Label">
            <TextInput value={item.label} onChange={(v) => updItem(i, { label: v })} />
          </Field>
          <Field label="Description">
            <TextInput value={item.desc} onChange={(v) => updItem(i, { desc: v })} multiline />
          </Field>
          <Field label="Background Image">
            <ImageBrowser
              key={`accordion-${i}-${focusIdx === i ? "focused" : "normal"}`}
              current={item.img}
              onSelect={(path) => updItem(i, { img: path })}
              onCrop={onCrop}
              defaultOpen={focusIdx === i}
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

function CraftEditor({
  s,
  set,
  onCrop,
  focusIdx,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
  onCrop: (url: string, onSave: (u: string) => void) => void;
  focusIdx: number | null;
}) {
  const items: CraftItem[] = s.craftItems ?? SITE_DEFAULTS.craftItems!;
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (focusIdx !== null && itemRefs.current[focusIdx]) {
      itemRefs.current[focusIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusIdx]);

  function updItem(i: number, patch: Partial<CraftItem>) {
    const next = items.map((item, idx) => idx === i ? { ...item, ...patch } : item);
    set({ ...s, craftItems: next });
  }

  return (
    <div className="space-y-4">
      <p className="font-sans text-[10px] text-muted-dark">
        Edit the 4 craft showcase panels in the pinned scroll section.
        {focusIdx === null && <span className="block mt-1 text-gold">Tip: click any craft panel in the preview to jump to it here.</span>}
      </p>
      {items.map((item, i) => (
        <div
          key={i}
          ref={(el) => { itemRefs.current[i] = el; }}
          className={`rounded-xl border p-4 space-y-3 transition-colors ${focusIdx === i ? "border-gold bg-gold/5" : "border-border-accent bg-surface-deep"}`}
        >
          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-gold">Craft {item.num}</p>
          <Field label="Heading">
            <TextInput value={item.label} onChange={(v) => updItem(i, { label: v })} />
          </Field>
          <Field label="Description">
            <TextInput value={item.desc} onChange={(v) => updItem(i, { desc: v })} multiline />
          </Field>
          <Field label="Full-Bleed Image">
            <ImageBrowser
              key={`craft-${i}-${focusIdx === i ? "focused" : "normal"}`}
              current={item.img}
              onSelect={(path) => updItem(i, { img: path })}
              onCrop={onCrop}
              defaultOpen={focusIdx === i}
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

function BentoEditor({
  s,
  set,
  onCrop,
  focused,
}: {
  s: SiteSettings;
  set: (s: SiteSettings) => void;
  onCrop: (url: string, onSave: (u: string) => void) => void;
  focused: boolean;
}) {
  const b = s.bento ?? SITE_DEFAULTS.bento!;
  const upd = (patch: Partial<NonNullable<SiteSettings["bento"]>>) =>
    set({ ...s, bento: { ...b, ...patch } });

  return (
    <div className="space-y-5">
      <p className="font-sans text-[10px] text-muted-dark">
        Edit the features grid (bento) section on the homepage.
      </p>

      <div className={`rounded-xl border p-4 space-y-4 transition-colors ${focused ? "border-gold bg-gold/5" : "border-border-accent bg-surface-deep"}`}>
        <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-gold">Main Feature Image</p>
        <Field label="Section Label">
          <TextInput value={b.cardALabel ?? "Materials"} onChange={(v) => upd({ cardALabel: v })} placeholder="Materials" />
        </Field>
        <Field label="Heading">
          <TextInput value={b.cardAHeading ?? ""} onChange={(v) => upd({ cardAHeading: v })} placeholder="Italian mill fabrics,\nS120 to S150." multiline />
        </Field>
        <Field label="Body Text">
          <TextInput value={b.cardABody ?? ""} onChange={(v) => upd({ cardABody: v })} multiline />
        </Field>
        <Field label="Image">
          <ImageBrowser
            key={`bento-${focused ? "focused" : "normal"}`}
            current={b.cardAImage}
            onSelect={(path) => upd({ cardAImage: path })}
            onCrop={onCrop}
            defaultOpen={focused}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border-accent bg-surface-deep p-4 space-y-3">
        <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-gold">Philosophy Quote</p>
        <Field label="Quote Text">
          <TextInput value={b.faithQuote ?? ""} onChange={(v) => upd({ faithQuote: v })} multiline placeholder="The LORD shall make thee the head, and not the tail." />
        </Field>
        <Field label="Scripture Ref">
          <TextInput value={b.faithRef ?? ""} onChange={(v) => upd({ faithRef: v })} placeholder="Deut. 28:13" />
        </Field>
      </div>
    </div>
  );
}

/* ─── Tabs config ──────────────────────────────────────────────── */
const TABS = [
  { id: "typography", label: "Typography", short: "Type",    icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 0v2" },
  { id: "nav",        label: "Navigation", short: "Nav",     icon: "M4 6h16M4 12h16M4 18h16" },
  { id: "hero",       label: "Hero",       short: "Hero",    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "sections",   label: "Sections",   short: "Sections",icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" },
  { id: "bento",      label: "Features",   short: "Bento",   icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
  { id: "accordion",  label: "Accordion",  short: "Accd",    icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { id: "craft",      label: "Craft",      short: "Craft",   icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
  { id: "marquee",    label: "Marquee",    short: "Ticker",  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { id: "footer",     label: "Footer",     short: "Footer",  icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

/* ─── Main page ────────────────────────────────────────────────── */
export default function CustomizePage() {
  const [settings, setSettings] = useState<SiteSettings>(SITE_DEFAULTS);
  const [activeTab, setActiveTab] = useState("hero");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cropState, setCropState] = useState<{ url: string; onSave: (u: string) => void } | null>(null);
  const [editFocus, setEditFocus] = useState<{ section: "accordion" | "craft" | "bento"; index: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeKey = useRef(0);
  const [iframeCount, setIframeCount] = useState(0);

  const handleCropRequest = useCallback((url: string, onSave: (u: string) => void) => {
    setCropState({ url, onSave });
  }, []);

  /* Load initial settings */
  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((data: SiteSettings) => {
        setSettings({
          ...SITE_DEFAULTS,
          ...data,
          accordion: data.accordion ?? SITE_DEFAULTS.accordion,
          craftItems: data.craftItems ?? SITE_DEFAULTS.craftItems,
          bento: { ...SITE_DEFAULTS.bento!, ...data.bento },
          pages: { ...SITE_DEFAULTS.pages, ...data.pages },
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* Listen for click-to-select messages from iframe */
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "bd-edit-section") {
        const tab = SECTION_TO_TAB[e.data.sectionId as string] ?? "sections";
        setActiveTab(tab);
      }
      if (e.data.type === "bd-edit-image") {
        const s = e.data.section as string;
        const section = s === "craft" ? "craft" : s === "bento" ? "bento" : "accordion";
        setActiveTab(section);
        setEditFocus({ section, index: (e.data.index as number) ?? 0 });
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  /* When tab changes, highlight the corresponding section in iframe */
  const notifyIframe = useCallback((sectionId: string | null) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    if (sectionId) {
      iframe.contentWindow.postMessage(
        { type: "bd-select-section", sectionId },
        "*"
      );
    } else {
      iframe.contentWindow.postMessage({ type: "bd-deselect-all" }, "*");
    }
  }, []);

  function switchTab(tabId: string) {
    setActiveTab(tabId);
    setEditFocus(null);
    const tabToSection: Record<string, string | null> = {
      hero: "hero",
      marquee: "marquee",
      accordion: "builder",
      craft: "craft",
      bento: "bento",
      nav: null,
      typography: null,
      sections: null,
      footer: null,
    };
    notifyIframe(tabToSection[tabId] ?? null);
  }

  async function save() {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Reload iframe to reflect saved changes
      iframeKey.current += 1;
      setIframeCount(iframeKey.current);
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 4000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ── Crop Modal ────────────────────────────────────────────── */}
      {cropState && createPortal(
        <CropModal
          src={cropState.url}
          originalPath={cropState.url}
          onSave={(newUrl) => { cropState.onSave(newUrl); setCropState(null); }}
          onClose={() => setCropState(null)}
        />,
        document.body
      )}

      {/* ── Editor Panel ──────────────────────────────────────────── */}
      <div className="flex flex-col w-80 shrink-0 border-r border-border-accent bg-background overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-border-accent">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-gold">Site Editor</p>
          <p className="font-sans text-[10px] text-muted-dark mt-0.5">Click any section in preview to edit</p>
        </div>

        {/* Tab grid — 3 columns × 2 rows */}
        <div className="grid grid-cols-3 border-b border-border-accent">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 font-sans text-[9px] uppercase tracking-[0.08em] transition-colors border-b-2 ${
                  active
                    ? "border-gold text-gold bg-gold/5"
                    : "border-transparent text-muted-dark hover:text-foreground hover:bg-surface-strong"
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={tab.icon} />
                </svg>
                <span className="leading-none">{tab.short}</span>
              </button>
            );
          })}
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {loading ? (
            <p className="font-sans text-xs text-muted-dark text-center pt-8">Loading…</p>
          ) : (
            <>
              {activeTab === "typography" && (
                <TypographyEditor s={settings} set={setSettings} />
              )}
              {activeTab === "nav" && (
                <NavEditor s={settings} set={setSettings} />
              )}
              {activeTab === "hero" && (
                <HeroEditor s={settings} set={setSettings} onCrop={handleCropRequest} />
              )}
              {activeTab === "sections" && (
                <SectionsEditor s={settings} set={setSettings} />
              )}
              {activeTab === "bento" && (
                <BentoEditor
                  s={settings}
                  set={setSettings}
                  onCrop={handleCropRequest}
                  focused={editFocus?.section === "bento"}
                />
              )}
              {activeTab === "accordion" && (
                <AccordionEditor
                  s={settings}
                  set={setSettings}
                  onCrop={handleCropRequest}
                  focusIdx={editFocus?.section === "accordion" ? editFocus.index : null}
                />
              )}
              {activeTab === "craft" && (
                <CraftEditor
                  s={settings}
                  set={setSettings}
                  onCrop={handleCropRequest}
                  focusIdx={editFocus?.section === "craft" ? editFocus.index : null}
                />
              )}
              {activeTab === "marquee" && (
                <MarqueeEditor s={settings} set={setSettings} />
              )}
              {activeTab === "footer" && (
                <FooterEditor s={settings} set={setSettings} />
              )}
            </>
          )}
        </div>

        {/* Sticky save footer */}
        <div className="shrink-0 border-t border-border-accent bg-background px-4 py-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={`w-full rounded-xl py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
              saved
                ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                : saveError
                ? "bg-red-900/30 text-red-400 border border-red-500/40"
                : "bg-gold text-background hover:opacity-90 disabled:opacity-50"
            }`}
          >
            {saved ? "Changes Saved ✓" : saving ? "Saving…" : saveError ? "Save Failed — Retry" : "Save Changes"}
          </button>
        </div>

      </div>

      {/* ── Live Preview Iframe ────────────────────────────────────── */}
      <div className="flex-1 relative bg-surface-deep flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-accent bg-background">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#EF4444]/60" />
            <div className="h-3 w-3 rounded-full bg-[#F59E0B]/60" />
            <div className="h-3 w-3 rounded-full bg-[#22C55E]/60" />
          </div>
          <div className="flex-1 rounded-md bg-surface-deep px-3 py-1 font-sans text-[10px] text-dim border border-border-accent">
            localhost:3000/?__edit=1
          </div>
          <button
            type="button"
            onClick={() => { iframeKey.current += 1; setIframeCount(iframeKey.current); }}
            className="text-muted-dark hover:text-foreground transition-colors"
            title="Refresh preview"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>

        <iframe
          key={iframeCount}
          ref={iframeRef}
          src="/?__edit=1"
          className="flex-1 w-full border-0"
          title="Site preview"
        />

        {/* Edit mode indicator */}
        <div className="absolute bottom-4 right-4 rounded-full bg-gold px-3 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-background shadow-lg pointer-events-none">
          Edit Mode
        </div>
      </div>
    </div>
  );
}
