"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { waLink } from "@/data/site-config";
import type { ReactNode } from "react";

const ACCENT_GLOW: Record<string, string> = {
  wellness: "rgba(53,208,161,0.35)",
  tech: "rgba(77,142,255,0.35)",
  gold: "rgba(212,175,106,0.4)",
};

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
    <section className="relative overflow-hidden pb-16 pt-36 sm:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-obsidian" />
        <div
          className="absolute -top-1/4 left-[-15%] h-[60vh] w-[60vh] rounded-full opacity-30 blur-[110px]"
          style={{ background: `radial-gradient(circle, ${ACCENT_GLOW[accent]}, transparent 70%)` }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 px-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
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
            className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-paper sm:text-5xl lg:text-6xl"
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

        {image && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto aspect-[4/5] w-full max-w-md"
          >
            <div className="glass absolute inset-0 rounded-[2rem]" />
            <div className="absolute inset-6 overflow-hidden rounded-[1.5rem]">
              <Image
                src={`/images/catalog/${image}`}
                alt=""
                fill
                priority
                sizes="420px"
                className="object-contain p-6"
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
