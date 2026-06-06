export type Collection = {
  slug: string;
  title: string;
  banner: string;
  image: string;
};

const fallback: Collection[] = [
  {
    slug: "winter-atelier",
    title: "Winter Atelier",
    banner: "Seasonal tailoring in navy and cream.",
    image: "https://placehold.co/1200x675/0B1B2E/D4AF37?text=Winter+Atelier",
  },
  {
    slug: "heritage-luxe",
    title: "Heritage Luxe",
    banner: "Timeless silhouettes for the modern gentleman.",
    image: "https://placehold.co/1200x675/0B1B2E/D4AF37?text=Heritage+Luxe",
  },
];

export const collections: Collection[] = fallback;
