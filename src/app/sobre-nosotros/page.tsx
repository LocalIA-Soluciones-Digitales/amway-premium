import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plane,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { waLink, WA_PRESETS, SITE } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Nosotros y contacto",
  description:
    "Distribuidores independientes de Amway en Barakaldo, Bizkaia. Productos originales de Estados Unidos, atención personal por WhatsApp y recogida en nuestro local.",
  alternates: { canonical: "/sobre-nosotros" },
};

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "100% originales" },
  { icon: Plane, label: "Importado de EE. UU." },
  { icon: PackageCheck, label: "Recogida en Barakaldo" },
  { icon: MessageCircle, label: "Atención por WhatsApp" },
];

const POINTS = [
  {
    image: "/images/editorial/nutricion-campo.webp",
    alt: "Cultivos de Nutrilite en campo abierto",
    eyebrow: "Origen",
    title: "Importación desde Estados Unidos",
    text: "Traemos el catálogo oficial de Amway US: Nutrilite, Artistry, XS Energy, eSpring, Atmosphere e iCook.",
  },
  {
    image: "/images/editorial/hogar-familia.webp",
    alt: "Madre con su bebé haciendo la colada en casa",
    eyebrow: "Cercanía",
    title: "Servicio local en Barakaldo",
    text: "Asesoramos en persona o por WhatsApp y preparamos cada pedido a mano para que lo recojas en nuestro local.",
  },
  {
    image: "/images/editorial/belleza-flores.webp",
    alt: "Sérum Artistry rodeado de flores",
    eyebrow: "Garantía",
    title: "Productos genuinos",
    text: "Sin imitaciones ni reenvasados: cada producto llega sellado y con la garantía de satisfacción Amway.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Nos escribes",
    text: "Por WhatsApp, email o el formulario de abajo. Cuéntanos qué buscas, aunque no sepas el nombre del producto.",
  },
  {
    n: "02",
    title: "Te asesoramos",
    text: "Te recomendamos lo que encaja contigo, sin compromiso.",
  },
  {
    n: "03",
    title: "Lo recoges",
    text: `Pasa por nuestro local de Barakaldo el día y la hora que elijas, ${SITE.horario.texto}.`,
  },
];

