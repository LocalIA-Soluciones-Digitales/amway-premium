"use client";

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCesta } from "./CartProvider";
import { track } from "@/lib/analytics";

export function CartButton({ dark }: { dark: boolean }) {
  const { openCesta, totalUnits, cestaVersion, isLoaded } = useCesta();
  const count = isLoaded ? totalUnits : 0;

  return (
    <button
      type="button"
      onClick={() => {
        openCesta();
        track("cart_open");
      }}
      aria-label={count > 0 ? `Abrir cesta (${count} producto${count === 1 ? "" : "s"})` : "Abrir cesta"}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full border transition",
        dark ? "border-cream/30 text-cream hover:bg-cream/10" : "border-carbon/15 text-carbon hover:bg-carbon/5"
      )}
    >
      {/* Re-keyed on every add so the bag gives a small bump, like Arrantza. */}
      <motion.span
        key={cestaVersion}
        initial={cestaVersion > 0 ? { scale: 0.7 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="flex"
      >
        <ShoppingBag size={18} />
      </motion.span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest px-1 text-[10px] font-semibold tabular-nums text-cream">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
