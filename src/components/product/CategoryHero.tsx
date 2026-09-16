"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { waLink } from "@/data/site-config";
import type { ReactNode } from "react";

export function CategoryHero({
  eyebrow,
  title,
  description,
  image,
  accent = "wellness",
  waMessage,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  accent?: "wellness" | "tech" | "gold";
  waMessage: string;
  children?: ReactNode;
}) {
  const accentClass =
    accent === "gold" ? "text-gold" : accent === "tech" ? "text-tech" : "text-wellness";

  return (
    <section className="relative flex min-h-[85vh] items-end overflow-hidden pt-32">
      {image && (
        <div className="absolute inset-0">
          <Image src={`/images/catalog/${image}`} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/70 to-obsidian/20" />
          <div className="absolute inset-0 bg-obsidian/30" />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`text-sm font-medium uppercase tracking-[0.2em] ${accentClass}`}
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] text-paper sm:text-6xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <a
            href="#catalogo"
            className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-obsidian transition hover:bg-white"
          >
            Ver productos
          </a>
          <a
            href={waLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-paper transition hover:border-wellness/50 hover:bg-wellness/10"
          >
            Consultar por WhatsApp
          </a>
        </motion.div>

        {children}
      </div>
    </section>
  );
}
