"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "¿Los productos son 100% originales?",
    a: "Sí. Todos nuestros productos son originales Amway, importados directamente de Estados Unidos, con la misma calidad, packaging y garantía de satisfacción que en origen.",
  },
  {
    q: "¿Cómo hago un pedido?",
    a: "Escríbenos por WhatsApp indicando el producto que te interesa. Te confirmamos disponibilidad, precio en euros y plazo de entrega antes de formalizar el pedido.",
  },
  {
    q: "¿Hacéis envíos a toda España?",
    a: "Sí, realizamos envíos a toda la península. Si estás en Barakaldo o alrededores, también podemos coordinar la entrega en persona.",
  },
  {
    q: "¿Los precios están en dólares o en euros?",
    a: "El catálogo de referencia es de Estados Unidos y los precios base están en dólares (USD). Te confirmamos el importe final en euros, incluidos gastos de importación, antes de cerrar el pedido.",
  },
  {
    q: "¿Qué pasa si un producto no está disponible?",
    a: "Te avisamos por WhatsApp y te proponemos alternativas o el plazo estimado de reposición según el catálogo Amway US.",
  },
  {
    q: "¿Ofrecéis asesoramiento personalizado?",
    a: "Sí, con gusto te ayudamos a elegir el producto Nutrilite, Artistry, XS Energy o para el hogar que mejor se adapte a tus necesidades.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      {FAQS.map((item, i) => (
        <div key={item.q} className="border-b border-white/8">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between py-6 text-left"
          >
            <span className="font-display text-lg text-paper">{item.q}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-mist transition-transform ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="pb-6 text-sm leading-relaxed text-mist">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
