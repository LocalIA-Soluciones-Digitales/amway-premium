"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";
import { waLink, WA_PRESETS } from "@/data/site-config";

const TITLE_LINES = [["Bienestar"], ["para", "tu", "día", "a", "día"]];

export function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;
    const words = titleRef.current.querySelectorAll("span span");
    gsap.fromTo(
      words,
      { y: "110%", opacity: 0, rotateZ: 2 },
      {
        y: "0%",
        opacity: 1,
        rotateZ: 0,
        duration: 1.15,
        stagger: 0.06,
        ease: "expo.out",
        delay: 0.3,
      }
    );
  }, []);

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/editorial/hero-bienestar.webp"
          alt="Bienestar cotidiano con productos Amway"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/25 to-carbon/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon/55 via-transparent to-transparent" />
      </div>

      <div className="relative w-full px-6 pb-20 pt-40 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-sm font-medium uppercase tracking-[0.3em] text-cream/70"
          >
            Importado directamente de Estados Unidos
          </motion.p>

          <h1
            ref={titleRef}
            className="mt-5 font-display text-[16vw] leading-[0.92] text-cream sm:text-[9rem] lg:text-[clamp(4rem,10vw,9rem)]"
          >
            {TITLE_LINES.map((line, li) => (
              <span key={li} className="flex flex-wrap gap-x-4">
                {line.map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden">
                    <span className="inline-block">{w}</span>
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="mt-7 max-w-md text-base leading-relaxed text-cream/80 sm:text-lg"
          >
            Productos seleccionados de nutrición, belleza y cuidado del hogar,
            con atención personalizada en Barakaldo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.7 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <a
              href="/catalogo"
              className="rounded-full bg-cream px-7 py-3.5 text-sm font-medium text-carbon transition hover:bg-white"
            >
              Descubrir productos
            </a>
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-cream/30 bg-cream/5 px-7 py-3.5 text-sm font-medium text-cream backdrop-blur transition hover:border-cream/50 hover:bg-cream/10"
            >
              Contactar por WhatsApp
            </a>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.6 }, y: { duration: 1.8, repeat: Infinity } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/70"
      >
        <ChevronDown size={22} />
      </motion.div>
    </section>
  );
}
