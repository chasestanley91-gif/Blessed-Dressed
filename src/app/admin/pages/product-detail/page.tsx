"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProductDetailPage = { careInstructions: string; guaranteeText: string };
const DEFAULTS: ProductDetailPage = {
  careInstructions: "Dry clean only. Store hanging in a breathable garment bag. Avoid direct sunlight.",
  guaranteeText: "Every garment is backed by our craftsmanship guarantee. If something isn't right, we'll make it right.",
};

const lbl = "block font-sans text-[11px] uppercase tracking-[0.2em] text-muted-dark mb-1";
const area = "w-full rounded-lg border border-border-accent bg-surface-deep px-3 py-2 font-sans text-sm text-foreground outline-none focus:border-gold transition-colors resize-none";

export default function AdminProductDetailPageEditor() {
  const [form, setForm] = useState<ProductDetailPage>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.pages?.productDetail) setForm(s.pages.productDetail);
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
    const updated = { ...current, pages: { ...current.pages, productDetail: form } };
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
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 font-sans text-sm shadow-lg ${toast.ok ? "border-[#22C55E]/30 bg-[#0F3D2A] text-[#22C55E]" : "border-[#EF4444]/30 bg-[#5A1A1A] text-[#EF4444]"}`}>
          {toast.msg}
        </div>
      )}
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-gold">Admin · Products</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Product Page Defaults</h1>
            <p className="font-sans mt-1 text-sm text-muted-dark">These fields appear on every product page unless overridden per product.</p>
          </div>
          <Link href="/admin" className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">← Dashboard</Link>
        </div>

        <form onSubmit={save} className="rounded-2xl border border-border-accent bg-surface-strong p-6 space-y-5">
          <div>
            <label className={lbl}>Care Instructions</label>
            <textarea rows={3} className={area} value={form.careInstructions} onChange={(e) => setForm((f) => ({ ...f, careInstructions: e.target.value }))} />
            <p className="font-sans mt-1 text-[10px] text-slate">Shown on all product detail pages below the size selector.</p>
          </div>
          <div>
            <label className={lbl}>Guarantee Text</label>
            <textarea rows={3} className={area} value={form.guaranteeText} onChange={(e) => setForm((f) => ({ ...f, guaranteeText: e.target.value }))} />
            <p className="font-sans mt-1 text-[10px] text-slate">Shown in the guarantee section on product detail pages.</p>
          </div>
          <div className="pt-2 flex gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-gold px-6 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
            <Link href="/products" target="_blank" className="rounded-lg border border-border-accent px-6 py-2.5 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">
              View Products ↗
            </Link>
          </div>
        </form>

        <div className="rounded-2xl border border-border-accent bg-surface-strong p-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold mb-3">Where these appear</p>
          <ul className="font-sans text-xs text-muted-dark space-y-2 list-disc list-inside">
            <li>Care Instructions → product detail page, below size selector</li>
            <li>Guarantee Text → product detail page, guarantee section</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
