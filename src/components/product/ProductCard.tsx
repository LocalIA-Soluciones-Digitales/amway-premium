"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Bell, ChevronDown, ClipboardList, MessageCircle, Star } from "lucide-react";
import type { Product } from "@/data/types";
import { cheapestVariantIndex, productImageSrc } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { formatEUR } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { SolicitudModal } from "@/components/catalog/SolicitudModal";

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
  const [variantIndex, setVariantIndex] = useState(() => cheapestVariantIndex(product));
  // Mounted on first open only, so 190 cards don't each carry a dialog.
  const [solicitud, setSolicitud] = useState<{ mounted: boolean; open: boolean }>({ mounted: false, open: false });
  const catalog = useCatalogState();
  const variant = product.variants[variantIndex];
  const price = catalog.precio(product, variantIndex);
  const agotado = catalog.agotado(product.id);
  const rating = catalog.valoracion(product.id);
  const imageSrc = productImageSrc(product);
  const hasOptions = product.variants.length > 1;

  if (catalog.oculto(product.id)) return null;

  const openSolicitud = () => setSolicitud({ mounted: true, open: true });

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex h-full flex-col"
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
        {agotado && (
          <span className="absolute right-0 top-0 z-10 bg-xs-red px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
            Agotado
          </span>
        )}
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={cn(
              "object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-[1.06] sm:p-8",
              agotado && "opacity-60 grayscale-[35%]"
            )}
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

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wider text-stone">{product.brand}</p>
          {rating && (
            <span
              className="flex items-center gap-1 text-[11px] tabular-nums text-stone"
              aria-label={`Valoración ${rating.media} de 5 (${rating.total} opiniones)`}
            >
              <Star size={11} className="fill-gold text-gold" />
              {rating.media.toFixed(1)}
              <span className="text-stone/70">({rating.total})</span>
            </span>
          )}
        </div>
        {/* Always reserves two lines so price and buttons line up across a row. */}
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.8em] font-display text-base leading-[1.4] text-carbon sm:text-lg">
          {product.name}
        </h3>

        <div className="mt-auto pt-3">
          <p className="text-sm font-medium tabular-nums text-carbon">
            {price != null ? formatEUR(price) : "Consultar precio"}
          </p>

          {/* Format row: plain text for one variant, a selector for several.
              Same height either way so every card keeps the same rhythm. */}
          <div className="relative mt-1 flex h-7 items-center border-b border-carbon/10">
            <span className="min-w-0 flex-1 truncate text-xs text-stone">{variant.size}</span>
            {hasOptions && (
              <>
                <ChevronDown size={14} className="pointer-events-none shrink-0 text-stone" />
                {/* Transparent native select on top: native picker on phones,
                    16px font so iOS never zooms, visual stays at text-xs. */}
                <select
                  value={variantIndex}
                  onChange={(e) => setVariantIndex(Number(e.target.value))}
                  aria-label={`Formato de ${product.name}`}
                  className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0"
                  style={{ fontSize: 16 }}
                >
                  {product.variants.map((v, i) => {
                    const optionPrice = catalog.precio(product, i);
                    return (
                      <option key={i} value={i}>
                        {v.size}
                        {optionPrice != null ? ` — ${formatEUR(optionPrice)}` : ""}
                      </option>
                    );
                  })}
                </select>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            {price != null && !agotado ? (
              <AddToCartButton
                productId={product.id}
                variantIndex={variantIndex}
                ariaLabel={`Añadir ${product.name} a la cesta`}
                className="min-w-0 flex-1 bg-carbon text-cream hover:bg-carbon-soft"
              />
            ) : (
              <button
                type="button"
                onClick={openSolicitud}
                className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-forest px-3 text-xs font-medium text-cream transition hover:bg-forest-dim"
              >
                {agotado ? <Bell size={14} /> : <ClipboardList size={14} />}
                {agotado ? "Avisarme" : "Solicitar"}
              </button>
            )}
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

      {solicitud.mounted && (
        <SolicitudModal
          open={solicitud.open}
          onClose={() => setSolicitud({ mounted: true, open: false })}
          tipo={agotado ? "agotado" : "encargo"}
          product={product}
          variantIndex={variantIndex}
        />
      )}
    </motion.article>
  );
}
