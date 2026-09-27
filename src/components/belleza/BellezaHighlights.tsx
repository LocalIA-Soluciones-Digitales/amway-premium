"use client";

import type { Product } from "@/data/types";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { HighlightVideo } from "@/components/product/HighlightVideo";

export function BellezaHighlights({
  items,
}: {
  items: { product: Product; video: string; poster: string }[];
}) {
  return (
    // Swipeable row on phones (next card peeks in), three-column grid from sm up.
    <div className="no-scrollbar -mx-6 mt-8 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
      {items.map(({ product, video, poster }) => (
        <div key={product.id} className="w-[82%] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-carbon sm:w-auto">
          <HighlightVideo src={video} poster={poster} label={product.name} />
          <div className="p-5">
            <h3 className="font-display text-lg text-cream">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-cream/55">{product.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-cream">{priceRangeLabel(product)}</span>
              <a
                href={waProductLink(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 transition hover:bg-gold hover:text-carbon"
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
