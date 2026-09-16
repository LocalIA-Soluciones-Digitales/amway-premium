"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";
import { waLink, WA_PRESETS } from "@/data/site-config";

const BACKDROPS = [
  "p017_0_841x1091.webp",
  "p086_0_353x1091.webp",
  "p194_0_851x606.webp",
  "p027_0_1047x1242.webp",
];

const TITLE_WORDS = ["Productos", "Premium", "de", "Estados", "Unidos", "para", "tu", "Bienestar"];

export function Hero() {
  const [slide, setSlide] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % BACKDROPS.length), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!titleRef.current) return;
    const words = titleRef.current.querySelectorAll("span");
    gsap.fromTo(
      words,
      { y: "110%", opacity: 0 },
      {
        y: "0%",
        opacity: 1,
        duration: 1,
        stagger: 0.06,
        ease: "expo.out",
        delay: 0.2,
      }
    );
  }, []);

  return (
    <section className="relative flex h-[100svh] min-h-[640px] items-center overflow-hidden">
      <div className="absolute inset-0">
        {BACKDROPS.map((src, i) => (
          <motion.div
            key={src}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === slide ? 1 : 0, scale: i === slide ? 1.08 : 1 }}
            transition={{ opacity: { duration: 1.4 }, scale: { duration: 6, ease: "linear" } }}
          >
            <Image src={`/images/catalog/${src}`} alt="" fill priority={i === 0} className="object-cover" />
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/75 to-obsidian/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/90 via-obsidian/40 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 sm:px-8">
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
          className="mt-5 max-w-4xl font-display text-[13vw] leading-[0.98] text-paper sm:text-6xl md:text-7xl"
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
