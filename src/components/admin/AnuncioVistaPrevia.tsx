"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Monitor, Smartphone, X } from "lucide-react";
import { SITE } from "@/data/site-config";
import { accionAnuncio, type Anuncio } from "@/lib/anuncios";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { AnuncioTarjeta } from "@/components/layout/AnuncioTarjeta";

type Dispositivo = "movil" | "ordenador";

// Vista previa a tamaño real del pop-up, con el mismo componente que la web.
// Sirve también para borradores: no hace falta publicar para verlo.
export function AnuncioVistaPrevia({ anuncio, onClose }: { anuncio: Anuncio | null; onClose: () => void }) {
  const ancho = useMediaQuery("(min-width: 900px)");
  const [elegido, setElegido] = useState<Dispositivo>("movil");
  const [aviso, setAviso] = useState<string | null>(null);
  const dispositivo: Dispositivo = ancho ? elegido : "movil";

  useEffect(() => {
    if (!anuncio) return;
    const onKey = (e: KeyboardEvent) => {
      // Que Escape cierre la vista previa y no el editor que hay debajo.
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [anuncio, onClose]);

  useEffect(() => setAviso(null), [anuncio]);

  if (!anuncio) return null;
  const accion = accionAnuncio(anuncio);

  // En la vista previa los botones no navegan: dicen adónde llevarían.
  const interceptar = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute("href") ?? "";
    setAviso(
      href.includes("calendar.google.com")
        ? "Este botón guarda el evento en el calendario del cliente."
        : href.startsWith("https://api.whatsapp.com")
          ? "Este botón abre WhatsApp con un mensaje ya escrito para ti."
          : `Este botón lleva a ${href.startsWith("/") ? `${SITE.url.replace(/^https?:\/\//, "")}${href}` : href}`
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col bg-carbon" role="dialog" aria-modal="true" aria-label="Vista previa del anuncio">
      <div className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-cream sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/60">Vista previa</p>
          <p className="truncate text-sm">Así lo verán tus clientes al entrar en la web</p>
        </div>
        {ancho && (
          <div className="flex gap-1 rounded-full bg-cream/10 p-1">
            {(
              [
                ["movil", "Móvil", Smartphone],
                ["ordenador", "Ordenador", Monitor],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setElegido(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  dispositivo === id ? "bg-cream text-carbon" : "text-cream/75 hover:text-cream"
                )}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar vista previa"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-cream/20"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
        <div
          onClickCapture={interceptar}
          className={cn(
            "@container relative h-full w-full overflow-hidden bg-cream shadow-2xl",
            dispositivo === "movil"
              ? "max-h-[820px] max-w-[400px] rounded-[2rem] ring-[6px] ring-black sm:rounded-[2.6rem] sm:ring-[10px]"
              : "max-h-[760px] max-w-[1200px] rounded-2xl"
          )}
        >
          <WebDeFondo ordenador={dispositivo === "ordenador"} />
          <div className="absolute inset-0 bg-carbon/45 backdrop-blur-[3px]" />
          <div className="absolute inset-0 flex items-end justify-center @2xl:items-center @2xl:p-6">
            <AnuncioTarjeta anuncio={anuncio} onCerrar={onClose} className="max-h-[92%] @2xl:max-w-4xl" />
          </div>
          {aviso && (
            <div className="absolute inset-x-3 top-3 z-20 flex items-start gap-2 rounded-2xl bg-carbon px-4 py-3 text-xs text-cream shadow-lg">
              <ExternalLink size={14} className="mt-0.5 shrink-0" />
              <span className="flex-1 break-words">{aviso}</span>
              <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar" className="text-cream/70 hover:text-cream">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      {!accion && <p className="pb-4 text-center text-xs text-cream/60">Sin enlace: el anuncio sale sin botón principal.</p>}
    </div>,
    document.body
  );
}

// La tienda difuminada detrás del pop-up, solo como contexto.
function WebDeFondo({ ordenador }: { ordenador: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col">
      {ordenador && (
        <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-carbon/10 bg-cream-soft px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-carbon/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-carbon/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-carbon/15" />
          <span className="ml-3 h-4 w-56 rounded-full bg-carbon/[0.06] px-2 text-[10px] leading-4 text-stone">{SITE.url.replace(/^https?:\/\//, "")}</span>
        </div>
      )}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg text-carbon">{SITE.name}</span>
        <span className="flex gap-2">
          <span className="h-2 w-10 rounded-full bg-carbon/15" />
          <span className="h-2 w-10 rounded-full bg-carbon/15" />
        </span>
      </div>
      <div className="mx-5 flex-1 rounded-3xl bg-linen" />
      <div className="grid grid-cols-3 gap-3 p-5">
        <span className="h-20 rounded-2xl bg-cream-soft" />
        <span className="h-20 rounded-2xl bg-cream-soft" />
        <span className="h-20 rounded-2xl bg-cream-soft" />
      </div>
    </div>
  );
}
