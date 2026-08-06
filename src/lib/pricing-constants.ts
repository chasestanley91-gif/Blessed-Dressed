/**
 * Shared pricing constants — the single source for the numbers that were
 * previously duplicated between the client builder store and the server
 * pricing authority (and inlined as bare literals in the builder page).
 *
 * This module must stay dependency-free: it is imported by client code
 * (src/store/builderStore.ts, the builder page) and by the server-only
 * pricing module (src/lib/pricing.ts, which pulls in `fs` via admin-data).
 * Importing anything here would drag it into the client bundle.
 *
 * NOTE: only the VALUES are shared. The monogram-counting rules still differ
 * between the client store (all slots) and the server (filled slots only) —
 * a known, documented divergence that is out of scope for this module.
 */

export const FABRIC_PREMIUM = 150;
export const MONOGRAM_EXTRA = 10;

/** Tolerance for float comparison — prices are dollars with 2 decimals. */
export const PRICE_EPSILON = 0.005;

export const BASE_PRICES: Record<string, number> = {
  shirt: 85,
  trousers: 495,
  "suit-2pc": 599.99,
  "suit-3pc": 799.99,
  vest: 395,
  "sport-coat": 350,
};
