"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { waLink } from "@/data/site-config";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const TITLE_WORDS = ["Agua", "pura,", "servida", "al", "instante."];

export function SpringHero({ waMessage }: { waMessage: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const deviceY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-spring-ink pt-20"
    >
      <motion.div style={{ y: reducedMotion ? 0 : bgY }} className="absolute inset-0">
        <Image
          src="/images/espring/hero-glass-pour.webp"
          alt="Agua purificándose al instante desde el grifo eSpring™"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[65%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-spring-ink via-spring-ink/80 to-spring-ink/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-spring-ink/85 via-spring-ink/25 to-transparent" />
      </motion.div>

      <div
        className="pointer-events-none absolute left-[20%] top-1/2 h-[60vh] w-[60vh] -translate-y-1/2 rounded-full bg-spring-blue/25 blur-[110px] animate-pulse-slow"
      />

      <motion.div
        style={{ opacity: reducedMotion ? 1 : contentOpacity }}
        className="relative flex w-full max-w-7xl flex-col px-6 sm:px-8"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-sm font-bold uppercase tracking-[0.4em] text-spring-blue"
        >
          eSpring™ · Tecnología LED UV-C
        </motion.p>

        <h1
          className="pointer-events-none mt-6 max-w-3xl select-none font-display text-[13vw] italic leading-[0.92] text-cream sm:text-[7.5vw] lg:text-[6.2vw]"
          aria-label={TITLE_WORDS.join(" ")}
        >
          {TITLE_WORDS.map((word, i) => (
            <span key={word} className="mr-[0.28em] inline-block overflow-hidden">
              <motion.span
                initial={{ y: "115%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          style={{ y: reducedMotion ? 0 : deviceY }}
          initial={{ opacity: 0, scale: 0.85, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute -right-4 bottom-0 hidden h-[62vh] w-[26vw] max-w-[360px] sm:block"
        >
          <Image
            src="/images/espring/device-cutaway.webp"
            alt="Purificador eSpring™ con cámara LED UV-C activa"
            fill
            sizes="360px"
            className="object-contain object-bottom drop-shadow-[0_40px_70px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="mt-7 max-w-lg text-base leading-relaxed text-cream/65 sm:text-lg"
        >
          De la marca n.º 1 del mundo en sistemas domésticos de tratamiento de agua*, el nuevo
          eSpring™ filtra más de 170 contaminantes y elimina el 99,9999 % de las bacterias, sin
          perder las sales minerales beneficiosas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <a
            href="#ciencia"
            className="group relative overflow-hidden rounded-full bg-spring-blue px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-spring-ink transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]"
          >
            <span className="relative z-10">Descubre la tecnología</span>
            <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-0" />
          </a>
          <a
            href={waLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-cream/25 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-cream transition hover:border-spring-blue/60 hover:bg-spring-blue/10"
          >
            WhatsApp
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.2 }}
          className="mt-4 max-w-lg text-xs text-cream/40"
        >
          *Según Verify Markets, estudio de ventas mundiales 2021.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.6 }, y: { duration: 1.8, repeat: Infinity } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/60"
      >
        <ChevronDown size={22} />
      </motion.div>
    </section>
  );
}
