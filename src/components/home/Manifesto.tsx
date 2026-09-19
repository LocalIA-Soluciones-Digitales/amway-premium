"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function Manifesto() {
  return (
    <section className="grid grid-cols-1 items-stretch lg:grid-cols-2">
      <div className="relative min-h-[50vh] lg:min-h-[70vh]">
        <Image
          src="/images/editorial/nutricion-campo.webp"
          alt="Cultivos Nutrilite al atardecer"
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      <div className="flex items-center bg-linen px-6 py-20 sm:px-8 lg:px-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-sm font-medium uppercase tracking-[0.2em] text-forest"
          >
            Nuestra filosofía
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-display text-5xl leading-[1.02] text-carbon sm:text-6xl"
          >
            Tu bienestar.
            <br />A tu manera.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-md text-base leading-relaxed text-stone sm:text-lg"
          >
            Nutrilite cultiva sus propias plantas en granjas certificadas, desde la
            semilla hasta el suplemento. Es la misma exigencia que aplicamos al
            elegir cada producto que te recomendamos: calidad real, sin atajos.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
