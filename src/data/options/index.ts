export * from "./types";
export { shirtDesign } from "./shirt";
export { trousersDesign } from "./trousers";
export { suit2pcDesign, suit3pcDesign } from "./suit";
export { vestDesign } from "./vest";
export { sportCoatDesign } from "./sport-coat";

import { shirtDesign } from "./shirt";
import { trousersDesign } from "./trousers";
import { suit2pcDesign, suit3pcDesign } from "./suit";
import { vestDesign } from "./vest";
import { sportCoatDesign } from "./sport-coat";
import type { ProductDesignConfig } from "./types";

export const allProductDesigns: Record<string, ProductDesignConfig> = {
  shirt: shirtDesign,
  trousers: trousersDesign,
  "suit-2pc": suit2pcDesign,
  "suit-3pc": suit3pcDesign,
  vest: vestDesign,
  "sport-coat": sportCoatDesign,
};
