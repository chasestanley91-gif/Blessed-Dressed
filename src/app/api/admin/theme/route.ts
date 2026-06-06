import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { revalidatePath } from "next/cache";

type Theme = Record<string, string>;

const DEFAULTS: Theme = {
  gold: "#d4af37",
  goldLight: "#B5975A",
  goldLighter: "#D4B478",
  background: "#071a2d",
  surface: "#09141e",
  surfaceStrong: "#0b1b2e",
  foreground: "#f5f1e6",
  muted: "#b1a893",
  ivory: "#FAF8F3",
  cream: "#F5F0E8",
  charcoal: "#1C1C1C",
  warmBlack: "#111010",
  gray: "#6B6560",
  borderLight: "#E2DBD0",
  navy: "#1A2744",
};

export async function GET() {
  return NextResponse.json(await loadDataAsync<Theme>("theme", DEFAULTS));
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as Theme;
  await saveDataAsync("theme", body);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
