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
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { getProductById } from "@/data/products";
import { productImageSrc, type Product } from "@/data/types";
import { LEGAL, SITE, waLink } from "@/data/site-config";
import { AvisoPrivacidad } from "@/components/legal/AvisoPrivacidad";
import { formatEUR } from "@/lib/currency";
import { track } from "@/lib/analytics";
import { mensajePedido } from "@/lib/mensaje-pedido";
import {
  diasRecogida,
  fechaLarga,
  horasDisponibles,
  recogidaValida,
  type MetodoPagoWeb,
} from "@/lib/recogida";
import { cn } from "@/lib/utils";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { cabeceraSesion, useCliente } from "@/components/cuenta/ClienteProvider";
import { cestaItemKey, MAX_QUANTITY_PER_LINE, useCesta, type CestaItem } from "./CartProvider";
import { RecogidaPicker } from "./RecogidaPicker";

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
  const { session, perfil, guardarPerfil } = useCliente();
  const hasUnavailable = unavailableKeys.size > 0;
  const lenis = useLenis();
  const [paso, setPaso] = useState<Paso>("cesta");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagoWeb>(SITE.pagoOnline ? "tarjeta" : "efectivo");
  // Aviso «estamos activando el pago online» al tocar Tarjeta sin Stripe activo.
  const [avisoPago, setAvisoPago] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [hecho, setHecho] = useState<{ numero: number; total: number; mensaje: string } | null>(null);
  const [recordado, setRecordado] = useState(false);
  // Un identificador por intento de pedido: si el envío se repite (doble
  // clic, reintento de red), el servidor devuelve el mismo pedido.
  const [intento, setIntento] = useState<string | null>(null);
  // Si cambia la cesta, es otro pedido.
  useEffect(() => setIntento(null), [items]);

  // Recalculado en cada apertura: los huecos de hoy caducan con la hora.
  const dias = useMemo(() => (isOpen ? diasRecogida(new Date(), catalog.cierres) : []), [isOpen, catalog.cierres]);
  const horas = useMemo(
    () => (fecha ? horasDisponibles(fecha, new Date(), catalog.cierres) : []),
    [fecha, catalog.cierres]
  );

  useEffect(() => {
    if (!isOpen) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (avisoPago) setAvisoPago(false);
      else closeCesta();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, lenis, closeCesta, avisoPago]);

  useEffect(() => {
    if (isOpen) return;
    setError(null);
    setPaso("cesta");
    setHecho(null);
    setAvisoPago(false);
  }, [isOpen]);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CONTACTO_KEY) ?? "null");
      if (typeof c?.nombre === "string") setNombre(c.nombre);
      if (typeof c?.telefono === "string") setTelefono(c.telefono);
      if (c?.nombre || c?.telefono) setRecordado(true);
    } catch {}
  }, []);

  // Con sesión, los datos del perfil mandan sobre lo recordado en el navegador.
  useEffect(() => {
    if (perfil?.nombre) setNombre(perfil.nombre);
    if (perfil?.telefono) setTelefono(perfil.telefono);
  }, [perfil?.nombre, perfil?.telefono]);

  // Un día que ya no vale (la cesta abierta de un día para otro) se vuelve a
  // elegir, y lo mismo una hora que no existe en el día nuevo.
  useEffect(() => {
    if (fecha && dias.length > 0 && !dias.includes(fecha)) setFecha(null);
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
    if (!recogidaValida({ fecha, hora }, new Date(), catalog.cierres)) {
      setError("Esa hora ya no está disponible. Elige otra, por favor.");
      return;
    }
    if (metodo === "tarjeta" && !SITE.pagoOnline) {
      setAvisoPago(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem(CONTACTO_KEY, JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim() }));
      setRecordado(true);
    } catch {}
    const idIntento = intento ?? crypto.randomUUID();
    if (!intento) setIntento(idIntento);
    // Completa el perfil con lo que falte, para el próximo pedido.
    if (session && perfil && (!perfil.nombre || !perfil.telefono)) {
      void guardarPerfil({ nombre: perfil.nombre || nombre, telefono: perfil.telefono || telefono });
    }

    const body = JSON.stringify({
      items: items.map(({ productId, variantIndex, flavor, quantity }) => ({ productId, variantIndex, flavor, quantity })),
      recogida: { fecha, hora },
      cliente: { nombre: nombre.trim(), telefono: telefono.trim() },
      notas: notas.trim(),
      intento: idIntento,
    });

    // Efectivo: la pestaña de WhatsApp se abre ya, dentro del clic, para que
    // el navegador no la bloquee; se rellena cuando el pedido queda apuntado.
    const waTab = metodo === "efectivo" ? window.open("", "_blank") : null;

    try {
      const res = await fetch(metodo === "tarjeta" ? "/api/checkout" : "/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...cabeceraSesion(session) },
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
      setIntento(null);
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
                  Tu pedido ya está registrado. {LEGAL.domicilio ? `Recógelo en ${LEGAL.domicilio}. ` : ""}Si quieres,
                  envíanos el resumen por WhatsApp (se abre la app con el mensaje escrito; lo envías tú).
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
                <Link
                  href={session ? "/cuenta" : `/cuenta?registro=1&pedido=${hecho.numero}`}
                  onClick={closeCesta}
                  className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-carbon/15 text-sm font-medium text-carbon transition hover:bg-carbon/5"
                >
                  <UserRound size={16} />
                  {session ? "Ver en mis pedidos" : "Crear cuenta y guardar este pedido"}
                </Link>
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
                    Recogida en mano en {SITE.city}.{" "}
                    {SITE.pagoOnline ? "Pagas con tarjeta o en efectivo al recoger." : "Pagas al recoger tu pedido."}
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
                  <Seccion titulo="¿Cuándo pasas a recogerlo?">
                    <RecogidaPicker
                      dias={dias}
                      horas={horas}
                      fecha={fecha}
                      hora={hora}
                      onFecha={setFecha}
                      onHora={setHora}
                    />
                    <p className="mt-2 text-xs text-stone">Abrimos {SITE.horario.texto}.</p>
                  </Seccion>

                  <Seccion titulo="¿Cómo quieres pagar?">
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { value: "tarjeta", label: "Tarjeta", hint: "Pago seguro ahora", icon: CreditCard },
                          { value: "efectivo", label: "Efectivo", hint: "Pagas al recoger", icon: Banknote },
                        ] as const
                      ).map((m) => {
                        const proximamente = m.value === "tarjeta" && !SITE.pagoOnline;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => (proximamente ? setAvisoPago(true) : setMetodo(m.value))}
                            aria-pressed={metodo === m.value}
                            aria-haspopup={proximamente ? "dialog" : undefined}
                            className={cn(
                              "relative flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition",
                              proximamente
                                ? "border-dashed border-carbon/20 bg-white/50 hover:border-carbon/35"
                                : metodo === m.value
                                  ? "border-carbon bg-white ring-1 ring-carbon"
                                  : "border-carbon/15 bg-white hover:border-carbon/35"
                            )}
                          >
                            {proximamente && (
                              <span className="absolute right-2.5 top-2.5 rounded-full bg-linen px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone">
                                Próximamente
                              </span>
                            )}
                            <m.icon size={18} className={proximamente ? "text-stone" : "text-carbon"} />
                            <span className={cn("mt-1 text-sm font-medium", proximamente ? "text-stone" : "text-carbon")}>
                              {m.label}
                            </span>
                            <span className="text-xs text-stone">{proximamente ? "Activándose" : m.hint}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Seccion>

                  <Seccion titulo="Tus datos">
                    {session ? (
                      <p className="mb-3 flex items-center gap-2 rounded-xl bg-forest/10 px-3 py-2.5 text-xs text-forest">
                        <UserRound size={14} className="shrink-0" />
                        <span className="min-w-0 truncate">
                          Se guardará en tu cuenta ({session.user.email})
                        </span>
                      </p>
                    ) : (
                      <p className="mb-3 text-xs leading-relaxed text-stone">
                        Puedes pedir sin cuenta.{" "}
                        <Link href="/cuenta" onClick={closeCesta} className="font-medium text-carbon underline underline-offset-2">
                          Entra
                        </Link>{" "}
                        o{" "}
                        <Link
                          href="/cuenta?registro=1"
                          onClick={closeCesta}
                          className="font-medium text-carbon underline underline-offset-2"
                        >
                          crea una cuenta
                        </Link>{" "}
                        para ver tus pedidos y repetirlos. La cesta se mantiene.
                      </p>
                    )}
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
                    {recordado && (
                      <p className="mt-2 text-[11px] text-stone">
                        Recordamos tu nombre y teléfono en este dispositivo para el próximo pedido.{" "}
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.removeItem(CONTACTO_KEY);
                            } catch {}
                            setRecordado(false);
                            setNombre("");
                            setTelefono("");
                          }}
                          className="underline underline-offset-2 hover:text-carbon"
                        >
                          Olvidarlos
                        </button>
                      </p>
                    )}
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

                  <p className="mt-3 text-[11px] leading-relaxed text-stone">
                    Al confirmar aceptas las{" "}
                    <Link href="/condiciones" target="_blank" className="underline underline-offset-2 hover:text-carbon">
                      condiciones de compra
                    </Link>{" "}
                    (incluye el derecho de desistimiento de 14 días y la garantía).
                    {metodo === "efectivo" && " Después se abrirá WhatsApp con el resumen por si quieres enviárnoslo."}
                  </p>
                  <AvisoPrivacidad
                    className="mt-1.5"
                    finalidad="gestionar tu pedido y la recogida"
                    extra={metodo === "tarjeta" ? "El pago lo procesa Stripe." : undefined}
                  />

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
                      <Banknote size={16} />
                    )}
                    {metodo === "tarjeta"
                      ? `Pagar ${formatEUR(subtotal)} con tarjeta`
                      : `Hacer pedido · pago al recoger (${formatEUR(subtotal)})`}
                  </button>
                </footer>
              </form>
            )}

            <AnimatePresence>
              {avisoPago && (
                <div className="absolute inset-0 z-10 flex items-end sm:items-center sm:px-5">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setAvisoPago(false)}
                    className="absolute inset-0 bg-carbon/35 backdrop-blur-[2px]"
                  />
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="aviso-pago-titulo"
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full rounded-t-3xl bg-cream-soft px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 shadow-2xl sm:rounded-3xl sm:pb-6"
                  >
                    <button
                      type="button"
                      onClick={() => setAvisoPago(false)}
                      aria-label="Cerrar aviso"
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-stone transition hover:bg-carbon/5 hover:text-carbon"
                    >
                      <X size={17} />
                    </button>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/10 text-forest">
                      <ShieldCheck size={22} />
                    </div>
                    <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-linen px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-stone">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest/60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-forest" />
                      </span>
                      Configurando pasarela
                    </p>
                    <h3 id="aviso-pago-titulo" className="mt-3 font-display text-2xl leading-tight text-carbon">
                      Estamos activando el pago online
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-stone">
                      Muy pronto podrás pagar con tarjeta, Apple Pay o Google Pay desde la web, con la seguridad de una
                      pasarela certificada.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-stone">
                      Mientras tanto, haz tu pedido con normalidad: te lo reservamos para el día y la hora que elijas y lo
                      pagas al recogerlo.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setMetodo("efectivo");
                        setAvisoPago(false);
                      }}
                      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft"
                    >
                      <Banknote size={16} />
                      Continuar con pago al recoger
                    </button>
                    <a
                      href={waLink("Hola, quería hacer un pedido y tengo una duda sobre el pago.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-carbon/15 text-sm font-medium text-carbon transition hover:bg-carbon/5"
                    >
                      <MessageCircle size={16} />
                      Consultar por WhatsApp
                    </a>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
