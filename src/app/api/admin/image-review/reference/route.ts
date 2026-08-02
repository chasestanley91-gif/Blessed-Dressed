import { NextRequest, NextResponse } from "next/server";
import { saveImageAsset, ImagePathError } from "@/lib/image-store";

// Owner-supplied reference photos for a craft option under review.
//
// These are the owner's own pictures - a real garment, a catalog page, a photo
// from the factory - attached to a rejected option so the retry has something
// authoritative to work from beyond the supplier line drawing. They are stored
// under public/images/review-refs/<product>/<option>/ and referenced by path in
// the decision record.

const SAFE = /^[a-z0-9][a-z0-9._-]*$/i;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * Accept by MIME type when the browser supplies a real one, and fall back to
 * the extension when it does not. Some drag-and-drop sources (and plain curl)
 * send `application/octet-stream` for a perfectly good image, and rejecting
 * those would block the owner from attaching a reference they can plainly see.
 */
function isAllowedImage(type: string, ext: string): boolean {
  if (type && type !== "application/octet-stream") return ALLOWED.has(type);
  return ALLOWED_EXT.has(ext);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const product = form.get("product");
    const option = form.get("option");

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (typeof product !== "string" || typeof option !== "string" ||
        !SAFE.test(product) || !SAFE.test(option)) {
      return NextResponse.json({ error: "Invalid product or option" }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!isAllowedImage(file.type, ext)) {
      return NextResponse.json(
        { error: `Not an image we can use: ${file.type || ext || "unknown type"}` },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
    }
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const rel = `review-refs/${product}/${option}/${stamp}.${ext || "jpg"}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const path = await saveImageAsset(rel, bytes, file.type || undefined);

    return NextResponse.json({ ok: true, path });
  } catch (err) {
    if (err instanceof ImagePathError) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    console.error("image-review reference upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
