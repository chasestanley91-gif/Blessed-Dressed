"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";

/**
 * Clears the cart exactly once, after a verified successful payment.
 * A server component can't touch localStorage, so this tiny client island
 * runs the clear on mount. The ref guards React 18 Strict Mode's
 * double-invoke in development from clearing twice (harmless here, but
 * keeps the intent — "clear once" — honest).
 */
export default function ClearCartOnMount() {
  const { clearCart } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
