import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown, MessageSquareReply, PenLine, ShieldCheck } from "lucide-react";
import { ResenasSection } from "@/components/catalog/ResenasSection";
import { PageHero, heroPrimaryClass, heroSecondaryClass } from "@/components/layout/PageHero";

export const metadata: Metadata = {
  title: "Opiniones de clientes",
  description:
    "Lo que opinan nuestros clientes de la tienda y de los productos Amway: Nutrilite, XS Energy, Artistry, eSpring y más.",
};

const PROMISES = [
  {
    icon: ShieldCheck,
    title: "Revisadas una a una",
    text: "Leemos cada opinión antes de publicarla para que solo veas experiencias reales.",
  },
  {
    icon: MessageSquareReply,
    title: "Respondemos en persona",
    text: "Quien te atiende en la tienda es quien contesta a cada comentario.",
  },
  {
    icon: PenLine,
    title: "De la tienda o de un producto",
    text: "Valora tu experiencia general o cuéntanos qué tal te ha ido un producto concreto.",
  },
];

export default function OpinionesPage() {
  return (
    <>
      <PageHero
        eyebrow="Opiniones de clientes"
        title={
          <>
            Lo que dicen <span className="italic text-gold-soft">nuestros clientes.</span>
          </>
        }
        description="Opiniones reales de quienes ya compran con nosotros en Barakaldo. Si ya has probado algo, tu experiencia ayuda a otros a elegir."
        photo="/images/xs-energy/lifestyle/park-portrait.webp"
        photoPosition="70% 30%"
        actions={
          <>
            <a href="#opinar" className={heroPrimaryClass}>
              <PenLine size={16} />
              Dejar mi opinión
            </a>
            <a href="#opiniones" className={heroSecondaryClass}>
              Leer opiniones
              <ArrowDown size={16} />
            </a>
          </>
        }
      />

      <section className="border-b border-carbon/10">
        <ul className="mx-auto grid max-w-7xl gap-px px-6 sm:px-8 md:grid-cols-3">
          {PROMISES.map((p) => (
            <li key={p.title} className="flex gap-4 py-8 md:px-6 md:first:pl-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest">
                <p.icon size={20} strokeWidth={1.7} />
              </span>
              <div>
                <p className="font-display text-lg text-carbon">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-linen">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:px-8 sm:py-20 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
            <Image
              src="/images/nosotros/clienta-estudio.webp"
              alt="Yuly junto a una clienta con sus suplementos Nutrilite"
              fill
              sizes="(min-width: 768px) 26rem, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
              Clientas reales
            </p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">
              Cada pedido, entregado en mano.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-stone sm:text-lg">
              Quienes compran con nosotros pasan por el local de Barakaldo, recogen su pedido y
              resuelven sus dudas en persona. Esas son las experiencias que encontrarás aquí.
            </p>
          </div>
        </div>
      </section>

      <section id="opiniones" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20">
        <ResenasSection />
      </section>
    </>
  );
}
