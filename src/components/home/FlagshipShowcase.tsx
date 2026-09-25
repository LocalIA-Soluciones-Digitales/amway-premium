"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { PRODUCTS } from "@/data/products";

const ESPRING = PRODUCTS.find((p) => p.id === "espring-mesón")!;

export function FlagshipShowcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1.02, 0.96]);

  return (
    <section ref={ref} className="overflow-hidden bg-carbon">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 py-24 sm:px-8 sm:py-32 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8fb4c2]">
            Protagonista del hogar
          </p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] text-cream sm:text-6xl">
            Agua más limpia,
            <br />
            gota a gota.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-cream/65 sm:text-lg">
            {ESPRING.description}
          </p>

          <div className="mt-9 flex items-center gap-6">
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
        </div>

        <motion.div
          style={{ scale }}
          className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-cream/10"
        >
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
        </motion.div>
      </div>
    </section>
  );
}
