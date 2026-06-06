import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import type { ConsultationRequest } from "@/app/api/consultation/route";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<ConsultationRequest>;
    const all = await loadDataAsync<ConsultationRequest[]>("consultations", []);
    if (!all.some((c) => c.id === id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = all.map((c) => (c.id === id ? { ...c, ...body, id } : c));
    await saveDataAsync("consultations", updated);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update consultation" }, { status: 500 });
  }
}
