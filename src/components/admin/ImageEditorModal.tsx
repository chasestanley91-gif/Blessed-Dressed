"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import type { DesignOption } from "@/data/options/types";
import { ImageGrid, type SiteImage } from "./shared";

export type ImageSlot = "image" | "aiImage" | "realImage";

const SLOT_META: Record<ImageSlot, { label: string; folder: (opt: DesignOption) => string }> = {
  image: { label: "Illustration", folder: (opt) => opt.id.split("-")[0] },
  aiImage: { label: "AI Render", folder: () => "ai" },
  realImage: { label: "Real Photo", folder: () => "real" },
};

const ASPECT_OPTIONS = [
  { label: "Square", value: 1 },
  { label: "Portrait", value: 3 / 4 },
  { label: "Landscape", value: 4 / 3 },
  { label: "Wide", value: 16 / 9 },
  { label: "Free", value: undefined },
] as const;

const PRODUCT_CATEGORY: Record<string, string> = {
  "suit-2pc": "jacket",
  "suit-3pc": "jacket",
  "sport-coat": "jacket",
  shirt: "shirt",
  trousers: "trousers",
  vest: "vest",
};

function centerAspectCrop(imgWidth: number, imgHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, imgWidth, imgHeight),
    imgWidth,
    imgHeight
  );
}

