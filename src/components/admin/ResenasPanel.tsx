"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageSquareReply, Send } from "lucide-react";
import { SITE } from "@/data/site-config";
import { PanelHeader, btnGhost, btnPrimary } from "./shared";

// Las reseñas viven solo en el Perfil de Empresa de Google: se publican
// solas y se responden desde Google. Aquí, los accesos directos.
export function ResenasPanel() {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    void navigator.clipboard.writeText(SITE.googleResenas).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    });
  }

  return (
    <div>
      <PanelHeader
        title="Reseñas"
        description="Las reseñas están en Google: se publican solas, sin aprobar nada, y salen también en la web. Tú solo las respondes."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-carbon/8 bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10 text-forest">
            <MessageSquareReply size={18} />
          </span>
          <p className="font-display text-lg text-carbon">Leer y responder</p>
          <p className="text-sm leading-relaxed text-stone">
            Abre tu ficha de Google con tu cuenta y pulsa «Leer reseñas». Debajo de cada una tienes «Responder».
          </p>
          <a href="https://www.google.com/search?q=mi+empresa" target="_blank" rel="noopener noreferrer" className={`${btnPrimary} mt-auto self-start`}>
            Abrir mi ficha de Google <ExternalLink size={14} />
          </a>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-carbon/8 bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Send size={18} />
          </span>
          <p className="font-display text-lg text-carbon">Pedir una reseña</p>
          <p className="text-sm leading-relaxed text-stone">
            Al entregar un pedido, el botón de WhatsApp de la agenda ya manda este enlace. Para otros clientes, cópialo o enséñales el QR del mostrador.
          </p>
          <p className="break-all rounded-lg bg-cream px-3 py-2 font-mono text-xs text-carbon">{SITE.googleResenas}</p>
          <button type="button" onClick={copiar} className={`${btnGhost} mt-auto self-start`}>
            {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar enlace"}
          </button>
        </div>
      </div>
    </div>
  );
}
