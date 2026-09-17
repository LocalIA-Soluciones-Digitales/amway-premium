"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";
import { waLink, WA_PRESETS } from "@/data/site-config";

const SHOWCASE = [
  { src: "p027_0_1047x1242.webp", label: "Nutrilite™" },
  { src: "p129_0_1234x1349.webp", label: "Artistry™" },
  { src: "p089_6_300x404.webp", label: "XS™" },
  { src: "p198_0_841x1091.webp", label: "Amway Home™" },
];

const TITLE_WORDS = ["Productos", "Premium", "de", "Estados", "Unidos", "para", "tu", "Bienestar"];

export function Hero() {
  const [slide, setSlide] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SHOWCASE.length), 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!titleRef.current) return;
    const words = titleRef.current.querySelectorAll("span");
    gsap.fromTo(
      words,
      { y: "110%", opacity: 0, rotateZ: 3 },
      {
        y: "0%",
        opacity: 1,
        rotateZ: 0,
        duration: 1.1,
        stagger: 0.055,
        ease: "expo.out",
        delay: 0.15,
      }
    );

    if (frameRef.current) {
      gsap.fromTo(
        frameRef.current,
        { opacity: 0, scale: 0.92, y: 24 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2, delay: 0.3, ease: "power3.out" }
      );
    }
  }, []);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-24">
      {/* Gradient mesh backdrop — no photo cropping issues, always looks intentional */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-obsidian" />
        <div
          className="absolute -top-1/3 left-[-10%] h-[70vh] w-[70vh] rounded-full opacity-40 blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(53,208,161,0.35), transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vh] rounded-full opacity-35 blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(77,142,255,0.35), transparent 70%)" }}
        />
        <div
          className="absolute right-[15%] top-[10%] h-[40vh] w-[40vh] rounded-full opacity-20 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(212,175,106,0.4), transparent 70%)" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,6,10,0.6)_100%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-sm font-medium uppercase tracking-[0.3em] text-wellness"
          >
            Importado directamente de Estados Unidos
          </motion.p>

          <h1
            ref={titleRef}
            className="mt-5 max-w-2xl font-display text-[12vw] leading-[0.98] text-paper sm:text-6xl lg:text-[4.2vw] xl:text-7xl"
          >
            {TITLE_WORDS.map((w, i) => (
              <span key={i} className="mr-3 inline-block overflow-hidden align-bottom sm:mr-4">
                <span className="inline-block">{w}</span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-6 max-w-lg text-base leading-relaxed text-mist sm:text-lg"
          >
            Nutrición, belleza, hogar y salud con la calidad Amway. Productos originales importados
            de EE. UU., con atención personalizada en Barakaldo, Bizkaia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.7 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <a
              href="/catalogo"
              className="rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-obsidian transition hover:bg-white"
            >
              Explorar productos
            </a>
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-medium text-paper backdrop-blur transition hover:border-wellness/50 hover:bg-wellness/10"
            >
              Contactar por WhatsApp
            </a>
          </motion.div>
        </div>

        {/* Framed showcase — object-contain means nothing ever gets cropped,
            regardless of the source photo's aspect ratio. */}
        <div ref={frameRef} className="relative mx-auto hidden aspect-[4/5] w-full max-w-md lg:block">
          <div className="glass absolute inset-0 rounded-[2rem]" />
          <div className="absolute inset-6 overflow-hidden rounded-[1.5rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={SHOWCASE[slide].src}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex h-full w-full items-center justify-center"
              >
                <Image
                  src={`/images/catalog/${SHOWCASE[slide].src}`}
                  alt={SHOWCASE[slide].label}
                  fill
                  priority
                  sizes="420px"
                  className="object-contain p-8"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {SHOWCASE.map((s, i) => (
              <button
                key={s.src}
                aria-label={`Ver ${s.label}`}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-6 bg-wellness" : "w-1.5 bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.4 }, y: { duration: 1.8, repeat: Infinity } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-mist"
      >
        <ChevronDown size={22} />
      </motion.div>
    </section>
  );
}
