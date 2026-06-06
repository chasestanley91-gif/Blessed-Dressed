import { NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";

export type ImageOverride = { src: string; position?: string; zoom?: number };
export type OverrideMap = Record<string, ImageOverride>;

export async function GET() {
  const overrides = await loadDataAsync<OverrideMap>("image-overrides", {});
  return NextResponse.json({ overrides });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    original: string;
    replacement: string;
    position?: string;
    zoom?: number;
  };
  const overrides = await loadDataAsync<OverrideMap>("image-overrides", {});
  overrides[body.original] = {
    src: body.replacement,
    position: body.position ?? "50% 50%",
    zoom: body.zoom ?? 1,
  };
  await saveDataAsync("image-overrides", overrides);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await saveDataAsync("image-overrides", {});
  return NextResponse.json({ ok: true });
}
