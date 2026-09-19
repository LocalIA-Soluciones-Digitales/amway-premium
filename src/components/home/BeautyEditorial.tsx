"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export function BeautyEditorial() {
  return (
    <section className="bg-cream-soft">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-0 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative order-2 aspect-[4/3] lg:order-1 lg:col-span-7 lg:aspect-auto lg:h-[36rem]"
        >
          <Image
            src="/images/editorial/belleza-flores.webp"
            alt="Artistry Skin Nutrition"
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        </motion.div>

        <div className="order-1 px-6 py-16 sm:px-8 lg:order-2 lg:col-span-5 lg:px-16">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Artistry™
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-6xl">
            La ciencia
            <br />
            de tu piel.
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-stone sm:text-lg">
            Fórmulas con fitonutrientes de origen vegetal, respaldadas por más de una
            década de investigación dermatológica. Resultados visibles, piel que se
            siente como propia.
          </p>
          <a
            href="/belleza"
            className="mt-8 inline-flex items-center gap-2 border-b border-carbon/30 pb-1 text-sm text-carbon transition hover:border-carbon"
          >
            Descubrir Artistry
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
