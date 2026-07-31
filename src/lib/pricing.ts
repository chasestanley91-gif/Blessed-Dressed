import { loadDataAsync } from "@/lib/admin-data";
import { allProductDesigns } from "@/data/options";
import type { ProductDesignConfig } from "@/data/options/types";
import { fabrics as bundledFabrics } from "@/data/builder";
import { readyToWear, type Product } from "@/data/products";
import { accessories as bundledAccessories, type Accessory } from "@/data/accessories";
import type { BespokeConfig, CartItem } from "@/context/CartContext";

// Server-side pricing authority.
//
// The checkout route used to pass the browser's `item.price` straight into
// Stripe's `unit_amount`, so a crafted POST could buy a bespoke suit for $0.50.
// Nothing here trusts the client: every figure is recomputed from the same
// sources the storefront renders from, and the caller compares.
//
// Deliberately reads the LIVE option config and fabric list rather than the
// bundled TS defaults, because an admin price edit must reach the charge. The
// client-side store (src/store/builderStore.ts) still reads the bundled config;
// where the two disagree, THIS module is correct and the mismatch is reported.

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

const round2 = (n: number) => Math.round(n * 100) / 100;

export type PriceResult =
  | { ok: true; price: number; breakdown: Record<string, number> }
  | { ok: false; reason: string };

/**
 * Recover the product id from a bespoke cart id.
 * The builder mints `bespoke-<productSlug>-<Date.now()>`; carts already sitting
 * in a customer's localStorage predate `config.productId`, so this is the
 * fallback rather than the primary path.
 */
export function productIdFromBespokeCartId(id: string): string | null {
  const m = /^bespoke-(.+)-\d+$/.exec(id);
  return m ? m[1] : null;
}

export async function computeBespokePrice(
  productId: string,
  config: BespokeConfig
): Promise<PriceResult> {
  const base = BASE_PRICES[productId];
  if (base === undefined) {
    return { ok: false, reason: `unknown bespoke product "${productId}"` };
  }

  // Fabric premium — decided by the fabric's own `premium` flag, never by a
  // client-sent boolean.
  const fabricList = await loadDataAsync("fabrics", bundledFabrics);
  const fabric = fabricList.find((f) => f.id === config.fabric);
  if (config.fabric && !fabric) {
    return { ok: false, reason: `unknown fabric "${config.fabric}"` };
  }
  const fabricExtra = fabric?.premium ? FABRIC_PREMIUM : 0;

  // Monograms — only FILLED slots are chargeable. The client store counted every
  // slot including blank ones, so two empty slots billed $20 for embroidery that
  // was never ordered and never reached the work order.
  const filledMonograms = (config.monograms ?? []).filter(
    (m) => typeof m.text === "string" && m.text.trim() !== ""
  );
  const monogramExtra = Math.max(0, filledMonograms.length - 1) * MONOGRAM_EXTRA;

  // Design upcharges — from the LIVE config, so an admin edit is actually charged.
  const design = await loadDataAsync<ProductDesignConfig | undefined>(
    `options/${productId}`,
    allProductDesigns[productId]
  );
  let designExtra = 0;
  const unknownSelections: string[] = [];
  for (const section of design?.sections ?? []) {
    for (const field of section.fields) {
      const selectedId = config.designSelections?.[field.id];
      if (!selectedId) continue;
      const opt = field.options.find((o) => o.id === selectedId);
      if (!opt) {
        unknownSelections.push(`${field.id}/${selectedId}`);
        continue;
      }
      if (opt.priceAdj) designExtra += opt.priceAdj;
    }
  }
  if (unknownSelections.length) {
    return {
      ok: false,
      reason: `selection not offered on ${productId}: ${unknownSelections.join(", ")}`,
    };
  }

  return {
    ok: true,
    price: round2(base + fabricExtra + monogramExtra + designExtra),
    breakdown: { base, fabric: fabricExtra, monograms: monogramExtra, design: designExtra },
  };
}

async function computeCatalogPrice(
  item: CartItem
): Promise<PriceResult> {
  if (item.type === "accessory") {
    const list = await loadDataAsync<Accessory[]>("accessories", bundledAccessories);
    const found = list.find((a) => a.id === item.id);
    if (!found) return { ok: false, reason: `unknown accessory "${item.id}"` };
    return { ok: true, price: round2(found.price), breakdown: { base: found.price } };
  }

  const list = await loadDataAsync<Product[]>("products", readyToWear);
  const found = list.find((p) => p.id === item.id);
  if (!found) return { ok: false, reason: `unknown product "${item.id}"` };
  return { ok: true, price: round2(found.price), breakdown: { base: found.price } };
}

/** Recompute one cart line's unit price from server-side data. */
export async function priceCartItem(item: CartItem): Promise<PriceResult> {
  if (item.type === "bespoke") {
    if (!item.config) return { ok: false, reason: "bespoke item has no configuration" };
    const productId =
      (item.config as BespokeConfig & { productId?: string }).productId ??
      productIdFromBespokeCartId(item.id);
    if (!productId) {
      return { ok: false, reason: `cannot determine product for bespoke item "${item.id}"` };
    }
    return computeBespokePrice(productId, item.config);
  }
  return computeCatalogPrice(item);
}

export type PricedLine = {
  item: CartItem;
  /** Authoritative unit price. Never the client's figure. */
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

export type RepriceResult =
  | { ok: true; lines: PricedLine[]; total: number }
  | { ok: false; errors: string[] };

/**
 * Reprice an entire cart. Rejects rather than silently charging a different
 * amount than the customer was shown — a surprise charge is its own defect.
 */
export async function repriceCart(items: CartItem[]): Promise<RepriceResult> {
  const lines: PricedLine[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const qty = Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 0;
    if (!qty) {
      errors.push(`"${item.name}": invalid quantity ${JSON.stringify(item.qty)}`);
      continue;
    }

    const priced = await priceCartItem(item);
    if (!priced.ok) {
      errors.push(`"${item.name}": ${priced.reason}`);
      continue;
    }

    const clientPrice = typeof item.price === "number" ? item.price : NaN;
    if (!Number.isFinite(clientPrice) || Math.abs(clientPrice - priced.price) > PRICE_EPSILON) {
      errors.push(
        `"${item.name}": price mismatch — cart says $${clientPrice}, server computes $${priced.price}`
      );
      continue;
    }

    lines.push({ item, unitPrice: priced.price, qty, lineTotal: round2(priced.price * qty) });
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, lines, total: round2(lines.reduce((s, l) => s + l.lineTotal, 0)) };
}
