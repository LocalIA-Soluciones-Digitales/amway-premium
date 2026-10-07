import type { Metadata } from "next";
import { ArrowDown, MessageSquareReply, PenLine, ShieldCheck } from "lucide-react";
import { ResenasSection } from "@/components/catalog/ResenasSection";
import { PageHero, heroPrimaryClass, heroSecondaryClass } from "@/components/layout/PageHero";
import { conRuta } from "@/lib/seo";

export const metadata: Metadata = conRuta("/opiniones", {
  title: "Opiniones de clientes",
  description:
    "Lo que opinan nuestros clientes de la tienda y de los productos Amway: Nutrilite, XS Energy, Artistry, eSpring y más.",
});

const PROMISES = [
  {
    icon: ShieldCheck,
    title: "Revisadas una a una",
    text: "Leemos cada opinión antes de publicarla y solo descartamos las ofensivas, publicitarias o ajenas a la tienda. No comprobamos que quien opina haya comprado.",
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
        description="Opiniones de quienes nos visitan y prueban nuestros productos. Si ya has probado algo, tu experiencia ayuda a otros a elegir."
        photo="/images/nosotros/opiniones-hero.webp"
        photoPosition="100% 35%"
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

      <section id="opiniones" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20">
        <ResenasSection />
      </section>
    </>
  );
}
