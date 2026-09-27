"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Info,
  MessageCircle,
  PackageSearch,
  ShoppingBag,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { SITE, WA_PRESETS, waLink } from "@/data/site-config";

const PRESETS: {
  key: keyof typeof WA_PRESETS;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    key: "general",
    icon: Sparkles,
    title: "Asesoramiento personalizado",
    description: "Te ayudamos a elegir los productos que mejor encajan contigo.",
  },
  {
    key: "info",
    icon: Info,
    title: "Información detallada",
    description: "Características, modo de uso, precios y condiciones de entrega.",
  },
  {
    key: "order",
    icon: ShoppingBag,
    title: "Realizar un pedido",
    description: "Te guiamos en el proceso, formas de pago y plazos de envío.",
  },
  {
    key: "availability",
    icon: PackageSearch,
    title: "Consultar disponibilidad",
    description: "Comprobamos el stock y el plazo de entrega en tu zona.",
  },
];

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-3 sm:right-8 sm:bottom-[calc(2rem+env(safe-area-inset-bottom))]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass-dark w-[calc(100vw-2rem)] max-w-[22rem] origin-bottom-right overflow-hidden rounded-2xl text-sm shadow-2xl shadow-black/30"
          >
            <div className="flex items-center gap-3 border-b border-white/10 bg-[#25D366]/10 px-4 py-3.5">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                <MessageCircle size={20} />
                <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-[#1c1c1c] bg-[#25D366]" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base leading-tight text-cream">
                  {SITE.name}
                </p>
                <p className="text-xs text-cream/55">
                  Atención personalizada · Te respondemos lo antes posible
                </p>
              </div>
            </div>

            <div className="p-4">
              <p className="mb-3 text-[13px] leading-relaxed text-cream/70">
                Hola 👋 ¿En qué podemos ayudarte? Elige una opción y te
                abriremos WhatsApp con el mensaje ya preparado.
              </p>
              <div className="flex flex-col gap-2">
                {PRESETS.map(({ key, icon: Icon, title, description }) => (
                  <a
                    key={key}
                    href={waLink(WA_PRESETS[key])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-[#25D366]/40 hover:bg-[#25D366]/10"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#25D366] transition group-hover:bg-[#25D366]/15">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-cream/90 group-hover:text-cream">
                        {title}
                      </span>
                      <span className="block text-xs leading-snug text-cream/50">
                        {description}
                      </span>
                    </span>
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-cream/30 transition group-hover:translate-x-0.5 group-hover:text-[#25D366]"
                    />
                  </a>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-cream/40">
                {SITE.legalNote}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Abrir chat de WhatsApp"
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
