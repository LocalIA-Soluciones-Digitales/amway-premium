"use client";

import { useEffect } from "react";
import { useCesta } from "./CartProvider";

// Rendered on the Stripe success page: the order is paid, so the basket
// that produced it is emptied (once it has been read from storage).
export function ClearCartOnMount() {
  const { isLoaded, clearCesta } = useCesta();
  useEffect(() => {
    if (isLoaded) clearCesta();
  }, [isLoaded, clearCesta]);
  return null;
}
