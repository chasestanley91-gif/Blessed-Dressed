import { cookies } from "next/headers";
import { createHmac } from "crypto";

const SECRET = process.env.ADMIN_TOKEN_SECRET ?? "dev_secret";
const COOKIE = "admin_session";

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

export async function getAdminSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  return !!token && verifyToken(token);
}
