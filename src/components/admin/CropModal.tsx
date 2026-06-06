"use client";

import { useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";

const ASPECT_OPTIONS = [
  { label: "Square", value: 1, tw: "1/1" },
  { label: "Portrait", value: 3 / 4, tw: "3/4" },
  { label: "Landscape", value: 4 / 3, tw: "4/3" },
  { label: "Wide", value: 16 / 9, tw: "16/9" },
  { label: "Free", value: undefined, tw: "free" },
] as const;

function centerAspectCrop(imgWidth: number, imgHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, imgWidth, imgHeight),
    imgWidth,
    imgHeight
  );
}

async function cropToBlob(img: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  canvas.width = Math.round(pixelCrop.width * scaleX);
  canvas.height = Math.round(pixelCrop.height * scaleY);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(
    img,
    Math.round(pixelCrop.x * scaleX),
    Math.round(pixelCrop.y * scaleY),
    Math.round(pixelCrop.width * scaleX),
    Math.round(pixelCrop.height * scaleY),
    0, 0,
    canvas.width, canvas.height
  );
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

export default function CropModal({
  src,
  originalPath,
  onSave,
  onClose,
}: {
  src: string;
  originalPath: string;
  onSave: (newUrl: string) => void;
  onClose: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [saving, setSaving] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    if (aspect) setCrop(centerAspectCrop(width, height, aspect));
  }

  function changeAspect(val: number | undefined) {
    setAspect(val);
    if (val && imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, val));
    }
  }

  async function apply() {
    if (!imgRef.current || !completedCrop) return;
    setSaving(true);
    const blob = await cropToBlob(imgRef.current, completedCrop);
    if (!blob) { setSaving(false); return; }

    // Overwrite the original file in place
    const pathWithoutImages = originalPath.startsWith("/images/")
      ? originalPath.slice("/images/".length)
      : originalPath.replace(/^\//, "");

    const filename = pathWithoutImages.split("/").pop()!;
    const file = new File([blob], filename, { type: "image/jpeg" });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("imagePath", pathWithoutImages);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
    if (res.ok) {
      // Cache-bust so the browser reloads the overwritten file
      onSave(originalPath + "?t=" + Date.now());
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border-accent bg-surface-strong shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-accent px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Crop Image</h2>
          <button type="button" onClick={onClose} className="font-sans text-lg text-muted-dark hover:text-foreground transition-colors leading-none">×</button>
        </div>

        {/* Aspect ratio selector */}
        <div className="flex gap-2 border-b border-border-accent px-6 py-3">
          {ASPECT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => changeAspect(opt.value)}
              className={`rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-colors ${
                aspect === opt.value
                  ? "bg-gold text-background"
                  : "border border-border-accent text-muted-dark hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-surface-deep">
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
              src={src}
              alt="Crop"
              onLoad={onImageLoad}
              className="max-h-[50vh] max-w-full object-contain"
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border-accent px-6 py-4">
          <button
            type="button"
            onClick={apply}
            disabled={saving || !completedCrop}
            className="rounded-lg bg-gold px-6 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving…" : "Apply Crop"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-accent px-6 py-2.5 font-sans text-sm text-muted-dark hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
