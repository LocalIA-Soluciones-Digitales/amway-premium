"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { waLink } from "@/data/site-config";
import { ENERGY_FLAVORS } from "@/data/energy-drinks";

const N = ENERGY_FLAVORS.length;

// One real lifestyle photo per chapter, chosen to feature that flavor's can
// where the source photography allows it (see ASSETS_NEEDED.md). Las fotos
// son apaisadas: en el móvil, en vertical, el recorte centrado de la primera
// solo dejaba pared lisa; cada una lleva el encuadre que mantiene a la vista
// a la persona o la lata.
const CHAPTER_BG = [
  { src: "office-laptop.webp", position: "28% 50%" },
  { src: "ginger-mountain.webp", position: "52% 50%" },
  { src: "hero-mountain-toast.webp", position: "50% 50%" },
  { src: "cheers-closeup.webp", position: "62% 50%" },
  { src: "friends-bench.webp", position: "40% 50%" },
  { src: "cheers-cooler.webp", position: "78% 50%" },
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
  // Lenis smooths the scroll position, so ScrollTrigger is told on every
  // Lenis frame (the global SmoothScroll no longer loads GSAP).
  const lenis = useLenis(() => ScrollTrigger.update());

  useEffect(() => {
    if (!wrapperRef.current) return;
    const wrapper = wrapperRef.current;

    // En el móvil las latas se separan más: a 42vw asomaban dos o tres a la
    // vez; a 80vw la vecina queda fuera de la pantalla mientras no se cambia.
    const spread = () => (window.innerWidth < 1024 ? 80 : 42);
    let gap = spread();

    function applyStage(progress: number) {
      const continuous = progress * (N - 1);

      canRefs.current.forEach((el, i) => {
        if (!el) return;
        const delta = i - continuous;
        const absDelta = Math.min(Math.abs(delta), 1.6);
        const opacity = Math.max(0, 1 - absDelta * (gap > 42 ? 1.1 : 0.85));
        const x = delta * gap;
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

    // En el móvil el scroll es nativo (Lenis no lo suaviza con el dedo) y
    // llega a saltos: las latas se pintaban a trompicones. El progreso pasa
    // por una interpolación corta, así el movimiento sigue al dedo con
    // inercia, y al soltar se asienta en la lata más cercana.
    const smooth = { p: 0 };
    const follow = gsap.quickTo(smooth, "p", {
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => applyStage(smooth.p),
    });

    // La barra de Safari al aparecer y esconderse cambia el alto de la
    // ventana; sin esto ScrollTrigger lo recalcula todo y la lata da un salto.
    ScrollTrigger.config({ ignoreMobileResize: true });

    const trigger = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => follow(self.progress),
      // Solo en pantallas táctiles: en el ordenador Lenis lleva el scroll y
      // un segundo desplazamiento automático se pelearía con él.
      snap: window.matchMedia("(pointer: coarse)").matches
        ? { snapTo: 1 / (N - 1), duration: { min: 0.25, max: 0.6 }, delay: 0.12, ease: "power2.inOut" }
        : undefined,
    });

    const onResize = () => {
      gap = spread();
      applyStage(smooth.p);
    };
    window.addEventListener("resize", onResize);
    applyStage(0);

    return () => {
      trigger.kill();
      gsap.killTweensOf(smooth);
      window.removeEventListener("resize", onResize);
    };
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
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const range = wrapper.offsetHeight - window.innerHeight;
    const offset = (i / (N - 1)) * range;
    if (lenis) lenis.scrollTo(wrapper, { offset, duration: 1.4 });
    else window.scrollTo({ top: wrapper.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
  }

  const active = ENERGY_FLAVORS[activeIndex];

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ height: `${N * 90}svh` }}
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] w-full overflow-hidden bg-xs-ink">
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
              src={`/images/xs-energy/lifestyle/${CHAPTER_BG[i].src}`}
              alt=""
              fill
              sizes="100vw"
              className="scale-110 object-cover"
              style={{ objectPosition: CHAPTER_BG[i].position }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-xs-ink via-xs-ink/70 to-xs-ink/50" />
        <div ref={washARef} className="absolute inset-0" style={{ opacity: 1 }} />
        <div ref={washBRef} className="absolute inset-0" style={{ opacity: 0 }} />

        <div className="pointer-events-none absolute inset-x-0 top-28 px-6 text-center font-mono text-xs tracking-widest text-cream/50 sm:px-8 lg:text-left lg:text-cream/40">
          {String(activeIndex + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
          {activeIndex < N - 1 && <span className="lg:hidden"> · Sigue bajando</span>}
        </div>

        <div
          ref={headlineRef}
          key={active.id}
          className="pointer-events-none absolute inset-x-0 top-36 z-10 px-4 text-center lg:top-[38%] lg:-translate-y-1/2"
        >
          <span className="block overflow-hidden">
            <span className="story-word inline-block font-display text-[12vw] italic uppercase leading-[0.85] text-cream/90 lg:text-[11vw]">
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
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center pb-[14svh] will-change-transform lg:pb-0"
          >
            <div className="relative h-[34svh] w-[170px] lg:h-[52vh] lg:w-[240px]">
              <Image
                src={`/images/xs-energy/cans/${flavor.image}`}
                alt={`XS™ ${flavor.name} sabor ${flavor.flavorEs}`}
                fill
                sizes="(max-width: 1023px) 170px, 240px"
                className="object-contain drop-shadow-[0_35px_50px_rgba(0,0,0,0.55)]"
              />
            </div>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-8 z-30 flex flex-col items-center gap-4 px-6 sm:px-8 lg:bottom-14 lg:gap-5">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-cream/70">
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">{active.line}</span>
            {active.tag && (
              <span className="rounded-full border border-cream/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-cream">
                {active.tag}
              </span>
            )}
          </div>

          <p className="min-h-[2.75rem] max-w-md text-center text-sm leading-relaxed text-cream/65">{active.benefit}</p>

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
