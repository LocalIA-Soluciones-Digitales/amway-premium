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
          className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[55] mx-auto max-w-xl rounded-2xl bg-carbon p-4 text-cream shadow-2xl sm:left-6 sm:right-auto sm:mx-0 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <Cookie size={18} className="mt-0.5 shrink-0 text-gold-soft" />
            <p className="text-sm leading-relaxed text-cream/80">
              Usamos cookies propias para saber qué páginas y productos interesan más y mejorar la tienda. No
              las compartimos con nadie.
            </p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => decide("rechazadas")}
              className="rounded-full border border-cream/20 px-4 py-2 text-xs font-medium text-cream/80 transition hover:bg-cream/10"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => decide("aceptadas")}
              className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-carbon transition hover:bg-white"
            >
              Aceptar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
