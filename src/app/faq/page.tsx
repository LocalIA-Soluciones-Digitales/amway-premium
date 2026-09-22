import type { Metadata } from "next";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { waLink, WA_PRESETS } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resolvemos tus dudas sobre pedidos, envíos, precios y autenticidad de los productos Amway importados de Estados Unidos.",
};

export default function FaqPage() {
  return (
    <div className="pt-32">
      <section className="border-b border-carbon/10 bg-linen">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:px-8 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
            Preguntas frecuentes
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[1.05] text-carbon sm:text-6xl">
            ¿En qué te ayudamos?
          </h1>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8">
        <FaqAccordion />
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-28 text-center sm:px-8">
        <p className="text-stone">¿No encuentras la respuesta que buscas?</p>
        <a
          href={waLink(WA_PRESETS.info)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-full bg-forest px-8 py-3.5 text-sm font-medium text-cream transition hover:bg-forest-dim"
        >
          Pregúntanos por WhatsApp
        </a>
      </section>
    </div>
  );
}
