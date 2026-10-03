"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/data/types";
import { cheapestVariantIndex, productHref, productImageSrc } from "@/data/types";
import { getProductById } from "@/data/products";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { formatEUR } from "@/lib/currency";

// Productos concretos (no gamas): las gamas ya tienen su bloque en «Cuatro
// mundos» y en las secciones de XS, eSpring y Nutrilite más abajo.
const PICKS = [
  {
    id: "double-x",
    brand: "Nutrilite™",
    title: "Double X™",
    blurb: "12 vitaminas, 10 minerales y fitonutrientes de 22 plantas en tu pack diario.",
    label: "Insignia Nutrilite",
  },
  {
    id: "art-suero-vitamina-c",
    brand: "Artistry Skin Nutrition™",
    title: "Suero Vitamina C+HA3",
    blurb: "Luminosidad diaria y líneas finas más suavizadas.",
  },
  {
    id: "xs-power-drink-naranja",
    brand: "XS™",
    title: "Power Drink Orange Kumquat",
    blurb: "Sin azúcares y bajo en calorías. Pack de 12 latas.",
  },
  {
    id: "sat-anticaida",
    brand: "Satinique™",
    title: "Champú Anticaída",
    blurb: "Reduce la rotura un 55 % y devuelve el volumen.",
  },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

type Pick = (typeof PICKS)[number] & { product: Product; label?: string };

export function BestSellers() {
  const catalog = useCatalogState();
  const picks = PICKS.map((p) => ({ ...p, product: getProductById(p.id) }))
    .filter((p): p is Pick => Boolean(p.product) && !catalog.oculto(p.id));

  if (picks.length === 0) return null;
  const [featured, ...rest] = picks;
  const priceOf = (p: Product) => {
    const price = catalog.precio(p, cheapestVariantIndex(p));
    return price != null ? formatEUR(price) : "Consultar precio";
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 flex items-end justify-between gap-6 sm:mb-14"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">Selección</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-carbon sm:text-6xl">
            Los imprescindibles.
          </h2>
        </div>
        <Link
          href="/catalogo"
          className="hidden shrink-0 border-b border-carbon/30 pb-0.5 text-sm text-carbon transition hover:border-carbon sm:block"
        >
          Ver catálogo completo
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Destacado */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="lg:col-span-7"
        >
          <Link href={productHref(featured.product)} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-linen sm:aspect-[5/4]">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_48%,rgba(255,255,255,0.75),transparent_70%)]"
              />
              <span className="absolute left-6 top-6 z-10 text-xs font-medium uppercase tracking-[0.2em] text-forest sm:left-8 sm:top-8">
                {featured.label ? `01 · ${featured.label}` : "01"}
              </span>
              <ProductShot
                product={featured.product}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="p-10 sm:p-14"
              />
            </div>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-md">
                <p className="text-xs uppercase tracking-[0.18em] text-stone">{featured.brand}</p>
                <h3 className="mt-2 font-display text-3xl text-carbon sm:text-4xl">{featured.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone sm:text-base">{featured.blurb}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="font-display text-xl text-carbon">{priceOf(featured.product)}</span>
                <Arrow />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Lista */}
        <div className="flex flex-col border-t border-carbon/10 lg:col-span-5">
          {rest.map((pick, i) => (
            <motion.div
              key={pick.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: EASE }}
              className="border-b border-carbon/10 lg:flex-1"
            >
              <Link
                href={productHref(pick.product)}
                className="group flex h-full items-center gap-5 py-5 sm:gap-6 sm:py-6"
              >
                <div className="relative aspect-square w-24 shrink-0 overflow-hidden bg-linen sm:w-32">
                  <ProductShot product={pick.product} sizes="128px" className="p-3 sm:p-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone">
                    <span className="tabular-nums text-forest">{String(i + 2).padStart(2, "0")}</span>
                    <span className="mx-2 text-carbon/20">/</span>
                    {pick.brand}
                  </p>
                  <h3 className="mt-1.5 font-display text-xl leading-snug text-carbon transition-transform duration-300 group-hover:translate-x-1 sm:text-2xl">
                    {pick.title}
                  </h3>
                  <p className="mt-1 hidden text-sm text-stone sm:block">{pick.blurb}</p>
                  <p className="mt-2 text-sm text-carbon">{priceOf(pick.product)}</p>
                </div>
                <Arrow className="hidden sm:flex" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <Link
        href="/catalogo"
        className="mt-10 flex items-center justify-center gap-2 rounded-full border border-carbon/15 py-3.5 text-sm font-medium text-carbon transition hover:border-carbon/40 sm:hidden"
      >
        Ver catálogo completo
        <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}

function ProductShot({ product, sizes, className }: { product: Product; sizes: string; className: string }) {
  const src = productImageSrc(product);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={product.name}
      fill
      sizes={sizes}
      className={`object-contain ${className} transition-transform duration-700 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04]`}
    />
  );
}

function Arrow({ className = "flex" }: { className?: string }) {
  return (
    <span
      className={`${className} h-11 w-11 shrink-0 items-center justify-center rounded-full border border-carbon/15 text-carbon transition group-hover:border-forest group-hover:bg-forest group-hover:text-cream`}
    >
      <ArrowUpRight size={17} />
    </span>
  );
}
