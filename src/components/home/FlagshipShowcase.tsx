"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { PRODUCTS } from "@/data/products";

const ESpringScene = dynamic(
  () => import("@/components/animated/ESpringScene").then((m) => m.ESpringScene),
  { ssr: false }
);

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

        <motion.div style={{ scale }} className="relative mx-auto aspect-square w-full max-w-lg">
          <ESpringScene />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-2/3 w-2/3">
              <Image
                src="/images/products/espring.webp"
                alt={ESPRING.name}
                fill
                sizes="400px"
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
