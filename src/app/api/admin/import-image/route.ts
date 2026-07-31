import { NextRequest, NextResponse } from "next/server";
import { saveImageAsset, ImagePathError } from "@/lib/image-store";

const MAX_BYTES = 15 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

export async function POST(req: NextRequest) {
  try {
    const { url, imagePath } = (await req.json()) as { url?: string; imagePath?: string };
    if (!url || !imagePath || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Missing or invalid url / imagePath" }, { status: 400 });
    }

    // Some image CDNs 403 non-browser user agents.
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Source returned ${res.status}` }, { status: 502 });
    }
    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: `Not an image (${contentType || "unknown type"})` }, { status: 415 });
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    // Never trust the remote filename — extension comes from content-type.
    let finalPath = imagePath;
    if (!/\.[a-z0-9]{2,5}$/i.test(finalPath)) {
      finalPath += EXT_BY_TYPE[contentType] ?? ".jpg";
    }

    // Traversal is rejected inside saveImageAsset. Returns a Blob URL in
    // production, a /images/... path locally.
    const path = await saveImageAsset(finalPath, bytes, contentType);

    return NextResponse.json({ ok: true, path });
  } catch (err) {
    if (err instanceof ImagePathError) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    console.error("import-image error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
