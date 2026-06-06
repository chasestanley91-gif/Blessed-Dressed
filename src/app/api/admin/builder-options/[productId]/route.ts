import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { allProductDesigns } from "@/data/options";
import type { ProductDesignConfig } from "@/data/options/types";
import { revalidatePath } from "next/cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const fallback = allProductDesigns[productId];
  if (!fallback) return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  const config = await loadDataAsync<ProductDesignConfig>(`options/${productId}`, fallback);
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!allProductDesigns[productId]) return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  const config = await req.json() as ProductDesignConfig;
  await saveDataAsync(`options/${productId}`, config);
  revalidatePath("/builder");
  revalidatePath(`/builder/${productId}`);
  return NextResponse.json({ ok: true });
}
