import { NextResponse } from "next/server";
import { loadDataAsync } from "@/lib/admin-data";
import {
  WARDROBE_STORE_KEY,
  type WardrobeQuestionnaireSubmission,
} from "@/data/wardrobe-questionnaire";

// Admin listing of wardrobe questionnaire leads. Gated by src/proxy.ts via the
// /api/admin/* prefix; the public submit route has no GET.
export async function GET() {
  return NextResponse.json(
    await loadDataAsync<WardrobeQuestionnaireSubmission[]>(WARDROBE_STORE_KEY, [])
  );
}