function filterString(b: number, c: number, s: number) {
  return `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
}

function isSvg(path: string) {
  return path.split("?")[0].toLowerCase().endsWith(".svg");
}

/** Re-draw the original image rotated by `turns` quarter-turns; returns an object URL. */
async function bakeRotation(img: HTMLImageElement, turns: number): Promise<string> {
  const canvas = document.createElement("canvas");
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const odd = turns % 2 === 1;
  canvas.width = odd ? h : w;
  canvas.height = odd ? w : h;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((turns * Math.PI) / 2);
  ctx.drawImage(img, -w / 2, -h / 2);
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(URL.createObjectURL(blob!)), "image/png")
  );
}

/** Crop + filter + downscale the working image to a JPEG blob. */
async function exportEdited(
  img: HTMLImageElement,
  pixelCrop: PixelCrop,
  filter: string
): Promise<Blob | null> {
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  let outW = Math.round(pixelCrop.width * scaleX);
  let outH = Math.round(pixelCrop.height * scaleY);
  const MAX_EDGE = 1600;
  const scale = Math.min(1, MAX_EDGE / Math.max(outW, outH));
  outW = Math.round(outW * scale);
  outH = Math.round(outH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (typeof ctx.filter === "string") ctx.filter = filter;
  ctx.drawImage(
    img,
    Math.round(pixelCrop.x * scaleX),
    Math.round(pixelCrop.y * scaleY),
    Math.round(pixelCrop.width * scaleX),
    Math.round(pixelCrop.height * scaleY),
    0, 0, outW, outH
  );
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

type Source =
  | { kind: "current"; path: string }
  | { kind: "upload"; file: File; objectUrl: string }
  | { kind: "candidate"; path: string }
  | { kind: "library"; path: string };

export default function ImageEditorModal({
  opt,
  productId,
  initialSlot,
  onApply,
  onClose,
}: {
  opt: DesignOption;
  productId: string;
  initialSlot: ImageSlot;
  onApply: (patch: Partial<DesignOption>) => void;
  onClose: () => void;
}) {
  const [slot, setSlot] = useState<ImageSlot>(initialSlot);
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState<string | null>(null); // candidate url being imported
  const [dragOver, setDragOver] = useState(false);

  // ── working image (what ReactCrop displays) ──
  const originalImgRef = useRef<HTMLImageElement | null>(null); // unrotated source bitmap
  const [workingSrc, setWorkingSrc] = useState<string | null>(null);
  const [quarterTurns, setQuarterTurns] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(4 / 3);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ── library ──
  const [library, setLibrary] = useState<SiteImage[]>([]);
  const category = PRODUCT_CATEGORY[productId] ?? "jacket";

  const currentPath = opt[slot];
  const filter = filterString(brightness, contrast, saturation);
  const editable = !!workingSrc && slot !== "image" && !(source && isSvg(sourcePath(source) ?? ""));

  function sourcePath(s: Source): string | null {
    return s.kind === "upload" ? s.objectUrl : s.path;
  }

  // load the library once
  useEffect(() => {
    const dirs = [`generated/${category}`, "real", "ai", "uploads"].join(",");
    fetch(`/api/admin/images?dirs=${encodeURIComponent(dirs)}`)
      .then((r) => r.json())
      .then((d: { images: SiteImage[] }) => setLibrary(d.images))
      .catch(() => {});
  }, [category]);

  // select the slot's current image whenever the slot changes
  useEffect(() => {
    // Slot change must clear the previous slot's error before reselecting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    if (currentPath && currentPath.startsWith("/")) {
      selectSource({ kind: "current", path: currentPath });
    } else {
      setSource(null);
      setWorkingSrc(null);
      originalImgRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  /** Load a source into the editor, resetting all edits. */
  const selectSource = useCallback((s: Source) => {
    setSource(s);
    setQuarterTurns(0);
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setPreviewUrl(null);
    const src = s.kind === "upload" ? s.objectUrl : s.path;
    const img = new Image();
    img.onload = () => {
      originalImgRef.current = img;
      setWorkingSrc(src);
    };
    img.onerror = () => setError("Could not load that image.");
    img.src = src;
  }, []);

  // rotate: re-bake from the original bitmap (no generational loss)
  async function rotate(delta: 1 | -1) {
    if (!originalImgRef.current) return;
    const next = (((quarterTurns + delta) % 4) + 4) % 4;
    setQuarterTurns(next);
    if (next === 0) {
      setWorkingSrc(source ? sourcePath(source) : null);
    } else {
      setWorkingSrc(await bakeRotation(originalImgRef.current, next));
    }
    setCrop(undefined);
    setCompletedCrop(undefined);
    setZoom(1);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    if (aspect) setCrop(centerAspectCrop(width, height, aspect));
  }

  function changeAspect(val: number | undefined) {
    setAspect(val);
    setZoom(1);
    if (val && imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, val));
    }
  }

  /** Zoom by shrinking the crop box around its current center. */
  function changeZoom(z: number) {
    setZoom(z);
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    const base = aspect
      ? centerAspectCrop(width, height, aspect)
      : ({ unit: "%", x: 5, y: 5, width: 90, height: 90 } as Crop);
    const baseW = ((base.width ?? 90) / 100) * width;
    const baseH = ((base.height ?? 90) / 100) * height;
    const w = baseW / z;
    const h = baseH / z;
    // keep the current crop's center
    const prev = crop && crop.unit === "%" ? crop : base;
    const cx = (((prev.x ?? 5) + (prev.width ?? 90) / 2) / 100) * width;
    const cy = (((prev.y ?? 5) + (prev.height ?? 90) / 2) / 100) * height;
    const x = Math.min(Math.max(cx - w / 2, 0), width - w);
    const y = Math.min(Math.max(cy - h / 2, 0), height - h);
    setCrop({
      unit: "%",
      x: (x / width) * 100,
      y: (y / height) * 100,
      width: (w / width) * 100,
      height: (h / height) * 100,
    });
  }

  // live card preview: redraw the cropped region (unfiltered; CSS filter goes on the <img>)
  useEffect(() => {
    if (!editable || !completedCrop || !imgRef.current) return;
    const t = setTimeout(() => {
      const img = imgRef.current!;
      const canvas = document.createElement("canvas");
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      canvas.width = Math.max(1, Math.round(completedCrop.width * scaleX));
      canvas.height = Math.max(1, Math.round(completedCrop.height * scaleY));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(
        img,
        Math.round(completedCrop.x * scaleX),
        Math.round(completedCrop.y * scaleY),
        Math.round(completedCrop.width * scaleX),
        Math.round(completedCrop.height * scaleY),
        0, 0, canvas.width, canvas.height
      );
      setPreviewUrl(canvas.toDataURL("image/jpeg", 0.85));
    }, 100);
    return () => clearTimeout(t);
  }, [completedCrop, workingSrc, editable]);

  // ── actions ──────────────────────────────────────────────────────

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    selectSource({ kind: "upload", file, objectUrl: URL.createObjectURL(file) });
  }

  async function importCandidate(url: string) {
    setImporting(url);
    setError(null);
    try {
      const res = await fetch("/api/admin/import-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, imagePath: `real/${opt.id}-src-${Date.now()}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      selectSource({ kind: "candidate", path: data.path });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(null);
    }
  }

  async function uploadBlob(blob: Blob, ext: string): Promise<string> {
    const folder = SLOT_META[slot].folder(opt);
    const imagePath = `${folder}/${opt.id}-${Date.now()}${ext}`;
    const fd = new FormData();
    fd.append("file", new File([blob], imagePath.split("/").pop()!, { type: blob.type }));
    fd.append("imagePath", imagePath);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return `/images/${imagePath}`;
  }

  async function applyAndSave() {
    if (!imgRef.current || !completedCrop) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await exportEdited(imgRef.current, completedCrop, filter);
      if (!blob) throw new Error("Could not process image");
      const path = await uploadBlob(blob, ".jpg");
      onApply({ [slot]: path } as Partial<DesignOption>);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function useAsIs() {
    if (!source) return;
    setSaving(true);
    setError(null);
    try {
      let path: string;
      if (source.kind === "upload") {
        const ext = source.file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".jpg";
        path = await uploadBlob(source.file, ext.toLowerCase());
      } else {
        path = source.path;
      }
      onApply({ [slot]: path } as Partial<DesignOption>);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function removePhoto() {
    onApply({ [slot]: undefined } as Partial<DesignOption>);
    onClose();
  }

  // ── styling shorthands (match CropModal / admin chrome) ─────────
  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
      active ? "bg-gold text-background" : "border border-border-accent text-muted-dark hover:text-foreground"
    }`;
  const railHead = "font-sans text-[9px] uppercase tracking-[0.2em] text-gold mb-1.5";
  const slider = "w-full accent-gold";

  const candidates = useMemo(() => (opt.images ?? []).slice(0, 12), [opt.images]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-border-accent bg-surface-strong shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border-accent px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground truncate">
            Edit Image — <span className="text-gold">{opt.label}</span>
          </h2>
          <div className="flex items-center gap-2">
            {(Object.keys(SLOT_META) as ImageSlot[]).map((s) => (
              <button key={s} type="button" onClick={() => setSlot(s)} className={chip(slot === s)}>
                {SLOT_META[s].label}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              className="ml-3 font-sans text-lg text-muted-dark hover:text-foreground transition-colors leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body: source rail | adjust & crop | card preview */}
        <div className="flex flex-1 min-h-0">
          {/* ── Source rail ── */}
          <div className="w-64 shrink-0 overflow-y-auto border-r border-border-accent bg-surface-deep p-3 space-y-4">
            {/* Current */}
            <div>
              <p className={railHead}>Current</p>
              {currentPath ? (
                <button
                  type="button"
                  onClick={() => currentPath.startsWith("/") && selectSource({ kind: "current", path: currentPath })}
                  className={`w-full overflow-hidden rounded-lg border-2 bg-white transition-colors ${
                    source?.kind === "current" ? "border-gold" : "border-transparent hover:border-gold/50"
                  }`}
                >
                  <img src={currentPath} alt="current" className="h-24 w-full object-contain" />
                </button>
              ) : (
                <p className="font-sans text-[10px] text-dim">No {SLOT_META[slot].label.toLowerCase()} set</p>
              )}
            </div>

            {/* Upload */}
            <div>
              <p className={railHead}>Upload</p>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                className={`flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors ${
                  dragOver ? "border-gold bg-gold/10" : "border-border-accent hover:border-gold/50"
                }`}
              >
                <span className="font-sans text-[10px] text-muted-dark">Drop image here</span>
                <span className="font-sans text-[10px] text-gold">or click to browse</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />
              </label>
            </div>

            {/* Candidates */}
            {candidates.length > 0 && (
              <div>
                <p className={railHead}>Candidates ({candidates.length})</p>
                <p className="font-sans text-[9px] text-dim mb-1.5">Click to import a local copy</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {candidates.map((url) => (
                    <button
                      key={url}
                      type="button"
                      disabled={importing !== null}
                      onClick={() => importCandidate(url)}
                      className={`relative aspect-[4/3] overflow-hidden rounded border-2 transition-colors ${
                        importing === url ? "border-gold" : "border-transparent hover:border-gold/50"
                      }`}
                      title={url}
                    >
                      <img
                        src={url}
                        alt="candidate"
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.opacity = "0.3";
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {importing === url && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/60 font-sans text-[9px] text-gold">
                          Importing…
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Library */}
            <div>
              <p className={railHead}>Library</p>
              <div className="rounded-lg border border-border-accent overflow-hidden -mx-1">
                <ImageGrid
                  images={library}
                  current={source && source.kind !== "upload" ? source.path : undefined}
                  onSelect={(path) => selectSource({ kind: "library", path })}
                  initialSearch={opt.id}
                  maxHeightClass="max-h-56"
                />
              </div>
            </div>
          </div>

          {/* ── Adjust & crop ── */}
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            {!workingSrc && (
              <div className="flex flex-1 items-center justify-center p-10">
                <p className="font-sans text-sm text-dim">Pick a source on the left to get started.</p>
              </div>
            )}

            {workingSrc && !editable && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
                <div className="max-h-[45vh] overflow-hidden rounded-lg bg-white p-4">
                  <img src={workingSrc} alt="preview" className="max-h-[40vh] max-w-full object-contain" />
                </div>
                <p className="font-sans text-xs text-muted-dark text-center max-w-sm">
                  {slot === "image"
                    ? "Illustrations are replaced, not edited — pick a new file or library image, then Use As-Is."
                    : "SVG images can't be cropped or adjusted — use Use As-Is to assign it."}
                </p>
              </div>
            )}

            {workingSrc && editable && (
              <>
                {/* toolbar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-border-accent px-4 py-3">
                  {ASPECT_OPTIONS.map((o) => (
                    <button key={o.label} type="button" onClick={() => changeAspect(o.value)} className={chip(aspect === o.value)}>
                      {o.label}
                    </button>
                  ))}
                  <span className="mx-1 h-5 w-px bg-border-accent" />
                  <button type="button" onClick={() => rotate(-1)} className={chip(false)} title="Rotate left">⟲ 90°</button>
                  <button type="button" onClick={() => rotate(1)} className={chip(false)} title="Rotate right">⟳ 90°</button>
                  <span className="mx-1 h-5 w-px bg-border-accent" />
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="font-sans text-[10px] text-muted-dark">Zoom</span>
                    <input
                      type="range" min={1} max={4} step={0.05} value={zoom}
                      onChange={(e) => changeZoom(parseFloat(e.target.value))}
                      className={slider} aria-label="Zoom"
                    />
                    <span className="font-mono text-[10px] text-muted-dark w-8">{zoom.toFixed(1)}x</span>
                  </div>
                </div>

                {/* crop area */}
                <div className="flex flex-1 items-start justify-center overflow-auto bg-surface-deep p-6">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    minWidth={10}
                    minHeight={10}
                  >
                    <img
                      ref={imgRef}
                      src={workingSrc}
                      alt="Edit"
                      onLoad={onImageLoad}
                      style={{ filter }}
                      className="max-h-[46vh] max-w-full object-contain"
                    />
                  </ReactCrop>
                </div>

                {/* adjustment sliders */}
                <div className="grid grid-cols-3 gap-4 border-t border-border-accent px-6 py-3">
                  {([
                    ["Brightness", brightness, setBrightness],
                    ["Contrast", contrast, setContrast],
                    ["Saturation", saturation, setSaturation],
                  ] as const).map(([label, value, setter]) => (
                    <div key={label}>
                      <div className="flex justify-between">
                        <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-dark">{label}</span>
                        <span className="font-mono text-[10px] text-muted-dark">{value}%</span>
                      </div>
                      <input
                        type="range" min={50} max={150} step={1} value={value}
                        onChange={(e) => setter(parseInt(e.target.value))}
                        className={slider} aria-label={label}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Card preview ── */}
          <div className="w-72 shrink-0 overflow-y-auto border-l border-border-accent bg-surface-deep p-4 space-y-4">
            <p className={railHead}>Builder Card Preview</p>
            {[
              { h: "h-20", note: "Resting" },
              { h: "h-40", note: "Hover" },
            ].map(({ h, note }) => (
              <div key={h}>
                <p className="font-sans text-[9px] text-dim mb-1">{note}</p>
                <div className="w-60 overflow-hidden rounded-2xl border border-border-accent bg-surface-strong">
                  <div className={`${h} w-full overflow-hidden rounded-t-[calc(1rem-1px)] bg-white`}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="card preview" style={{ filter }} className="h-full w-full object-cover" />
                    ) : workingSrc && !editable ? (
                      <img src={workingSrc} alt="card preview" className="h-full w-full object-contain" />
                    ) : (
                      <div className="h-full w-full bg-border-accent/40" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-sans text-xs font-semibold text-foreground truncate">{opt.label}</p>
                    <p className="font-sans text-[10px] text-muted-dark line-clamp-2 mt-0.5">{opt.description}</p>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => source && selectSource(source)}
              className="w-full rounded-lg border border-border-accent px-3 py-1.5 font-sans text-[10px] text-muted-dark hover:text-foreground transition-colors"
            >
              Reset all edits
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-border-accent px-6 py-4">
          <button
            type="button"
            onClick={applyAndSave}
            disabled={saving || !editable || !completedCrop}
            className="rounded-lg bg-gold px-6 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving…" : "Apply & Save"}
          </button>
          <button
            type="button"
            onClick={useAsIs}
            disabled={saving || !source}
            className="rounded-lg border border-gold/40 px-5 py-2.5 font-sans text-sm text-gold hover:bg-gold/10 transition-colors disabled:opacity-40"
          >
            Use As-Is
          </button>
          {currentPath && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={saving}
              className="rounded-lg border border-[#EF4444]/30 px-5 py-2.5 font-sans text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors disabled:opacity-40"
            >
              Remove
            </button>
          )}
          {error && <span className="font-sans text-xs text-[#EF4444]">{error}</span>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-border-accent px-6 py-2.5 font-sans text-sm text-muted-dark hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
