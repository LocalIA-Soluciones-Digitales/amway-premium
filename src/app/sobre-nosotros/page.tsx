import type { Metadata } from "next";
import { ImageIcon, MessageCircle, Plane, MapPin, ShieldCheck } from "lucide-react";
import { waLink, WA_PRESETS, SITE } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "Somos distribuidores independientes de Amway en Barakaldo, Bizkaia. Importamos productos originales de Estados Unidos con atención personalizada.",
};

const POINTS = [
  {
    icon: Plane,
    title: "Importación desde Estados Unidos",
    text: "Traemos directamente el catálogo oficial de Amway US: Nutrilite, Artistry, XS Energy, eSpring, Atmosphere e iCook.",
  },
  {
    icon: MapPin,
    title: "Servicio local en Barakaldo",
    text: "Entregamos y asesoramos en persona o por WhatsApp a clientes de toda España.",
  },
  {
    icon: ShieldCheck,
    title: "100% originales",
    text: "Productos genuinos, con la garantía de satisfacción Amway en cada pedido.",
  },
];

export default function SobreNosotrosPage() {
  return (
    <div className="pt-32">
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center sm:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
          Sobre nosotros
        </p>
        <h1 className="mt-5 font-display text-5xl leading-[1.05] text-carbon sm:text-6xl">
          Calidad americana,
          <br />
          con trato de casa.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-stone sm:text-lg">
          {SITE.name} nace en {SITE.city}, {SITE.region}, con una misión sencilla: acercar la
          calidad de los productos Amway de Estados Unidos a cada hogar de España, con un trato
          cercano y honesto.
        </p>
      </section>

      <section className="bg-linen">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 sm:px-8 sm:py-32 lg:grid-cols-12 lg:gap-16">
          <div
            className="relative order-2 flex aspect-[4/5] items-center justify-center rounded-sm border border-dashed border-carbon/25 bg-cream-soft lg:order-1 lg:col-span-5"
            aria-label="Fotografía pendiente"
          >
            <div className="flex flex-col items-center gap-3 px-8 text-center text-stone">
              <ImageIcon size={28} strokeWidth={1.5} />
              <p className="text-xs uppercase tracking-wider">Añade tu fotografía aquí</p>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
              Quién te atiende
            </p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
              Una persona real,
              <br />
              no un centro de atención.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-stone sm:text-lg">
              Detrás de {SITE.name} hay una sola persona en {SITE.city} que responde cada
              mensaje, prepara cada pedido y conoce el catálogo de memoria. Si tienes dudas
              sobre qué producto elegir, la cantidad recomendada o el envío, hablas
              directamente conmigo.
            </p>
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-carbon px-7 py-3.5 text-sm font-medium text-cream transition hover:bg-carbon-soft"
            >
              <MessageCircle size={16} />
              Hablar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title}>
              <point.icon className="text-forest" size={24} strokeWidth={1.5} />
              <h2 className="mt-5 font-display text-xl text-carbon">{point.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone">{point.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-28 text-center sm:px-8">
        <h2 className="font-display text-3xl text-carbon sm:text-4xl">
          ¿Quieres conocernos mejor?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-stone">
          Escríbenos por WhatsApp: te contamos cómo trabajamos y resolvemos cualquier duda sobre
          nuestros productos.
        </p>
        <a
          href={waLink(WA_PRESETS.general)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex rounded-full bg-forest px-8 py-3.5 text-sm font-medium text-cream transition hover:bg-forest-dim"
        >
          Hablar por WhatsApp
        </a>
      </section>
    </div>
  );
}
