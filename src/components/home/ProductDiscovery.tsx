"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const NEEDS = [
  { label: "Energía", href: "/xs-energy", description: "Rendimiento, foco y recuperación." },
  { label: "Bienestar", href: "/nutricion", description: "Vitaminas, proteína e inmunidad." },
  { label: "Belleza", href: "/belleza", description: "Cuidado de la piel y el cabello." },
  { label: "Cuidado diario", href: "/belleza", description: "Higiene y rutina personal." },
  { label: "Hogar", href: "/hogar", description: "Agua, aire y cocina más limpios." },
];

export function ProductDiscovery() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-sm font-medium uppercase tracking-[0.2em] text-forest"
      >
        Guía rápida
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.05 }}
        className="mt-4 font-display text-4xl leading-[1.05] text-carbon sm:text-6xl"
      >
        Encuentra lo que necesitas.
      </motion.h2>

      <div className="mt-12 flex flex-col divide-y divide-carbon/10 border-t border-carbon/10">
        {NEEDS.map((need, i) => (
          <motion.div
            key={need.label + i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          >
            <Link
              href={need.href}
              className="group flex items-center justify-between gap-6 py-7 transition-colors hover:bg-linen/60 sm:px-2"
            >
              <div className="flex min-w-0 items-baseline gap-5 sm:gap-10">
                <span className="text-sm text-stone">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <span className="block font-display text-3xl text-carbon transition-transform duration-300 group-hover:translate-x-2 sm:text-4xl">
                    {need.label}
                  </span>
                  <span className="mt-1 block text-sm text-stone sm:hidden">{need.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="hidden max-w-[14rem] text-right text-sm text-stone sm:block">
                  {need.description}
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-carbon/15 text-carbon transition group-hover:border-forest group-hover:bg-forest group-hover:text-cream">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
