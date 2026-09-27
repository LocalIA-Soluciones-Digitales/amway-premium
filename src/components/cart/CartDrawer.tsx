"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { getProductById } from "@/data/products";
import { productImageSrc, type Product } from "@/data/types";
import { SITE, waLink } from "@/data/site-config";
import { formatEUR } from "@/lib/currency";
import { track } from "@/lib/analytics";
import { mensajePedido } from "@/lib/mensaje-pedido";
import {
  diasRecogida,
  etiquetaRelativa,
  fechaCorta,
  fechaLarga,
  horasDisponibles,
  type MetodoPagoWeb,
} from "@/lib/recogida";
import { cn } from "@/lib/utils";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { cestaItemKey, MAX_QUANTITY_PER_LINE, useCesta, type CestaItem } from "./CartProvider";

type PriceOf = (product: Product, variantIndex: number) => number | null;
type Paso = "cesta" | "datos" | "hecho";

// Nombre y teléfono se recuerdan en este navegador para el próximo pedido.
const CONTACTO_KEY = "amway_premium_contacto_v1";

function lineDetails(item: CestaItem, priceOf: PriceOf) {
  const product = getProductById(item.productId);
  if (!product) return null;
  const variant = product.variants[item.variantIndex];
  if (!variant) return null;
  return { product, variant, price: priceOf(product, item.variantIndex) ?? 0 };
}

const fieldClass =
  "h-12 w-full rounded-xl border border-carbon/15 bg-white px-3.5 text-base text-carbon outline-none transition placeholder:text-stone/70 focus:border-carbon/40";

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="py-5">
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone">{titulo}</h3>
      {children}
    </section>
  );
}

