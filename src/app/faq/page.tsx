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
      <section className="mx-auto max-w-3xl px-6 pb-14 text-center sm:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-wellness">
          Preguntas frecuentes
        </p>
        <h1 className="mt-4 font-display text-4xl text-paper sm:text-5xl">¿En qué te ayudamos?</h1>
      </section>

      <section className="px-6 pb-20 sm:px-8">
        <FaqAccordion />
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-28 text-center sm:px-8">
        <p className="text-mist">¿No encuentras la respuesta que buscas?</p>
        <a
          href={waLink(WA_PRESETS.info)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-full bg-wellness px-8 py-3.5 text-sm font-medium text-obsidian transition hover:bg-wellness/90"
        >
          Pregúntanos por WhatsApp
        </a>
      </section>
    </div>
  );
}
