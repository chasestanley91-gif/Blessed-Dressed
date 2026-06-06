type BuilderPricingState = {
  product: string;
  fabricPremium: boolean;
  customizationOptions: string[];
  embroidery: string[];
};

const basePrices: Record<string, number> = {
  shirt: 295,
  trousers: 495,
  suit: 1595,
  vest: 395,
};

const premiumFabricSurcharge = 150;

export function calculateBuilderPrice(state: BuilderPricingState) {
  const base = basePrices[state.product] ?? 0;
  const fabricPremium = state.fabricPremium ? premiumFabricSurcharge : 0;
  const customization = state.customizationOptions.length * 20;
  const embroideryCost = Math.max(0, state.embroidery.length - 1) * 10;

  return base + fabricPremium + customization + embroideryCost;
}
