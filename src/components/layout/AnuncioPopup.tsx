"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { fetchAnunciosActivos, type Anuncio } from "@/lib/anuncios";
import { getConsent, track } from "@/lib/analytics";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { AnuncioTarjeta } from "./AnuncioTarjeta";

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
  // Abierto con /?anuncio=<id> desde el panel: no cuenta en las estadísticas.
  const forzado = useRef(false);
  const lenis = useLenis();
  const reducirMovimiento = usePrefersReducedMotion();
  const bloqueada = RUTAS_SIN_ANUNCIO.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pedido = params.get("anuncio");
    if (pedido) {
      params.delete("anuncio");
      const q = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`);
    }
    if (bloqueada || (!pedido && yaSalioEnEstaVisita())) return;
    let cancelado = false;
    let t: ReturnType<typeof setTimeout>;
    const mostrar = async () => {
      // Primera visita: no apilar el anuncio sobre el banner de cookies.
      if (!pedido && getConsent() === null) {
        t = setTimeout(mostrar, 1200);
        return;
      }
      const lista = await fetchAnunciosActivos();
      const vistos = new Set(leerVistos());
      const elegido = (pedido && lista.find((a) => a.id === pedido)) || lista.find((a) => !vistos.has(claveVisto(a)));
      if (cancelado || !elegido) return;
      forzado.current = elegido.id === pedido;
      if (!forzado.current) track("anuncio_visto", elegido.id);
      setAnuncio(elegido);
      setOpen(true);
    };
    t = setTimeout(mostrar, pedido ? 500 : 1800);
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

  const pulsarBoton = useCallback(() => {
    if (anuncio && !forzado.current) track("anuncio_click", anuncio.id);
    cerrar();
  }, [anuncio, cerrar]);

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

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="@container fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-labelledby="anuncio-titulo">
          <div className="flex h-full items-end justify-center @2xl:items-center @2xl:p-6">
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
              className="relative flex w-full @2xl:max-w-3xl"
            >
              <AnuncioTarjeta
                anuncio={anuncio}
                onCerrar={cerrar}
                onAccion={pulsarBoton}
                reducirMovimiento={reducirMovimiento}
                className="max-h-[92dvh]"
              />
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
