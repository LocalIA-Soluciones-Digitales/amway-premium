"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { waProductLink } from "@/data/site-config";
import { energyProduct, ENERGY_FLAVORS } from "@/data/energy-drinks";

const N = ENERGY_FLAVORS.length;
const SWIPE_THRESHOLD = 60;

export function EnergyFlavorSwipe() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const active = ENERGY_FLAVORS[index];
  const product = energyProduct(active.productId);

  function go(next: number) {
    const clamped = Math.min(N - 1, Math.max(0, next));
    if (clamped === index) return;
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
  }

  return (
    <div className="relative overflow-hidden bg-xs-ink lg:hidden">
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

        <div
          className="relative flex flex-1 items-center justify-center touch-pan-y"
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const onEnd = (ev: TouchEvent) => {
              const dx = ev.changedTouches[0].clientX - startX;
              if (dx > SWIPE_THRESHOLD) go(index - 1);
              else if (dx < -SWIPE_THRESHOLD) go(index + 1);
              window.removeEventListener("touchend", onEnd);
            };
            window.addEventListener("touchend", onEnd, { once: true });
          }}
        >
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={active.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.9 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              <div className="relative h-[42vh] w-[220px]">
                <Image
                  src={`/images/catalog/${active.image}`}
                  alt={`XS™ ${active.line} sabor ${active.name}`}
                  fill
                  sizes="220px"
                  className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
                />
              </div>
              <h3 className="mt-6 text-center font-display text-4xl italic uppercase leading-[0.9] text-cream">
                {active.name}
              </h3>
              <div className="mt-3 flex items-center gap-2 text-cream/60">
                <span className="text-xs font-semibold uppercase tracking-[0.25em]">{active.line}</span>
                {active.tag && (
                  <span className="rounded-full border border-cream/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
                    {active.tag}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-6">
          <a
            href={waProductLink(`${product.name} · ${active.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-cream px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-carbon transition hover:bg-white"
          >
            Pedir {active.name}
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
