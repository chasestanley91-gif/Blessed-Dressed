import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createHash } from "crypto";
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
//
// Two records are written per decision:
//   image-review-decisions.json      last decision per key (what the UI reads)
//   image-review-decisions-log.json  append-only history with FULL identity —
//                                    craft address and content hash — so a
//                                    decision can never migrate to the wrong
//                                    craft (the suit-2pc/coin-left lesson) and
//                                    an undo never erases that it happened.
// tools/build_decision_ledger.mjs merges the log into the canonical ledger.

const STORE = join(process.cwd(), "data-store");
const QUEUE_FILE = join(STORE, "image-review-queue.json");
const DECISIONS_FILE = join(STORE, "image-review-decisions.json");
const DECISIONS_LOG_FILE = join(STORE, "image-review-decisions-log.json");

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

type LogEntry = ReviewDecision & {
  /** Full craft address `product > section > field > option` — the identity
   *  that survives product/option key collisions. */
  addr?: string;
  /** sha1 of the exact image bytes the decision was made on, when resolvable. */
  imageSha1?: string;
  /** Repo-relative path those bytes were hashed from. */
  imagePath?: string;
  /** "decision" or "revoked" (an undo — history is kept, never erased). */
  event: "decision" | "revoked";
};

function appendLog(entry: LogEntry) {
  const log = readJson<LogEntry[]>(DECISIONS_LOG_FILE, []);
  log.push(entry);
  mkdirSync(STORE, { recursive: true });
  writeFileSync(DECISIONS_LOG_FILE, JSON.stringify(log, null, 1));
}

/** Hash the exact bytes the owner judged: the pipeline candidate when it
 *  exists, otherwise the staged review copy. Returns null rather than guessing. */
function resolveImage(key: string, attempt: number): { imagePath: string; imageSha1: string } | null {
  const [product, option] = key.split("/");
  const candidates = [
    join(process.cwd(), ".craft-pipeline", product, option, `candidate-${attempt}.png`),
    join(process.cwd(), "public", "images", "review", `${product}__${option}__a${attempt}.webp`),
    join(process.cwd(), "public", "images", "review", `${product}__${option}__owner.webp`),
  ];
  for (const abs of candidates) {
    try {
      if (!existsSync(abs)) continue;
      const sha1 = createHash("sha1").update(readFileSync(abs)).digest("hex");
      const rel = abs.slice(process.cwd().length + 1).split("\\").join("/");
      return { imagePath: rel, imageSha1: sha1 };
    } catch {
      /* unreadable — try the next spelling */
    }
  }
  return null;
}

/** The queue is the source of truth for which craft a key currently shows. */
function addrFromQueue(key: string): string | undefined {
  const queue = readJson<{ items?: { key: string; addr?: string }[] }>(QUEUE_FILE, {});
  return queue.items?.find((i) => i.key === key)?.addr;
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
  let body: Partial<ReviewDecision> & { addr?: string };
  try {
    body = (await req.json()) as Partial<ReviewDecision> & { addr?: string };
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

  // Full-identity, append-only record. The client-sent addr is advisory; the
  // queue's own addr for this key wins when they disagree.
  const clientAddr = typeof body.addr === "string" ? body.addr : undefined;
  appendLog({
    ...decisions[key],
    event: "decision",
    addr: addrFromQueue(key) ?? clientAddr,
    ...(resolveImage(key, attempt) ?? {}),
  });

  return NextResponse.json({ ok: true, decision: decisions[key] });
}

export async function DELETE(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  const decisions = readJson<DecisionMap>(DECISIONS_FILE, {});
  const revoked = decisions[key];
  delete decisions[key];
  writeDecisions(decisions);
  // An undo removes the decision from the working map but never from history —
  // losing decision history is the exact failure this system exists to prevent.
  if (revoked) {
    appendLog({ ...revoked, event: "revoked", addr: addrFromQueue(key) });
  }
  return NextResponse.json({ ok: true });
}
