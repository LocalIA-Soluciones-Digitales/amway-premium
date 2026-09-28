"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { cestaItemKey, MAX_QUANTITY_PER_LINE, useCesta } from "./CartProvider";
import { track } from "@/lib/analytics";

// Once the line is in the basket the button stays as a stepper showing how
// many units there are, so the shopper never has to open the basket to know.
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
  const { items, addItem, increase, decrease, removeItem, justAddedKey } = useCesta();
  const key = cestaItemKey({ productId, variantIndex, flavor });
  const quantity = items.find((i) => cestaItemKey(i) === key)?.quantity ?? 0;
  const flash = justAddedKey === key;
  const base = "flex h-9 items-center rounded-full text-xs font-medium transition";
  const colors = className ?? "bg-carbon text-cream hover:bg-carbon-soft";

  if (quantity > 0) {
    return (
      <div className={cn(base, "justify-between gap-1 px-1", colors)}>
        <button
          type="button"
          onClick={() => (quantity > 1 ? decrease(key) : removeItem(key))}
          aria-label={quantity > 1 ? "Quitar una unidad" : "Quitar de la cesta"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-current/15"
        >
          <Minus size={14} />
        </button>
        <span aria-live="polite" className="flex min-w-0 items-center gap-1 truncate">
          {flash && <Check size={13} className="shrink-0" />}
          <span className="tabular-nums">{quantity}</span>
          <span className="truncate">en la cesta</span>
        </span>
        <button
          type="button"
          onClick={() => {
            increase(key);
            track("add_to_cart", productId);
          }}
          disabled={quantity >= MAX_QUANTITY_PER_LINE}
          aria-label="Añadir una unidad"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-current/15 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem(productId, variantIndex, flavor);
        track("add_to_cart", productId);
      }}
      aria-label={ariaLabel ?? "Añadir a la cesta"}
      className={cn(base, "justify-center gap-1.5 px-3", colors)}
    >
      <ShoppingBag size={14} />
      <span>{label}</span>
    </button>
  );
}
