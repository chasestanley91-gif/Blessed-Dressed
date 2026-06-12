export type DesignOption = {
  id: string;
  label: string;
  description: string;
  priceAdj?: number;
  /** Original tech-pack drawing / illustration of the option. */
  image?: string;
  /** AI-generated photo of the option (perchance-image-gen pipeline). */
  aiImage?: string;
  /** Sourced + verified real-world photo of the option. */
  realImage?: string;
  images?: string[];
  /** Cluster key used by the dynamic quiz engine, e.g. "notch" | "peak" | "shawl". */
  group?: string;
  /** Optional style tags for secondary relevance, e.g. ["formal","italian"]. */
  tags?: string[];
};

/** One selectable answer in a category's discovery question. */
export type QuizAnswer = {
  id: string;
  label: string;
  description?: string;
  /** When present the answer renders as a visual card (image-aware quiz). */
  image?: string;
  /** option.group values considered an exact match for this answer. */
  matchGroups?: string[];
  /** option.tags considered a related match for this answer. */
  matchTags?: string[];
};

/** Per-category (per-field) discovery question. Auto-shown when a field has
 *  >= QUESTION_THRESHOLD options, unless `enabled` overrides it. */
export type FieldQuiz = {
  enabled?: boolean;
  question: string;
  answers: QuizAnswer[];
};

export type DesignField = {
  id: string;
  label: string;
  hint?: string;
  options: DesignOption[];
  advanced?: boolean;
  defaultValue: string;
  quiz?: FieldQuiz;
};

export type DesignSection = {
  id: string;
  label: string;
  fields: DesignField[];
};

export type ProductDesignConfig = {
  productId: string;
  basePrice: number;
  sections: DesignSection[];
};
