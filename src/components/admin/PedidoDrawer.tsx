"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { CalendarClock, X } from "lucide-react";
import { PedidoDetalle } from "./PedidoDetalle";
import { Badge, ESTADO_PEDIDO, eur, fecha, recogidaCorta, type Pedido } from "./shared";

// Ficha de un pedido en un panel lateral (hoja inferior en el móvil): se ve
// y se gestiona sin perder de vista la agenda ni desplazar la lista.
export function PedidoDrawer({
  pedido,
  onClose,
  onUpdate,
  onDelete,
}: {
  pedido: Pedido | null;
  onClose: () => void;
  onUpdate: (id: string, c: Partial<Pedido>) => void;
  onDelete: (p: Pedido) => void;
}) {
  const lenis = useLenis();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const open = pedido != null;
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {pedido && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Pedido #${pedido.numero}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-carbon/30 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
            className="absolute inset-y-0 right-0 flex w-full max-w-[34rem] flex-col bg-cream-soft shadow-[-30px_0_60px_rgba(28,26,22,0.18)] sm:rounded-l-3xl"
          >
            <header className="flex items-start gap-3 border-b border-carbon/[0.07] px-5 pb-4 pt-[calc(1.1rem+env(safe-area-inset-top))]">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-2xl leading-none tabular-nums text-carbon">#{pedido.numero}</span>
                  <Badge tone={ESTADO_PEDIDO[pedido.estado].tone}>{ESTADO_PEDIDO[pedido.estado].label}</Badge>
                </div>
                <p className="mt-1.5 truncate text-sm font-medium text-carbon">{pedido.cliente_nombre || "Sin nombre"}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone">
                  <span>{fecha(pedido.created_at, true)}</span>
                  {pedido.recogida_fecha && (
                    <span className="inline-flex items-center gap-1 text-carbon">
                      <CalendarClock size={12} className="text-stone" /> Recoge {recogidaCorta(pedido)}
                    </span>
                  )}
                  <span className="font-medium tabular-nums text-carbon">{eur(pedido.total_eur)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-carbon/10 bg-white text-carbon transition hover:border-carbon/25"
              >
                <X size={16} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
              <PedidoDetalle
                key={pedido.id}
                p={pedido}
                compact
                onUpdate={(c) => onUpdate(pedido.id, c)}
                onDelete={() => onDelete(pedido)}
              />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
