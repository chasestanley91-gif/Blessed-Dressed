// Admin credential resolution — shared by the login route (Node runtime) and
// the proxy/middleware (Edge runtime), so both sign and verify with the same
// secret.
//
// These used to fall back to literals (`"blessed2026"`, `"dev_secret"`) in all
// environments. Those literals live in a public repo, so an unset env var in
// production meant anyone could log in, or forge a session cookie by signing
// `blessed_admin:<ts>` with the known secret. We now fail closed in production
// and keep the convenience defaults for local dev only.

const DEV_SECRET = "dev_secret";
const DEV_PASSWORD = "blessed2026";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || !!process.env.VERCEL;
}

/** HMAC key for admin session cookies. Throws in production when unset. */
export function getAdminSecret(): string {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (secret) return secret;
  if (isProduction()) {
    throw new Error(
      "ADMIN_TOKEN_SECRET is not set. Refusing to sign or verify admin sessions with a build-time default."
    );
  }
  return DEV_SECRET;
}

/** Admin login password. Throws in production when unset. */
export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (password) return password;
  if (isProduction()) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Refusing to accept a build-time default admin password."
    );
  }
  return DEV_PASSWORD;
}
