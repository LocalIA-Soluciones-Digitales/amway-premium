"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { waLink } from "@/data/site-config";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ENERGY_FLAVORS } from "@/data/energy-drinks";

const HERO_CAN = ENERGY_FLAVORS[0];

export function EnergyHero({ waMessage }: { waMessage: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = usePrefersReducedMotion();

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
      ref={stageRef}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-xs-ink pt-20"
      style={{ perspective: "1400px" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px] animate-pulse-slow"
          style={{ background: `radial-gradient(circle, ${HERO_CAN.accentSoft}, transparent 70%)` }}
        />
        <div
          className="absolute -left-[12%] top-0 h-[140%] w-[60%] origin-top-left -skew-x-[14deg]"
          style={{ background: "linear-gradient(160deg, rgba(63,107,125,0.28), transparent 70%)" }}
        />
        <div
          className="absolute -right-[15%] top-[-10%] h-[130%] w-[55%] origin-top-right skew-x-[10deg]"
          style={{ background: "linear-gradient(200deg, rgba(232,56,79,0.2), transparent 65%)" }}
        />
      </div>

      <div className="relative flex w-full max-w-7xl flex-col items-center px-6 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-sm font-bold uppercase tracking-[0.4em] text-xs-red"
        >
          XS™ Energy Drink
        </motion.p>

        <div className="relative mt-6 flex w-full min-h-[44vh] items-center justify-center sm:min-h-[56vh]">
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

          <div
            ref={canRef}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="relative h-[40vh] w-full max-w-[200px] sm:h-[62vh] sm:max-w-[340px] lg:h-[68vh] lg:max-w-[420px]">
              <Image
                src={`/images/catalog/${HERO_CAN.image}`}
                alt={`Lata XS™ Energy Drink sabor ${HERO_CAN.name}`}
                fill
                priority
                sizes="(max-width: 640px) 200px, (max-width: 1024px) 340px, 420px"
                className="object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]"
              />
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.15 }}
          className="mt-6 max-w-md text-center text-base leading-relaxed text-cream/60 sm:text-lg"
        >
          Sin azúcar, con 114 mg de cafeína y megadosis de vitaminas B. Ocho sabores
          reales, cero límites.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#historia"
            className="rounded-full bg-xs-red px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-cream transition hover:bg-xs-red/90"
          >
            Descubre los sabores
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
      </div>

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
