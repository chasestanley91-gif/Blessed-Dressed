import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getAdminPassword, getAdminSecret } from "@/lib/admin-secret";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function makeToken(): string {
  const payload = `blessed_admin:${Date.now()}`;
  const sig = createHmac("sha256", getAdminSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export async function POST(req: NextRequest) {
  let expectedPassword: string;
  try {
    // Resolved per-request so a misconfigured production deploy returns a clear
    // 503 instead of silently accepting the dev-default password.
    expectedPassword = getAdminPassword();
    getAdminSecret();
  } catch (err) {
    console.error("Admin auth misconfigured:", err);
    return NextResponse.json(
      { error: "Admin authentication is not configured on this deployment." },
      { status: 503 }
    );
  }

  const { password } = await req.json();
  if (password !== expectedPassword) {
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
