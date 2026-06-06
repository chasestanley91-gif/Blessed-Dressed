"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Primitives ─────────────────────────────────────────────────── */

export const inp =
  "w-full rounded-lg border border-border-accent bg-surface-deep px-3 py-2 font-sans text-xs text-foreground outline-none focus:border-gold transition-colors placeholder:text-dim";

export const lbl = "block font-sans text-[10px] uppercase tracking-[0.2em] text-muted-dark mb-1";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className={lbl}>{label}</p>
      {children}
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────── */

export function Toast({ toast }: { toast: { msg: string; ok: boolean } | null }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 font-sans text-sm shadow-lg ${
        toast.ok
          ? "border-[#22C55E]/30 bg-[#0F3D2A] text-[#22C55E]"
          : "border-[#EF4444]/30 bg-[#5A1A1A] text-[#EF4444]"
      }`}
    >
      {toast.msg}
    </div>
  );
}

/* ─── Focal point picker ─────────────────────────────────────────── */

export function FocalPointPicker({
  image,
  position,
  onChange,
}: {
  image: string;
  position: string;
  onChange: (pos: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
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
          className="h-full w-full object-cover brightness-75"
          style={{ objectPosition: position }}
          draggable={false}
        />
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_#000] transition-[left,top]"
          style={{ left: `${px}%`, top: `${py}%` }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "linear-gradient(var(--muted-dark) 1px,transparent 1px),linear-gradient(90deg,var(--muted-dark) 1px,transparent 1px)", backgroundSize: "33.3% 33.3%" }}
        />
      </div>
      <p className="font-sans text-[10px] text-muted-dark">
        Position: {px}% {py}%
      </p>
    </div>
  );
}

/* ─── Image browser ──────────────────────────────────────────────── */

type SiteImage = { path: string; dir: string; name: string };

const DIR_LABELS: Record<string, string> = {
  "builder-heroes": "Hero Photos",
  collections: "Collections",
  products: "Products",
  uploads: "Uploaded",
};

export function ImageBrowser({
  current,
  onSelect,
  subfolder,
}: {
  current: string;
  onSelect: (path: string) => void;
  subfolder?: string;
}) {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
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
    form.append("imagePath", `${subfolder ?? "uploads"}/${file.name}`);
    try {
      await fetch("/api/admin/upload-image", { method: "POST", body: form });
      const res = await fetch("/api/admin/images");
      const d: { images: SiteImage[] } = await res.json();
      setImages(d.images);
      onSelect(`/images/${subfolder ?? "uploads"}/${file.name}`);
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
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              aria-label="Upload image file"
              className="sr-only"
              onChange={upload}
            />
          </div>

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

      <div>
        <p className={`${lbl} mb-1`}>Or paste image URL / path</p>
        <input
          type="text"
          className={inp}
          value={current}
          onChange={(e) => onSelect(e.target.value)}
          placeholder="/images/... or https://..."
        />
      </div>
    </div>
  );
}
