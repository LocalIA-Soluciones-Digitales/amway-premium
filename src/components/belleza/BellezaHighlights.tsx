"use client";

import dynamic from "next/dynamic";
import type { Product } from "@/data/types";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";

const ArtistryGlow = dynamic(
  () => import("@/components/animated/ArtistryGlow").then((m) => m.ArtistryGlow),
  { ssr: false }
);

export function BellezaHighlights({ items }: { items: { product: Product; image: string }[] }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
      {items.map(({ product, image }) => (
        <div key={product.id} className="overflow-hidden rounded-3xl border border-white/8 bg-graphite/30">
          <ArtistryGlow image={image} />
          <div className="p-5">
            <h3 className="font-display text-lg text-paper">{product.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-mist">{product.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-paper">{priceRangeLabel(product)}</span>
              <a
                href={waProductLink(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/5 px-4 py-2 text-xs text-mist transition hover:bg-gold hover:text-obsidian"
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
