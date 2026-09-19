"use client";

import { motion } from "framer-motion";
import { waLink, WA_PRESETS, SITE } from "@/data/site-config";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-cream py-24 sm:py-32">
      <div className="relative mx-auto max-w-4xl px-6 text-center sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl leading-[1.05] text-carbon sm:text-6xl"
        >
          ¿No sabes cuál elegir?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-5 max-w-xl text-base text-stone sm:text-lg"
        >
          Escríbenos y te asesoramos sin compromiso, con entrega directa en{" "}
          {SITE.city} y toda España.
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
            className="rounded-full bg-forest px-8 py-3.5 text-sm font-medium text-cream transition hover:bg-forest-dim"
          >
            Escribir por WhatsApp
          </a>
          <a
            href="/catalogo"
            className="rounded-full border border-carbon/20 px-8 py-3.5 text-sm font-medium text-carbon transition hover:border-carbon/40"
          >
            Ver catálogo completo
          </a>
        </motion.div>
      </div>
    </section>
  );
}
