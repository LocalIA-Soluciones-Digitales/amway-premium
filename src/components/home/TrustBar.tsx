"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Plane, MapPin, Award } from "lucide-react";

const ITEMS = [
  {
    icon: Plane,
    title: "Importación directa",
    text: "Productos originales importados desde Estados Unidos, sin intermediarios.",
  },
  {
    icon: MapPin,
    title: "Servicio local",
    text: "Atención personalizada en Barakaldo, Bizkaia, con entrega en toda España.",
  },
  {
    icon: ShieldCheck,
    title: "100% originales",
    text: "Garantía de autenticidad Amway en cada uno de nuestros productos.",
  },
  {
    icon: Award,
    title: "Más de 90 años",
    text: "Innovación Nutrilite basada en plantas y prácticas agrícolas orgánicas.",
  },
];

export function TrustBar() {
  return (
    <section className="border-y border-white/8 bg-obsidian-soft/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-16 sm:grid-cols-4 sm:px-8">
        {ITEMS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex flex-col items-start gap-3"
          >
            <item.icon className="text-wellness" size={22} />
            <p className="font-display text-lg text-paper">{item.title}</p>
            <p className="text-sm leading-relaxed text-mist">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
