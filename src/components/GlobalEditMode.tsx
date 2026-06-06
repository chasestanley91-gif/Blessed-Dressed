"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type SiteImage = { path: string; dir: string; name: string };
type ImageInfo = { originalSrc: string; currentSrc: string; el: HTMLImageElement };

const DIR_LABELS: Record<string, string> = {
  "builder-heroes": "Hero Photos",
  collections: "Collections",
  products: "Products",
  uploads: "Uploaded",
};

const MODAL_INP =
  "w-full rounded-lg border border-border-accent bg-surface-deep px-3 py-2 font-sans text-xs text-foreground outline-none focus:border-gold transition-colors placeholder:text-dim";

export default function GlobalEditMode() {
  const [isIframe, setIsIframe] = useState(false);
  useEffect(() => { setIsIframe(window !== window.parent); }, []);
  if (isIframe) return null;
  return <GlobalEditModeInner />;
}

function GlobalEditModeInner() {
  const [editMode, setEditMode] = useState(false);
  const [modal, setModal] = useState<ImageInfo | null>(null);
  const [newSrc, setNewSrc] = useState("");
  const [newPos, setNewPos] = useState("50% 50%");
  const [newZoom, setNewZoom] = useState(1);
  const [images, setImages] = useState<SiteImage[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  /* ── Load image library once ─────────────────────────────────── */
  useEffect(() => {
    fetch("/api/admin/images")
      .then((r) => r.json())
      .then((d: { images: SiteImage[] }) => setImages(d.images))
      .catch(() => {});
  }, []);

  /* ── Inject / remove edit-mode CSS ──────────────────────────── */
  useEffect(() => {
    if (editMode) {
      const s = document.createElement("style");
      s.setAttribute("data-bd-admin", "1");
      s.textContent = `
        [data-bd-editable] {
          outline: 2px dashed rgba(212,175,55,0.45) !important;
          outline-offset: 3px;
          cursor: pointer !important;
          transition: outline 0.12s;
        }
        [data-bd-editable]:hover {
          outline: 2px solid #D4AF37 !important;
          outline-offset: 3px;
        }
      `;
      document.head.appendChild(s);
      styleRef.current = s;
    } else {
      styleRef.current?.remove();
      styleRef.current = null;
    }
    return () => { styleRef.current?.remove(); };
  }, [editMode]);

  /* ── Tag all qualifying images ───────────────────────────────── */
  const tagImages = useCallback(() => {
    document.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      if (img.getAttribute("data-bd-editable")) return;
      if (img.closest("[data-bd-admin]")) return;
      // skip tiny UI icons / logos under 60px on either side
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 60 && rect.height < 60) return;
      img.setAttribute("data-bd-editable", "1");
      // record the canonical original src once
      if (!img.getAttribute("data-bd-original")) {
        // strip the host so we store a root-relative path when possible
        const raw = img.getAttribute("src") || img.src;
        const relative = raw.startsWith("http")
          ? new URL(raw).pathname
          : raw;
        img.setAttribute("data-bd-original", relative);
      }
    });
  }, []);

  /* ── Set up / tear down edit mode ────────────────────────────── */
  useEffect(() => {
    if (!editMode) {
      document
        .querySelectorAll("[data-bd-editable]")
        .forEach((el) => el.removeAttribute("data-bd-editable"));
      return;
    }

    tagImages();

    const observer = new MutationObserver(tagImages);
    observer.observe(document.body, { childList: true, subtree: true });

    function handleClick(e: MouseEvent) {
      const img = (e.target as Element).closest(
        "[data-bd-editable]"
      ) as HTMLImageElement | null;
      if (!img) return;
      e.preventDefault();
      e.stopPropagation();
      const original =
        img.getAttribute("data-bd-original") ||
        new URL(img.src).pathname;
      setModal({ originalSrc: original, currentSrc: img.src, el: img });
      setNewSrc(img.getAttribute("data-bd-original") || img.src);
      setNewPos("50% 50%");
      // Pre-populate zoom from existing inline style
      const existingScale = img.style.transform.match(/scale\(([\d.]+)\)/);
      setNewZoom(existingScale ? parseFloat(existingScale[1]) : 1);
      setSearch("");
      setSaved(false);
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
      document
        .querySelectorAll("[data-bd-editable]")
        .forEach((el) => el.removeAttribute("data-bd-editable"));
    };
  }, [editMode, tagImages]);

  /* ── Focal point click ───────────────────────────────────────── */
  function handleFocalClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = fpRef.current!.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setNewPos(`${x}% ${y}%`);
  }

  /* ── Upload ──────────────────────────────────────────────────── */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("imagePath", `uploads/${file.name}`);
    try {
      await fetch("/api/admin/upload-image", { method: "POST", body: form });
      const res = await fetch("/api/admin/images");
      const d: { images: SiteImage[] } = await res.json();
      setImages(d.images);
      setNewSrc(`/images/uploads/${file.name}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /* ── Save override ───────────────────────────────────────────── */
  async function saveChange() {
    if (!modal || !newSrc) return;
    setSaving(true);
    try {
      // Update the DOM immediately so the change is visible right now
      modal.el.src = newSrc;
      (modal.el as HTMLElement).style.objectPosition = newPos;
      (modal.el as HTMLElement).style.transform =
        newZoom !== 1 ? `scale(${newZoom})` : "";
      // Persist
      await fetch("/api/admin/image-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original: modal.originalSrc,
          replacement: newSrc,
          position: newPos,
          zoom: newZoom,
        }),
      });
      setSaved(true);
      setTimeout(() => {
        setModal(null);
        setSaved(false);
      }, 900);
    } finally {
      setSaving(false);
    }
  }

  /* ── Filtered image list ─────────────────────────────────────── */
  const filtered = images.filter(
    (img) =>
      img.name.toLowerCase().includes(search.toLowerCase()) ||
      img.dir.toLowerCase().includes(search.toLowerCase())
  );
  const byDir = filtered.reduce<Record<string, SiteImage[]>>((acc, img) => {
    (acc[img.dir] ??= []).push(img);
    return acc;
  }, {});

  // Parse focal point percentages
  const fp = newPos.split(" ");
  const fpx = parseFloat(fp[0]) || 50;
  const fpy = parseFloat(fp[1]) || 50;

  return (
    <>
      {/* ── Floating admin toolbar ─────────────────────────────── */}
      <div
        data-bd-admin="1"
        className="fixed bottom-5 left-5 z-[9998] flex items-center gap-3 rounded-full border border-border-accent bg-background/95 px-4 py-2.5 shadow-[0_4px_32px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      >
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-dark">
          Edit Images
        </span>
        {/* Toggle */}
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          aria-pressed={editMode}
          aria-label={editMode ? "Disable image editing" : "Enable image editing"}
          className={`relative h-5 w-10 rounded-full transition-colors ${
            editMode ? "bg-gold" : "bg-border-accent"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              editMode ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
        {editMode && (
          <span className="font-sans text-[10px] text-gold">
            Click any image
          </span>
        )}
      </div>

      {/* ── Replace Image modal ────────────────────────────────── */}
      {modal && (
        <div
          data-bd-admin="1"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-accent bg-background">

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border-accent px-5 py-4">
              <div className="min-w-0">
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-gold">
                  Replace Image
                </p>
                <p className="mt-0.5 truncate font-sans text-[11px] text-muted-dark">
                  {modal.originalSrc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="ml-4 shrink-0 text-lg leading-none text-muted-dark hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">

              {/* ── Focal point / crop ─────────────────────────── */}
              <div>
                <p className="mb-2 font-sans text-[10px] uppercase tracking-[0.2em] text-muted-dark">
                  Crop / Focal Point — click to set
                </p>
                <div
                  ref={fpRef}
                  onClick={handleFocalClick}
                  className="relative h-52 w-full cursor-crosshair select-none overflow-hidden rounded-xl border border-border-accent"
                >
                  <img
                    src={newSrc || modal.currentSrc}
                    alt=""
                    className="focal-img h-full w-full object-cover brightness-[0.78]"
                    style={{ "--focal-pos": newPos } as React.CSSProperties}
                    draggable={false}
                  />
                  {/* crosshair */}
                  <div
                    className="focal-dot pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.7)]"
                    style={{
                      "--focal-x": `${fpx}%`,
                      "--focal-y": `${fpy}%`,
                    } as React.CSSProperties}
                  />
                  <div className="focal-grid pointer-events-none absolute inset-0" />
                  <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 font-sans text-[9px] text-white">
                    {fpx}% · {fpy}%
                  </span>
                </div>
              </div>

              {/* ── Zoom ──────────────────────────────────────── */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-dark">
                    Zoom
                  </p>
                  <span className="font-sans text-[10px] tabular-nums text-gold">
                    {newZoom.toFixed(2)}×
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={newZoom}
                  onChange={(e) => setNewZoom(parseFloat(e.target.value))}
                  className="w-full accent-gold"
                  aria-label="Image zoom"
                />
                <div className="mt-1 flex justify-between font-sans text-[9px] text-dim">
                  <span>0.5×&nbsp;zoom out</span>
                  <span>1×</span>
                  <span>zoom in&nbsp;2×</span>
                </div>
              </div>

              {/* ── Image browser ──────────────────────────────── */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <p className="flex-1 font-sans text-[10px] uppercase tracking-[0.2em] text-muted-dark">
                    Choose Image
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="rounded-md bg-border-accent px-3 py-1 font-sans text-[10px] text-foreground transition-colors hover:bg-gold hover:text-background disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : "↑ Upload new"}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    aria-label="Upload image file"
                    className="sr-only"
                    onChange={handleUpload}
                  />
                </div>

                <input
                  type="text"
                  className={`${MODAL_INP} mb-3`}
                  placeholder="Search by name or folder…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                  {Object.entries(byDir).map(([dir, imgs]) => (
                    <div key={dir}>
                      <p className="mb-1.5 font-sans text-[9px] uppercase tracking-[0.15em] text-gold">
                        {DIR_LABELS[dir] ?? dir}
                      </p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {imgs.map((img) => (
                          <button
                            key={img.path}
                            type="button"
                            title={img.name}
                            onClick={() => setNewSrc(img.path)}
                            className={`relative aspect-[4/3] overflow-hidden rounded border-2 transition-colors ${
                              newSrc === img.path
                                ? "border-gold"
                                : "border-transparent hover:border-gold/50"
                            }`}
                          >
                            <img
                              src={img.path}
                              alt={img.name}
                              className="h-full w-full object-cover object-top brightness-75"
                            />
                            {newSrc === img.path && (
                              <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[7px] font-bold text-background">
                                ✓
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="py-4 text-center font-sans text-xs text-dim">
                      No images found
                    </p>
                  )}
                </div>

                <div className="mt-3">
                  <p className="mb-1 font-sans text-[10px] text-muted-dark">
                    Or paste a URL / path directly
                  </p>
                  <input
                    type="text"
                    className={MODAL_INP}
                    value={newSrc}
                    onChange={(e) => setNewSrc(e.target.value)}
                    placeholder="/images/... or https://..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border-accent px-5 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="font-sans text-xs text-muted-dark hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveChange}
                disabled={saving || !newSrc}
                className={`rounded-xl px-6 py-2 font-sans text-xs font-semibold transition-colors disabled:opacity-40 ${
                  saved
                    ? "bg-[#22C55E]/20 text-[#22C55E]"
                    : "bg-gold text-background hover:opacity-90"
                }`}
              >
                {saved ? "Saved ✓" : saving ? "Saving…" : "Replace Image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
