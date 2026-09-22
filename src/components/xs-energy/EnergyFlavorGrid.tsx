"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { waProductLink } from "@/data/site-config";
import { energyProduct, ENERGY_FLAVORS } from "@/data/energy-drinks";

export function EnergyFlavorGrid() {
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
            Ocho sabores. Cero límites.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ENERGY_FLAVORS.map((flavor, i) => {
            const product = energyProduct(flavor.productId);
            return (
              <motion.a
                key={flavor.id}
                href={waProductLink(`${product.name} · ${flavor.name}`)}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -10 }}
                className="group relative flex aspect-[3/4.2] flex-col justify-end overflow-hidden rounded-2xl"
                style={{ backgroundColor: "#0b0c10" }}
              >
                <div
                  className="absolute inset-0 origin-top-left skew-y-[-8deg] scale-125 opacity-90 transition-transform duration-500 ease-out group-hover:skew-y-0 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(160deg, ${flavor.accent} 0%, rgba(5,6,10,0.92) 75%)`,
                  }}
                />
                <div
                  className="pointer-events-none absolute -top-10 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: flavor.accentSoft }}
                />

                {flavor.tag && (
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-cream/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-carbon">
                    {flavor.tag}
                  </span>
                )}

                <motion.div
                  className="relative flex flex-1 items-center justify-center pt-8"
                  initial={{ rotate: -6 }}
                  whileHover={{ rotate: 0, scale: 1.08 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Image
                    src={`/images/catalog/${flavor.image}`}
                    alt={`${flavor.line} · ${flavor.name}`}
                    width={200}
                    height={280}
                    className="h-[72%] w-auto object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
                  />
                </motion.div>

                <div className="relative bg-xs-ink/80 px-4 py-4 backdrop-blur-sm">
                  <p className="font-display text-sm leading-tight text-cream sm:text-base">
                    {flavor.line}
                  </p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-cream/55">
                    {flavor.name}
                  </p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
