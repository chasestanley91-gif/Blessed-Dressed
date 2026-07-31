import { NextResponse } from "next/server";
import { loadDataAsync } from "@/lib/admin-data";
import type { ConsultationRequest } from "@/app/api/consultation/route";

// Admin listing of consultation leads.
//
// This lived on the PUBLIC /api/consultation GET, which src/proxy.ts does not
// match — so every lead's name, email, phone, budget and notes were readable by
// anyone. It belongs under /api/admin/* where the proxy gates it.
export async function GET() {
  return NextResponse.json(await loadDataAsync<ConsultationRequest[]>("consultations", []));
}
