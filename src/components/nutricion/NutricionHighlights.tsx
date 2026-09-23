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
    // Swipeable row on phones (next card peeks in), three-column grid from sm up.
    <div className="no-scrollbar -mx-6 mt-8 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
      {items.map(({ product, image, tag }) => (
        <div key={product.id} className="w-[82%] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-carbon sm:w-auto">
          <NutriliteBotanical image={image} />
          <div className="p-5">
            <p className="text-[11px] uppercase tracking-wide text-forest-soft">{tag}</p>
            <h3 className="mt-2 font-display text-lg text-cream">{product.name}</h3>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-cream">{priceRangeLabel(product)}</span>
              <a
                href={waProductLink(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 transition hover:bg-forest hover:text-cream"
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
