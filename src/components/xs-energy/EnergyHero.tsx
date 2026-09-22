"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { waLink } from "@/data/site-config";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ENERGY_FLAVORS, XS_ANNIVERSARY } from "@/data/energy-drinks";

const HERO_CAN = ENERGY_FLAVORS[0];

export function EnergyHero({ waMessage }: { waMessage: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const canY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    if (!titleRef.current || !canRef.current) return;

    const words = titleRef.current.querySelectorAll(".word-inner");
    const tl = gsap.timeline({ delay: 0.15 });

    tl.fromTo(
      words,
      { y: "115%", rotateZ: 3 },
      { y: "0%", rotateZ: 0, duration: 1.1, stagger: 0.07, ease: "expo.out" }
    ).fromTo(
      canRef.current,
      { opacity: 0, scale: 0.55, y: 80, rotate: -10 },
      { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 1.3, ease: "expo.out" },
      "-=0.85"
    );

    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || !stageRef.current || !canRef.current) return;
    const stage = stageRef.current;
    const can = canRef.current;

    const rotateX = gsap.quickTo(can, "rotateX", { duration: 0.7, ease: "power3.out" });
    const rotateY = gsap.quickTo(can, "rotateY", { duration: 0.7, ease: "power3.out" });

    function onMove(e: PointerEvent) {
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotateY(px * 16);
      rotateX(py * -16);
    }
    function onLeave() {
      rotateX(0);
      rotateY(0);
    }

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-xs-ink pt-20"
    >
      <motion.div style={{ y: reducedMotion ? 0 : bgY }} className="absolute inset-0">
        <Image
          src="/images/xs-energy/lifestyle/girl-mountain.webp"
          alt="Aventura al aire libre con XS™ Power Water+"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[30%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-xs-ink via-xs-ink/75 to-xs-ink/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-xs-ink/70 via-xs-ink/20 to-transparent" />
      </motion.div>

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px] animate-pulse-slow"
        style={{ background: `radial-gradient(circle, ${HERO_CAN.accentSoft}, transparent 70%)` }}
      />

      <motion.div
        style={{ opacity: reducedMotion ? 1 : contentOpacity }}
        className="relative flex w-full max-w-7xl flex-col items-center px-6 sm:px-8"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-sm font-bold uppercase tracking-[0.4em] text-xs-red"
        >
          XS™ Power Drinks
        </motion.p>

        <div ref={stageRef} className="relative mt-6 flex w-full min-h-[44vh] items-center justify-center sm:min-h-[56vh]" style={{ perspective: "1400px" }}>
          <h1
            ref={titleRef}
            className="pointer-events-none select-none whitespace-nowrap font-display text-[15vw] italic leading-[0.82] text-cream sm:text-[19vw] lg:text-[15vw]"
            aria-label="Pura energía"
          >
            <span className="block overflow-hidden">
              <span className="word-inner inline-block">Pura</span>
            </span>
            <span className="block overflow-hidden text-right text-transparent [-webkit-text-stroke:1.5px_#f7f4ee] sm:[-webkit-text-stroke:2px_#f7f4ee]">
              <span className="word-inner inline-block">Energía</span>
            </span>
          </h1>

          <motion.div
            ref={canRef}
            style={{ y: reducedMotion ? 0 : canY, transformStyle: "preserve-3d" }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <div className="relative h-[40vh] w-full max-w-[200px] sm:h-[62vh] sm:max-w-[340px] lg:h-[68vh] lg:max-w-[420px]">
              <Image
                src={`/images/xs-energy/cans/${HERO_CAN.image}`}
                alt={`Lata XS™ ${HERO_CAN.name} sabor ${HERO_CAN.flavorEs}`}
                fill
                priority
                sizes="(max-width: 640px) 200px, (max-width: 1024px) 340px, 420px"
                className="object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute -right-2 top-0 z-20 h-16 w-16 animate-[spin_18s_linear_infinite] sm:h-24 sm:w-24 lg:-right-6"
          >
            <Image
              src="/images/xs-energy/badge-20-years.webp"
              alt="20 años de aventura XS™"
              fill
              sizes="96px"
              className="object-contain drop-shadow-lg"
            />
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.15 }}
          className="mt-6 max-w-md text-center text-base leading-relaxed text-cream/60 sm:text-lg"
        >
          Sin azúcares añadidos, sin colorantes ni aromas artificiales.
          Celebramos {XS_ANNIVERSARY.years} años de aventura con seis sabores reales.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#historia"
            className="group relative overflow-hidden rounded-full bg-xs-red px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-cream transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]"
          >
            <span className="relative z-10">Descubre los sabores</span>
            <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
          </a>
          <a
            href={waLink(waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/25 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-cream transition hover:border-xs-red/60 hover:bg-xs-red/10"
          >
            WhatsApp
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.7 }, y: { duration: 1.8, repeat: Infinity } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/60"
      >
        <ChevronDown size={22} />
      </motion.div>
    </section>
  );
}
