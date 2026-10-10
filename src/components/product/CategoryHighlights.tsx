"use client";

import Image from "next/image";
import Link from "next/link";
import { m as motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/data/types";
import { cheapestVariantIndex, productHref, productImageSrc } from "@/data/types";
import { HighlightVideo } from "@/components/product/HighlightVideo";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatEUR } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type HighlightItem = {
  product: Product;
  tag: string;
  /** Vídeo en bucle; sin él se muestra el producto flotando sobre lino. */
  video?: string;
  poster?: string;
  /** CSS object-position del recorte cuadrado del vídeo. */
  position?: string;
  link?: { href: string; label: string };
};

const ACCENTS = {
  forest: { text: "text-forest", hover: "group-hover:border-forest group-hover:bg-forest group-hover:text-cream" },
  gold: { text: "text-gold", hover: "group-hover:border-gold group-hover:bg-gold group-hover:text-cream" },
  tech: { text: "text-tech", hover: "group-hover:border-tech group-hover:bg-tech group-hover:text-cream" },
} as const;

const EASE = [0.16, 1, 0.3, 1] as const;

export function CategoryHighlights({
  eyebrow,
  title,
  accent,
  items,
}: {
  eyebrow: string;
  title: string;
  accent: keyof typeof ACCENTS;
  items: HighlightItem[];
}) {
  const catalog = useCatalogState();
  const a = ACCENTS[accent];
  const visible = items.filter((i) => !catalog.oculto(i.product.id));
  if (visible.length === 0) return null;

  return (
    <section className="border-b border-carbon/10 bg-cream-soft pb-10 pt-16 sm:pb-20 sm:pt-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className={cn("text-xs font-medium uppercase tracking-[0.22em]", a.text)}>{eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl leading-[1.05] text-carbon sm:text-5xl">{title}</h2>
          </div>
          <a
            href="#catalogo"
            className="hidden shrink-0 border-b border-carbon/30 pb-0.5 text-sm text-carbon transition hover:border-carbon sm:block"
          >
            Ver todo el catálogo
          </a>
        </div>

        {/* Fila deslizable en móvil (asoma la siguiente), tres columnas desde sm. */}
        <div className="no-scrollbar -mx-6 mt-10 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0 sm:pb-0">
          {visible.map((item, i) => {
            const { product } = item;
            const price = catalog.precio(product, cheapestVariantIndex(product));
            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                className="group w-[82%] shrink-0 snap-start sm:w-auto"
              >
                <Link href={productHref(product)} aria-label={`Ver ${product.name}`} className="block overflow-hidden">
                  {item.video && item.poster ? (
                    <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                      <HighlightVideo src={item.video} poster={item.poster} label={product.name} position={item.position} />
                    </div>
                  ) : (
                    <FloatingShot product={product} delay={i * 0.6} />
                  )}
                </Link>

                <div className="pt-5">
                  <p className={cn("text-[11px] font-medium uppercase tracking-[0.18em]", a.text)}>{item.tag}</p>
                  <Link href={productHref(product)}>
                    <h3 className="mt-2 font-display text-lg leading-snug text-carbon sm:text-xl">{product.name}</h3>
                  </Link>
                  <div className="mt-4 flex items-center justify-between border-t border-carbon/10 pt-4">
                    <span className="text-sm text-carbon">
                      {price != null ? formatEUR(price) : "Consultar precio"}
                    </span>
                    <Link
                      href={productHref(product)}
                      className="inline-flex items-center gap-2 text-sm text-carbon"
                    >
                      Ver producto
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border border-carbon/15 transition",
                          a.hover
                        )}
                      >
                        <ArrowUpRight size={15} />
                      </span>
                    </Link>
                  </div>
                  {item.link && (
                    <Link
                      href={item.link.href}
                      className={cn("mt-3 inline-block text-xs underline-offset-4 hover:underline", a.text)}
                    >
                      {item.link.label}
                    </Link>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Mientras no haya vídeo: el envase flotando suavemente sobre lino. */
function FloatingShot({ product, delay }: { product: Product; delay: number }) {
  const reduced = usePrefersReducedMotion();
  const src = productImageSrc(product);
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-linen">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_45%,rgba(255,255,255,0.8),transparent_70%)]"
      />
      {/* Sombra que respira con el envase */}
      <motion.div
        aria-hidden
        className="absolute bottom-[12%] left-1/2 h-4 w-1/3 -translate-x-1/2 rounded-[50%] bg-carbon/15 blur-md"
        animate={reduced ? undefined : { scaleX: [1, 0.82, 1], opacity: [0.9, 0.55, 0.9] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
      />
      {src && (
        <motion.div
          className="absolute inset-0"
          animate={reduced ? undefined : { y: [0, -12, 0], rotate: [0, -1.2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
        >
          <Image
            src={src}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 82vw, 33vw"
            className="object-contain p-12 transition-transform duration-700 ease-out group-hover:scale-[1.05] sm:p-14"
          />
        </motion.div>
      )}
    </div>
  );
}
