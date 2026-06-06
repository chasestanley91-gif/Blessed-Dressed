export type SizeStock = {
  size: string;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  sizes: string[];
  stockBySize: SizeStock[];
  image: string;
  images?: string[];
  tag: string;
};

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "r1",
    name: "Navy Cashmere Blazer",
    subtitle: "Ready-to-wear luxury for every season.",
    price: 895,
    sizes: ["36R", "38R", "40R", "42R"],
    stockBySize: [
      { size: "36R", stock: 2 },
      { size: "38R", stock: 5 },
      { size: "40R", stock: 0 },
      { size: "42R", stock: 3 },
    ],
    image: "/images/builder-heroes/sport-coat.jpg",
    tag: "Classic",
  },
  {
    id: "r2",
    name: "Ivory Linen Shirt",
    subtitle: "Bespoke-inspired ready-to-wear shirt.",
    price: 245,
    sizes: ["S", "M", "L", "XL"],
    stockBySize: [
      { size: "S", stock: 4 },
      { size: "M", stock: 4 },
      { size: "L", stock: 1 },
      { size: "XL", stock: 0 },
    ],
    image: "/images/builder-heroes/shirt.jpg",
    tag: "Essential",
  },
];

export const readyToWear: Product[] = FALLBACK_PRODUCTS;
