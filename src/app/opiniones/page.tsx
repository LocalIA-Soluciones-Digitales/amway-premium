import type { Metadata } from "next";
import { ResenasSection } from "@/components/catalog/ResenasSection";

export const metadata: Metadata = {
  title: "Opiniones de clientes",
  description:
    "Lo que opinan nuestros clientes de la tienda y de los productos Amway: Nutrilite, XS Energy, Artistry, eSpring y más.",
};

export default function OpinionesPage() {
  return (
    <div className="pt-32">
      <section className="border-b border-carbon/10 bg-linen">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">Opiniones</p>
          <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.05] text-carbon sm:text-6xl">
            Lo que dicen nuestros clientes.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-stone sm:text-lg">
            Opiniones reales de quienes ya compran con nosotros. Revisamos cada una antes de
            publicarla.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <ResenasSection />
      </section>
    </div>
  );
}
