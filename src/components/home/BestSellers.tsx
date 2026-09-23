"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const RANGES = [
  {
    id: "xs-energy",
    brand: "XS™ Energy",
    tagline: "Power Drinks en seis sabores reales, pre-entreno y recuperación deportiva.",
    image: "/images/xs-energy/lifestyle/cheers-cooler.webp",
    href: "/xs-energy",
  },
  {
    id: "espring",
    brand: "eSpring™",
    tagline: "Purificación LED UV-C: filtra más de 170 contaminantes al instante.",
    image: "/images/espring/kitchen-lifestyle.webp",
    href: "/espring",
  },
  {
    id: "nutrilite",
    brand: "Nutrilite™",
    tagline: "Vitaminas y proteínas cultivadas desde la raíz, ciencia basada en plantas.",
    image: "/images/products/double-x.webp",
    href: "/nutricion",
  },
] as const;

export function BestSellers() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 flex items-end justify-between gap-6"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
            Selección
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-carbon sm:text-6xl">
            Los imprescindibles.
          </h2>
        </div>
        <a
          href="/catalogo"
          className="hidden shrink-0 border-b border-carbon/30 pb-0.5 text-sm text-carbon transition hover:border-carbon sm:block"
        >
          Ver catálogo completo
        </a>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {RANGES.map((range, i) => (
          <motion.div
            key={range.id}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={range.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-carbon"
            >
              <Image
                src={range.image}
                alt={range.brand}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/35 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-7">
                <h3 className="font-display text-2xl text-cream sm:text-3xl">{range.brand}</h3>
                <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-cream/70">
                  {range.tagline}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cream">
                  Descubre la gama
                  <ArrowUpRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <Link
        href="/catalogo"
        className="mt-10 flex items-center justify-center gap-2 rounded-full border border-carbon/15 py-3.5 text-sm font-medium text-carbon transition hover:border-carbon/40 sm:hidden"
      >
        Ver catálogo completo
        <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
