"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type CartItemType = "rtw" | "bespoke" | "accessory";

export type BespokeMonogram = {
  text: string;
  font: string;
  threadColor: string;
  placement: string;
  size: string;
};

export type BespokeConfig = {
  fabric: string;
  fabricLabel: string;
  designSelections: Record<string, string>;
  measureMode: "standard" | "body" | "finished";
  standardSize?: string;
  customMeasurements?: Record<string, string>;
  chestAllowance?: string;
  wearingHabit?: string;
  postureAdjustments?: Record<string, string>;
  monograms?: BespokeMonogram[];
};

export type CartItem = {
  cartId: string;
  id: string;
  name: string;
  price: number;
  image?: string;
  type: CartItemType;
  qty: number;
  size?: string;
  config?: BespokeConfig;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartId" | "qty"> & { qty?: number }) => void;
  removeItem: (cartId: string) => void;
  updateQty: (cartId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "bd_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((incoming: Omit<CartItem, "cartId" | "qty"> & { qty?: number }) => {
    setItems((prev) => {
      // For RTW/accessory items with the same id+size, increment qty instead
      if (incoming.type !== "bespoke") {
        const match = prev.find(
          (x) => x.id === incoming.id && x.type === incoming.type && x.size === incoming.size
        );
        if (match) {
          return prev.map((x) =>
            x.cartId === match.cartId ? { ...x, qty: x.qty + (incoming.qty ?? 1) } : x
          );
        }
      }
      return [
        ...prev,
        {
          ...incoming,
          qty: incoming.qty ?? 1,
          cartId: `${incoming.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setItems((prev) => prev.filter((x) => x.cartId !== cartId));
  }, []);

  const updateQty = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((x) => x.cartId !== cartId));
    } else {
      setItems((prev) => prev.map((x) => (x.cartId === cartId ? { ...x, qty } : x)));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, x) => s + x.qty, 0);
  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
