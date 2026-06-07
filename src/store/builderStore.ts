import { create } from "zustand";
import { allProductDesigns } from "@/data/options";

export type Monogram = {
  text: string;
  font: string;
  threadColor: string;
  placement: string;
  size: string;
};

export type BuilderState = {
  product: string;
  fabric: string;
  fabricPremium: boolean;

  /* Per-field design selection: fieldId → selectedOptionId */
  designSelections: Record<string, string>;

  /* Monograms (index 0 = free, 1–2 = +$10 each) */
  monograms: Monogram[];

  /* Measurements */
  measureMode: "standard" | "body" | "finished";
  standardSize: string;
  customMeasurements: Record<string, string>;
  chestAllowance: string;
  wearingHabit: string;

  /* Posture adjustments: fieldId → selectedAdjustmentId */
  postureAdjustments: Record<string, string>;

  /* Style quiz answers: key → answer (e.g. lapelFamily → "notch") */
  styleQuiz: Record<string, string>;

  /* Fabric discovery quiz answers: key → answer (e.g. occasion → "business") */
  discoveryQuiz: Record<string, string>;

  price: number;

  /* Actions */
  setProduct: (product: string) => void;
  setFabric: (fabric: string, premium?: boolean) => void;
  setDesignSelection: (fieldId: string, optionId: string) => void;
  setMonogram: (index: number, data: Partial<Monogram>) => void;
  addMonogram: () => void;
  removeMonogram: (index: number) => void;
  setMeasureMode: (mode: "standard" | "body" | "finished") => void;
  setStandardSize: (size: string) => void;
  setCustomMeasurement: (key: string, value: string) => void;
  setChestAllowance: (v: string) => void;
  setWearingHabit: (v: string) => void;
  setPostureAdjustment: (fieldId: string, optionId: string) => void;
  setStyleQuiz: (key: string, value: string) => void;
  clearStyleQuizKey: (key: string) => void;
  clearStyleQuiz: () => void;
  setDiscoveryQuiz: (key: string, value: string) => void;
  clearDiscoveryQuiz: () => void;
  hydrateState: (partial: {
    fabric?: string;
    fabricPremium?: boolean;
    designSelections?: Record<string, string>;
    measureMode?: "standard" | "body" | "finished";
    standardSize?: string;
    customMeasurements?: Record<string, string>;
    chestAllowance?: string;
    wearingHabit?: string;
    postureAdjustments?: Record<string, string>;
    styleQuiz?: Record<string, string>;
    discoveryQuiz?: Record<string, string>;
    monograms?: Monogram[];
  }) => void;
  recalculatePrice: () => void;
  resetBuilder: () => void;
};

const basePrices: Record<string, number> = {
  shirt: 85,
  trousers: 495,
  "suit-2pc": 599.99,
  "suit-3pc": 799.99,
  vest: 395,
  "sport-coat": 350,
};

function calcPrice(
  product: string,
  fabricPremium: boolean,
  designSelections: Record<string, string>,
  monograms: Monogram[]
): number {
  const base = basePrices[product] ?? 0;
  const fabric = fabricPremium ? 150 : 0;
  const extra = monograms.length > 1 ? (monograms.length - 1) * 10 : 0;

  const config = allProductDesigns[product];
  let designExtra = 0;
  if (config) {
    for (const section of config.sections) {
      for (const field of section.fields) {
        const selectedId = designSelections[field.id];
        if (selectedId) {
          const opt = field.options.find((o) => o.id === selectedId);
          if (opt?.priceAdj) designExtra += opt.priceAdj;
        }
      }
    }
  }

  return base + fabric + extra + designExtra;
}

const emptyMonogram = (): Monogram => ({
  text: "",
  font: "script-classic",
  threadColor: "thread-matching",
  placement: "",
  size: "medium",
});

