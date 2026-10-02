"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardList,
  CreditCard,
  MessageCircle,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import type { Product } from "@/data/types";
import { cheapestVariantIndex, productImageSrc } from "@/data/types";
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
        ariaLabel={`Añadir ${product.name} a la cesta`}
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

  const specs: { label: string; value: ReactNode }[] = [
    { label: "Marca", value: product.brand },
    {
      label: "Categoría",
      value: (
        <>
          <Link href={categoryHref} className="underline-offset-4 hover:underline">
            {categoryLabel}
          </Link>{" "}
          · {product.subcategory}
        </>
      ),
    },
    { label: hasOptions ? "Formatos" : "Formato", value: product.variants.map((v) => v.size).join(" · ") },
    ...(skus.length > 0
      ? [{ label: skus.length > 1 ? "Referencias" : "Referencia", value: <span className="tabular-nums">{skus.join(" · ")}</span> }]
      : []),
  ];

  const steps = [
    { icon: ShoppingBag, title: "Añádelo a la cesta", text: "Elige el formato y las unidades que necesitas." },
    { icon: CalendarClock, title: "Elige día y hora", text: `Al terminar el pedido, eliges cuándo pasar: ${SITE.horario.texto}.` },
    { icon: Store, title: `Recógelo en ${SITE.city}`, text: "Lo tenemos preparado. Paga con tarjeta en la web o en efectivo." },
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

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductStage product={product} imageSrc={imageSrc} agotado={agotado} accent={accent} />

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: hasOptions ? "Formato elegido" : "Formato", value: variant.size },
                { label: "Referencia", value: variant.sku ?? "—" },
                { label: "Gama", value: product.subcategory },
              ].map((s) => (
                <div key={s.label} className="min-w-0 rounded-2xl bg-linen/60 px-4 py-3 ring-1 ring-carbon/5 [&:nth-child(3)]:max-sm:hidden">
                  <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone">{s.label}</dt>
                  <dd className="mt-1 truncate text-sm font-medium tabular-nums text-carbon">{s.value}</dd>
                </div>
              ))}
            </dl>
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
            <h1 className="mt-3 text-balance font-display text-[2rem] leading-[1.1] tracking-[-0.01em] text-carbon sm:text-[2.75rem]">
              {product.name}
            </h1>

            {rating && (
              <a
                href="/opiniones"
                className="mt-4 inline-flex items-center gap-2 text-sm text-stone transition hover:text-carbon"
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

            <div className="mt-7 rounded-[1.75rem] bg-white/70 p-5 shadow-[0_1px_0_rgba(28,26,22,0.04),0_20px_50px_-30px_rgba(28,26,22,0.25)] ring-1 ring-carbon/[0.06] sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <p className="font-display text-[2.6rem] leading-none tabular-nums text-carbon">
                    {price != null ? formatEUR(price) : "Consultar precio"}
                  </p>
                  {price != null && <p className="mt-2 text-xs text-stone">IVA incluido · sin gastos de envío</p>}
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

              {hasOptions && (
                <fieldset className="mt-7">
                  <legend className="text-xs font-medium uppercase tracking-[0.14em] text-stone">Elige formato</legend>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                            "relative rounded-2xl border px-4 py-3 text-left text-sm transition",
                            active
                              ? "border-carbon bg-carbon text-cream shadow-lg shadow-carbon/10"
                              : "border-carbon/10 bg-cream-soft text-carbon hover:border-carbon/35"
                          )}
                        >
                          {active && <Check size={14} className="absolute right-3 top-3 text-cream/80" />}
                          <span className="block pr-4 font-medium">{v.size}</span>
                          {optionPrice != null && (
                            <span className={cn("mt-0.5 block text-xs tabular-nums", active ? "text-cream/70" : "text-stone")}>
                              {formatEUR(optionPrice)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

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
            </div>

            <ul className="mt-6 divide-y divide-carbon/[0.07] rounded-[1.75rem] ring-1 ring-carbon/[0.07]">
              {[
                { icon: Store, title: "Recogida en tienda", text: `En nuestro local de ${SITE.city}, ${SITE.horario.texto}` },
                { icon: CreditCard, title: "Pago flexible", text: "Con tarjeta en la web o en efectivo al recoger" },
                { icon: ShieldCheck, title: "Garantía Amway", text: "Producto original con garantía de satisfacción" },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/[0.08] text-forest">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium text-carbon">{title}</span>
                    <span className="block text-stone">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Vista general + ficha técnica */}
        <section aria-labelledby="vista-general" className="mt-24 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p id="vista-general" className="text-xs font-medium uppercase tracking-[0.22em] text-stone">
              Vista general
            </p>
            <p className="mt-5 text-pretty font-display text-2xl leading-snug text-carbon sm:text-[1.9rem]">{lead}</p>
            {body && <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-carbon/75">{body}</p>}
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-[1.75rem] bg-linen/70 p-6 ring-1 ring-carbon/5 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone">Ficha técnica</p>
              <dl className="mt-4 divide-y divide-carbon/[0.08] text-sm">
                {specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-[7.5rem_1fr] gap-4 py-3.5">
                    <dt className="text-stone">{s.label}</dt>
                    <dd className="min-w-0 text-carbon">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Cómo se compra */}
        <section aria-labelledby="como-comprar" className="mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone">Recogida y pago</p>
              <h2 id="como-comprar" className="mt-3 font-display text-3xl text-carbon sm:text-4xl">
                Así de fácil
              </h2>
            </div>
            <p className="max-w-sm text-sm text-stone">
              No hacemos envíos: preparamos tu pedido y lo recoges tú. Todos los precios incluyen IVA.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="group relative overflow-hidden rounded-[1.75rem] bg-white/60 p-7 ring-1 ring-carbon/[0.06] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-35px_rgba(28,26,22,0.35)]"
              >
                <span
                  aria-hidden
                  className="absolute right-5 top-3 font-display text-[5.5rem] leading-none text-carbon/[0.04] transition-colors duration-500 group-hover:text-forest/[0.08]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-carbon text-cream">
                  <Icon size={20} />
                </span>
                <h3 className="mt-6 font-display text-xl text-carbon">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Ayuda */}
        <section className="relative mt-24 overflow-hidden rounded-[2rem] bg-forest px-7 py-12 text-cream sm:px-12 sm:py-14">
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
