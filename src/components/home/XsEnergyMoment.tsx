"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function XsEnergyMoment() {
  return (
    <section className="relative flex min-h-[85svh] items-center overflow-hidden bg-xs-ink">
      <div className="absolute inset-0">
        <Image
          src="/images/editorial/xs-energy-tenista.webp"
          alt="Energía y rendimiento XS"
          fill
          sizes="100vw"
          className="object-cover object-[80%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-xs-ink)_0%,var(--color-xs-ink)_66%,rgba(12,13,16,0.5)_80%,rgba(12,13,16,0.15)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-xs-ink/70 via-transparent to-xs-ink/40" />
      </div>

      <div className="relative w-full px-6 py-28 sm:px-8 lg:py-36">
        <div className="mx-auto max-w-7xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-xs-red"
          >
            XS Energy
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-xl font-display text-6xl uppercase italic leading-[0.92] text-cream sm:text-7xl lg:text-8xl"
          >
            Energía
            <br />
            para seguir
            <br />
            tu ritmo.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-9"
          >
            <a
              href="/xs-energy"
              className="group inline-flex items-center gap-2 rounded-full bg-xs-red px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-cream transition hover:bg-xs-red/90"
            >
              Descubre XS
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
