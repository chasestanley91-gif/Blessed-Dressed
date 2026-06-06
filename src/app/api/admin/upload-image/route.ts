import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join, normalize, dirname } from "path";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const imagePath = form.get("imagePath") as string | null;

    if (!file || !imagePath) {
      return NextResponse.json({ error: "Missing file or imagePath" }, { status: 400 });
    }

    // Prevent path traversal: ensure the resolved path stays within public/images/
    const publicImages = join(process.cwd(), "public", "images");
    const resolved = normalize(join(publicImages, imagePath));
    if (!resolved.startsWith(publicImages)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    mkdirSync(dirname(resolved), { recursive: true });
    writeFileSync(resolved, Buffer.from(bytes));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("upload-image error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
