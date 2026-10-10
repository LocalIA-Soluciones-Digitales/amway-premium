"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m as motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Hash,
  Layers,
  LayoutGrid,
  MessageCircle,
  Package,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { Product } from "@/data/types";
import { cheapestVariantIndex, productImageSrc, variantKind } from "@/data/types";
import { FormatoDestacado } from "./Formato";
import { SITE, waProductLink } from "@/data/site-config";
import { formatEUR } from "@/lib/currency";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { SolicitudModal } from "@/components/catalog/SolicitudModal";

export type ProductAccent = "forest" | "xs" | "gold" | "tech";

// Halo detrás del producto con el color de su categoría.
const GLOW: Record<ProductAccent, string> = {
  forest: "rgba(77,122,104,0.26)",
  xs: "rgba(232,56,79,0.16)",
  gold: "rgba(184,144,90,0.22)",
  tech: "rgba(63,107,125,0.22)",
};

// Primera frase como entradilla; el resto, como cuerpo.
function splitLead(text: string): [string, string] {
  const match = text.match(/^([^]+?[.!?])\s+([^]+)$/);
  return match ? [match[1], match[2]] : [text, ""];
}

function ProductStage({
  product,
  imageSrc,
  agotado,
  accent,
}: {
  product: Product;
  imageSrc: string | null;
  agotado: boolean;
  accent: ProductAccent;
}) {
  const imgRef = useRef<HTMLDivElement>(null);

  // Zoom que sigue al cursor; se escribe en el estilo para no re-renderizar.
  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = imgRef.current;
    if (!el) return;
    const r = e.currentTarget.getBoundingClientRect();
    el.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  }

  return (
    <div
      onMouseMove={onMove}
      className="group relative isolate flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-linen ring-1 ring-carbon/5"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(42% 38% at 50% 46%, rgba(255,255,255,0.85) 0%, transparent 100%), radial-gradient(70% 65% at 50% 50%, ${GLOW[accent]} 0%, transparent 72%)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(rgba(28,26,22,0.10)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,transparent_35%,black_90%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-3 -z-10 flex select-none justify-center whitespace-nowrap font-display text-[clamp(4rem,16vw,8.5rem)] leading-none text-carbon/[0.045]"
      >
        {product.brand}
      </span>
      <div aria-hidden className="absolute bottom-[13%] left-1/2 -z-10 h-8 w-2/5 -translate-x-1/2 rounded-[50%] bg-carbon/20 blur-2xl" />

      {product.badge && (
        <span className="absolute left-5 top-5 z-10 rounded-full bg-carbon px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
          {product.badge}
        </span>
      )}
      {agotado && (
        <span className="absolute right-5 top-5 z-10 rounded-full bg-xs-red px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
          Agotado
        </span>
      )}

      {imageSrc ? (
        <div
          ref={imgRef}
          className="absolute inset-0 transition-transform duration-500 ease-[var(--ease-premium)] [@media(pointer:fine)]:group-hover:scale-[1.35]"
        >
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={cn(
              "object-contain p-12 drop-shadow-[0_24px_30px_rgba(28,26,22,0.14)] sm:p-20",
              agotado && "opacity-60 grayscale-[35%]"
            )}
          />
        </div>
      ) : (
        <p className="font-display text-4xl text-stone">{product.brand}</p>
      )}

      <span className="absolute bottom-5 left-5 z-10 flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-medium text-carbon/80 ring-1 ring-carbon/5 backdrop-blur-md">
        <ShieldCheck size={13} className="text-forest" />
        Original Amway
      </span>
    </div>
  );
}

function ShareButton({ product }: { product: Product }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        // El usuario canceló.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin portapapeles: no hay nada más que hacer.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Enlace copiado" : "Compartir producto"}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-carbon/10 px-3 text-xs text-stone transition hover:border-carbon/30 hover:text-carbon"
    >
      {copied ? <Check size={14} className="text-forest" /> : <Share2 size={14} />}
      <span className="hidden sm:inline">{copied ? "Copiado" : "Compartir"}</span>
    </button>
  );
}

