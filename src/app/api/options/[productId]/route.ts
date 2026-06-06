import { NextRequest, NextResponse } from "next/server";
import { loadData } from "@/lib/admin-data";
import { allProductDesigns } from "@/data/options";
import type { ProductDesignConfig } from "@/data/options/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const fallback = allProductDesigns[productId];
  if (!fallback) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(loadData<ProductDesignConfig>(`options/${productId}`, fallback));
}
