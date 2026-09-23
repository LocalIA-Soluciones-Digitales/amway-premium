"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ENERGY_FACTS, ENERGY_FLAVORS } from "@/data/energy-drinks";

// Each ingredient claim paired with the real can that actually carries it
// (Power Water+ has the collagen, Power Drink+ has the vitamin C + zinc),
// so the product shown is never arbitrary.
const CHAPTERS = [
  { fact: ENERGY_FACTS[0], flavor: ENERGY_FLAVORS[2], crossed: null },
  { fact: ENERGY_FACTS[1], flavor: ENERGY_FLAVORS[0], crossed: null },
  { fact: ENERGY_FACTS[2], flavor: ENERGY_FLAVORS[1], crossed: null },
  { fact: ENERGY_FACTS[3], flavor: ENERGY_FLAVORS[4], crossed: "Azúcares añadidos" },
] as const;

export function EnergyFacts() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = chapterRefs.current.findIndex((el) => el === entry.target);
          if (i !== -1) setActiveIndex(i);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    chapterRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function goTo(i: number) {
    chapterRefs.current[i]?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }

  return (
    <section ref={wrapperRef} className="relative bg-xs-ink">
      <div className="sticky top-20 z-30 mx-auto h-px w-full max-w-7xl px-6 sm:px-8">
        <div className="h-px w-full bg-cream/10">
          <motion.div
            style={{ scaleX: scrollYProgress }}
            className="h-full w-full origin-left bg-xs-red"
          />
        </div>
      </div>

      <div className="pointer-events-none sticky top-1/2 z-30 hidden -translate-y-1/2 justify-end lg:flex">
        <div className="pointer-events-auto mr-6 flex flex-col gap-4 xl:mr-10">
          {CHAPTERS.map((chapter, i) => (
            <button
              key={chapter.fact.id}
              onClick={() => goTo(i)}
              aria-label={`Ir a ${chapter.fact.label}`}
              aria-current={i === activeIndex}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300"
              style={{
                borderColor: i === activeIndex ? chapter.flavor.accent : "rgba(247,244,238,0.18)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === activeIndex ? chapter.flavor.accent : "rgba(247,244,238,0.35)",
                  transform: i === activeIndex ? "scale(1.6)" : undefined,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-center sm:px-8 sm:pt-28">
        <motion.h2
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-3xl italic uppercase text-cream sm:text-4xl"
        >
          Ingredientes reales, sin trucos
        </motion.h2>
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-cream/55"
        >
          Cada lata XS™ lleva lo que dice llevar. Esto es lo que hay dentro.
        </motion.p>
      </div>

      {CHAPTERS.map((chapter, i) => {
        const { fact, flavor, crossed } = chapter;
        return (
          <div
            key={fact.id}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
            className="relative flex min-h-[70vh] items-center overflow-hidden border-t border-cream/10 py-20 sm:min-h-[80vh]"
          >
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[110px]"
              style={{ background: `radial-gradient(circle, ${flavor.accentSoft}, transparent 70%)` }}
            />

            <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 sm:px-8 lg:grid-cols-2 lg:gap-20">
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className={i % 2 === 1 ? "lg:order-2" : ""}
              >
                {crossed && (
                  <div className="mb-5 flex flex-col items-start gap-1.5">
                    <span className="w-fit rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cream/40 line-through decoration-cream/40">
                      {crossed}
                    </span>
                    <span className="w-fit rounded-full bg-xs-red px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
                      {fact.value} {fact.label}
                    </span>
                  </div>
                )}

                <p className="font-display text-4xl italic leading-[1.05] text-cream sm:text-5xl lg:text-6xl">
                  <span style={{ color: flavor.accent }}>{fact.value}</span> {fact.label}
                </p>

                <p className="mt-5 max-w-md text-base leading-relaxed text-cream/60">
                  {fact.detail}
                </p>
              </motion.div>

              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`flex justify-center ${i % 2 === 1 ? "lg:order-1" : ""}`}
              >
                <div className="relative h-[38vh] w-[200px] sm:h-[48vh] sm:w-[250px]">
                  <Image
                    src={`/images/xs-energy/cans/${flavor.image}`}
                    alt={`XS™ ${flavor.name} sabor ${flavor.flavorEs}`}
                    fill
                    sizes="(max-width: 640px) 200px, 250px"
                    className="object-contain drop-shadow-[0_35px_50px_rgba(0,0,0,0.55)]"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
