"use client";

import dynamic from "next/dynamic";
import type { Product } from "@/data/types";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";

const NutriliteBotanical = dynamic(
  () => import("@/components/animated/NutriliteBotanical").then((m) => m.NutriliteBotanical),
  { ssr: false }
);

export function NutricionHighlights({
  items,
}: {
  items: { product: Product; image: string; tag: string }[];
}) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {items.map(({ product, image, tag }) => (
        <div key={product.id} className="overflow-hidden rounded-3xl border border-white/8 bg-graphite/30">
          <NutriliteBotanical image={image} />
          <div className="p-5">
            <p className="text-[11px] uppercase tracking-wide text-wellness">{tag}</p>
            <h3 className="mt-2 font-display text-lg text-paper">{product.name}</h3>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-paper">{priceRangeLabel(product)}</span>
              <a
                href={waProductLink(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/5 px-4 py-2 text-xs text-mist transition hover:bg-wellness hover:text-obsidian"
              >
                Consultar
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
