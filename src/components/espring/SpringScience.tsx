"use client";

import { motion } from "framer-motion";
import { SpringVideoMoment } from "./SpringVideoMoment";
import { SPRING_FILTER_LAYERS, SPRING_SPECS } from "@/data/espring-content";

export function SpringScience() {
  return (
    <>
      <SpringVideoMoment
        id="ciencia"
        video="/videos/espring/exploded-science.mp4"
        poster="/images/espring/device-cutaway.webp"
        posterAlt="Vista despiezada del Filtro de carbón e3 de eSpring™"
        eyebrow="El Filtro de carbón e3"
        description="Tres capas de filtración de alta calidad, desde el prefiltro hasta el bloque de carbón activado, explicadas capa a capa."
      />

      <section className="bg-carbon-soft py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {SPRING_FILTER_LAYERS.map((layer, i) => (
                <motion.div
                  key={layer.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-cream/10 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spring-blue">
                    0{i + 1}
                  </p>
                  <h3 className="mt-3 font-display text-lg text-cream">{layer.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/55">{layer.detail}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-center gap-5 rounded-2xl bg-carbon p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spring-blue">
                Ficha técnica
              </p>
              {SPRING_SPECS.map((spec) => (
                <div key={spec.label} className="flex items-baseline justify-between gap-4 border-t border-cream/10 pt-4 first:border-t-0 first:pt-0">
                  <span className="text-sm text-cream/55">{spec.label}</span>
                  <span className="text-right text-sm font-medium text-cream">{spec.value}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
