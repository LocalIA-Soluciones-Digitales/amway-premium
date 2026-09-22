"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { waLink } from "@/data/site-config";
import { ENERGY_FLAVORS } from "@/data/energy-drinks";

const N = ENERGY_FLAVORS.length;
const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY = 400;

const CHAPTER_BG = [
  "office-laptop.webp",
  "ginger-mountain.webp",
  "hero-mountain-toast.webp",
  "cheers-closeup.webp",
  "friends-bench.webp",
  "cheers-cooler.webp",
];

export function EnergyFlavorSwipe() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const active = ENERGY_FLAVORS[index];

  function go(next: number) {
    const clamped = Math.min(N - 1, Math.max(0, next));
    if (clamped === index) return;
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY) go(index + 1);
    else if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY) go(index - 1);
  }

  return (
    <div className="relative overflow-hidden bg-xs-ink lg:hidden">
      <AnimatePresence>
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={`/images/xs-energy/lifestyle/${CHAPTER_BG[index]}`}
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-xs-ink via-xs-ink/75 to-xs-ink/55" />
        </motion.div>
      </AnimatePresence>
      <div
        className="absolute inset-0 transition-[background] duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${active.accentSoft}, transparent 65%)`,
        }}
      />

      <div className="relative flex min-h-[92svh] flex-col justify-between px-6 pb-12 pt-24 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cream/50">
            {String(index + 1).padStart(2, "0")} / {String(N).padStart(2, "0")} · Desliza para descubrir
          </p>
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={onDragEnd}
          className="relative flex flex-1 cursor-grab items-center justify-center active:cursor-grabbing"
        >
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={active.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.9 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none flex flex-col items-center"
            >
              <div className="relative h-[38vh] w-[200px]">
                <Image
                  src={`/images/xs-energy/cans/${active.image}`}
                  alt={`XS™ ${active.name} sabor ${active.flavorEs}`}
                  fill
                  sizes="200px"
                  className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
                />
              </div>
              <h3 className="mt-6 text-center font-display text-4xl italic uppercase leading-[0.9] text-cream">
                {active.name}
              </h3>
              <p className="mt-1 text-center text-sm uppercase tracking-[0.2em] text-cream/55">
                {active.flavorEs}
              </p>
              <div className="mt-3 flex items-center gap-2 text-cream/60">
                <span className="text-xs font-semibold uppercase tracking-[0.25em]">{active.line}</span>
                {active.tag && (
                  <span className="rounded-full border border-cream/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
                    {active.tag}
                  </span>
                )}
              </div>
              <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-cream/60">
                {active.benefit}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="flex flex-col items-center gap-6">
          <a
            href={waLink(`Hola, quiero información sobre XS™ ${active.name} sabor ${active.flavorEs}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-cream px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-carbon transition active:scale-95"
          >
            Consultar {active.name}
          </a>

          <div className="flex items-center gap-2">
            {ENERGY_FLAVORS.map((flavor, i) => (
              <button
                key={flavor.id}
                onClick={() => go(i)}
                aria-label={`Ir al sabor ${flavor.name}`}
                aria-current={i === index}
                className="p-1.5"
              >
                <span
                  className="block h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === index ? 22 : 6,
                    backgroundColor: i === index ? flavor.accent : "rgba(247,244,238,0.3)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
