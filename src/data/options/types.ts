/** Why an option has no usable technical drawing — recorded, never guessed. */
export type IllustrationStatus =
  /** `illustration` holds a genuine technical drawing. */
  | "drawing"
  /** Something was recorded, but it is a photo, a brand glyph or otherwise not a drawing. */
  | "unverified"
  /** Nothing was ever recorded. Held, not invented — the drawing is law. */
  | "needs-source";

/** Provenance and licence for an option's sourced photography. */
export type OptionVerification = {
  verifiedDate?: string;
  method?: string;
  license?: { type?: string; source?: string; url?: string; commercialOk?: boolean; attribution?: string };
  stages?: Record<string, boolean>;
  notes?: string;
};

export type DesignOption = {
  id: string;
  label: string;
  description: string;
  priceAdj?: number;

  /**
   * COMPATIBILITY SLOT — the single asset legacy consumers render (admin UI,
   * bundled fallback, e2e helpers). Historically OVERLOADED: it holds a PHOTO
   * for ~1,336 options and an ILLUSTRATION for ~1,402. Never read this to
   * decide what an asset *is*; read `illustration` / `photos`.
   */
  image?: string;

  /** The technical drawing. Local path. Never a photo, never an SVG glyph. */
  illustration?: string;
  /** Set on every option by tools/decompose_option_assets.mjs. */
  illustrationStatus?: IllustrationStatus;
  /** Every photograph of this option, best first, de-duplicated. */
  photos?: string[];

  /**
   * This option's primary photo is byte-identical to a sibling's in the same
   * part+field, so it cannot show what makes them differ. Computed by
   * tools/image_collisions.mjs; the card then leads with the drawing.
   */
  photoAmbiguous?: boolean;

  /** @deprecated superseded by `illustration`; still read by the pipeline tooling. */
  techpackIllustration?: string;
  /** @deprecated folded into `photos`; still written by the admin's AI Render slot. */
  aiImage?: string;
  /** @deprecated folded into `photos`; still written by the admin's Real Photo slot. */
  realImage?: string;
  /** @deprecated folded into `photos`. Historically remote supplier CDN URLs. */
  images?: string[];

  /** Provenance + licence for this option's photography. */
  verification?: OptionVerification;
  /** Factory SKU mapping (Baoxiniao field/value) — an order attribute, not an image. */
  bxn?: { field: string; value: string; desc: string };

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
