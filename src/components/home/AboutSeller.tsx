"use client";

import { motion } from "framer-motion";
import { ImageIcon, MessageCircle } from "lucide-react";
import { SITE, waLink, WA_PRESETS } from "@/data/site-config";

export function AboutSeller() {
  return (
    <section className="bg-linen">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 sm:px-8 sm:py-32 lg:grid-cols-12 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative order-2 flex aspect-[4/5] items-center justify-center rounded-sm border border-dashed border-carbon/25 bg-cream-soft lg:order-1 lg:col-span-5"
          aria-label="Fotografía pendiente"
        >
          <div className="flex flex-col items-center gap-3 px-8 text-center text-stone">
            <ImageIcon size={28} strokeWidth={1.5} />
            <p className="text-xs uppercase tracking-wider">Añade tu fotografía aquí</p>
          </div>
        </motion.div>

        <div className="order-1 lg:order-2 lg:col-span-7">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
            Atención personal en {SITE.city}
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-6xl">
            Estoy aquí
            <br />
            para ayudarte.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-stone sm:text-lg">
            Cada persona tiene necesidades distintas. Si no sabes qué producto es
            el más adecuado para ti, escríbeme y te asesoro sin compromiso: qué
            tomar, en qué cantidad y qué esperar del resultado.
          </p>
          <a
            href={waLink(WA_PRESETS.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-carbon px-7 py-3.5 text-sm font-medium text-cream transition hover:bg-carbon-soft"
          >
            <MessageCircle size={16} />
            Hablar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
