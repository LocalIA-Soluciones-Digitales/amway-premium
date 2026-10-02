"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { ArrowRight, CalendarDays, CalendarPlus, Clock, MapPin, X } from "lucide-react";
import {
  TIPO_ANUNCIO,
  accionAnuncio,
  calendarioEvento,
  fechaEvento,
  fetchAnunciosActivos,
  horarioEvento,
  imagenAnuncio,
  type Anuncio,
} from "@/lib/anuncios";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const VISTOS_KEY = "amway-anuncios-vistos";
const SESION_KEY = "amway-anuncio-sesion";
// Ni en el pago ni en la cuenta: ahí el pop-up solo estorba.
const RUTAS_SIN_ANUNCIO = ["/admin", "/checkout", "/cuenta"];

// Un anuncio editado en el panel cuenta como nuevo: vuelve a salir.
const claveVisto = (a: Anuncio) => `${a.id}:${a.updated_at}`;

function leerVistos(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(VISTOS_KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function marcarVisto(a: Anuncio) {
  try {
    localStorage.setItem(VISTOS_KEY, JSON.stringify([claveVisto(a), ...leerVistos()].slice(0, 30)));
    sessionStorage.setItem(SESION_KEY, "1");
  } catch {
    // storage blocked: it just shows again next visit
  }
}

function yaSalioEnEstaVisita(): boolean {
  try {
    return sessionStorage.getItem(SESION_KEY) === "1";
  } catch {
    return false;
  }
}

// Pop-up con el anuncio vigente más reciente que el visitante aún no ha
// cerrado. Como mucho uno por visita, y un momento después de entrar para
// no tapar la primera impresión de la página.
export function AnuncioPopup() {
  const pathname = usePathname();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const reducirMovimiento = usePrefersReducedMotion();
  const bloqueada = RUTAS_SIN_ANUNCIO.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    if (bloqueada || yaSalioEnEstaVisita()) return;
    let cancelado = false;
    const t = setTimeout(async () => {
      const lista = await fetchAnunciosActivos();
      const vistos = new Set(leerVistos());
      const siguiente = lista.find((a) => !vistos.has(claveVisto(a)));
      if (cancelado || !siguiente) return;
      setAnuncio(siguiente);
      setOpen(true);
    }, 1800);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
    // Solo al entrar: navegar dentro de la tienda no vuelve a buscar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cerrar = useCallback(() => {
    if (anuncio) marcarVisto(anuncio);
    setOpen(false);
  }, [anuncio]);

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, lenis, cerrar]);

  // Si entra a una ruta sin anuncios con el pop-up abierto, se cierra.
  useEffect(() => {
    if (bloqueada && open) setOpen(false);
  }, [bloqueada, open]);

  if (!anuncio) return null;

  const imagen = imagenAnuncio(anuncio);
  const video = anuncio.video_url || null;
  const accion = accionAnuncio(anuncio);
  const calendario = calendarioEvento(anuncio);
  const horario = horarioEvento(anuncio);
  const esEvento = anuncio.tipo === "evento";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="anuncio-titulo"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cerrar}
            className="absolute inset-0 bg-carbon/45 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden overflow-y-auto overscroll-contain rounded-t-3xl bg-cream-soft shadow-2xl sm:max-w-3xl sm:flex-row sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar anuncio"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream-soft/90 text-carbon shadow-sm backdrop-blur transition hover:bg-cream"
            >
              <X size={18} />
            </button>

            {(imagen || video) && (
              <div className="relative h-56 shrink-0 bg-linen sm:h-auto sm:min-h-[26rem] sm:w-[44%]">
                {video ? (
                  // Con «reducir movimiento» se queda quieto en la portada.
                  <video
                    src={video}
                    poster={imagen ?? undefined}
                    muted
                    loop
                    playsInline
                    autoPlay={!reducirMovimiento}
                    preload="auto"
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  // Imágenes subidas al panel (Supabase) o de public/: <img> sirve para ambas.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagen!}
                    alt=""
                    className={
                      anuncio.imagen_url
                        ? "absolute inset-0 h-full w-full object-cover"
                        : "absolute inset-0 h-full w-full object-contain p-8"
                    }
                  />
                )}
              </div>
            )}

            <div className="flex flex-1 flex-col px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7 sm:px-9 sm:py-10">
              <p className="pr-12 text-[11px] uppercase tracking-[0.24em] text-forest">{TIPO_ANUNCIO[anuncio.tipo].eyebrow}</p>
              <h2 id="anuncio-titulo" className="mt-3 pr-8 font-display text-3xl leading-[1.08] text-carbon sm:text-[2.35rem]">
                {anuncio.titulo}
              </h2>

              {esEvento && (anuncio.evento_fecha || horario || anuncio.evento_lugar) && (
                <ul className="mt-5 flex flex-col gap-2 text-sm text-carbon/80">
                  {anuncio.evento_fecha && (
                    <li className="flex items-center gap-2.5">
                      <CalendarDays size={16} className="shrink-0 text-forest" />
                      <span className="first-letter:uppercase">{fechaEvento(anuncio.evento_fecha)}</span>
                    </li>
                  )}
                  {horario && (
                    <li className="flex items-center gap-2.5">
                      <Clock size={16} className="shrink-0 text-forest" />
                      {horario}
                    </li>
                  )}
                  {anuncio.evento_lugar && (
                    <li className="flex items-center gap-2.5">
                      <MapPin size={16} className="shrink-0 text-forest" />
                      {anuncio.evento_lugar}
                    </li>
                  )}
                </ul>
              )}

              {anuncio.texto && (
                <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-carbon/75">{anuncio.texto}</p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-auto sm:pt-8">
                {/* <a> y no <Link>: /catalogo?q=… solo lee la búsqueda al cargar la página. */}
                {accion && (
                  <a
                    href={accion.href}
                    {...(accion.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    onClick={cerrar}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-carbon px-6 text-sm font-medium text-cream transition hover:bg-carbon-soft"
                  >
                    {accion.texto} <ArrowRight size={16} />
                  </a>
                )}
                {calendario && (
                  <a
                    href={calendario}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-carbon/15 px-5 text-sm text-carbon transition hover:bg-carbon/5"
                  >
                    <CalendarPlus size={16} /> Añadir al calendario
                  </a>
                )}
                <button type="button" onClick={cerrar} className="h-12 px-2 text-sm text-stone transition hover:text-carbon">
                  Ahora no
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
