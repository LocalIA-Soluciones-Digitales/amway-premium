"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  wide,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  /** Wider sheet for admin editors. */
  wide?: boolean;
  children: ReactNode;
}) {
  const lenis = useLenis();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, lenis, onClose]);

  if (!mounted) return null;

  // Portal: cards use transforms (hover/entrance animations) that would
  // otherwise trap a fixed-position dialog inside the card.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-carbon/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
            className={`relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-cream-soft px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 shadow-2xl sm:rounded-3xl sm:pb-7 ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {eyebrow && <p className="text-[11px] uppercase tracking-[0.2em] text-stone">{eyebrow}</p>}
                <h2 className="font-display text-2xl leading-tight text-carbon">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-carbon/15 text-carbon transition hover:bg-carbon/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export const fieldClass =
  "w-full rounded-xl border border-carbon/15 bg-white/70 px-4 py-3 text-base text-carbon placeholder:text-stone/60 focus:border-forest focus:outline-none sm:text-sm";
