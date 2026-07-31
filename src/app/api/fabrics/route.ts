import { NextResponse } from "next/server";
import { loadDataAsync } from "@/lib/admin-data";
import { fabrics } from "@/data/builder";

export type PublicFabric = {
  id: string;
  label: string;
  detail: string;
  premium: boolean;
  collection?: string;
  photoImage?: string;
  codeImage?: string;
  image?: string;
  color?: string[];
  pattern?: string;
  weight?: "light" | "medium" | "heavy";
  finish?: "crisp" | "soft" | "luxurious" | "textured";
  season?: string[];
  occasion?: string[];
};

// Public, ungated source of truth for the customer builder's fabric list.
// Mirrors /api/options/[productId]: reads the live list from Blob in prod /
// data-store JSON in dev, falling back to the bundled TS defaults.
//
// The builder previously fetched /api/admin/fabrics, which src/proxy.ts gates
// behind admin auth — guests received a 401 body with no `.length`, so the
// client's `if (!adminFabrics?.length) return` swallowed it and every customer
// silently saw the bundled fallback list instead of the managed one.
export async function GET() {
  return NextResponse.json(await loadDataAsync<PublicFabric[]>("fabrics", fabrics));
}
