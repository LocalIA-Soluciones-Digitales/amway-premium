"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, ChevronRight, ClipboardList, CreditCard, MessageCircle, ShieldCheck, Star, Store } from "lucide-react";
import type { Product } from "@/data/types";
import { cheapestVariantIndex, productImageSrc } from "@/data/types";
import { SITE, waProductLink } from "@/data/site-config";
import { formatEUR } from "@/lib/currency";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { SolicitudModal } from "@/components/catalog/SolicitudModal";

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-carbon/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-xl text-carbon">{title}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-stone transition-transform duration-300", open && "rotate-180")} />
      </button>
      {/* grid-rows 0fr → 1fr anima la altura sin medirla. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-6 text-[15px] leading-relaxed text-carbon/80">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetail({
  product,
  categoryLabel,
  categoryHref,
}: {
  product: Product;
  categoryLabel: string;
  categoryHref: string;
}) {
  const [variantIndex, setVariantIndex] = useState(() => cheapestVariantIndex(product));
  const [solicitud, setSolicitud] = useState(false);
  const catalog = useCatalogState();
  const variant = product.variants[variantIndex];
  const price = catalog.precio(product, variantIndex);
  const agotado = catalog.agotado(product.id);
  const rating = catalog.valoracion(product.id);
  const imageSrc = productImageSrc(product);
  const hasOptions = product.variants.length > 1;
  const skus = Array.from(new Set(product.variants.map((v) => v.sku).filter(Boolean)));

  if (catalog.oculto(product.id)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center sm:px-8">
        <p className="font-display text-3xl text-carbon">Este producto no está disponible ahora mismo.</p>
        <p className="mt-3 text-stone">Echa un vistazo al resto del catálogo o pregúntanos por WhatsApp.</p>
        <Link
          href={categoryHref}
          className="mt-8 inline-flex rounded-full bg-carbon px-6 py-3 text-sm font-medium text-cream transition hover:bg-carbon-soft"
        >
          Ver {categoryLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8">
      <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 text-xs text-stone">
        <Link href="/catalogo" className="shrink-0 transition hover:text-carbon">
          Catálogo
        </Link>
        <ChevronRight size={12} className="shrink-0" />
        <Link href={categoryHref} className="shrink-0 transition hover:text-carbon">
          {categoryLabel}
        </Link>
        <ChevronRight size={12} className="shrink-0" />
        <span className="truncate text-carbon/70">{product.subcategory}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-linen">
            {product.badge && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-carbon px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                {product.badge}
              </span>
            )}
            {agotado && (
              <span className="absolute right-4 top-4 z-10 rounded-full bg-xs-red px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                Agotado
              </span>
            )}
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={cn("object-contain p-10 sm:p-16", agotado && "opacity-60 grayscale-[35%]")}
              />
            ) : (
              <p className="font-display text-4xl text-stone">{product.brand}</p>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone">{product.brand}</p>
          <h1 className="mt-2 font-display text-3xl leading-[1.15] text-carbon sm:text-4xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone">
            {variant.sku && <span>Referencia {variant.sku}</span>}
            {!hasOptions && <span>Tamaño: {variant.size}</span>}
            {rating && (
              <a href="/opiniones" className="flex items-center gap-1 tabular-nums transition hover:text-carbon">
                <Star size={13} className="fill-gold text-gold" />
                {rating.media.toFixed(1)} ({rating.total} opiniones)
              </a>
            )}
          </div>

          <p className="mt-6 font-display text-4xl tabular-nums text-carbon">
            {price != null ? formatEUR(price) : "Consultar precio"}
          </p>
          {price != null && <p className="mt-1 text-xs text-stone">IVA incluido · sin gastos de envío</p>}

          {hasOptions && (
            <fieldset className="mt-7">
              <legend className="text-sm font-medium text-carbon">Formato</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((v, i) => {
                  const optionPrice = catalog.precio(product, i);
                  const active = i === variantIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setVariantIndex(i)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-2xl border px-4 py-2.5 text-left text-sm transition",
                        active ? "border-carbon bg-carbon text-cream" : "border-carbon/15 text-carbon hover:border-carbon/40"
                      )}
                    >
                      <span className="block">{v.size}</span>
                      {optionPrice != null && (
                        <span className={cn("block text-xs tabular-nums", active ? "text-cream/70" : "text-stone")}>
                          {formatEUR(optionPrice)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <p className={cn("mt-7 flex items-center gap-2 text-sm font-medium", agotado ? "text-xs-red" : "text-forest")}>
            <span className={cn("h-2 w-2 rounded-full", agotado ? "bg-xs-red" : "bg-forest")} />
            {agotado ? "Agotado temporalmente" : `Disponible para recoger en ${SITE.city}`}
          </p>

          <div className="mt-4 flex items-center gap-2">
            {price != null && !agotado ? (
              <AddToCartButton
                productId={product.id}
                variantIndex={variantIndex}
                label="Añadir a la cesta"
                ariaLabel={`Añadir ${product.name} a la cesta`}
                className="h-12 min-w-0 flex-1 bg-carbon text-sm text-cream hover:bg-carbon-soft"
              />
            ) : (
              <button
                type="button"
                onClick={() => setSolicitud(true)}
                className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-forest px-4 text-sm font-medium text-cream transition hover:bg-forest-dim"
              >
                {agotado ? <Bell size={16} /> : <ClipboardList size={16} />}
                {agotado ? "Avísame cuando vuelva" : "Solicitar este producto"}
              </button>
            )}
            <a
              href={waProductLink(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", `producto:${product.id}`)}
              aria-label={`Consultar ${product.name} por WhatsApp`}
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-carbon/15 px-4 text-sm font-medium text-carbon transition hover:border-forest hover:bg-forest hover:text-cream"
            >
              <MessageCircle size={17} />
              <span className="hidden sm:inline">Consultar</span>
            </a>
          </div>

          <ul className="mt-8 grid gap-3 rounded-2xl bg-linen p-5 text-sm text-carbon/80 sm:grid-cols-3 sm:gap-4">
            <li className="flex items-start gap-2.5 sm:flex-col sm:gap-2">
              <Store size={18} className="shrink-0 text-forest" />
              Recogida en nuestro local, {SITE.horario.texto}
            </li>
            <li className="flex items-start gap-2.5 sm:flex-col sm:gap-2">
              <CreditCard size={18} className="shrink-0 text-forest" />
              Paga con tarjeta en la web o en efectivo al recoger
            </li>
            <li className="flex items-start gap-2.5 sm:flex-col sm:gap-2">
              <ShieldCheck size={18} className="shrink-0 text-forest" />
              Producto original Amway con garantía de satisfacción
            </li>
          </ul>

          <div className="mt-8 border-t border-carbon/10">
            <Section title="Vista general" defaultOpen>
              <p>{product.description}</p>
            </Section>
            <Section title="Detalles">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
                <dt className="text-stone">Marca</dt>
                <dd>{product.brand}</dd>
                <dt className="text-stone">Categoría</dt>
                <dd>
                  <Link href={categoryHref} className="underline-offset-4 hover:underline">
                    {categoryLabel}
                  </Link>{" "}
                  · {product.subcategory}
                </dd>
                <dt className="text-stone">{product.variants.length > 1 ? "Formatos" : "Formato"}</dt>
                <dd>{product.variants.map((v) => v.size).join(" · ")}</dd>
                {skus.length > 0 && (
                  <>
                    <dt className="text-stone">{skus.length > 1 ? "Referencias" : "Referencia"}</dt>
                    <dd className="tabular-nums">{skus.join(" · ")}</dd>
                  </>
                )}
              </dl>
            </Section>
            <Section title="Recogida y pago">
              <p>
                No hacemos envíos: preparamos tu pedido y lo recoges en nuestro local de {SITE.city},{" "}
                {SITE.horario.texto}. Al terminar el pedido eliges el día y la hora que mejor te vengan.
              </p>
              <p className="mt-3">
                Puedes pagar con tarjeta en la web o en efectivo cuando vengas a recogerlo. Todos los precios
                incluyen IVA.
              </p>
            </Section>
            <Section title="¿Tienes dudas?">
              <p>
                Te asesoramos sobre modo de uso, combinaciones y el formato que mejor te encaja.{" "}
                <a
                  href={waProductLink(product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("whatsapp_click", `producto:${product.id}`)}
                  className="font-medium text-forest underline-offset-4 hover:underline"
                >
                  Escríbenos por WhatsApp
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </div>

      <SolicitudModal
        open={solicitud}
        onClose={() => setSolicitud(false)}
        tipo={agotado ? "agotado" : "encargo"}
        product={product}
        variantIndex={variantIndex}
      />
    </div>
  );
}
