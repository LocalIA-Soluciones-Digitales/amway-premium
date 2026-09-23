"use client";

import { Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { cestaItemKey, useCesta } from "./CartProvider";
import { track } from "@/lib/analytics";

export function AddToCartButton({
  productId,
  variantIndex = 0,
  flavor = "",
  className,
  label = "Añadir",
  ariaLabel,
}: {
  productId: string;
  variantIndex?: number;
  flavor?: string;
  className?: string;
  label?: string;
  ariaLabel?: string;
}) {
  const { addItem, justAddedKey } = useCesta();
  const added = justAddedKey === cestaItemKey({ productId, variantIndex, flavor });

  return (
    <button
      type="button"
      onClick={() => {
        addItem(productId, variantIndex, flavor);
        track("add_to_cart", productId);
      }}
      aria-label={ariaLabel ?? "Añadir a la cesta"}
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
        className ?? "bg-carbon text-cream hover:bg-carbon-soft"
      )}
    >
      {added ? <Check size={14} /> : <ShoppingBag size={14} />}
      <span aria-live="polite">{added ? "Añadido" : label}</span>
    </button>
  );
}
