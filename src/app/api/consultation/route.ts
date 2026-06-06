import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { sendConsultationNotification } from "@/lib/email";

export type ConsultationRequest = {
  id: string;
  createdAt: string;
  status: "New" | "Contacted" | "Scheduled" | "Completed" | "Cancelled";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timesAvailable: string[];
  product: string;
  colors: string;
  patterns: string;
  budget: string;
  notes: string;
};

export async function GET() {
  const consultations = await loadDataAsync<ConsultationRequest[]>("consultations", []);
  return NextResponse.json(consultations);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<ConsultationRequest, "id" | "createdAt" | "status">;

    const existing = await loadDataAsync<ConsultationRequest[]>("consultations", []);

    // Auto-increment ID: CONS-0001, CONS-0002, …
    const lastNum = existing.reduce((max, c) => {
      const n = parseInt(c.id.replace("CONS-", ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const id = `CONS-${String(lastNum + 1).padStart(4, "0")}`;

    const entry: ConsultationRequest = {
      id,
      createdAt: new Date().toISOString(),
      status: "New",
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      email: body.email ?? "",
      phone: body.phone ?? "",
      timesAvailable: Array.isArray(body.timesAvailable) ? body.timesAvailable : [],
      product: body.product ?? "",
      colors: body.colors ?? "",
      patterns: body.patterns ?? "",
      budget: body.budget ?? "",
      notes: body.notes ?? "",
    };

    await saveDataAsync("consultations", [entry, ...existing]);

    void sendConsultationNotification(entry).catch((err) =>
      console.error("[consultation] Notification error:", err)
    );

    return NextResponse.json({ consultationId: id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save consultation" }, { status: 500 });
  }
}
