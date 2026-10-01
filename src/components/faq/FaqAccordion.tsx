"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SITE } from "@/data/site-config";

const FAQS = [
  {
    q: "¿Los productos son 100% originales?",
    a: "Sí. Todos nuestros productos son originales Amway, importados directamente de Estados Unidos, con la misma calidad, packaging y garantía de satisfacción que en origen.",
  },
  {
    q: "¿Cómo hago un pedido?",
    a: "Añade los productos a la cesta, elige el día y la hora de recogida en nuestro local y paga con tarjeta en la web o en efectivo al recoger. Si lo prefieres, también puedes pedirlo por WhatsApp.",
  },
  {
    q: "¿Hacéis envíos a domicilio?",
    a: `No. Todos los pedidos se recogen en nuestro local de ${SITE.city}, ${SITE.horario.texto}. Eliges el día y la hora al hacer el pedido.`,
  },
  {
    q: "¿Los precios están en dólares o en euros?",
    a: "Todos los precios que ves en la web están en euros, con IVA incluido, según la lista de precios oficial de Amway España. No hay gastos de envío: los pedidos se recogen en nuestro local.",
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
        <div key={item.q} className="border-b border-carbon/10">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between py-6 text-left"
          >
            <span className="font-display text-lg text-carbon">{item.q}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-forest transition-transform ${open === i ? "rotate-180" : ""}`}
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
                <p className="pb-6 text-sm leading-relaxed text-stone">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
