"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

interface Props {
  id: string;
  name: string;
  price: number;
  image?: string;
  type?: "rtw" | "accessory";
  size?: string;
}

export default function AddToCartButton({ id, name, price, image, type = "rtw" }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ id, name, price, image, type });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`font-sans rounded-full px-6 py-3 text-sm font-semibold transition-[background,opacity,transform] duration-200 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong ${
        added
          ? "bg-[#1a3a1a] text-[#4ade80]"
          : "bg-gold text-background shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
      }`}
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
