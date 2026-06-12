import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync } from "@/lib/admin-data";
import { allProductDesigns } from "@/data/options";
import type { ProductDesignConfig } from "@/data/options/types";

// Public, ungated source of truth for the customer builder. Reads the live
// option config (incl. dynamic-quiz metadata) from Blob in prod / data-store
// JSON in dev, falling back to the bundled TS design.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const fallback = allProductDesigns[productId];
  if (!fallback) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await loadDataAsync<ProductDesignConfig>(`options/${productId}`, fallback));
}
