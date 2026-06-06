export type OrderStatus = "Pending" | "In Production" | "Shipped" | "Delivered" | "Cancelled";
export type OrderType = "Bespoke" | "Ready-to-Wear" | "Accessory";

export type OrderItemConfig = {
  fabric?: string;
  fabricLabel?: string;
  designSelections?: Record<string, string>;
  measureMode?: "standard" | "custom";
  standardSize?: string;
  customMeasurements?: Record<string, string>;
  monograms?: Array<{ text: string; font: string; threadColor: string; placement: string; size: string }>;
};

export type OrderItem = {
  name: string;
  type: OrderType;
  qty: number;
  price: number;
  config?: OrderItemConfig;
};

export type Order = {
  id: string;
  customer: string;
  email: string;
  phone?: string;
  address?: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  notes?: string;
};

const fallback: Order[] = [
  {
    id: "ORD-0041",
    customer: "Marcus Whitfield",
    email: "m.whitfield@example.com",
    date: "2026-05-14",
    status: "In Production",
    items: [
      { name: "Bespoke 3-Piece Suit — Charcoal Hopsack", type: "Bespoke", qty: 1, price: 2400 },
    ],
    total: 2400,
  },
  {
    id: "ORD-0040",
    customer: "David Osei",
    email: "d.osei@example.com",
    date: "2026-05-13",
    status: "Pending",
    items: [
      { name: "Bespoke Vest — Navy Herringbone", type: "Bespoke", qty: 1, price: 680 },
      { name: "Silk Tie", type: "Accessory", qty: 2, price: 85 },
    ],
    total: 850,
  },
  {
    id: "ORD-0039",
    customer: "James Thornton",
    email: "j.thornton@example.com",
    date: "2026-05-11",
    status: "Shipped",
    items: [
      { name: "Navy Cashmere Blazer", type: "Ready-to-Wear", qty: 1, price: 895 },
      { name: "Pocket Square", type: "Accessory", qty: 1, price: 45 },
    ],
    total: 940,
  },
  {
    id: "ORD-0038",
    customer: "Emmanuel Asante",
    email: "e.asante@example.com",
    date: "2026-05-09",
    status: "Delivered",
    items: [
      { name: "Bespoke Shirt — White Royal Oxford", type: "Bespoke", qty: 2, price: 320 },
    ],
    total: 640,
  },
  {
    id: "ORD-0037",
    customer: "Nathan Clarke",
    email: "n.clarke@example.com",
    date: "2026-05-07",
    status: "Delivered",
    items: [
      { name: "Ivory Linen Shirt", type: "Ready-to-Wear", qty: 1, price: 245 },
      { name: "Leather Shoes", type: "Accessory", qty: 1, price: 360 },
    ],
    total: 605,
  },
  {
    id: "ORD-0036",
    customer: "Christopher Mensah",
    email: "c.mensah@example.com",
    date: "2026-05-04",
    status: "Delivered",
    items: [
      { name: "Bespoke Trousers — Mid-Grey Flannel", type: "Bespoke", qty: 1, price: 485 },
    ],
    total: 485,
  },
  {
    id: "ORD-0035",
    customer: "Samuel Adeyemi",
    email: "s.adeyemi@example.com",
    date: "2026-04-30",
    status: "Cancelled",
    items: [
      { name: "Bespoke Suit — Black Barathea", type: "Bespoke", qty: 1, price: 2200 },
    ],
    total: 2200,
  },
];

export const orders: Order[] = fallback;
