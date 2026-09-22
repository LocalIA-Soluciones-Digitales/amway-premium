"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { PRODUCTS } from "@/data/products";

const FEATURED: { id: string; image: string }[] = [
  { id: "double-x", image: "/images/products/double-x.webp" },
  { id: "art-suero-vitamina-c", image: "/images/products/artistry-serum-vitamina-c.webp" },
  { id: "espring-mesón", image: "/images/products/espring.webp" },
  { id: "xs-elite-focus", image: "/images/products/xs-elite-focus.webp" },
];

export function BestSellers() {
  const items = FEATURED.map(({ id, image }) => {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return null;
    return { product, image };
  }).filter((x): x is { product: (typeof PRODUCTS)[number]; image: string } => x != null);

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 flex items-end justify-between gap-6"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
            Selección
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-carbon sm:text-6xl">
            Los imprescindibles.
          </h2>
        </div>
        <a
          href="/catalogo"
          className="hidden shrink-0 border-b border-carbon/30 pb-0.5 text-sm text-carbon transition hover:border-carbon sm:block"
        >
          Ver catálogo completo
        </a>
      </motion.div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-4">
        {items.map(({ product, image }, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="group flex flex-col"
          >
            <div className="relative aspect-square overflow-hidden bg-linen">
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              />
            </div>
            <p className="mt-5 text-[11px] uppercase tracking-wider text-stone">{product.brand}</p>
            <h3 className="mt-1 font-display text-lg leading-snug text-carbon">{product.name}</h3>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-carbon">{priceRangeLabel(product)}</span>
              <a
                href={waProductLink(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Consultar ${product.name} por WhatsApp`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-carbon/10 text-stone transition hover:border-forest/30 hover:bg-forest hover:text-cream"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
