"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";
import { PRODUCTS } from "@/data/products";

const XSEnergyScene = dynamic(() => import("@/components/animated/XSEnergyScene").then((m) => m.XSEnergyScene), { ssr: false });
const ESpringScene = dynamic(() => import("@/components/animated/ESpringScene").then((m) => m.ESpringScene), { ssr: false });
const AtmosphereScene = dynamic(() => import("@/components/animated/AtmosphereScene").then((m) => m.AtmosphereScene), { ssr: false });
const NutriliteBotanical = dynamic(() => import("@/components/animated/NutriliteBotanical").then((m) => m.NutriliteBotanical), { ssr: false });
const ArtistryGlow = dynamic(() => import("@/components/animated/ArtistryGlow").then((m) => m.ArtistryGlow), { ssr: false });
const ICookSteam = dynamic(() => import("@/components/animated/ICookSteam").then((m) => m.ICookSteam), { ssr: false });

function findProduct(id: string) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) throw new Error(`Flagship product missing: ${id}`);
  return p;
}

const XS = findProduct("xs-energy-drink");
const ESPRING = findProduct("espring-mesón");
const ATMOSPHERE = findProduct("atmosphere-sky");
const NUTRILITE = findProduct("omega-avanzado");
const ARTISTRY = findProduct("art-gotas-omega");
const ICOOK = findProduct("icook-coleccion-19");

const ITEMS = [
  { key: "xs", node: <XSEnergyScene image="p089_6_300x404.webp" />, product: XS, hint: "Pasa el ratón: energía y partículas" },
  { key: "espring", node: <ESpringScene />, product: ESPRING, hint: "Pasa el ratón: agua fluyendo" },
  { key: "atmosphere", node: <AtmosphereScene />, product: ATMOSPHERE, hint: "Pasa el ratón: aire purificado" },
  { key: "nutrilite", node: <NutriliteBotanical image="p027_0_1047x1242.webp" />, product: NUTRILITE, hint: "Pasa el ratón: naturaleza viva" },
  { key: "artistry", node: <ArtistryGlow image="p129_0_1234x1349.webp" />, product: ARTISTRY, hint: "Pasa el ratón: brillo de lujo" },
  { key: "icook", node: <ICookSteam image="p196_0_840x458.webp" />, product: ICOOK, hint: "Pasa el ratón: vapor culinario" },
];

export function FlagshipShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 max-w-2xl"
      >
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
          Experiencias interactivas
        </p>
        <h2 className="mt-4 font-display text-3xl text-paper sm:text-5xl">
          Productos que cobran vida.
        </h2>
        <p className="mt-4 text-base text-mist">
          Seis iconos de nuestro catálogo, reinventados con animación en tiempo real.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ key, node, product, hint }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="group overflow-hidden rounded-3xl border border-white/8 bg-graphite/30"
          >
            {node}
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-wide text-mist">{hint}</p>
              <h3 className="mt-2 font-display text-lg text-paper">{product.name}</h3>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-paper">{priceRangeLabel(product)}</span>
                <a
                  href={waProductLink(product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/5 px-4 py-2 text-xs text-mist transition group-hover:bg-wellness group-hover:text-obsidian"
                >
                  Consultar
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
