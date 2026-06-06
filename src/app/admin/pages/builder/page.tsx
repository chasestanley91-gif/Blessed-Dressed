"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CropModal from "@/components/admin/CropModal";
import { ImageBrowser, Toast, inp, lbl } from "@/components/admin/shared";

type BuilderCard = { id: string; label: string; description: string; image: string };
type BuilderPage = { heading: string; subtext: string; cards: BuilderCard[] };

const DEFAULT_CARDS: BuilderCard[] = [
  { id: "shirt",      label: "Bespoke Shirt",    description: "Collar, cuff, placket, pocket — every element crafted to your specification.",  image: "/images/builder-heroes/shirt.jpg" },
  { id: "trousers",   label: "Bespoke Trousers", description: "Pleat, rise, waistband, and cuff — precision tailored for your proportions.",    image: "/images/builder-heroes/trousers.jpg" },
  { id: "suit-2pc",   label: "2-Piece Suit",     description: "Jacket and trousers — lapel, canvas, lining, and vent engineered around you.",   image: "/images/builder-heroes/suit-2pc.jpg" },
  { id: "suit-3pc",   label: "3-Piece Suit",     description: "Jacket, trousers, and vest — the complete bespoke three-piece commission.",      image: "/images/builder-heroes/suit-3pc.jpg" },
  { id: "vest",       label: "Bespoke Vest",     description: "Button stance, neckline, pocket, and back — the complete waistcoat, your way.",  image: "/images/builder-heroes/vest.jpg" },
  { id: "sport-coat", label: "Sport Coat",       description: "Casual-refined jacket — patch pockets, elbow patches, and personal character.",  image: "/images/builder-heroes/sport-coat.jpg" },
];

const DEFAULTS: BuilderPage = {
  heading: "Begin your tailored journey.",
  subtext: "Choose a garment, select premium fabrics, and personalize every detail through our 7-step bespoke process.",
  cards: DEFAULT_CARDS,
};

export default function AdminBuilderPageEditor() {
  const [form, setForm] = useState<BuilderPage>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [cropTarget, setCropTarget] = useState<{ src: string; idx: number } | null>(null);
  const [imgBrowserOpen, setImgBrowserOpen] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.pages?.builder) {
          const cards = s.pages.builder.cards?.length ? s.pages.builder.cards : DEFAULT_CARDS;
          setForm({ ...DEFAULTS, ...s.pages.builder, cards });
        }
      });
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const settingsRes = await fetch("/api/admin/site-settings");
    const current = await settingsRes.json();
    const updated = { ...current, pages: { ...current.pages, builder: form } };
    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaving(false);
    if (res.ok) showToast("Saved", true);
    else showToast("Save failed", false);
  }

  function updateCard(i: number, patch: Partial<BuilderCard>) {
    setForm((f) => ({ ...f, cards: f.cards.map((c, ci) => ci === i ? { ...c, ...patch } : c) }));
  }

  function move(i: number, dir: -1 | 1) {
    const cards = [...form.cards];
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    [cards[i], cards[j]] = [cards[j], cards[i]];
    setForm((f) => ({ ...f, cards }));
  }

  async function uploadCardImage(i: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("imagePath", `builder-heroes/${file.name}`);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    if (res.ok) updateCard(i, { image: `/images/builder-heroes/${file.name}` });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-10">
      <Toast toast={toast} />

      {cropTarget && (
        <CropModal
          src={cropTarget.src}
          originalPath={cropTarget.src}
          onSave={(url) => { updateCard(cropTarget.idx, { image: url }); setCropTarget(null); }}
          onClose={() => setCropTarget(null)}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin · Pages</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Builder Selection Page</h1>
            <p className="font-sans text-xs text-slate mt-1">Edit labels, descriptions, and hero images for each garment card at <code className="text-gold">/builder</code></p>
          </div>
          <Link href="/admin" className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">← Dashboard</Link>
        </div>

        <form onSubmit={save} className="space-y-6">
          {/* Page hero text */}
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6 space-y-5">
            <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-gold">Page Hero</h2>
            <div>
              <label className={lbl}>Heading</label>
              <input className={inp} value={form.heading}
                onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Subtext</label>
              <textarea rows={2} className={inp + " resize-none"} value={form.subtext}
                onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))} />
            </div>
          </div>

          {/* Garment cards */}
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-gold">Garment Cards</h2>
              <p className="font-sans text-[10px] text-slate">Use ↑↓ to reorder</p>
            </div>
            <div className="space-y-4">
              {form.cards.map((card, i) => (
                <div key={card.id} className="rounded-xl border border-border-accent bg-background p-4">
                  <div className="flex gap-4">
                    {/* Image column */}
                    <div className="shrink-0 flex flex-col gap-1.5 w-24">
                      <div className="relative h-28 w-24 overflow-hidden rounded-lg border border-border-accent bg-surface-deep">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={card.image} alt={card.label} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-end justify-center gap-1 p-1 opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                          <button type="button"
                            onClick={() => fileRefs.current[i]?.click()}
                            className="rounded bg-border-accent px-1.5 py-1 font-sans text-[9px] text-white hover:bg-gold hover:text-background transition-colors">
                            Upload
                          </button>
                          {card.image && (
                            <button type="button"
                              onClick={() => setCropTarget({ src: card.image, idx: i })}
                              className="rounded bg-border-accent px-1.5 py-1 font-sans text-[9px] text-white hover:bg-gold hover:text-background transition-colors">
                              Crop
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        ref={(el) => { fileRefs.current[i] = el; }}
                        type="file" accept="image/*" title={`Upload image for ${card.label}`}
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCardImage(i, f); }}
                      />
                      {/* Browse library */}
                      <button type="button"
                        onClick={() => setImgBrowserOpen(imgBrowserOpen === i ? null : i)}
                        className="font-sans text-[9px] text-slate hover:text-gold transition-colors text-center">
                        {imgBrowserOpen === i ? "Close" : "Browse"}
                      </button>
                    </div>

                    {/* Text fields */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className={lbl}>Label</label>
                        <input className={inp} value={card.label} title={`Label for ${card.id}`} placeholder="Garment label"
                          onChange={(e) => updateCard(i, { label: e.target.value })} />
                      </div>
                      <div>
                        <label className={lbl}>Description</label>
                        <textarea rows={2} className={inp + " resize-none text-xs"} value={card.description} title={`Description for ${card.id}`} placeholder="Brief description…"
                          onChange={(e) => updateCard(i, { description: e.target.value })} />
                      </div>
                    </div>

                    {/* Reorder */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                        className="rounded border border-border-accent px-2 py-1.5 font-sans text-xs text-slate hover:text-foreground disabled:opacity-30 transition-colors"
                        aria-label="Move up">↑</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === form.cards.length - 1}
                        className="rounded border border-border-accent px-2 py-1.5 font-sans text-xs text-slate hover:text-foreground disabled:opacity-30 transition-colors"
                        aria-label="Move down">↓</button>
                    </div>
                  </div>

                  {/* Inline image browser for this card */}
                  {imgBrowserOpen === i && (
                    <div className="mt-3 pt-3 border-t border-border-accent">
                      <ImageBrowser
                        current={card.image}
                        onSelect={(path) => { updateCard(i, { image: path }); setImgBrowserOpen(null); }}
                        subfolder="builder-heroes"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-gold px-6 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40">
              {saving ? "Saving…" : "Save All"}
            </button>
            <Link href="/builder" target="_blank"
              className="rounded-lg border border-border-accent px-6 py-2.5 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">
              Preview ↗
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
