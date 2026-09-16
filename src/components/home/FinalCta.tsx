"use client";

import { motion } from "framer-motion";
import { waLink, WA_PRESETS, SITE } from "@/data/site-config";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(53,208,161,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl text-paper sm:text-5xl"
        >
          Tu bienestar empieza con una conversación.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-base text-mist"
        >
          Escríbenos y te asesoramos sin compromiso sobre el producto Amway que mejor se adapta a
          ti, con entrega directa en {SITE.city} y toda España.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-9 flex flex-wrap justify-center gap-4"
        >
          <a
            href={waLink(WA_PRESETS.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-wellness px-8 py-3.5 text-sm font-medium text-obsidian transition hover:bg-wellness/90"
          >
            Escribir por WhatsApp
          </a>
          <a
            href="/catalogo"
            className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-paper transition hover:border-white/40"
          >
            Ver catálogo completo
          </a>
        </motion.div>
      </div>
    </section>
  );
}
