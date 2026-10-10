"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { entrada } from "@/lib/entrada";
import { m as motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { waLink } from "@/data/site-config";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ENERGY_FLAVORS, XS_ANNIVERSARY } from "@/data/energy-drinks";

const HERO_CAN = ENERGY_FLAVORS[0];
// Latas que acompañan a la principal en abanico (solo móvil y tablet).
const SIDE_CANS = [
  { flavor: ENERGY_FLAVORS[1], side: "left" },
  { flavor: ENERGY_FLAVORS[5], side: "right" },
] as const;
const BADGE_TEXT = `${XS_ANNIVERSARY.claim} · XS™ · `;

function AnniversaryBadge() {
  return (
    <div
      style={entrada(1.4, 0.8)}
      className="pointer-events-none absolute right-[4%] top-[2%] z-20 h-[84px] w-[84px] sm:right-[14%] sm:h-[104px] sm:w-[104px] lg:right-[8%] lg:top-[10%] lg:h-[120px] lg:w-[120px]"
    >
      <div className="absolute inset-0 rounded-full bg-xs-red shadow-[0_12px_30px_rgba(232,56,79,0.45)]" />
      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="absolute inset-0 animate-[spin_18s_linear_infinite] motion-reduce:animate-none"
      >
        <defs>
          <path id="xs-badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-cream text-[9px] font-bold uppercase">
          <textPath href="#xs-badge-circle" textLength="236" lengthAdjust="spacing">{BADGE_TEXT}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-cream">
        <span className="font-display text-2xl italic sm:text-3xl">{XS_ANNIVERSARY.years}</span>
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.2em] sm:text-[9px]">años</span>
      </div>
    </div>
  );
}

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
      className="relative flex min-h-[100svh] items-stretch justify-center overflow-hidden bg-xs-ink pb-8 pt-24 lg:items-center lg:pb-0 lg:pt-20"
    >
      <motion.div style={{ y: reducedMotion ? 0 : bgY }} className="absolute inset-0">
        <Image
          src="/images/xs-energy/lifestyle/girl-mountain.webp"
          alt="Aventura al aire libre con XS™ Power Water+"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[30%_center] opacity-30 lg:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-xs-ink via-xs-ink/75 to-xs-ink/35" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-xs-ink/70 via-xs-ink/20 to-transparent lg:block" />
      </motion.div>

      {/* Rejilla técnica sutil: textura de fondo en móvil, donde la foto horizontal apenas se lee. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)] lg:hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(247,244,238,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(247,244,238,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px] animate-pulse-slow"
        style={{ background: `radial-gradient(circle, ${HERO_CAN.accentSoft}, transparent 70%)` }}
      />

      <motion.div
        style={{ opacity: reducedMotion ? 1 : contentOpacity }}
        className="relative grid w-full max-w-7xl grid-cols-1 grid-rows-[auto_1fr_auto] px-5 sm:px-8 lg:grid-cols-2 lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-8"
      >
        <div className="flex flex-col items-center text-center lg:col-start-1 lg:row-start-2 lg:items-start lg:text-left">
          <p
            style={entrada(0.05, 0.6)}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-xs-red sm:text-sm sm:tracking-[0.4em]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-xs-red shadow-[0_0_12px_#e8384f]" />
            XS™ Power Drinks
          </p>

          <h1
            ref={titleRef}
            className="mt-3 select-none font-display text-[17vw] italic leading-[0.85] text-cream sm:mt-4 sm:text-[9vw] lg:text-[4.8vw] xl:text-[4.2rem]"
            aria-label="Pura energía"
          >
            <span className="block overflow-hidden">
              <span className="word-inner inline-block">Pura</span>
            </span>
            <span className="block overflow-hidden text-transparent [-webkit-text-stroke:1.5px_#f7f4ee] sm:[-webkit-text-stroke:2px_#f7f4ee]">
              <span className="word-inner inline-block">Energía</span>
            </span>
          </h1>
        </div>

        <div
          ref={stageRef}
          className="relative flex min-h-[300px] w-full items-center justify-center py-4 sm:min-h-[48vh] lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:min-h-[60vh] lg:py-0"
          style={{ perspective: "1400px" }}
        >
          {/* Suelo: sombra elíptica que asienta las latas. */}
          <div className="pointer-events-none absolute bottom-[4%] left-1/2 h-8 w-[70%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl lg:hidden" />

          {SIDE_CANS.map(({ flavor, side }) => (
            <div
              key={flavor.id}
              aria-hidden
              style={entrada(side === "left" ? 0.9 : 1.0, 1)}
              className={`absolute inset-y-0 z-0 flex items-center lg:hidden ${
                side === "left" ? "left-[2%] sm:left-[16%]" : "right-[2%] sm:right-[16%]"
              }`}
            >
              <div
                className={`relative mt-[6%] h-[30svh] max-h-[260px] min-h-[180px] w-[96px] sm:h-[36vh] sm:max-h-none sm:w-[150px] ${
                  side === "left" ? "-rotate-[12deg]" : "rotate-[12deg]"
                }`}
              >
                <Image
                  src={`/images/xs-energy/cans/${flavor.image}`}
                  alt=""
                  fill
                  sizes="150px"
                  className="object-contain brightness-[0.7] drop-shadow-[0_24px_30px_rgba(0,0,0,0.6)]"
                />
              </div>
            </div>
          ))}

          <motion.div
            ref={canRef}
            style={{ y: reducedMotion ? 0 : canY, transformStyle: "preserve-3d" }}
            className="relative z-10 flex items-center justify-center"
          >
            <div className="relative h-[40svh] max-h-[340px] min-h-[240px] w-[140px] sm:h-[48vh] sm:max-h-none sm:w-[280px] lg:h-[58vh] lg:w-[360px]">
              <Image
                src={`/images/xs-energy/cans/${HERO_CAN.image}`}
                alt={`Lata XS™ ${HERO_CAN.name} sabor ${HERO_CAN.flavorEs}`}
                fill
                priority
                sizes="(max-width: 640px) 140px, (max-width: 1024px) 280px, 360px"
                className="object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.55)]"
              />
            </div>
          </motion.div>

          <AnniversaryBadge />
        </div>

        <div className="flex flex-col items-center text-center lg:col-start-1 lg:row-start-3 lg:items-start lg:text-left">
          <p
            style={entrada(1.15)}
            className="max-w-xs text-[15px] leading-relaxed text-cream/65 sm:mt-6 sm:max-w-md sm:text-lg"
          >
            Sin azúcares añadidos, sin colorantes ni aromas artificiales.
            <span className="hidden sm:inline">
              {" "}Celebramos {XS_ANNIVERSARY.years} años de aventura con seis sabores reales.
            </span>
          </p>

          <div
            style={entrada(1.3)}
            className="mt-6 flex w-full max-w-sm items-center gap-3 sm:mt-8 sm:w-auto sm:max-w-none sm:gap-4"
          >
            <a
              href="#sabores"
              className="group relative flex-1 overflow-hidden rounded-full bg-xs-red px-6 py-4 text-center text-sm font-bold uppercase tracking-wide text-cream shadow-[0_14px_40px_-10px_rgba(232,56,79,0.7)] transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98] sm:flex-none sm:px-8 sm:py-3.5"
            >
              <span className="relative z-10">Descubre los sabores</span>
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
            </a>
            <a
              href={waLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pedir por WhatsApp"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/5 text-sm font-bold uppercase tracking-wide text-cream backdrop-blur-sm transition hover:border-xs-red/60 hover:bg-xs-red/10 sm:h-auto sm:w-auto sm:bg-transparent sm:px-8 sm:py-3.5"
            >
              <MessageCircle size={20} className="sm:hidden" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>

          <ul
            style={entrada(1.45)}
            className="mt-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/45 sm:hidden"
          >
            <li>0 azúcares</li>
            <li aria-hidden className="h-1 w-1 rounded-full bg-cream/30" />
            <li>6 sabores</li>
            <li aria-hidden className="h-1 w-1 rounded-full bg-cream/30" />
            <li>250 ml</li>
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.7 }, y: { duration: 1.8, repeat: Infinity } }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-cream/60 lg:block"
      >
        <ChevronDown size={22} />
      </motion.div>
    </section>
  );
}
