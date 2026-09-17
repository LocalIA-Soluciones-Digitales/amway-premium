"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { waLink } from "@/data/site-config";

const XSEnergyScene = dynamic(
  () => import("@/components/animated/XSEnergyScene").then((m) => m.XSEnergyScene),
  { ssr: false }
);

export function XsHero({ waMessage }: { waMessage: string }) {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-24">
      {/* Bold diagonal energy sweeps — genre convention for energy-drink brands,
          built from our own accent palette, not any third-party trade dress. */}
      <div className="pointer-events-none absolute inset-0 bg-obsidian">
        <div
          className="absolute -left-[10%] top-0 h-[140%] w-[65%] origin-top-left -skew-x-[14deg]"
          style={{ background: "linear-gradient(160deg, rgba(77,142,255,0.22), transparent 70%)" }}
        />
        <div
          className="absolute -right-[15%] top-[-10%] h-[130%] w-[55%] origin-top-right skew-x-[10deg]"
          style={{ background: "linear-gradient(200deg, rgba(53,208,161,0.18), transparent 65%)" }}
        />
        <div
          className="absolute bottom-[-20%] left-1/3 h-[70%] w-[45%] -skew-x-[8deg]"
          style={{ background: "linear-gradient(0deg, rgba(217,82,122,0.16), transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm font-bold uppercase tracking-[0.35em] text-tech"
          >
            XS™ · Nutrición deportiva
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-2xl font-display text-6xl italic uppercase leading-[0.95] text-paper sm:text-7xl lg:text-[5.2vw]"
          >
            Energía
            <br />
            <span className="text-transparent [-webkit-text-stroke:1.5px_#f7f7f5]">
              activada.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-md text-base leading-relaxed text-mist sm:text-lg"
          >
            Bebidas energéticas de gran sabor, pre-entrenamiento, creatina, proteínas y
            recuperación para cada etapa de tu entrenamiento. Cero límites, toda la potencia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <a
              href="#catalogo"
              className="rounded-full bg-tech px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-obsidian transition hover:bg-tech/90"
            >
              Ver productos
            </a>
            <a
              href={waLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/25 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-paper transition hover:border-tech/60 hover:bg-tech/10"
            >
              WhatsApp
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-sm"
        >
          <XSEnergyScene image="p089_6_300x404.webp" />
        </motion.div>
      </div>
    </section>
  );
}
