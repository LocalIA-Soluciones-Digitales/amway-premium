"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import type { Product } from "@/data/types";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { cn } from "@/lib/utils";

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

// Source photos extracted from the catalog vary wildly in native resolution.
// Stretching a ~100px source to fill a 300px+ card looks blurry, so anything
// below this bar renders at its true size instead of being scaled up.
const MIN_SHARP_DIMENSION = 180;

function parseImageSize(image: string): { width: number; height: number } | null {
  const match = image.match(/_(\d+)x(\d+)\.webp$/);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const size = product.image ? parseImageSize(product.image) : null;
  const isSharp = size ? Math.min(size.width, size.height) >= MIN_SHARP_DIMENSION : false;
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-graphite/40 transition-colors hover:border-white/20"
    >
      {product.badge && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-obsidian">
          {product.badge}
        </span>
      )}

      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br from-graphite-soft to-obsidian-soft p-6">
        {product.image && size && isSharp ? (
          <Image
            src={`/images/catalog/${product.image}`}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : product.image && size ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="absolute h-24 w-24 rounded-full bg-white/[0.04] blur-2xl" />
            <Image
              src={`/images/catalog/${product.image}`}
              alt={product.name}
              width={size.width}
              height={size.height}
              className="relative max-h-[45%] w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full text-lg font-display",
              "bg-white/5 text-white/70 ring-1 ring-white/10"
            )}
          >
            {BRAND_INITIALS[product.brand] ?? product.brand.slice(0, 2)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] uppercase tracking-wider text-wellness">{product.brand}</p>
        <h3 className="line-clamp-2 font-display text-base leading-snug text-paper">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-mist">{product.description}</p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-medium text-paper">{priceRangeLabel(product)}</span>
          <a
            href={waProductLink(product.name)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Consultar ${product.name} por WhatsApp`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-mist transition hover:bg-wellness hover:text-obsidian"
          >
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </motion.article>
  );
}
