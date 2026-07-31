import type { Page } from "@playwright/test";

/**
 * Collects the two signals that mean "this page did not actually render":
 *
 *  - `pageerror`  — an uncaught exception in app code. Always a real defect;
 *                   React will have bailed out of at least one subtree.
 *  - `console.error` — anything the app (or React, or the browser) shouted about.
 *
 * Nothing is filtered here. Filtering happens in the spec, in the open, so a
 * suppressed class of error is visible in review rather than buried in a helper.
 */
export type PageHealth = {
  /** Uncaught exceptions raised in the page. */
  pageErrors: string[];
  /** Every `console.error(...)` the page emitted, including subresource failures. */
  consoleErrors: string[];
  /** Non-2xx/3xx responses for requests the page issued. */
  badResponses: string[];
};

export function watchPageHealth(page: Page): PageHealth {
  const health: PageHealth = { pageErrors: [], consoleErrors: [], badResponses: [] };

  page.on("pageerror", (error) => {
    health.pageErrors.push(error.stack ?? String(error));
  });

  page.on("console", (message) => {
    if (message.type() === "error") health.consoleErrors.push(message.text());
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      health.badResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  return health;
}

/**
 * Browsers log a `console.error` for every subresource that fails to load
 * ("Failed to load resource: ..."). Those are covered far more precisely by
 * `badResponses` and by tests/e2e/asset-delivery.spec.ts, which names the exact
 * offending asset. Keeping them out of the *console* assertion stops one broken
 * image from masquerading as "the page has a JavaScript error".
 */
export function scriptConsoleErrors(health: PageHealth): string[] {
  return health.consoleErrors.filter(
    (text) => !/^Failed to load resource/i.test(text.trim())
  );
}
