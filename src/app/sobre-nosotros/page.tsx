import type { Metadata } from "next";
import { MapPin, Plane, Users, ShieldCheck } from "lucide-react";
import { waLink, WA_PRESETS, SITE } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "Somos distribuidores independientes de Amway en Barakaldo, Bizkaia. Importamos productos originales de Estados Unidos con atención personalizada.",
};

const STEPS = [
  {
    icon: Plane,
    title: "Importación desde Estados Unidos",
    text: "Traemos directamente el catálogo oficial de Amway US: Nutrilite, Artistry, XS Energy, eSpring, Atmosphere e iCook, con la misma calidad que en origen.",
  },
  {
    icon: MapPin,
    title: "Servicio local en Barakaldo",
    text: "Con base en Barakaldo, Bizkaia, entregamos y asesoramos en persona o por WhatsApp a clientes de toda España.",
  },
  {
    icon: Users,
    title: "Atención personalizada",
    text: "Cada consulta se atiende de forma individual: te ayudamos a elegir el producto adecuado según tus necesidades de bienestar.",
  },
  {
    icon: ShieldCheck,
    title: "Confianza y experiencia",
    text: "Productos 100% originales, con la garantía de satisfacción Amway y años de experiencia como distribuidores independientes.",
  },
];

export default function SobreNosotrosPage() {
  return (
    <div className="pt-32">
      <section className="mx-auto max-w-4xl px-6 pb-16 text-center sm:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-wellness">
          Sobre nosotros
        </p>
        <h1 className="mt-4 font-display text-4xl text-paper sm:text-5xl">
          Calidad americana, con trato de casa.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-mist sm:text-lg">
          {SITE.name} nace en {SITE.city}, {SITE.region}, con una misión sencilla: acercar la
          calidad, innovación y bienestar de los productos Amway de Estados Unidos a cada hogar de
          España, con un trato cercano y honesto.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-white/8 bg-graphite/30 p-7">
              <step.icon className="text-wellness" size={26} />
              <h2 className="mt-4 font-display text-xl text-paper">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mist">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-28 text-center sm:px-8">
        <h2 className="font-display text-2xl text-paper sm:text-3xl">
          ¿Quieres conocernos mejor?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-mist">
          Escríbenos por WhatsApp: te contamos cómo trabajamos y resolvemos cualquier duda sobre
          nuestros productos.
        </p>
        <a
          href={waLink(WA_PRESETS.general)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex rounded-full bg-wellness px-8 py-3.5 text-sm font-medium text-obsidian transition hover:bg-wellness/90"
        >
          Hablar por WhatsApp
        </a>
      </section>
    </div>
  );
}
