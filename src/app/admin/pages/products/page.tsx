"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Field, FocalPointPicker, ImageBrowser, Toast, inp, lbl } from "@/components/admin/shared";

const TILE_SHAPES = [
  { label: "Square",    value: "1/1",  cls: "tile-aspect-sq" },
  { label: "Portrait",  value: "3/4",  cls: "tile-aspect-pt" },
  { label: "Landscape", value: "4/3",  cls: "tile-aspect-ls" },
  { label: "Wide",      value: "16/9", cls: "tile-aspect-wd" },
];

type ProductsPage = {
  heading: string;
  subtext: string;
  heroImage?: string;
  heroPosition?: string;
  defaultTileAspect?: string;
};

const DEFAULTS: ProductsPage = {
  heading: "Ready to Wear",
  subtext: "Premium garments, ready when you are.",
  heroImage: "/images/builder-heroes/suit-2pc.jpg",
  heroPosition: "50% 50%",
  defaultTileAspect: "3/4",
};

export default function AdminProductsPageEditor() {
  const [form, setForm] = useState<ProductsPage>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.pages?.products) setForm({ ...DEFAULTS, ...s.pages.products });
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
    const updated = { ...current, pages: { ...current.pages, products: form } };
    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaving(false);
    if (res.ok) showToast("Saved", true);
    else showToast("Save failed", false);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 lg:px-10">
      <Toast toast={toast} />

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin · Pages</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Products Page</h1>
            <p className="font-sans text-xs text-slate mt-1">Controls the heading, banner image, and default tile shape at <code className="text-gold">/products</code></p>
          </div>
          <Link href="/admin" className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">← Dashboard</Link>
        </div>

        <form onSubmit={save} className="space-y-6">
          {/* Page text */}
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6 space-y-5">
            <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-gold">Page Copy</h2>
            <Field label="Page Heading">
              <input className={inp} value={form.heading} title="Page heading" placeholder="Ready to Wear"
                onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} />
            </Field>
            <Field label="Subtext">
              <textarea rows={3} className={inp + " resize-none"} value={form.subtext} title="Page subtext" placeholder="Premium garments, ready when you are."
                onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))} />
            </Field>
          </div>

          {/* Hero image */}
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6 space-y-5">
            <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-gold">Hero / Banner Image</h2>
            <Field label="Image">
              <ImageBrowser
                current={form.heroImage ?? ""}
                onSelect={(path) => setForm((f) => ({ ...f, heroImage: path }))}
                subfolder="uploads"
              />
            </Field>
            {form.heroImage && (
              <FocalPointPicker
                image={form.heroImage}
                position={form.heroPosition ?? "50% 50%"}
                onChange={(pos) => setForm((f) => ({ ...f, heroPosition: pos }))}
              />
            )}
          </div>

          {/* Default tile shape */}
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6 space-y-4">
            <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-gold">Default Product Tile Shape</h2>
            <p className="font-sans text-xs text-muted-dark">The grid card aspect ratio for products that have no individual tile shape set.</p>
            <div className="flex flex-wrap gap-2">
              {TILE_SHAPES.map((s) => (
                <button key={s.value} type="button"
                  onClick={() => setForm((f) => ({ ...f, defaultTileAspect: s.value }))}
                  className={`rounded-lg px-4 py-2 font-sans text-xs font-semibold border transition-colors ${(form.defaultTileAspect ?? "3/4") === s.value ? "border-gold bg-gold/10 text-gold" : "border-border-accent text-muted-dark hover:text-foreground"}`}>
                  {s.label}
                </button>
              ))}
            </div>
            {/* Preview strip */}
            <div className="flex items-end gap-3 mt-1">
              {TILE_SHAPES.map((s) => (
                <div key={s.value} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-12 overflow-hidden rounded border transition-colors ${(form.defaultTileAspect ?? "3/4") === s.value ? "border-gold" : "border-border-accent"} bg-surface-deep ${s.cls}`}
                  />
                  <span className="font-sans text-[8px] text-slate">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-gold px-6 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
            <Link href="/products" target="_blank"
              className="rounded-lg border border-border-accent px-6 py-2.5 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">
              Preview ↗
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
