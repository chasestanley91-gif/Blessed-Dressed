import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import {
  WARDROBE_STATUSES,
  WARDROBE_STORE_KEY,
  type WardrobeQuestionnaireStatus,
  type WardrobeQuestionnaireSubmission,
} from "@/data/wardrobe-questionnaire";

// Only the status is editable from the admin; the customer's answers are the
// record and are never rewritten.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { status?: unknown };
    const status = body.status;
    if (typeof status !== "string" || !WARDROBE_STATUSES.includes(status as WardrobeQuestionnaireStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const all = await loadDataAsync<WardrobeQuestionnaireSubmission[]>(WARDROBE_STORE_KEY, []);
    if (!all.some((c) => c.id === id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const updated = all.map((c) =>
      c.id === id ? { ...c, status: status as WardrobeQuestionnaireStatus } : c
    );
    await saveDataAsync(WARDROBE_STORE_KEY, updated);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update questionnaire" }, { status: 500 });
  }
}
