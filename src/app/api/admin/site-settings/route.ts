import { NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { SITE_DEFAULTS, type SiteSettings } from "@/data/site-settings";
import { revalidatePath } from "next/cache";

export async function GET() {
  const settings = await loadDataAsync<SiteSettings>("site-settings", SITE_DEFAULTS);
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const body = (await req.json()) as SiteSettings;
  await saveDataAsync("site-settings", body);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/collections");
  revalidatePath("/builder");
  return NextResponse.json({ ok: true });
}
