"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { getConsent, reportError, setConsent, track } from "@/lib/analytics";

// Pageviews on every route change, WhatsApp clicks anywhere on the page,
// global error capture, and the consent banner that gates all of it.
export function Analytics() {
  const pathname = usePathname();
  const [askConsent, setAskConsent] = useState(false);
  const [consentVersion, setConsentVersion] = useState(0);

  useEffect(() => {
    if (!pathname?.startsWith("/admin")) setAskConsent(getConsent() === null);
  }, [pathname]);

  useEffect(() => {
    if (pathname) track("pageview", undefined, pathname);
  }, [pathname, consentVersion]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (a?.href && /wa\.me|whatsapp\.com/.test(a.href)) track("whatsapp_click", a.getAttribute("aria-label") ?? undefined);
    };
    const onError = (e: ErrorEvent) => reportError(e.message || "Error", e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      reportError(r instanceof Error ? r.message : String(r ?? "Promesa rechazada"), r instanceof Error ? r.stack : undefined);
    };
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
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
          className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[55] mx-auto max-w-sm rounded-2xl border border-cream/10 bg-carbon/95 p-5 text-cream shadow-[0_20px_50px_rgba(28,26,22,0.35)] backdrop-blur-md sm:left-8 sm:right-auto sm:bottom-[calc(2rem+env(safe-area-inset-bottom))] sm:mx-0"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream/10">
              <Cookie size={17} className="text-gold-soft" />
            </span>
            <p className="font-display text-lg leading-none">Tu privacidad</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-cream/75">
            Usamos cookies propias para saber qué páginas y productos interesan más y mejorar la tienda. No las
            compartimos con nadie.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => decide("rechazadas")}
              className="rounded-full border border-cream/20 px-4 py-2.5 text-sm font-medium text-cream/85 transition hover:border-cream/40 hover:bg-cream/10"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => decide("aceptadas")}
              className="rounded-full bg-cream px-4 py-2.5 text-sm font-semibold text-carbon transition hover:bg-white"
            >
              Aceptar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
