import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Clock,
  HandHeart,
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

const PROMISES = [
  { icon: MessageCircle, text: "Responde ella misma cada mensaje de WhatsApp" },
  { icon: PackageCheck, text: "Prepara cada pedido a mano" },
  { icon: HandHeart, text: "Te lo entrega en persona en el local" },
];

const SIDE_POINTS = [
  {
    image: "/images/nosotros/origen-natural.webp",
    alt: "Cápsulas de suplemento junto a naranjas y limas cortadas",
    eyebrow: "Origen",
    title: "Importación desde Estados Unidos",
    text: "El catálogo oficial de Amway US: Nutrilite, Artistry, XS Energy, eSpring, Atmosphere e iCook.",
  },
  {
    image: "/images/nosotros/garantia-capsulas.webp",
    alt: "Bote abierto con cápsulas sobre una mesa blanca",
    eyebrow: "Garantía",
    title: "Productos genuinos",
    text: "Sin imitaciones ni reenvasados: cada producto llega sellado y con la garantía Amway.",
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

const eyebrowClass = "text-xs font-medium uppercase tracking-[0.25em] text-forest";

export default function SobreNosotrosPage() {
  return (
    <div className="pt-28 sm:pt-32">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-8 sm:pb-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-forest">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Nosotros · {SITE.city}
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] text-carbon sm:text-6xl lg:text-7xl">
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

            <div className="mt-10 flex items-center gap-4 border-t border-carbon/10 pt-8">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-gold/40 ring-offset-2 ring-offset-cream">
                <Image
                  src="/images/nosotros/yuly-avatar.webp"
                  alt="Yuly"
                  fill
                  sizes="3.5rem"
                  className="object-cover"
                />
              </div>
              <div className="leading-snug">
                <p className="font-display text-lg text-carbon">Yuly</p>
                <p className="text-sm text-stone">Te atiende en persona en {SITE.city}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-linen shadow-[0_30px_80px_-30px_rgba(28,26,22,0.35)]">
              <Image
                src="/images/nosotros/yuly-mostrador.webp"
                alt="Yuly en el local de Barakaldo mostrando las bebidas XS Energy sobre el mostrador"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
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
            <div className="glass-strong absolute -bottom-5 left-4 hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_12px_40px_rgba(28,26,22,0.12)] sm:left-6 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/20 text-gold">
                <Clock size={16} />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-carbon">Recogida en el local</p>
                <p className="text-xs text-stone">{SITE.horario.texto}</p>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-carbon/10 bg-carbon/10 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <li key={h.label} className="flex items-center gap-3 bg-cream-soft px-4 py-5 sm:px-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest">
                <h.icon size={17} strokeWidth={1.7} />
              </span>
              <span className="text-sm font-medium text-carbon">{h.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Quién te atiende */}
      <section className="bg-linen">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <Image
                src="/images/nosotros/yuly-clienta.webp"
                alt="Yuly entregando una caja de barritas XS Energy a una clienta en el local"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-[center_30%]"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-carbon/60 to-transparent" />
              <p className="absolute bottom-5 left-5 rounded-full bg-cream/90 px-4 py-1.5 text-xs font-medium text-carbon backdrop-blur">
                Yuly con una clienta · {SITE.city}
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className={eyebrowClass}>Quién te atiende</p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
              Una persona real,
              <br />
              <span className="italic text-forest">no un centro de atención.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-stone sm:text-lg">
              Detrás de {SITE.name} está Yuly, en {SITE.city}: responde cada mensaje, prepara cada
              pedido y te lo entrega en mano en el local.
            </p>

            <figure className="relative mt-10 rounded-3xl bg-cream-soft p-7 sm:p-8">
              <span
                aria-hidden
                className="absolute -top-5 left-7 font-display text-7xl leading-none text-gold"
              >
                “
              </span>
              <blockquote className="font-display text-xl leading-snug text-carbon sm:text-2xl">
                Si tienes dudas sobre qué producto elegir, la cantidad recomendada o la recogida,
                hablas directamente conmigo.
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 text-sm text-stone">
                <span className="h-px w-8 bg-gold" />
                <span className="font-display text-base italic text-carbon">Yuly</span>
                <span>· {SITE.name}</span>
              </figcaption>
            </figure>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {PROMISES.map((p) => (
                <li key={p.text} className="flex items-start gap-3 text-sm leading-snug text-carbon">
                  <p.icon size={18} strokeWidth={1.7} className="mt-0.5 shrink-0 text-forest" />
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Por qué nosotros */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className={eyebrowClass}>Por qué elegirnos</p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
              Lo mejor de Amway, sin intermediarios.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-stone">
            Productos originales, asesoramiento cercano y un local al que puedes venir cuando
            quieras.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:grid-rows-2">
          <article className="group relative min-h-[26rem] overflow-hidden rounded-[2rem] lg:col-span-2 lg:row-span-2 lg:min-h-[36rem]">
            <Image
              src="/images/nosotros/clienta-local.webp"
              alt="Yuly entregando suplementos Nutrilite a una clienta en su local de Barakaldo"
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover object-[center_25%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-carbon/85 via-carbon/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-soft">
                Cercanía
              </p>
              <h3 className="mt-3 max-w-lg font-display text-3xl text-cream sm:text-4xl">
                Servicio local en {SITE.city}
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-cream/75 sm:text-base">
                Asesoramos en persona o por WhatsApp y preparamos cada pedido a mano para que lo
                recojas en nuestro local.
              </p>
            </div>
          </article>

          {SIDE_POINTS.map((point) => (
            <article
              key={point.title}
              className="group relative min-h-[17rem] overflow-hidden rounded-[2rem]"
            >
              <Image
                src={point.image}
                alt={point.alt}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-carbon/95 via-carbon/55 to-carbon/10" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-soft">
                  {point.eyebrow}
                </p>
                <h3 className="mt-2 font-display text-2xl text-cream">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/75">{point.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-forest text-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-soft">
            Cómo funciona
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-4xl leading-[1.05] sm:text-5xl">
            Tres pasos, sin complicaciones.
          </h2>
          <ol className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-7 transition hover:bg-cream/[0.07]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-soft/40 font-display text-lg text-gold-soft">
                  {step.n}
                </span>
                <h3 className="mt-6 font-display text-2xl">{step.title}</h3>
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
