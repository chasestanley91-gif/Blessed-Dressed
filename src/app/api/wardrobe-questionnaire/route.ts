import { NextRequest, NextResponse } from "next/server";
import { loadDataAsync, saveDataAsync } from "@/lib/admin-data";
import { sendWardrobeQuestionnaireNotification } from "@/lib/email";
import {
  WARDROBE_ID_PREFIX,
  WARDROBE_STORE_KEY,
  missingRequiredWardrobeAnswers,
  sanitizeWardrobeAnswers,
  type WardrobeQuestionnaireSubmission,
} from "@/data/wardrobe-questionnaire";

// Public POST only. As with /api/consultation, there is deliberately no GET:
// the listing carries every lead's name, email and phone and lives behind the
// admin proxy at /api/admin/wardrobe-questionnaires.

const MAX_FIELD = 200;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim().slice(0, MAX_FIELD) : "";
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const email = str(body.email);
  const phone = str(body.phone);
  const answers = sanitizeWardrobeAnswers(body.answers);

  const missing: string[] = [];
  if (!firstName) missing.push("firstName");
  if (!lastName) missing.push("lastName");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push("email");
  if (!phone) missing.push("phone");
  missing.push(...missingRequiredWardrobeAnswers(answers));
  if (missing.length > 0) {
    return NextResponse.json({ error: "Missing required fields", missing }, { status: 400 });
  }

  try {
    const existing = await loadDataAsync<WardrobeQuestionnaireSubmission[]>(WARDROBE_STORE_KEY, []);

    // Auto-increment ID: WQ-0001, WQ-0002, …
    const lastNum = existing.reduce((max, c) => {
      const n = parseInt(c.id.replace(WARDROBE_ID_PREFIX, ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const id = `${WARDROBE_ID_PREFIX}${String(lastNum + 1).padStart(4, "0")}`;

    const entry: WardrobeQuestionnaireSubmission = {
      id,
      createdAt: new Date().toISOString(),
      status: "New",
      firstName,
      lastName,
      email,
      phone,
      answers,
    };

    await saveDataAsync(WARDROBE_STORE_KEY, [entry, ...existing]);

    void sendWardrobeQuestionnaireNotification(entry).catch((err) =>
      console.error("[wardrobe-questionnaire] Notification error:", err)
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save questionnaire" }, { status: 500 });
  }
}
