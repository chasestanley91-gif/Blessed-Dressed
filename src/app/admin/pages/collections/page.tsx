"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Field, FocalPointPicker, ImageBrowser, Toast, inp } from "@/components/admin/shared";

type CollectionsPage = {
  heading: string;
  subtext: string;
  heroImage?: string;
  heroPosition?: string;
};

const DEFAULTS: CollectionsPage = {
  heading: "Collections",
  subtext: "Curated seasonal offerings, crafted for the discerning gentleman.",
  heroImage: "/images/builder-heroes/suit-2pc.jpg",
  heroPosition: "50% 50%",
};

export default function AdminCollectionsPageEditor() {
  const [form, setForm] = useState<CollectionsPage>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.pages?.collections) setForm({ ...DEFAULTS, ...s.pages.collections });
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
    const updated = { ...current, pages: { ...current.pages, collections: form } };
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
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">Collections Page</h1>
            <p className="font-sans text-xs text-slate mt-1">Controls the heading and banner image at <code className="text-gold">/collections</code></p>
          </div>
          <Link href="/admin" className="font-sans text-xs text-muted-dark hover:text-gold transition-colors">← Dashboard</Link>
        </div>

        <form onSubmit={save} className="space-y-6">
          {/* Page text */}
          <div className="rounded-2xl border border-border-accent bg-surface-strong p-6 space-y-5">
            <h2 className="font-sans text-xs uppercase tracking-[0.2em] text-gold">Page Copy</h2>
            <Field label="Page Heading">
              <input className={inp} value={form.heading} title="Page heading" placeholder="Collections"
                onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} />
            </Field>
            <Field label="Subtext">
              <textarea rows={3} className={inp + " resize-none"} value={form.subtext} title="Page subtext" placeholder="Curated seasonal offerings…"
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

          {/* Actions */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-gold px-6 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
            <Link href="/collections" target="_blank"
              className="rounded-lg border border-border-accent px-6 py-2.5 font-sans text-sm text-muted-dark hover:text-foreground transition-colors">
              Preview ↗
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
