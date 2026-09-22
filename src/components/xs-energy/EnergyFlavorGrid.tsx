"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { waLink } from "@/data/site-config";
import { ENERGY_FLAVORS, type EnergyFlavor } from "@/data/energy-drinks";

function FlavorCard({ flavor, index }: { flavor: EnergyFlavor; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springConfig = { stiffness: 220, damping: 20 };
  const spx = useSpring(px, springConfig);
  const spy = useSpring(py, springConfig);
  const rotateX = useTransform(spy, [0, 1], [8, -8]);
  const rotateY = useTransform(spx, [0, 1], [-8, 8]);

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }
  function onLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.a
      ref={ref}
      href={waLink(`Hola, quiero información sobre XS™ ${flavor.name} sabor ${flavor.flavorEs}.`)}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 900 }}
      className="group relative flex aspect-[3/5] flex-col justify-end overflow-hidden rounded-2xl"
    >
      <div
        className="absolute inset-0 origin-top-left skew-y-[-8deg] scale-125 opacity-90 transition-transform duration-500 ease-out group-hover:skew-y-0 group-hover:scale-110"
        style={{ background: `linear-gradient(160deg, ${flavor.accent} 0%, rgba(5,6,10,0.92) 75%)` }}
      />
      <Glow px={spx} py={spy} color={flavor.accentSoft} />

      {flavor.tag && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-cream/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-carbon">
          {flavor.tag}
        </span>
      )}

      <div className="relative flex flex-1 items-center justify-center pt-6" style={{ transform: "translateZ(40px)" }}>
        <div className="relative aspect-[0.4] w-[44%]">
          <Image
            src={`/images/xs-energy/cans/${flavor.image}`}
            alt={`${flavor.name} · ${flavor.flavorEs}`}
            fill
            sizes="(max-width: 640px) 22vw, 14vw"
            className="object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      <div className="relative flex h-24 flex-col justify-center bg-xs-ink/80 px-4 py-3 backdrop-blur-sm">
        <p className="line-clamp-2 font-display text-sm leading-tight text-cream sm:text-base">{flavor.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs uppercase leading-snug tracking-wide text-cream/55">{flavor.flavorEs}</p>
      </div>
    </motion.a>
  );
}

function Glow({ px, py, color }: { px: MotionValue<number>; py: MotionValue<number>; color: string }) {
  const left = useTransform(px, (v) => `${v * 100}%`);
  const top = useTransform(py, (v) => `${v * 100}%`);
  return (
    <motion.div
      className="pointer-events-none absolute h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
      style={{ left, top, background: color }}
    />
  );
}

export function EnergyFlavorGrid() {
  return (
    <section className="relative overflow-hidden bg-xs-ink py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 max-w-2xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-xs-red">
            Elige tu sabor
          </p>
          <h2 className="mt-4 font-display text-3xl uppercase italic text-cream sm:text-5xl">
            Seis sabores. Cero límites.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {ENERGY_FLAVORS.map((flavor, i) => (
            <FlavorCard key={flavor.id} flavor={flavor} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
