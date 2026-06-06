"use client";

import { useEffect, useState } from "react";

type SiteContent = {
  heroHeadline: string;
  heroSubline: string;
  heroCtaLabel: string;
  aboutHeading: string;
  aboutBody: string;
  footerTagline: string;
};

const FIELDS: { key: keyof SiteContent; label: string; multiline?: boolean }[] = [
  { key: "heroHeadline", label: "Hero Headline" },
  { key: "heroSubline", label: "Hero Subline", multiline: true },
  { key: "heroCtaLabel", label: "Hero CTA Button Label" },
  { key: "aboutHeading", label: "About Section Heading" },
  { key: "aboutBody", label: "About Body Text", multiline: true },
  { key: "footerTagline", label: "Footer Tagline" },
];

export default function AdminContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch("/api/admin/content").then((r) => r.json()).then(setContent); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!content) return;
    await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inp = "w-full rounded-lg border border-[#1D3C62] bg-[#040E1A] px-3 py-2 font-sans text-sm text-[#F5F1E6] outline-none focus:border-[#D4AF37] transition-colors resize-none";
  const lbl = "block font-sans text-[11px] uppercase tracking-[0.2em] text-[#9B9180] mb-1";

  if (!content) return <div className="min-h-screen bg-[#071A2D] flex items-center justify-center"><p className="font-sans text-sm text-[#6A7A8C]">Loading…</p></div>;

  return (
    <div className="min-h-screen bg-[#071A2D] px-4 py-10 lg:px-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Admin</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.02em] text-[#F5F1E6]">Website Content</h1>
          <p className="font-sans mt-2 text-sm text-[#9B9180]">Edit the key text shown across the public site.</p>
        </div>

        <form onSubmit={save} className="rounded-2xl border border-[#1D3C62] bg-[#0B1B2E] p-6 space-y-5">
          {FIELDS.map(({ key, label, multiline }) => (
            <div key={key}>
              <label className={lbl}>{label}</label>
              {multiline ? (
                <textarea rows={3} className={inp} value={content[key]} onChange={(e) => setContent((c) => c ? { ...c, [key]: e.target.value } : c)} title={label} />
              ) : (
                <input className={inp} value={content[key]} onChange={(e) => setContent((c) => c ? { ...c, [key]: e.target.value } : c)} title={label} />
              )}
            </div>
          ))}
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="rounded-lg bg-[#D4AF37] px-6 py-2.5 font-sans text-sm font-semibold text-[#071A2D] hover:opacity-90 transition-opacity">Save Changes</button>
            {saved && <span className="font-sans text-xs text-emerald-400">Saved ✓</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
