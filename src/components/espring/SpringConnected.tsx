"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SPRING_APP_FEATURES } from "@/data/espring-content";

export function SpringConnected() {
  return (
    <section className="relative overflow-hidden bg-spring-ink py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 sm:px-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-spring-blue">
            Conectado
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-cream sm:text-5xl">
            La app Amway™ Healthy Home
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {SPRING_APP_FEATURES.map((feature, i) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="flex items-start gap-3 text-cream/75"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-spring-blue/20 text-spring-blue">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed sm:text-base">{feature}</span>
              </motion.li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-cream/35">Requiere conexión a internet.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto flex w-full max-w-sm items-end justify-center gap-4"
        >
          <div className="relative h-[280px] w-[140px] sm:h-[340px] sm:w-[170px]">
            <Image
              src="/images/espring/app-screenshot-usage.webp"
              alt="Consumo de agua en la app Amway Healthy Home"
              fill
              sizes="170px"
              className="rounded-2xl object-cover shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
            />
          </div>
          <div className="relative h-[320px] w-[160px] translate-y-4 sm:h-[390px] sm:w-[195px]">
            <Image
              src="/images/espring/app-screenshot-filter.webp"
              alt="Vida útil del filtro en la app Amway Healthy Home"
              fill
              sizes="195px"
              className="rounded-2xl object-cover shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
