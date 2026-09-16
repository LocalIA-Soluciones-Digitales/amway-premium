"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { WA_PRESETS, waLink } from "@/data/site-config";

const PRESET_LABELS: { key: keyof typeof WA_PRESETS; label: string }[] = [
  { key: "general", label: "Hola, estoy interesado en vuestros productos." },
  { key: "info", label: "Quiero recibir más información." },
  { key: "order", label: "Quiero realizar un pedido." },
  { key: "availability", label: "¿Está disponible este producto?" },
];

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong w-72 overflow-hidden rounded-2xl p-4 text-sm shadow-2xl shadow-black/50 sm:w-80"
          >
            <p className="mb-3 font-display text-base text-paper">
              ¿Hablamos por WhatsApp?
            </p>
            <div className="flex flex-col gap-2">
              {PRESET_LABELS.map((preset) => (
                <a
                  key={preset.key}
                  href={waLink(WA_PRESETS[preset.key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-mist transition hover:border-wellness/40 hover:bg-wellness/10 hover:text-white"
                >
                  {preset.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Abrir chat de WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
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
