"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_META } from "@/data/products";

const TILES: { slug: "nutricion" | "belleza" | "hogar"; image: string; span: string }[] = [
  { slug: "nutricion", image: "/images/editorial/nutricion-botanico.webp", span: "sm:col-span-7 sm:row-span-2" },
  { slug: "belleza", image: "/images/editorial/belleza-editorial.webp", span: "sm:col-span-5" },
  { slug: "hogar", image: "/images/editorial/hogar-familia.webp", span: "sm:col-span-5" },
];

export function CategoryShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 max-w-2xl"
      >
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
          Nuestro catálogo
        </p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-carbon sm:text-6xl">
          Tres mundos, una sola calidad.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-12 sm:grid-rows-2">
        {TILES.map(({ slug, image, span }, i) => {
          const meta = CATEGORY_META[slug];
          return (
            <motion.div
              key={slug}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={span}
            >
              <Link
                href={meta.href}
                className="group relative flex h-72 flex-col justify-end overflow-hidden sm:h-full sm:min-h-[17rem]"
              >
                <Image
                  src={image}
                  alt={meta.label}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-carbon/85 via-carbon/15 to-transparent transition-opacity duration-500 group-hover:from-carbon/90" />

                <div className="relative flex items-end justify-between p-7 sm:p-8">
                  <div>
                    <h3 className="font-display text-2xl text-cream sm:text-3xl">{meta.label}</h3>
                    <p className="mt-2 max-w-xs text-sm text-cream/70">{meta.tagline}</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream backdrop-blur transition group-hover:bg-cream group-hover:text-carbon">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
