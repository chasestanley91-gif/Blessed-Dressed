import { NextRequest, NextResponse } from "next/server";
import { saveImageAsset, ImagePathError } from "@/lib/image-store";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const imagePath = form.get("imagePath") as string | null;

    if (!file || !imagePath) {
      return NextResponse.json({ error: "Missing file or imagePath" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    // Returns a Blob URL in production, a /images/... path locally. Callers
    // must use this value rather than reconstructing the path themselves.
    const path = await saveImageAsset(imagePath, bytes, file.type || undefined);

    return NextResponse.json({ ok: true, path });
  } catch (err) {
    if (err instanceof ImagePathError) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    console.error("upload-image error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
