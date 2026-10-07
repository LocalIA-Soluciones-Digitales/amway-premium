"use client";

import { ABRIR_COOKIES } from "@/lib/analytics";

// Vuelve a abrir el banner para cambiar o retirar el consentimiento.
export function ConfigurarCookies({ className, children = "Configurar cookies" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(ABRIR_COOKIES))} className={className}>
      {children}
    </button>
  );
}
