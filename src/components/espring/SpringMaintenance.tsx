"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SPRING_MAINTENANCE } from "@/data/espring-content";

export function SpringMaintenance() {
  return (
    <section className="bg-cream-soft py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 sm:px-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative order-2 aspect-[4/5] overflow-hidden rounded-3xl lg:order-1"
        >
          <Image
            src="/images/espring/filter-change.webp"
            alt="Cambio del cartucho de filtro eSpring™"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>

        <div className="order-1 lg:order-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-tech">Cómodo</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
            La sencilla regla 2-1-0.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-stone">
            Cambiar el filtro es tan sencillo como girar el cartucho. Sin fontanero, sin piezas
            adicionales.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-carbon/10 pt-8">
            {SPRING_MAINTENANCE.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <p className="font-display text-4xl text-carbon sm:text-5xl">{item.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-tech">
                  {item.unit}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-stone">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