export default function SobreNosotrosPage() {
  return (
    <div className="pt-28 sm:pt-32">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-8 sm:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
              Nosotros · {SITE.city}
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] text-carbon sm:text-6xl lg:text-7xl">
              Calidad americana,
              <br />
              <span className="italic text-forest">con trato de casa.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-stone sm:text-lg">
              {SITE.name} nace en {SITE.city}, {SITE.region}, con una misión sencilla: acercar la
              calidad de los productos Amway de Estados Unidos a cada hogar, con un trato
              cercano y honesto.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={waLink(WA_PRESETS.general)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 text-sm font-medium text-cream transition hover:bg-forest-dim"
              >
                <MessageCircle size={16} />
                Hablar por WhatsApp
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 rounded-full border border-carbon/15 px-7 py-3.5 text-sm font-medium text-carbon transition hover:bg-carbon/5"
              >
                Ver contacto
                <ArrowDown size={16} />
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-linen sm:aspect-[5/4]">
              <Image
                src="/images/editorial/hero-bienestar.webp"
                alt="Mujer sonriente en un entorno luminoso"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover object-[60%_30%]"
              />
            </div>
            <div className="absolute -bottom-8 -left-2 hidden w-40 overflow-hidden rounded-2xl border-4 border-cream shadow-[0_20px_50px_rgba(28,26,22,0.18)] sm:block lg:-left-10 lg:w-48">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/images/editorial/nutricion-familia.webp"
                  alt="Padre con su hijo a hombros sujetando un bote de Nutrilite"
                  fill
                  sizes="12rem"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="glass-strong absolute -top-4 right-4 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_12px_40px_rgba(28,26,22,0.12)] sm:right-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-cream">
                <Sparkles size={16} />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-carbon">Atención personal</p>
                <p className="text-xs text-stone">Sin bots ni centralitas</p>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-carbon/10 bg-carbon/10 sm:mt-24 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <li key={h.label} className="flex items-center gap-3 bg-cream px-4 py-5 sm:px-6">
              <h.icon className="shrink-0 text-forest" size={20} strokeWidth={1.6} />
              <span className="text-sm text-carbon">{h.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Quién te atiende */}
      <section className="bg-linen">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-20">
          <div className="relative order-2 aspect-square overflow-hidden rounded-[2rem] lg:order-1">
            <Image
              src="/images/editorial/nutricion-botanico.webp"
              alt="Mano acariciando plantas de albahaca"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="origin-right scale-110 object-cover object-right"
            />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
              Quién te atiende
            </p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
              Una persona real,
              <br />
              no un centro de atención.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-stone sm:text-lg">
              Detrás de {SITE.name} hay una sola persona en {SITE.city} que responde cada mensaje,
              prepara cada pedido y conoce el catálogo de memoria.
            </p>
            <blockquote className="mt-8 border-l-2 border-gold pl-5 font-display text-xl leading-snug text-carbon sm:text-2xl">
              “Si tienes dudas sobre qué producto elegir, la cantidad recomendada o la recogida,
              hablas directamente conmigo.”
            </blockquote>
          </div>
        </div>
      </section>

      {/* Por qué nosotros */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
            Por qué elegirnos
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
            Lo mejor de Amway, sin intermediarios.
          </h2>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {POINTS.map((point) => (
            <article
              key={point.title}
              className="group overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-cream-soft"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={point.image}
                  alt={point.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-6 sm:p-7">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  {point.eyebrow}
                </p>
                <h3 className="mt-3 font-display text-2xl text-carbon">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{point.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-forest text-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-soft">
            Cómo funciona
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-4xl leading-[1.05] sm:text-5xl">
            Tres pasos, sin complicaciones.
          </h2>
          <ol className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step) => (
              <li key={step.n} className="border-t border-cream/20 pt-6">
                <span className="font-display text-5xl text-gold-soft/80">{step.n}</span>
                <h3 className="mt-4 font-display text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">Contacto</p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
              Hablemos de tu bienestar.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-stone">
              Elige el canal que prefieras. WhatsApp es la vía más rápida
              para resolver cualquier duda.
            </p>

            <div className="mt-10 flex flex-col gap-3">
              <a
                href={waLink(WA_PRESETS.general)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-forest/20 bg-forest/5 p-5 transition hover:border-forest/40 hover:bg-forest/10"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-cream">
                  <MessageCircle size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-carbon">WhatsApp</p>
                  <p className="text-sm text-stone">+{SITE.whatsapp}</p>
                </div>
                <ArrowUpRight
                  size={20}
                  className="shrink-0 text-forest transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>

              <a
                href={`mailto:${SITE.email}`}
                className="group flex items-center gap-4 rounded-2xl border border-carbon/10 p-5 transition hover:border-carbon/25 hover:bg-carbon/[0.03]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tech/10 text-tech">
                  <Mail size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-carbon">Email</p>
                  <p className="truncate text-sm text-stone">{SITE.email}</p>
                </div>
                <ArrowUpRight
                  size={20}
                  className="shrink-0 text-stone transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>

              <div className="flex items-center gap-4 rounded-2xl border border-carbon/10 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <MapPin size={22} />
                </span>
                <div>
                  <p className="font-display text-lg text-carbon">Ubicación</p>
                  <p className="text-sm text-stone">
                    {SITE.city}, {SITE.region} · Recogida en el local, {SITE.horario.texto}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative mt-8 hidden aspect-[16/9] overflow-hidden rounded-2xl lg:block">
              <Image
                src="/images/espring/woman-window.webp"
                alt="Mujer bebiendo un vaso de agua junto a la ventana"
                fill
                sizes="40vw"
                className="object-cover object-[30%_40%]"
              />
            </div>
          </div>

          <div className="rounded-[2rem] bg-linen p-7 sm:p-10">
            <p className="font-display text-2xl text-carbon">Escríbenos</p>
            <p className="mt-1 mb-8 text-sm text-stone">
              Rellena el formulario y te abrimos WhatsApp con el mensaje listo.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
