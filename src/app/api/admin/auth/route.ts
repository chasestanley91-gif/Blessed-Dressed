import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const PASSWORD = process.env.ADMIN_PASSWORD || "blessed2026";
const SECRET = process.env.ADMIN_TOKEN_SECRET ?? "dev_secret";
const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function makeToken(): string {
  const payload = `blessed_admin:${Date.now()}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    return sig === expected && payload.startsWith("blessed_admin:");
  } catch {
    return false;
  }
}

export function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE)?.value;
  return !!token && verifyToken(token);
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
