export type DesignOption = {
  id: string;
  label: string;
  description: string;
  priceAdj?: number;
  image?: string;
  images?: string[];
};

export type DesignField = {
  id: string;
  label: string;
  hint?: string;
  options: DesignOption[];
  advanced?: boolean;
  defaultValue: string;
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
