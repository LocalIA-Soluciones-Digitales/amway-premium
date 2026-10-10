"use client";

import { useEffect, useState } from "react";
import { useRuta } from "@/hooks/useRuta";
import { AnimatePresence, m as motion } from "framer-motion";
import { Cookie } from "lucide-react";
import Link from "next/link";
import { ABRIR_COOKIES, atenderErroresTempranos, getConsent, setConsent, track } from "@/lib/analytics";

// Pageviews on every route change, WhatsApp clicks anywhere on the page,
// global error capture, and the consent banner that gates all of it.
export function Analytics() {
  const pathname = useRuta();
  const [askConsent, setAskConsent] = useState(false);
  const [consentVersion, setConsentVersion] = useState(0);

  useEffect(() => {
    if (!pathname?.startsWith("/admin")) setAskConsent(getConsent() === null);
  }, [pathname]);

  // «Configurar cookies» (pie de página y política de cookies).
  useEffect(() => {
    const abrir = () => setAskConsent(true);
    window.addEventListener(ABRIR_COOKIES, abrir);
    return () => window.removeEventListener(ABRIR_COOKIES, abrir);
  }, []);

  useEffect(() => {
    if (pathname) track("pageview", undefined, pathname);
  }, [pathname, consentVersion]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (a?.href && /wa\.me|whatsapp\.com/.test(a.href)) track("whatsapp_click", a.getAttribute("aria-label") ?? undefined);
    };
    document.addEventListener("click", onClick, { capture: true });
    // Los errores los recoge el script del layout desde la carga.
    atenderErroresTempranos();
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  function decide(v: "aceptadas" | "rechazadas") {
    setConsent(v);
    setAskConsent(false);
    // Count the page they accepted on.
    if (v === "aceptadas") setConsentVersion((n) => n + 1);
  }

  return (
    <AnimatePresence>
      {askConsent && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-label="Preferencias de cookies"
          aria-describedby="cookies-texto"
          // Móvil: tarjeta abajo. Ordenador: barra centrada y ancha, con margen
          // a los lados para no tapar el botón de WhatsApp.
          className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[55] mx-auto max-w-sm rounded-2xl border border-cream/10 bg-carbon/95 p-5 text-cream shadow-[0_24px_60px_rgba(28,26,22,0.4)] backdrop-blur-md sm:inset-x-24 sm:bottom-[calc(2rem+env(safe-area-inset-bottom))] sm:max-w-4xl sm:p-6 lg:px-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-10">
            <div className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream/10 ring-1 ring-cream/10">
                <Cookie size={18} className="text-gold-soft" />
              </span>
              <div>
                <p className="font-display text-xl leading-tight">Tu privacidad, primero</p>
                <p id="cookies-texto" className="mt-1.5 text-sm leading-relaxed text-cream/70">
                  Con tu permiso guardamos en tu navegador unas estadísticas propias (qué páginas y productos
                  interesan más) para mejorar la tienda. Sin publicidad ni terceros, y puedes cambiarlo cuando
                  quieras.{" "}
                  <Link href="/cookies" className="whitespace-nowrap text-cream underline underline-offset-4 hover:text-gold-soft">
                    Política de cookies
                  </Link>
                </p>
              </div>
            </div>
            {/* Mismo tamaño y peso para las dos opciones: rechazar tiene que ser tan fácil como aceptar. */}
            <div className="grid shrink-0 grid-cols-2 gap-2.5 sm:ml-14 lg:ml-0 lg:w-80">
              <button
                type="button"
                onClick={() => decide("rechazadas")}
                className="h-11 rounded-full border border-cream/40 px-5 text-sm font-semibold text-cream transition hover:border-cream hover:bg-cream/10"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => decide("aceptadas")}
                className="h-11 rounded-full border border-cream bg-cream px-5 text-sm font-semibold text-carbon transition hover:bg-white"
              >
                Aceptar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
