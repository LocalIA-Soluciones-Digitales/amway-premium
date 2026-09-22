"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import type { Product } from "@/data/types";
import { priceRangeLabel, directCheckoutPrice } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { cn } from "@/lib/utils";
import { BuyButton } from "./BuyButton";

const BRAND_INITIALS: Record<string, string> = {
  Nutrilite: "N",
  XS: "XS",
  Artistry: "A",
  Satinique: "S",
  "g&h": "gh",
  Glister: "G",
  eSpring: "e",
  Atmosphere: "At",
  iCook: "iC",
  "Amway Home": "AH",
};

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const canBuyDirectly = directCheckoutPrice(product) != null;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col"
    >
      <a
        href={waProductLink(product.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-linen"
      >
        {product.badge && (
          <span className="absolute left-0 top-0 z-10 bg-carbon px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
            {product.badge}
          </span>
        )}
        {product.image ? (
          <Image
            src={product.image.includes("/") ? `/images/${product.image}` : `/images/catalog/${product.image}`}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-sm font-display text-stone ring-1 ring-carbon/8">
            {BRAND_INITIALS[product.brand] ?? product.brand.slice(0, 2)}
          </div>
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-cream text-carbon opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100">
          <ArrowUpRight size={16} />
        </span>
      </a>

      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        <p className="text-[11px] uppercase tracking-wider text-stone">{product.brand}</p>
        <h3 className="line-clamp-2 font-display text-lg leading-snug text-carbon">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-carbon">{priceRangeLabel(product)}</span>
          <div className="flex items-center gap-1.5">
            {canBuyDirectly && <BuyButton productId={product.id} />}
            <a
              href={waProductLink(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Consultar ${product.name} por WhatsApp`}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-carbon/10 text-stone transition",
                "hover:border-forest/30 hover:bg-forest hover:text-cream"
              )}
            >
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
