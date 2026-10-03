"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Manifesto() {
  return (
    // Contenido dentro del ancho de página (no a sangre) para que haya aire
    // entre esta sección clara y el bloque oscuro de XS que viene después.
    <section className="mx-auto max-w-7xl px-6 pb-28 pt-4 sm:px-8 sm:pb-36 sm:pt-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 1.03 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative aspect-[4/3] overflow-hidden lg:col-span-6 lg:aspect-[4/5]"
        >
          <Image
            src="/images/editorial/nutricion-campo.webp"
            alt="Cultivos Nutrilite al atardecer"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>

        <div className="lg:col-span-5 lg:col-start-8">
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
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="mt-5 font-display text-5xl leading-[1.02] text-carbon sm:text-6xl"
          >
            Tu bienestar.
            <br />A tu manera.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            className="mt-7 max-w-md text-base leading-relaxed text-stone sm:text-lg"
          >
            Nutrilite cultiva sus propias plantas en granjas certificadas, desde la
            semilla hasta el suplemento. Es la misma exigencia que aplicamos al
            elegir cada producto que te recomendamos: calidad real, sin atajos.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex items-center gap-8 border-t border-carbon/10 pt-8"
          >
            <div>
              <p className="font-display text-3xl text-carbon">1934</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone">Nutrilite desde</p>
            </div>
            <Link
              href="/nutricion"
              className="ml-auto inline-flex items-center gap-2 border-b border-carbon/30 pb-1 text-sm text-carbon transition hover:border-carbon"
            >
              Conoce Nutrilite™
              <ArrowUpRight size={15} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