export function CartDrawer() {
  const { items, isOpen, closeCesta, increase, decrease, removeItem, clearCesta, totalUnits, subtotal, unavailableKeys } =
    useCesta();
  const catalog = useCatalogState();
  const hasUnavailable = unavailableKeys.size > 0;
  const lenis = useLenis();
  const [paso, setPaso] = useState<Paso>("cesta");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagoWeb>("tarjeta");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [hecho, setHecho] = useState<{ numero: number; total: number; mensaje: string } | null>(null);

  // Recalculado en cada apertura: los huecos de hoy caducan con la hora.
  const dias = useMemo(() => (isOpen ? diasRecogida() : []), [isOpen]);
  const horas = useMemo(() => (fecha ? horasDisponibles(fecha) : []), [fecha]);

  useEffect(() => {
    if (!isOpen) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCesta();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, lenis, closeCesta]);

  useEffect(() => {
    if (isOpen) return;
    setError(null);
    setPaso("cesta");
    setHecho(null);
  }, [isOpen]);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CONTACTO_KEY) ?? "null");
      if (typeof c?.nombre === "string") setNombre(c.nombre);
      if (typeof c?.telefono === "string") setTelefono(c.telefono);
    } catch {}
  }, []);

  // Si el día elegido ya no está (o la hora ya no cabe), se vuelve a elegir.
  useEffect(() => {
    if (fecha && !dias.includes(fecha)) setFecha(null);
  }, [dias, fecha]);
  useEffect(() => {
    if (hora && !horas.includes(hora)) setHora(null);
  }, [horas, hora]);

  const lineasValidas = items.flatMap((item) => {
    const d = lineDetails(item, catalog.precio);
    return d && !unavailableKeys.has(cestaItemKey(item)) ? [{ item, ...d }] : [];
  });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!fecha || !hora) {
      setError("Elige el día y la hora a la que pasarás a recogerlo.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem(CONTACTO_KEY, JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() }));
    } catch {}

    const body = JSON.stringify({
      items: items.map(({ productId, variantIndex, flavor, quantity }) => ({ productId, variantIndex, flavor, quantity })),
      recogida: { fecha, hora },
      cliente: { nombre: nombre.trim(), telefono: telefono.trim() },
      notas: notas.trim(),
    });

    // Efectivo: la pestaña de WhatsApp se abre ya, dentro del clic, para que
    // el navegador no la bloquee; se rellena cuando el pedido queda apuntado.
    const waTab = metodo === "efectivo" ? window.open("", "_blank") : null;

    try {
      const res = await fetch(metodo === "tarjeta" ? "/api/checkout" : "/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json();

      if (metodo === "tarjeta") {
        if (!res.ok || !data.url) throw new Error(data.error ?? "No se pudo iniciar el pago.");
        track("checkout_start", `${items.length} líneas · ${subtotal.toFixed(2)}`);
        window.location.href = data.url;
        return;
      }

      if (!res.ok || !data.numero) throw new Error(data.error ?? "No se pudo registrar el pedido.");
      const mensaje = mensajePedido({
        numero: data.numero,
        lineas: lineasValidas.map((l) => ({
          cantidad: l.item.quantity,
          nombre: l.product.name,
          detalle: [l.variant.size, l.item.flavor].filter(Boolean).join(" · "),
          importe: l.price * l.item.quantity,
        })),
        total: data.total,
        metodo,
        recogida: { fecha, hora },
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        notas: notas.trim(),
      });
      track("whatsapp_click", `pedido #${data.numero} · efectivo`);
      if (waTab) waTab.location.href = waLink(mensaje);
      setHecho({ numero: data.numero, total: data.total, mensaje });
      setPaso("hecho");
      setNotas("");
      clearCesta();
    } catch (err) {
      waTab?.close();
      setError(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  const cabecera =
    paso === "cesta"
      ? { kicker: "Tu pedido", titulo: "Cesta" }
      : paso === "datos"
        ? { kicker: "Paso 2 de 2", titulo: "Recogida y pago" }
        : { kicker: "Pedido registrado", titulo: "¡Gracias!" };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Tu cesta">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCesta}
            className="absolute inset-0 bg-carbon/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream-soft shadow-[-20px_0_60px_rgba(28,26,22,0.18)]"
          >
            <header className="flex items-center justify-between border-b border-carbon/10 px-6 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
              <div className="flex items-center gap-3">
                {paso === "datos" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaso("cesta");
                      setError(null);
                    }}
                    aria-label="Volver a la cesta"
                    className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-carbon transition hover:bg-carbon/5"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-stone">{cabecera.kicker}</p>
                  <h2 className="font-display text-2xl text-carbon">
                    {cabecera.titulo}
                    {paso === "cesta" && totalUnits > 0 && <span className="ml-2 text-base text-stone">({totalUnits})</span>}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCesta}
                aria-label="Cerrar cesta"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-carbon/15 text-carbon transition hover:bg-carbon/5"
              >
                <X size={18} />
              </button>
            </header>

            {paso === "hecho" && hecho ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <CheckCircle2 className="text-forest" size={52} />
                <p className="mt-5 font-display text-2xl text-carbon">Pedido nº {hecho.numero}</p>
                <p className="mt-3 text-sm leading-relaxed text-stone">
                  Te esperamos el <strong className="font-medium text-carbon">{fecha && fechaLarga(fecha)}</strong> a las{" "}
                  <strong className="whitespace-nowrap font-medium text-carbon">{hora} h</strong>. Pagas{" "}
                  <strong className="font-medium text-carbon">{formatEUR(hecho.total)}</strong> en efectivo al recogerlo.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone">
                  Envíanos el resumen por WhatsApp para confirmarte el pedido y la dirección de recogida.
                </p>
                <a
                  href={waLink(hecho.mensaje)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest text-sm font-medium text-cream transition hover:bg-forest-dim"
                >
                  <MessageCircle size={16} />
                  Enviar pedido por WhatsApp
                </a>
                <button
                  type="button"
                  onClick={closeCesta}
                  className="mt-2.5 flex h-12 w-full items-center justify-center rounded-full border border-carbon/15 text-sm font-medium text-carbon transition hover:bg-carbon/5"
                >
                  Seguir comprando
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linen text-stone">
                  <ShoppingBag size={24} />
                </div>
                <p className="mt-5 font-display text-xl text-carbon">Tu cesta está vacía</p>
                <p className="mt-2 text-sm text-stone">Añade productos desde el catálogo para pedirlos de una vez.</p>
                <Link
                  href="/catalogo"
                  onClick={closeCesta}
                  className="mt-7 rounded-full bg-carbon px-6 py-3 text-sm font-medium text-cream transition hover:bg-carbon-soft"
                >
                  Ver catálogo
                </Link>
              </div>
            ) : paso === "cesta" ? (
              <>
                <ul data-lenis-prevent className="flex-1 divide-y divide-carbon/8 overflow-y-auto overscroll-contain px-6">
                  {items.map((item) => {
                    const d = lineDetails(item, catalog.precio);
                    if (!d) return null;
                    const key = cestaItemKey(item);
                    const unavailable = unavailableKeys.has(key);
                    const src = productImageSrc(d.product);
                    return (
                      <li key={key} className={cn("flex gap-4 py-5", unavailable && "opacity-60")}>
                        <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-linen">
                          {src && (
                            <Image src={src} alt={d.product.name} fill sizes="80px" className="object-contain p-2" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wider text-stone">{d.product.brand}</p>
                              <p className="line-clamp-2 font-display text-base leading-snug text-carbon">
                                {d.product.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-stone">
                                {[d.variant.size, item.flavor].filter(Boolean).join(" · ")}
                              </p>
                              {unavailable && (
                                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-xs-red">
                                  Agotado · quítalo para continuar
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(key)}
                              aria-label={`Quitar ${d.product.name} de la cesta`}
                              className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-carbon/5 hover:text-carbon"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center rounded-full border border-carbon/15">
                              <button
                                type="button"
                                onClick={() => decrease(key)}
                                disabled={item.quantity <= 1}
                                aria-label="Quitar una unidad"
                                className="flex h-8 w-8 items-center justify-center text-carbon transition disabled:opacity-30"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-6 text-center text-sm tabular-nums text-carbon">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => increase(key)}
                                disabled={item.quantity >= MAX_QUANTITY_PER_LINE}
                                aria-label="Añadir una unidad"
                                className="flex h-8 w-8 items-center justify-center text-carbon transition disabled:opacity-30"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <span className="text-sm font-medium tabular-nums text-carbon">
                              {unavailable ? "—" : formatEUR(d.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <footer className="border-t border-carbon/10 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-stone">Subtotal</span>
                    <span className="font-display text-2xl tabular-nums text-carbon">{formatEUR(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone">
                    Recogida en mano en {SITE.city}. Pagas con tarjeta o en efectivo al recoger.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPaso("datos")}
                    disabled={hasUnavailable}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
                  >
                    <CalendarDays size={16} />
                    Elegir recogida y pago
                  </button>
                </footer>
              </>
            ) : (
              <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
                <div data-lenis-prevent className="flex-1 divide-y divide-carbon/8 overflow-y-auto overscroll-contain px-6">
                  <Seccion titulo="¿Qué día pasas a recogerlo?">
                    <div className="-mx-6 flex snap-x gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
                      {dias.map((d) => {
                        const c = fechaCorta(d);
                        const activo = d === fecha;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setFecha(d)}
                            aria-pressed={activo}
                            aria-label={fechaLarga(d)}
                            className={cn(
                              "flex w-16 shrink-0 snap-start flex-col items-center rounded-2xl border py-2.5 transition",
                              activo
                                ? "border-carbon bg-carbon text-cream"
                                : "border-carbon/15 bg-white text-carbon hover:border-carbon/35"
                            )}
                          >
                            <span className={cn("text-[10px] uppercase tracking-wider", activo ? "text-cream/70" : "text-stone")}>
                              {etiquetaRelativa(d) ?? c.dia}
                            </span>
                            <span className="font-display text-xl leading-tight">{c.num}</span>
                            <span className={cn("text-[10px]", activo ? "text-cream/70" : "text-stone")}>{c.mes}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Seccion>

                  <Seccion titulo="¿A qué hora?">
                    {fecha ? (
                      <div className="grid grid-cols-4 gap-2">
                        {horas.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHora(h)}
                            aria-pressed={h === hora}
                            className={cn(
                              "h-10 rounded-xl border text-sm tabular-nums transition",
                              h === hora
                                ? "border-carbon bg-carbon text-cream"
                                : "border-carbon/15 bg-white text-carbon hover:border-carbon/35"
                            )}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone">Elige primero el día.</p>
                    )}
                  </Seccion>

                  <Seccion titulo="¿Cómo quieres pagar?">
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { value: "tarjeta", label: "Tarjeta", hint: "Pago seguro ahora", icon: CreditCard },
                          { value: "efectivo", label: "Efectivo", hint: "Pagas al recoger", icon: Banknote },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMetodo(m.value)}
                          aria-pressed={metodo === m.value}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition",
                            metodo === m.value
                              ? "border-carbon bg-white ring-1 ring-carbon"
                              : "border-carbon/15 bg-white hover:border-carbon/35"
                          )}
                        >
                          <m.icon size={18} className="text-carbon" />
                          <span className="mt-1 text-sm font-medium text-carbon">{m.label}</span>
                          <span className="text-xs text-stone">{m.hint}</span>
                        </button>
                      ))}
                    </div>
                  </Seccion>

                  <Seccion titulo="Tus datos">
                    <div className="flex flex-col gap-2.5">
                      <input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre y apellido"
                        autoComplete="name"
                        required
                        maxLength={100}
                        className={fieldClass}
                      />
                      <input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Teléfono (WhatsApp)"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        minLength={9}
                        maxLength={20}
                        className={fieldClass}
                      />
                      <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Comentarios (opcional)"
                        rows={2}
                        maxLength={500}
                        className={cn(fieldClass, "h-auto resize-none py-3")}
                      />
                    </div>
                  </Seccion>
                </div>

                <footer className="border-t border-carbon/10 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-stone">Total</span>
                    <span className="font-display text-2xl tabular-nums text-carbon">{formatEUR(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone">
                    {fecha && hora
                      ? `Recogida el ${fechaLarga(fecha)} a las ${hora} h.`
                      : "Elige día y hora de recogida."}
                  </p>

                  {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-carbon/5 px-3 py-2 text-xs leading-snug text-carbon">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || hasUnavailable}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : metodo === "tarjeta" ? (
                      <CreditCard size={16} />
                    ) : (
                      <MessageCircle size={16} />
                    )}
                    {metodo === "tarjeta" ? `Pagar ${formatEUR(subtotal)} con tarjeta` : "Confirmar pedido por WhatsApp"}
                  </button>
                </footer>
              </form>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
