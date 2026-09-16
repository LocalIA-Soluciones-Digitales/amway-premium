"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_META } from "@/data/products";

const IMAGES: Record<string, string> = {
  nutricion: "p027_0_1047x1242.webp",
  "xs-energy": "p089_6_300x404.webp",
  belleza: "p129_0_1234x1349.webp",
  hogar: "p198_0_841x1091.webp",
};

export function CategoryShowcase() {
  const categories = Object.entries(CATEGORY_META);

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 max-w-2xl"
      >
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-wellness">
          Nuestro catálogo
        </p>
        <h2 className="mt-4 font-display text-3xl text-paper sm:text-5xl">
          Cuatro mundos, una sola calidad.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {categories.map(([slug, meta], i) => (
          <motion.div
            key={slug}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={meta.href}
              className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-3xl border border-white/8 p-8 sm:h-96"
            >
              <Image
                src={`/images/catalog/${IMAGES[slug]}`}
                alt=""
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-obsidian/10" />

              <div className="relative flex items-end justify-between">
                <div>
                  <h3 className="font-display text-2xl text-paper sm:text-3xl">{meta.label}</h3>
                  <p className="mt-2 max-w-xs text-sm text-mist">{meta.tagline}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-paper transition group-hover:bg-wellness group-hover:text-obsidian">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
