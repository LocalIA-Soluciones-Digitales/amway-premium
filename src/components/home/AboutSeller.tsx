"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { SITE, waLink, WA_PRESETS } from "@/data/site-config";

const STEPS = [
  {
    title: "Me cuentas qué necesitas",
    text: "Tus objetivos, tus hábitos y cualquier duda que tengas sobre el catálogo.",
  },
  {
    title: "Te recomiendo lo adecuado",
    text: "Qué producto elegir, en qué cantidad y cómo usarlo para sacarle partido.",
  },
  {
    title: "Te acompaño después",
    text: "Seguimiento del pedido y resolución de dudas una vez lo tienes en casa.",
  },
];

export function AboutSeller() {
  return (
    <section className="bg-linen">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 py-24 sm:px-8 sm:py-32 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
            Atención personal en {SITE.city}
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-6xl">
            Estoy aquí
            <br />
            para ayudarte.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-stone sm:text-lg">
            Cada persona tiene necesidades distintas. Si no sabes qué producto es
            el más adecuado para ti, escríbeme y te asesoro sin compromiso.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-carbon px-7 py-3.5 text-sm font-medium text-cream transition hover:bg-carbon-soft"
            >
              <MessageCircle size={16} />
              Hablar por WhatsApp
            </a>
            <span className="text-sm text-stone">Asesoramiento gratuito</span>
          </div>
        </div>

        <motion.ol
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="divide-y divide-carbon/10 border-y border-carbon/10 lg:col-span-6"
        >
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-6 py-7 sm:gap-8 sm:py-8">
              <span className="font-display text-2xl leading-none text-forest tabular-nums sm:text-3xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-xl text-carbon sm:text-2xl">{step.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-stone sm:text-base">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
