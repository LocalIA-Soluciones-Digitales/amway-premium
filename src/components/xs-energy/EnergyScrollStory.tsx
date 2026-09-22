"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { waLink } from "@/data/site-config";
import { ENERGY_FLAVORS } from "@/data/energy-drinks";

const N = ENERGY_FLAVORS.length;

// One real lifestyle photo per chapter, chosen to feature that flavor's can
// where the source photography allows it (see ASSETS_NEEDED.md).
const CHAPTER_BG = [
  "office-laptop.webp",
  "ginger-mountain.webp",
  "hero-mountain-toast.webp",
  "cheers-closeup.webp",
  "friends-bench.webp",
  "cheers-cooler.webp",
];

export function EnergyScrollStory() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const washARef = useRef<HTMLDivElement>(null);
  const washBRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const layerToggleRef = useRef<"a" | "b">("a");

  const [activeIndex, setActiveIndex] = useState(0);
  const lenis = useLenis();

  useEffect(() => {
    if (!wrapperRef.current) return;
    const wrapper = wrapperRef.current;

    function applyStage(progress: number) {
      const continuous = progress * (N - 1);

      canRefs.current.forEach((el, i) => {
        if (!el) return;
        const delta = i - continuous;
        const absDelta = Math.min(Math.abs(delta), 1.6);
        const opacity = Math.max(0, 1 - absDelta * 0.85);
        const x = delta * 42;
        const scale = 1 - Math.min(Math.abs(delta), 1) * 0.32;
        const rotate = delta * 12;
        el.style.transform = `translate3d(${x}vw, 0, 0) scale(${scale}) rotate(${rotate}deg)`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(100 - Math.round(absDelta * 10));
      });

      const idx = Math.min(N - 1, Math.max(0, Math.round(continuous)));
      if (idx !== activeIndexRef.current) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
      }
    }

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => applyStage(self.progress),
    });

    applyStage(0);

    return () => trigger.kill();
  }, []);

  // Chrome (background photo, color wash, headline) reacts only to discrete
  // index changes, crossfading independently from the continuously-scrubbed
  // can stack above.
  useEffect(() => {
    const flavor = ENERGY_FLAVORS[activeIndex];

    // Every flavor's background photo is a permanent, pre-loaded layer in
    // the DOM (like the can stack below) — only opacity ever animates, so
    // there is no src-swap race or flash between chapters.
    bgRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, { opacity: i === activeIndex ? 1 : 0, duration: 1, ease: "power2.out" });
    });

    const showWash = layerToggleRef.current === "a" ? washARef.current : washBRef.current;
    const hideWash = layerToggleRef.current === "a" ? washBRef.current : washARef.current;

    if (showWash) {
      showWash.style.background = `radial-gradient(circle at 50% 38%, ${flavor.accentSoft}, transparent 62%)`;
      gsap.to(showWash, { opacity: 1, duration: 1, ease: "power2.out" });
    }
    if (hideWash) gsap.to(hideWash, { opacity: 0, duration: 1, ease: "power2.out" });

    layerToggleRef.current = layerToggleRef.current === "a" ? "b" : "a";

    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll(".story-word");
      gsap.fromTo(
        words,
        { y: "60%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 0.65, stagger: 0.04, ease: "expo.out" }
      );
    }
  }, [activeIndex]);

  function goTo(i: number) {
    if (!wrapperRef.current || !lenis) return;
    const range = wrapperRef.current.offsetHeight - window.innerHeight;
    const offset = (i / (N - 1)) * range;
    lenis.scrollTo(wrapperRef.current, { offset, duration: 1.4 });
  }

  const active = ENERGY_FLAVORS[activeIndex];

  return (
    <div
      ref={wrapperRef}
      className="relative hidden lg:block"
      style={{ height: `${N * 100}vh` }}
    >
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden bg-xs-ink">
        {ENERGY_FLAVORS.map((flavor, i) => (
          <div
            key={flavor.id}
            ref={(el) => {
              bgRefs.current[i] = el;
            }}
            className="absolute inset-0"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <Image
              src={`/images/xs-energy/lifestyle/${CHAPTER_BG[i]}`}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="scale-110 object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-xs-ink via-xs-ink/70 to-xs-ink/50" />
        <div ref={washARef} className="absolute inset-0" style={{ opacity: 1 }} />
        <div ref={washBRef} className="absolute inset-0" style={{ opacity: 0 }} />

        <div className="pointer-events-none absolute left-8 top-28 font-mono text-xs tracking-widest text-cream/40">
          {String(activeIndex + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
        </div>

        <div
          ref={headlineRef}
          key={active.id}
          className="pointer-events-none absolute inset-x-0 top-[38%] z-10 -translate-y-1/2 text-center"
        >
          <span className="block overflow-hidden">
            <span className="story-word inline-block font-display text-[11vw] italic uppercase leading-[0.85] text-cream/90">
              {active.name}
            </span>
          </span>
          <span className="mt-2 block overflow-hidden">
            <span className="story-word inline-block text-sm font-medium uppercase tracking-[0.3em] text-cream/55">
              {active.flavorEs}
            </span>
          </span>
        </div>

        {ENERGY_FLAVORS.map((flavor, i) => (
          <div
            key={flavor.id}
            ref={(el) => {
              canRefs.current[i] = el;
            }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center will-change-transform"
          >
            <div className="relative h-[52vh] w-[240px]">
              <Image
                src={`/images/xs-energy/cans/${flavor.image}`}
                alt={`XS™ ${flavor.name} sabor ${flavor.flavorEs}`}
                fill
                sizes="240px"
                className="object-contain drop-shadow-[0_35px_50px_rgba(0,0,0,0.55)]"
              />
            </div>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-14 z-30 flex flex-col items-center gap-5 px-8">
          <p className="max-w-md text-center text-sm leading-relaxed text-cream/65">{active.benefit}</p>

          <div className="flex items-center gap-3 text-cream/70">
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">{active.line}</span>
            {active.tag && (
              <span className="rounded-full border border-cream/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-cream">
                {active.tag}
              </span>
            )}
          </div>

          <a
            href={waLink(`Hola, quiero información sobre XS™ ${active.name} sabor ${active.flavorEs}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-full bg-cream px-7 py-3 text-sm font-bold uppercase tracking-wide text-carbon transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]"
          >
            Consultar {active.name}
          </a>

          <div className="flex items-center gap-2.5">
            {ENERGY_FLAVORS.map((flavor, i) => (
              <button
                key={flavor.id}
                onClick={() => goTo(i)}
                aria-label={`Ir al sabor ${flavor.name}`}
                aria-current={i === activeIndex}
                className="group relative flex h-6 w-6 items-center justify-center"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full transition-all duration-300 group-hover:scale-150"
                  style={{
                    backgroundColor: i === activeIndex ? flavor.accent : "rgba(247,244,238,0.3)",
                    transform: i === activeIndex ? "scale(1.8)" : undefined,
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