export const useBuilderStore = create<BuilderState>((set) => ({
  product: "shirt",
  fabric: "navy-herringbone",
  fabricPremium: true,
  designSelections: {},
  monograms: [emptyMonogram()],
  measureMode: "standard",
  standardSize: "",
  customMeasurements: {},
  chestAllowance: "8",
  wearingHabit: "",
  postureAdjustments: {},
  styleQuiz: {},
  discoveryQuiz: {},
  price: basePrices.shirt + 150,

  setProduct: (product) =>
    set((state) => ({
      product,
      designSelections: {},
      standardSize: "",
      customMeasurements: {},
      postureAdjustments: {},
      price: calcPrice(product, state.fabricPremium, {}, state.monograms),
    })),

  setFabric: (fabric, premium = false) =>
    set((state) => ({
      fabric,
      fabricPremium: premium,
      price: calcPrice(state.product, premium, state.designSelections, state.monograms),
    })),

  setDesignSelection: (fieldId, optionId) =>
    set((state) => {
      const next = { ...state.designSelections, [fieldId]: optionId };
      return {
        designSelections: next,
        price: calcPrice(state.product, state.fabricPremium, next, state.monograms),
      };
    }),

  setMonogram: (index, data) =>
    set((state) => {
      const monograms = state.monograms.map((m, i) => (i === index ? { ...m, ...data } : m));
      return { monograms, price: calcPrice(state.product, state.fabricPremium, state.designSelections, monograms) };
    }),

  addMonogram: () =>
    set((state) => {
      if (state.monograms.length >= 3) return state;
      const monograms = [...state.monograms, emptyMonogram()];
      return { monograms, price: calcPrice(state.product, state.fabricPremium, state.designSelections, monograms) };
    }),

  removeMonogram: (index) =>
    set((state) => {
      if (index === 0) return state;
      const monograms = state.monograms.filter((_, i) => i !== index);
      return { monograms, price: calcPrice(state.product, state.fabricPremium, state.designSelections, monograms) };
    }),

  setMeasureMode: (mode) => set({ measureMode: mode }),

  setStandardSize: (size) => set({ standardSize: size }),

  setCustomMeasurement: (key, value) =>
    set((state) => ({
      customMeasurements: { ...state.customMeasurements, [key]: value },
    })),

  setChestAllowance: (v) => set({ chestAllowance: v }),

  setWearingHabit: (v) => set({ wearingHabit: v }),

  setPostureAdjustment: (fieldId, optionId) =>
    set((state) => ({
      postureAdjustments: { ...state.postureAdjustments, [fieldId]: optionId },
    })),

  setStyleQuiz: (key, value) =>
    set((state) => ({ styleQuiz: { ...state.styleQuiz, [key]: value } })),

  clearStyleQuizKey: (key) =>
    set((state) => {
      const next = { ...state.styleQuiz };
      delete next[key];
      return { styleQuiz: next };
    }),

  clearStyleQuiz: () => set({ styleQuiz: {} }),

  setDiscoveryQuiz: (key, value) =>
    set((state) => ({ discoveryQuiz: { ...state.discoveryQuiz, [key]: value } })),

  clearDiscoveryQuiz: () => set({ discoveryQuiz: {} }),

  hydrateState: (partial) =>
    set((state) => {
      const next = { ...state, ...partial };
      return {
        ...next,
        price: calcPrice(
          next.product,
          next.fabricPremium,
          next.designSelections,
          next.monograms
        ),
      };
    }),

  recalculatePrice: () =>
    set((state) => ({
      price: calcPrice(state.product, state.fabricPremium, state.designSelections, state.monograms),
    })),

  resetBuilder: () =>
    set({
      product: "shirt",
      fabric: "navy-herringbone",
      fabricPremium: true,
      designSelections: {},
      monograms: [emptyMonogram()],
      measureMode: "standard",
      standardSize: "",
      customMeasurements: {},
      chestAllowance: "8",
      wearingHabit: "",
      postureAdjustments: {},
      styleQuiz: {},
      discoveryQuiz: {},
      price: basePrices.shirt + 150,
    }),
}));
