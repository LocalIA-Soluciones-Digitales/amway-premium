"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cestaItemKey, MAX_QUANTITY_PER_LINE, useCesta } from "./CartProvider";
import { track } from "@/lib/analytics";

// Once the line is in the basket the button turns into an outlined stepper
// with the unit count, so the shopper sees at a glance what they already have.
export function AddToCartButton({
  productId,
  variantIndex = 0,
  flavor = "",
  className,
  stepperClassName,
  label = "Añadir",
  ariaLabel,
}: {
  productId: string;
  variantIndex?: number;
  flavor?: string;
  className?: string;
  /** Colores del selector de cantidad, que se distingue del botón de añadir. */
  stepperClassName?: string;
  label?: string;
  ariaLabel?: string;
}) {
  const { items, addItem, increase, decrease, removeItem } = useCesta();
  const key = cestaItemKey({ productId, variantIndex, flavor });
  const quantity = items.find((i) => cestaItemKey(i) === key)?.quantity ?? 0;
  const base = "flex h-9 items-center rounded-full text-xs font-medium transition";
  const colors = className ?? "bg-carbon text-cream hover:bg-carbon-soft";

  if (quantity > 0) {
    const stepBtn =
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition disabled:opacity-30";
    return (
      <div
        className={cn(
          base,
          "justify-between px-1",
          className,
          stepperClassName ?? "border border-carbon/20 bg-white text-carbon hover:bg-white"
        )}
      >
        <button
          type="button"
          onClick={() => (quantity > 1 ? decrease(key) : removeItem(key))}
          aria-label={quantity > 1 ? "Quitar una unidad" : "Quitar de la cesta"}
          className={cn(stepBtn, "hover:bg-current/10")}
        >
          {quantity > 1 ? <Minus size={14} /> : <Trash2 size={13} />}
        </button>
        <span aria-live="polite" aria-label={`${quantity} en la cesta`} className="text-sm font-semibold tabular-nums">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => {
            increase(key);
            track("add_to_cart", productId);
          }}
          disabled={quantity >= MAX_QUANTITY_PER_LINE}
          aria-label="Añadir una unidad"
          className={cn(stepBtn, "hover:bg-current/10")}
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
