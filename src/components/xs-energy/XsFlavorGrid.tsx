"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { waProductLink } from "@/data/site-config";

interface Flavor {
  name: string;
  variant: string;
  image: string;
  color: string;
  glow: string;
}

const FLAVORS: Flavor[] = [
  {
    name: "XS™ Clásico",
    variant: "Cítrico",
    image: "p089_0_174x250.webp",
    color: "#e8792f",
    glow: "rgba(232,121,47,0.55)",
  },
  {
    name: "XS™ Tropical",
    variant: "Zero Sugar",
    image: "p089_1_280x404.webp",
    color: "#1f6fd6",
    glow: "rgba(31,111,214,0.55)",
  },
  {
    name: "XS™ Energy + Burn",
    variant: "Kiwi y fresa",
    image: "p089_3_141x216.webp",
    color: "#6cb52e",
    glow: "rgba(108,181,46,0.5)",
  },
  {
    name: "XS™ Watermelon",
    variant: "Lemonade",
    image: "p089_4_174x250.webp",
    color: "#e23f7e",
    glow: "rgba(226,63,126,0.5)",
  },
  {
    name: "XS™ Clásico",
    variant: "Naranja",
    image: "p089_5_174x250.webp",
    color: "#e2542f",
    glow: "rgba(226,84,47,0.5)",
  },
  {
    name: "XS™ Elite Focus",
    variant: "Mango durazno",
    image: "p089_6_300x404.webp",
    color: "#d9527a",
    glow: "rgba(217,82,122,0.5)",
  },
];

export function XsFlavorGrid() {
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
            Una explosión para cada momento.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {FLAVORS.map((flavor, i) => (
            <motion.a
              key={`${flavor.name}-${flavor.variant}`}
              href={waProductLink(`${flavor.name} ${flavor.variant}`)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8 }}
              className="group relative flex aspect-[3/4.2] flex-col justify-end overflow-hidden rounded-2xl"
              style={{ backgroundColor: "#0b0c10" }}
            >
              {/* Diagonal energy sweep, angled like a can-side highlight */}
              <div
                className="absolute inset-0 origin-top-left skew-y-[-8deg] scale-125 opacity-90 transition-transform duration-500 ease-out group-hover:skew-y-0 group-hover:scale-110"
                style={{
                  background: `linear-gradient(160deg, ${flavor.color} 0%, rgba(5,6,10,0.9) 75%)`,
                }}
              />
              <div
                className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: flavor.glow, opacity: 0.6 }}
              />

              <motion.div
                className="relative flex flex-1 items-center justify-center pt-8"
                initial={{ rotate: -6 }}
                whileHover={{ rotate: 0, scale: 1.06 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src={`/images/catalog/${flavor.image}`}
                  alt={`${flavor.name} ${flavor.variant}`}
                  width={200}
                  height={280}
                  className="h-[70%] w-auto object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
                />
              </motion.div>

              <div className="relative bg-xs-ink/80 px-4 py-4 backdrop-blur-sm">
                <p className="font-display text-sm leading-tight text-cream sm:text-base">
                  {flavor.name}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-cream/55">
                  {flavor.variant}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
