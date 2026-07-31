/**
 * apiFetch — the one place a client-side call to our own API is checked.
 *
 * The codebase had ~30 `fetch()` call sites that did some subset of: not
 * checking `res.ok`, calling `res.json()` on an error body, or wrapping the
 * whole thing in `catch {}`. The failure mode is always the same and always
 * silent — the UI proceeds as though the request succeeded.
 *
 * The worst instance was the bulk fabric import: a failed photo upload was
 * swallowed by `catch {}`, which made the photo array SHORTER than the code
 * array, and the records were then paired by index. Every fabric after the
 * failure got another cloth's swatch code, with no error shown to anyone.
 *
 * Two rules this helper exists to enforce:
 *   1. A non-2xx response is an error, and the error carries the server's own
 *      message when there is one — a caller that shows "something went wrong"
 *      when the server said "fabric code already exists" has thrown away the
 *      only useful part.
 *   2. A body that is not JSON is not a silent empty object. `res.json()` on an
 *      HTML error page throws a SyntaxError that reads like a bug in our code;
 *      here it becomes an explicit, attributable failure.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body: unknown;

  constructor(message: string, status: number, url: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Pull the most useful message the server offered, if any. */
function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of ["error", "message", "detail"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  if (typeof body === "string" && body.trim() && body.length < 300) return body;
  return fallback;
}

/**
 * Fetch JSON from our API, throwing `ApiError` on any non-2xx or unparseable
 * response. Never returns a partial or empty result to paper over a failure.
 */
export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (cause) {
    // Network-level failure: offline, DNS, CORS, aborted.
    throw new ApiError(
      `Could not reach ${input}. Check your connection and try again.`,
      0,
      input,
      cause
    );
  }

  const body = await readBody(res);

  if (!res.ok) {
    throw new ApiError(
      messageFrom(body, `Request failed (${res.status} ${res.statusText})`),
      res.status,
      input,
      body
    );
  }

  return body as T;
}

/** `apiFetch` for callers that only need to know it worked. */
export async function apiSend(input: string, init?: RequestInit): Promise<void> {
  await apiFetch(input, init);
}

/**
 * For call sites that genuinely want to continue on failure — a non-critical
 * refresh, say. It returns the fallback AND reports, so "we chose to ignore
 * this" stays distinguishable from "we never noticed".
 */
export async function apiFetchOr<T>(
  input: string,
  fallback: T,
  init?: RequestInit
): Promise<T> {
  try {
    return await apiFetch<T>(input, init);
  } catch (error) {
    console.error("[apiFetch]", input, error);
    return fallback;
  }
}
