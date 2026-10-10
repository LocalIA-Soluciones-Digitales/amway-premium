"use client";

import Image from "next/image";
import { m as motion } from "framer-motion";
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
    <section className="relative isolate overflow-hidden bg-forest-dim">
      <Image
        src="/images/editorial/nutricion-botanico.webp"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-dim/95 via-forest-dim/85 to-forest-dim/70"
      />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 py-24 sm:px-8 sm:py-32 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cream/70">
            Atención personal en {SITE.city}
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-cream sm:text-6xl">
            Estoy aquí
            <br />
            para ayudarte.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-cream/75 sm:text-lg">
            Cada persona tiene necesidades distintas. Si no sabes qué producto es
            el más adecuado para ti, escríbeme y te asesoro sin compromiso.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-medium text-carbon transition hover:bg-cream-soft"
            >
              <MessageCircle size={16} />
              Hablar por WhatsApp
            </a>
            <span className="text-sm text-cream/60">Asesoramiento gratuito</span>
          </div>
        </div>

        <motion.ol
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="divide-y divide-cream/15 border-y border-cream/15 lg:col-span-6"
        >
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-6 py-7 sm:gap-8 sm:py-8">
              <span className="w-10 shrink-0 font-display text-2xl leading-none text-cream/50 tabular-nums sm:w-12 sm:text-3xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-xl text-cream sm:text-2xl">{step.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-cream/70 sm:text-base">
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