// Descripción, ficha y recogida en pestañas, justo debajo de la compra:
// todo a la vista sin tener que bajar hasta el final de la página.
function ProductTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <section className="mt-8">
      <div
        role="tablist"
        aria-label="Información del producto"
        className="flex gap-1 rounded-full bg-linen/70 p-1 ring-1 ring-carbon/[0.05]"
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative flex-1 rounded-full px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm",
                selected ? "text-cream" : "text-stone hover:text-carbon"
              )}
            >
              {selected && (
                <motion.span
                  layoutId="product-tab"
                  className="absolute inset-0 rounded-full bg-carbon shadow-sm"
                  transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          role="tabpanel"
          id={`panel-${current.id}`}
          aria-labelledby={`tab-${current.id}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="px-1 pt-6"
        >
          {current.content}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// Más de esto se pliega: 15 tonos de golpe empujan el botón de compra fuera
// de la pantalla en el móvil.
const OPCIONES_VISIBLES = 8;

// Opciones del producto (tonos, sabores o formatos) como botones a la vista:
// se ve todo lo que hay y se elige de un toque, sin abrir un desplegable.
// Los tonos numerados («101 Shell») destacan el número, que es como se piden.
function SelectorOpciones({
  product,
  kind,
  kindPlural,
  value,
  onChange,
}: {
  product: Product;
  kind: string;
  kindPlural: string;
  value: number;
  onChange: (i: number) => void;
}) {
  const catalog = useCatalogState();
  const total = product.variants.length;
  const [abierto, setAbierto] = useState(() => value >= OPCIONES_VISIBLES);
  const plegable = total > OPCIONES_VISIBLES + 2;
  const visibles = plegable && !abierto ? product.variants.slice(0, OPCIONES_VISIBLES) : product.variants;
  const precios = product.variants.map((_, i) => catalog.precio(product, i));
  // El precio solo se repite en cada botón si cambia de una opción a otra.
  const preciosDistintos = new Set(precios.filter((p) => p != null)).size > 1;
  const formatos = kind === "Formato";

  return (
    <div className="mt-3">
      <div
        role="radiogroup"
        aria-label={`Elige ${kind.toLowerCase()} de ${product.name}`}
        className={cn("grid gap-2", formatos ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}
      >
        {visibles.map((v, i) => {
          const active = i === value;
          const numerado = v.size.match(/^(\d{2,3})\s+(.+)$/);
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(i)}
              className={cn(
                "relative flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                active
                  ? "border-carbon bg-carbon text-cream shadow-md shadow-carbon/10"
                  : "border-carbon/10 bg-cream-soft text-carbon hover:border-carbon/35"
              )}
            >
              {numerado && (
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    active ? "bg-cream/15 text-cream" : "bg-linen text-carbon/80"
                  )}
                >
                  {numerado[1]}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block leading-snug">{numerado ? numerado[2] : v.size}</span>
                {preciosDistintos && precios[i] != null && (
                  <span className={cn("block text-xs tabular-nums", active ? "text-cream/70" : "text-stone")}>
                    {formatEUR(precios[i]!)}
                  </span>
                )}
              </span>
              {active && <Check size={14} className="shrink-0 text-cream/80" />}
            </button>
          );
        })}
      </div>
      {plegable && (
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          className="mt-2.5 inline-flex items-center gap-1 text-sm font-medium text-carbon underline-offset-4 hover:underline"
        >
          {abierto ? "Ver menos" : `Ver los ${total} ${kindPlural}`}
          <ChevronDown size={15} className={cn("transition-transform", abierto && "rotate-180")} />
        </button>
      )}
      {product.variants[value]?.sku && (
        <p className="mt-2 text-[11px] tabular-nums text-stone">
          {kind} elegido: {product.variants[value].size} · Ref. {product.variants[value].sku}
        </p>
      )}
    </div>
  );
}

export function ProductDetail({
  product,
  categoryLabel,
  categoryHref,
  accent = "forest",
}: {
  product: Product;
  categoryLabel: string;
  categoryHref: string;
  accent?: ProductAccent;
}) {
  const [variantIndex, setVariantIndex] = useState(() => cheapestVariantIndex(product));
  const [solicitud, setSolicitud] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const catalog = useCatalogState();
  const variant = product.variants[variantIndex];
  const price = catalog.precio(product, variantIndex);
  const agotado = catalog.agotado(product.id);
  const rating = catalog.valoracion(product.id);
  const imageSrc = productImageSrc(product);
  const hasOptions = product.variants.length > 1;
  const kind = variantKind(product);
  const skus = Array.from(new Set(product.variants.map((v) => v.sku).filter(Boolean)));
  const canBuy = price != null && !agotado;
  const [lead, body] = splitLead(product.description);
  const hidden = catalog.oculto(product.id);

  // La barra de compra del móvil aparece cuando los botones principales
  // quedan por encima de la pantalla.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hidden]);

  if (hidden) {
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

  const whatsappProps = {
    href: waProductLink(product.name),
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: () => track("whatsapp_click", `producto:${product.id}`),
  } as const;

  const buyButton = (className: string, label: string) =>
    canBuy ? (
      <AddToCartButton
        productId={product.id}
        variantIndex={variantIndex}
        label={label}
        ariaLabel={`Añadir a la cesta: ${product.name}`}
        className={cn("bg-carbon text-sm text-cream hover:bg-carbon-soft", className)}
      />
    ) : (
      <button
        type="button"
        onClick={() => setSolicitud(true)}
        className={cn(
          "flex items-center justify-center gap-2 rounded-full bg-forest px-4 text-sm font-medium text-cream transition hover:bg-forest-dim",
          className
        )}
      >
        {agotado ? <Bell size={16} /> : <ClipboardList size={16} />}
        {agotado ? "Avísame" : "Solicitar"}
        <span className="hidden sm:inline">{agotado ? " cuando vuelva" : " este producto"}</span>
      </button>
    );

  const kindPlural = kind === "Formato" ? "formatos" : `${kind.toLowerCase()}s`;

  const specs: { icon: LucideIcon; label: string; value: ReactNode }[] = [
    { icon: Tag, label: "Marca", value: product.brand },
    {
      icon: LayoutGrid,
      label: "Categoría",
      value: (
        <Link href={categoryHref} className="underline-offset-4 hover:underline">
          {categoryLabel}
        </Link>
      ),
    },
    { icon: Layers, label: "Gama", value: product.subcategory },
    {
      icon: Package,
      label: hasOptions ? `${kind === "Formato" ? "Formatos" : `${kind}s`}` : kind,
      value: hasOptions ? `${product.variants.length} opciones` : variant.size,
    },
    ...(skus.length > 0
      ? [
          {
            icon: Hash,
            label: skus.length > 1 ? "Referencia elegida" : "Referencia",
            value: <span className="tabular-nums">{variant.sku ?? skus[0]}</span>,
          },
        ]
      : []),
    { icon: ShieldCheck, label: "Origen", value: "Original Amway" },
  ];

  const steps = [
    { icon: ShoppingBag, title: "Añádelo a la cesta", text: `Elige ${kind.toLowerCase()} y las unidades que necesitas.` },
    { icon: CalendarClock, title: "Elige día y hora", text: `Al terminar el pedido, eliges cuándo pasar: ${SITE.horario.texto}.` },
    { icon: Store, title: `Recógelo en ${SITE.city}`, text: SITE.pagoOnline ? "Lo tenemos preparado. Paga con tarjeta en la web o en efectivo." : "Lo tenemos preparado. Lo pagas al recogerlo." },
  ];

  const tabs: { id: string; label: string; content: ReactNode }[] = [
    {
      id: "descripcion",
      label: "Descripción",
      content: (
        <div>
          {/* La entradilla ya va bajo el título; aquí, el resto del texto. */}
          {body ? (
            <p className="text-[15px] leading-relaxed text-carbon/75">{body}</p>
          ) : (
            <p className="text-pretty font-display text-xl leading-snug text-carbon sm:text-2xl">{lead}</p>
          )}
        </div>
      ),
    },
    {
      id: "ficha",
      label: "Ficha técnica",
      content: (
        <dl className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
          {specs.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex min-w-0 items-start gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-carbon/[0.06]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest/[0.08] text-forest">
                <Icon size={15} />
              </span>
              <span className="min-w-0">
                <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone">{label}</dt>
                <dd className="mt-0.5 break-words text-sm font-medium text-carbon">{value}</dd>
              </span>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "recogida",
      label: "Recogida",
      content: (
        <div>
          <ol className="relative space-y-5 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-carbon/10">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title} className="relative flex gap-4">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-carbon text-cream">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-sm font-medium text-carbon">{title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-stone">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-2xl bg-linen/60 px-4 py-3 text-xs leading-relaxed text-stone">
            No hacemos envíos: preparamos tu pedido y lo recoges tú. Todos los precios incluyen IVA.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
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

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductStage product={product} imageSrc={imageSrc} agotado={agotado} accent={accent} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={categoryHref}
                className="text-xs font-medium uppercase tracking-[0.22em] text-stone transition hover:text-carbon"
              >
                {product.brand}
              </Link>
              <ShareButton product={product} />
            </div>
            <h1 className="mt-3 text-balance font-display text-[2rem] leading-[1.1] tracking-[-0.01em] text-carbon sm:text-[2.6rem]">
              {product.name}
            </h1>

            {rating && (
              <a
                href="/opiniones"
                className="mt-3 inline-flex items-center gap-2 text-sm text-stone transition hover:text-carbon"
              >
                <span className="flex" aria-hidden>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      className={n <= Math.round(rating.media) ? "fill-gold text-gold" : "text-stone-soft"}
                    />
                  ))}
                </span>
                <span className="tabular-nums">
                  {rating.media.toFixed(1)} · {rating.total} opiniones
                </span>
              </a>
            )}

            {body && <p className="mt-4 text-pretty text-[15px] leading-relaxed text-carbon/70">{lead}</p>}

            {/* Datos rápidos */}
            <ul className="mt-5 flex flex-wrap gap-2">
              {[
                ...(hasOptions ? [{ icon: Package, text: `${product.variants.length} ${kindPlural}` }] : []),
                { icon: Layers, text: product.subcategory },
                ...(variant.sku ? [{ icon: Hash, text: `Ref. ${variant.sku}` }] : []),
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-1.5 rounded-full bg-linen/70 px-3 py-1.5 text-xs font-medium text-carbon/80 ring-1 ring-carbon/[0.05]"
                >
                  <Icon size={13} className="text-stone" />
                  <span className="tabular-nums">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-[1.75rem] bg-white/70 p-5 shadow-[0_1px_0_rgba(28,26,22,0.04),0_20px_50px_-30px_rgba(28,26,22,0.25)] ring-1 ring-carbon/[0.06] sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <p className="font-display text-[2.4rem] leading-none tabular-nums text-carbon">
                    {price != null ? formatEUR(price) : "Consultar precio"}
                  </p>
                  {price != null && <p className="mt-2 text-xs text-stone">IVA incluido · recogida en tienda</p>}
                </div>
                <p
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                    agotado ? "bg-xs-red/10 text-xs-red" : "bg-forest/[0.08] text-forest"
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    {!agotado && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest/50" />
                    )}
                    <span className={cn("relative h-2 w-2 rounded-full", agotado ? "bg-xs-red" : "bg-forest")} />
                  </span>
                  {agotado ? "Agotado temporalmente" : `Disponible en ${SITE.city}`}
                </p>
              </div>

              <div className="mt-6 border-t border-carbon/[0.07] pt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone">
                    {hasOptions ? `Elige ${kind.toLowerCase()}` : kind}
                  </p>
                  {hasOptions && (
                    <p className="min-w-0 truncate text-xs text-stone">
                      {product.variants.length} {kindPlural}
                    </p>
                  )}
                </div>

                {hasOptions ? (
                  <SelectorOpciones
                    product={product}
                    kind={kind}
                    kindPlural={kindPlural}
                    value={variantIndex}
                    onChange={setVariantIndex}
                  />
                ) : (
                  <FormatoDestacado size={variant.size} precio={price} />
                )}
              </div>

              <div ref={ctaRef} className="mt-6 flex items-center gap-2">
                {buyButton("h-14 min-w-0 flex-1 text-[15px]", "Añadir a la cesta")}
                <a
                  {...whatsappProps}
                  aria-label={`Consultar ${product.name} por WhatsApp`}
                  className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-full border border-carbon/15 px-5 text-sm font-medium text-carbon transition hover:border-forest hover:bg-forest hover:text-cream"
                >
                  <MessageCircle size={17} />
                  <span className="hidden sm:inline">Consultar</span>
                </a>
              </div>

              <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-carbon/[0.07] pt-5">
                {[
                  { icon: Store, text: "Recogida en tienda" },
                  { icon: CreditCard, text: SITE.pagoOnline ? "Tarjeta o efectivo" : "Pago al recoger" },
                  { icon: ShieldCheck, text: "Producto original" },
                ].map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex flex-col items-center gap-1.5 text-center text-[11px] leading-tight text-stone sm:flex-row sm:text-left"
                  >
                    <Icon size={16} className="shrink-0 text-forest" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <ProductTabs tabs={tabs} />
          </div>
        </div>

        {/* Ayuda */}
        <section className="relative mt-20 overflow-hidden rounded-[2rem] bg-forest px-7 py-12 text-cream sm:px-12 sm:py-14">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-forest-soft/40 blur-3xl"
          />
          <div aria-hidden className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-cream/60">¿Tienes dudas?</p>
              <h2 className="mt-3 text-balance font-display text-3xl leading-tight sm:text-4xl">
                Te asesoramos sin compromiso
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-cream/75">
                Modo de uso, combinaciones y el formato que mejor te encaja. Te respondemos por WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                {...whatsappProps}
                className="flex h-12 items-center gap-2 rounded-full bg-cream px-6 text-sm font-medium text-forest transition hover:bg-white"
              >
                <MessageCircle size={17} />
                Escríbenos por WhatsApp
              </a>
              <Link
                href={categoryHref}
                className="flex h-12 items-center gap-2 rounded-full border border-cream/25 px-6 text-sm font-medium text-cream transition hover:border-cream/60"
              >
                Ver {categoryLabel}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Barra de compra fija en móvil; deja hueco a la derecha para el botón de WhatsApp. */}
      <div
        aria-hidden={!showBar}
        inert={!showBar}
        className={cn(
          "fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-[5.25rem] z-40 flex items-center gap-3 rounded-full bg-cream-soft/95 py-2 pl-2 pr-2 shadow-[0_20px_50px_-15px_rgba(28,26,22,0.4)] ring-1 ring-carbon/10 backdrop-blur-xl transition-all duration-500 ease-[var(--ease-premium)] lg:hidden",
          showBar ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[150%] opacity-0"
        )}
      >
        {imageSrc && (
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linen">
            <Image src={imageSrc} alt="" fill sizes="40px" className="object-contain p-1" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs text-stone">{product.name}</span>
          <span className="block text-sm font-semibold tabular-nums text-carbon">
            {price != null ? formatEUR(price) : "Consultar"}
          </span>
        </span>
        {buyButton("h-10 shrink-0 px-4", "Añadir")}
      </div>

      <SolicitudModal
        open={solicitud}
        onClose={() => setSolicitud(false)}
        tipo={agotado ? "agotado" : "encargo"}
        product={product}
        variantIndex={variantIndex}
      />
    </>
  );
}
