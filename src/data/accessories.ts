export type Accessory = {
  id: string;
  name: string;
  price: number;
  image: string;
};

const fallback: Accessory[] = [
  {
    id: "a1",
    name: "Silk Tie",
    price: 85,
    image: "https://placehold.co/600x480/0B1B2E/D4AF37?text=Silk+Tie",
  },
  {
    id: "a2",
    name: "Leather Shoes",
    price: 360,
    image: "https://placehold.co/600x480/0B1B2E/D4AF37?text=Leather+Shoes",
  },
  {
    id: "a3",
    name: "Pocket Square",
    price: 45,
    image: "https://placehold.co/600x480/0B1B2E/D4AF37?text=Pocket+Square",
  },
];

export const accessories: Accessory[] = fallback;
