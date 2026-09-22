"use client";

import { motion } from "framer-motion";
import { SPRING_FACTS } from "@/data/espring-content";

export function SpringFacts() {
  return (
    <section className="relative overflow-hidden bg-carbon py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {SPRING_FACTS.map((fact, i) => (
            <motion.div
              key={fact.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-cream/10 pt-6"
            >
              <p className="font-display text-5xl italic text-cream sm:text-6xl">{fact.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-spring-blue">
                {fact.label}
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/55">{fact.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
