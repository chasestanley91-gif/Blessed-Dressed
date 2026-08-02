import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Owner image review.
//
// Every remaining craft option gets ONE generation, and the owner approves or
// rejects it here rather than the pipeline self-approving. GET returns the
// queue plus every decision made so far; POST records one decision.
//
// The queue is built by tools/build_review_queue.mjs, which also copies the
// candidate and its supplier drawing into public/images/review/ so the browser
// can load them - the .craft-pipeline tree sits outside Next's static root.

const STORE = join(process.cwd(), "data-store");
const QUEUE_FILE = join(STORE, "image-review-queue.json");
const DECISIONS_FILE = join(STORE, "image-review-decisions.json");

export type ReviewDecision = {
  key: string;
  attempt: number;
  verdict: "approved" | "rejected";
  /** Owner's reason. Required on reject so the retry prompt has something to act on. */
  notes?: string;
  /** Which named problems the owner ticked, for pattern-spotting across rejects. */
  tags?: string[];
  /** Owner-supplied reference photos, as /images/... paths. */
  references?: string[];
  decidedAt: string;
};

type DecisionMap = Record<string, ReviewDecision>;

function readJson<T>(p: string, fallback: T): T {
  try {
    if (!existsSync(p)) return fallback;
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeDecisions(d: DecisionMap) {
  mkdirSync(STORE, { recursive: true });
  writeFileSync(DECISIONS_FILE, JSON.stringify(d, null, 1));
}

export async function GET() {
  const queue = readJson<{ items?: unknown[]; generatedAt?: string }>(QUEUE_FILE, {});
  const decisions = readJson<DecisionMap>(DECISIONS_FILE, {});
  return NextResponse.json({
    generatedAt: queue.generatedAt ?? null,
    items: queue.items ?? [],
    decisions,
  });
}

export async function POST(req: NextRequest) {
  let body: Partial<ReviewDecision>;
  try {
    body = (await req.json()) as Partial<ReviewDecision>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { key, attempt, verdict } = body;

  if (!key || typeof key !== "string" || !key.includes("/")) {
    return NextResponse.json({ error: "key must be 'product/option'" }, { status: 400 });
  }
  if (typeof attempt !== "number" || !Number.isFinite(attempt)) {
    return NextResponse.json({ error: "attempt must be a number" }, { status: 400 });
  }
  if (verdict !== "approved" && verdict !== "rejected") {
    return NextResponse.json({ error: "verdict must be 'approved' or 'rejected'" }, { status: 400 });
  }

  // A reject with no reason produces a retry prompt with nothing to change, so
  // the retry regresses to the same image. Require the reason at the boundary.
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === "string") : [];
  if (verdict === "rejected" && notes.length < 4 && tags.length === 0) {
    return NextResponse.json(
      { error: "A rejection needs a reason: tick at least one problem or write a note." },
      { status: 400 },
    );
  }

  const references = Array.isArray(body.references)
    ? body.references.filter(
        (r): r is string => typeof r === "string" && r.startsWith("/images/"),
      )
    : [];

  const decisions = readJson<DecisionMap>(DECISIONS_FILE, {});
  decisions[key] = {
    key,
    attempt,
    verdict,
    notes: notes || undefined,
    tags: tags.length ? tags : undefined,
    references: references.length ? references : undefined,
    decidedAt: new Date().toISOString(),
  };
  writeDecisions(decisions);

  return NextResponse.json({ ok: true, decision: decisions[key] });
}

export async function DELETE(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  const decisions = readJson<DecisionMap>(DECISIONS_FILE, {});
  delete decisions[key];
  writeDecisions(decisions);
  return NextResponse.json({ ok: true });
}
