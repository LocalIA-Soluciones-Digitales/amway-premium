"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { waProductLink } from "@/data/site-config";
import { energyProduct, ENERGY_FLAVORS } from "@/data/energy-drinks";

const N = ENERGY_FLAVORS.length;

export function EnergyScrollStory() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bgARef = useRef<HTMLDivElement>(null);
  const bgBRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const bgToggleRef = useRef<"a" | "b">("a");

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

  // Chrome (headline + background wash) reacts only to discrete index changes,
  // animated independently from the continuously-scrubbed can stack above.
  useEffect(() => {
    const flavor = ENERGY_FLAVORS[activeIndex];
    const showEl = bgToggleRef.current === "a" ? bgARef.current : bgBRef.current;
    const hideEl = bgToggleRef.current === "a" ? bgBRef.current : bgARef.current;

    if (showEl) {
      showEl.style.background = `radial-gradient(circle at 50% 38%, ${flavor.accentSoft}, transparent 62%)`;
      gsap.to(showEl, { opacity: 1, duration: 0.9, ease: "power2.out" });
    }
    if (hideEl) {
      gsap.to(hideEl, { opacity: 0, duration: 0.9, ease: "power2.out" });
    }
    bgToggleRef.current = bgToggleRef.current === "a" ? "b" : "a";

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
  const product = energyProduct(active.productId);

  return (
    <div
      ref={wrapperRef}
      className="relative hidden lg:block"
      style={{ height: `${N * 100}vh` }}
    >
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden bg-xs-ink">
        <div ref={bgARef} className="absolute inset-0 opacity-100 transition-none" />
        <div ref={bgBRef} className="absolute inset-0 opacity-0 transition-none" />

        <div className="pointer-events-none absolute left-8 top-28 font-mono text-xs tracking-widest text-cream/40">
          {String(activeIndex + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
        </div>

        <div
          ref={headlineRef}
          key={active.id}
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center"
        >
          <span className="block overflow-hidden">
            <span className="story-word inline-block font-display text-[13vw] italic uppercase leading-[0.85] text-cream/90">
              {active.name}
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
            <div className="relative h-[58vh] w-[280px]">
              <Image
                src={`/images/catalog/${flavor.image}`}
                alt={`XS™ ${flavor.line} sabor ${flavor.name}`}
                fill
                sizes="280px"
                className="object-contain drop-shadow-[0_35px_50px_rgba(0,0,0,0.55)]"
              />
            </div>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-14 z-30 flex flex-col items-center gap-6 px-8">
          <div className="flex items-center gap-3 text-cream/70">
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">{active.line}</span>
            {active.tag && (
              <span className="rounded-full border border-cream/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-cream">
                {active.tag}
              </span>
            )}
          </div>

          <a
            href={waProductLink(`${product.name} · ${active.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-cream px-7 py-3 text-sm font-bold uppercase tracking-wide text-carbon transition hover:bg-white"
          >
            Pedir {active.name}
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
