"use client";

import { motion } from "framer-motion";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { PRODUCTS } from "@/data/products";

const ESPRING = PRODUCTS.find((p) => p.id === "espring-mesón")!;

export function FlagshipShowcase() {
  return (
    <section className="relative isolate overflow-hidden bg-carbon lg:flex lg:min-h-[88vh] lg:items-end">
      <div className="relative aspect-video w-full lg:absolute lg:inset-0 lg:-z-10 lg:aspect-auto">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/espring/purifier-loop.mp4"
          poster="/images/espring/purifier-loop-poster.webp"
          aria-label={`${ESPRING.name} filtrando agua`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/10 to-transparent lg:via-carbon/40 lg:to-carbon/10"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-20 pt-4 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:pb-24 lg:pt-0"
      >
        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8fb4c2]">
            Protagonista del hogar
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-cream sm:text-6xl">
            Agua más limpia,
            <br />
            gota a gota.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-cream/75 sm:text-lg">
            {ESPRING.description}
          </p>
        </div>

        <div className="flex items-center gap-6 lg:shrink-0">
          <span className="font-display text-2xl text-cream">{priceRangeLabel(ESPRING)}</span>
          <a
            href={waProductLink(ESPRING.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-cream px-6 py-3 text-sm font-medium text-carbon transition hover:bg-white"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </motion.div>
    </section>
  );
}
