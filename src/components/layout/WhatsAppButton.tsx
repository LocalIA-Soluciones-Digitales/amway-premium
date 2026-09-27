"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, MessageCircle, RotateCcw, X } from "lucide-react";
import { SITE, WA_PRESETS, waLink } from "@/data/site-config";
import {
  SALUDO_ASISTENTE,
  TEMAS,
  TEMAS_INICIO,
  type AccionAsistente,
  type TemaId,
} from "@/data/asistente";
import { useCesta } from "@/components/cart/CartProvider";
import { track } from "@/lib/analytics";

type Mensaje = { id: number; de: "bot" | "cliente"; lineas: string[] };

const ESCRIBIENDO_MS = 550;

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [temaActual, setTemaActual] = useState<TemaId | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const siguienteId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { openCesta } = useCesta();

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [mensajes, escribiendo]);

  function nuevo(de: Mensaje["de"], lineas: string[]): Mensaje {
    return { id: siguienteId.current++, de, lineas };
  }

  function preguntar(id: TemaId) {
    if (escribiendo) return;
    const tema = TEMAS[id];
    setMensajes((m) => [...m, nuevo("cliente", [tema.pregunta])]);
    setTemaActual(null);
    setEscribiendo(true);
    timer.current = setTimeout(() => {
      setMensajes((m) => [...m, nuevo("bot", tema.respuesta)]);
      setTemaActual(id);
      setEscribiendo(false);
    }, ESCRIBIENDO_MS);
  }

  function reiniciar() {
    if (timer.current) clearTimeout(timer.current);
    setMensajes([]);
    setTemaActual(null);
    setEscribiendo(false);
  }

  function alWhatsApp(label: string) {
    track("whatsapp_click", `asistente · ${label}`);
  }

  const acciones: AccionAsistente[] = temaActual
    ? TEMAS[temaActual].acciones
    : TEMAS_INICIO.map((id) => ({ tipo: "tema", id, label: TEMAS[id].pregunta }));

  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-3 sm:right-8 sm:bottom-[calc(2rem+env(safe-area-inset-bottom))]">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={`Asistente de ${SITE.name}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[min(34rem,calc(100dvh-7.5rem))] w-[calc(100vw-2rem)] max-w-[23rem] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-carbon/10 bg-cream-soft text-sm text-carbon shadow-2xl shadow-carbon/20"
          >
            <header className="flex items-center gap-3 border-b border-carbon/8 px-4 py-3">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-cream">
                <MessageCircle size={17} />
                <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-cream-soft bg-[#25D366]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] leading-tight">{SITE.name}</p>
                <p className="text-xs text-stone">Asistente · respuestas al momento</p>
              </div>
              {mensajes.length > 0 && (
                <button
                  type="button"
                  onClick={reiniciar}
                  aria-label="Volver al inicio"
                  title="Volver al inicio"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone transition hover:bg-linen hover:text-carbon"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone transition hover:bg-linen hover:text-carbon"
              >
                <X size={17} />
              </button>
            </header>

            <div
              ref={scrollRef}
              data-lenis-prevent
              aria-live="polite"
              className="flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-4"
            >
              <Burbuja de="bot" lineas={SALUDO_ASISTENTE} />
              {mensajes.map((m) => (
                <Burbuja key={m.id} de={m.de} lineas={m.lineas} />
              ))}
              {escribiendo && <Escribiendo />}

              {!escribiendo && (
                <motion.div
                  key={temaActual ?? "inicio"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="mt-1 flex flex-wrap gap-1.5"
                >
                  {acciones.map((a) => (
                    <Chip
                      key={a.label}
                      accion={a}
                      onTema={preguntar}
                      onCesta={() => {
                        setOpen(false);
                        openCesta();
                      }}
                      onEnlace={() => setOpen(false)}
                      onWhatsApp={alWhatsApp}
                    />
                  ))}
                  {temaActual && (
                    <button
                      type="button"
                      onClick={() => setTemaActual(null)}
                      className="rounded-full px-3 py-1.5 text-xs text-stone transition hover:text-carbon"
                    >
                      Otras dudas
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            <footer className="border-t border-carbon/8 p-3">
              <a
                href={waLink(WA_PRESETS.general)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => alWhatsApp("hablar con una persona")}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-medium text-white transition hover:bg-[#1fbe5b]"
              >
                <MessageCircle size={16} />
                Hablar con una persona
              </a>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente y WhatsApp"}
        aria-expanded={open}
        className="relative flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
      >
        <span className="absolute inset-0 animate-pulse-slow rounded-full bg-[#25D366]/50 blur-md" />
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="relative"
            >
              <X size={26} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageCircle size={26} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

function Burbuja({ de, lineas }: { de: Mensaje["de"]; lineas: string[] }) {
  const bot = de === "bot";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={
        bot
          ? "max-w-[88%] self-start rounded-2xl rounded-tl-md bg-linen px-3.5 py-2.5 leading-relaxed"
          : "max-w-[80%] self-end rounded-2xl rounded-tr-md bg-forest px-3.5 py-2 text-cream"
      }
    >
      {lineas.map((l, i) => (
        <p key={i} className={i > 0 ? "mt-1.5" : undefined}>
          {l}
        </p>
      ))}
    </motion.div>
  );
}

function Escribiendo() {
  return (
    <div className="flex w-fit items-center gap-1 self-start rounded-2xl rounded-tl-md bg-linen px-3.5 py-3" aria-label="Escribiendo">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-stone"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

const chipClass =
  "inline-flex items-center gap-1 rounded-full border border-forest/25 bg-white/60 px-3 py-1.5 text-xs font-medium text-forest transition hover:border-forest hover:bg-forest hover:text-cream";

function Chip({
  accion,
  onTema,
  onCesta,
  onEnlace,
  onWhatsApp,
}: {
  accion: AccionAsistente;
  onTema: (id: TemaId) => void;
  onCesta: () => void;
  onEnlace: () => void;
  onWhatsApp: (label: string) => void;
}) {
  switch (accion.tipo) {
    case "tema":
      return (
        <button type="button" onClick={() => onTema(accion.id)} className={chipClass}>
          {accion.label}
        </button>
      );
    case "cesta":
      return (
        <button type="button" onClick={onCesta} className={chipClass}>
          {accion.label}
        </button>
      );
    case "enlace":
      return (
        <Link href={accion.href} onClick={onEnlace} className={chipClass}>
          {accion.label}
        </Link>
      );
    case "whatsapp":
      return (
        <a
          href={waLink(accion.mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onWhatsApp(accion.label)}
          className="inline-flex items-center gap-1 rounded-full border border-[#25D366]/50 bg-[#25D366]/10 px-3 py-1.5 text-xs font-medium text-[#128c4a] transition hover:bg-[#25D366] hover:text-white"
        >
          {accion.label}
          <ArrowUpRight size={12} />
        </a>
      );
  }
}
