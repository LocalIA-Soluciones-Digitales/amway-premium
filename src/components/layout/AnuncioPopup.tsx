"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRuta } from "@/hooks/useRuta";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { fetchAnunciosActivos, type Anuncio } from "@/lib/anuncios";
import { getConsent, track } from "@/lib/analytics";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { AnuncioTarjeta } from "./AnuncioTarjeta";

const SESION_KEY = "amway-anuncio-sesion";
// Ni en el pago ni en la cuenta: ahí el pop-up solo estorba.
const RUTAS_SIN_ANUNCIO = ["/admin", "/checkout", "/cuenta"];

// Cerrado vale solo para esta visita: al volver a abrir la web sale otra vez.
function marcarVisto() {
  try {
    sessionStorage.setItem(SESION_KEY, "1");
  } catch {
    // storage blocked: it may show again on the next page
  }
}

function yaSalioEnEstaVisita(): boolean {
  try {
    return sessionStorage.getItem(SESION_KEY) === "1";
  } catch {
    return false;
  }
}

// Pop-up con el anuncio vigente más reciente. Sale en cada visita (aunque se
// cerrara en otra), como mucho una vez por visita, nada más entrar.
export function AnuncioPopup() {
  const pathname = useRuta();
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
    // Se pide nada más entrar y sale en cuanto llega.
    const peticion = fetchAnunciosActivos();
    const mostrar = async () => {
      // Primera visita: no apilar el anuncio sobre el banner de cookies.
      if (!pedido && getConsent() === null) {
        t = setTimeout(mostrar, 300);
        return;
      }
      const lista = await peticion;
      const elegido = (pedido && lista.find((a) => a.id === pedido)) || lista[0];
      if (cancelado || !elegido) return;
      forzado.current = elegido.id === pedido;
      if (!forzado.current) track("anuncio_visto", elegido.id);
      setAnuncio(elegido);
      setOpen(true);
    };
    void mostrar();
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
    // Solo al entrar: navegar dentro de la tienda no vuelve a buscar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cerrar = useCallback(() => {
    marcarVisto();
    setOpen(false);
  }, []);

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
              className="relative flex w-full @2xl:max-w-4xl"
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
