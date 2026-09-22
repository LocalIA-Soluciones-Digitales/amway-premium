import type { Metadata } from "next";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { SpringHero } from "@/components/espring/SpringHero";
import { SpringFacts } from "@/components/espring/SpringFacts";
import { SpringVideoMoment } from "@/components/espring/SpringVideoMoment";
import { SpringStory } from "@/components/espring/SpringStory";
import { SpringScience } from "@/components/espring/SpringScience";
import { SpringConnected } from "@/components/espring/SpringConnected";
import { SpringMaintenance } from "@/components/espring/SpringMaintenance";
import { getEspringProducts, getSubcategories, getBrands } from "@/data/products";

export const metadata: Metadata = {
  title: "eSpring™ — Purificador de agua LED UV-C",
  description:
    "El nuevo Sistema de Tratamiento de Agua eSpring™: filtra más de 170 contaminantes y elimina el 99,9999 % de las bacterias con tecnología LED UV-C. Descubre la ciencia, la app conectada y el catálogo completo.",
};

export default function EspringPage() {
  const products = getEspringProducts();
  const subcategories = getSubcategories("hogar").filter((s) => s === "Agua y aire limpios");
  const brands = getBrands("hogar").filter((b) => b === "eSpring");

  return (
    <>
      <SpringHero waMessage="Hola, quiero información sobre el purificador de agua eSpring™." />

      <SpringFacts />

      <SpringVideoMoment
        video="/videos/espring/campaign-overview.mp4"
        poster="/images/espring/kitchen-lifestyle.webp"
        posterAlt="Purificador eSpring™ en una cocina moderna"
        eyebrow="El nuevo eSpring™"
        description="Cómo el nuevo Sistema de Tratamiento de Agua eSpring transforma cada grifo en una fuente de agua pura, para toda la familia."
      />

      <SpringStory />

      <SpringScience />

      <SpringConnected />

      <SpringMaintenance />

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="mb-2 font-display text-2xl text-carbon sm:text-3xl">
          Catálogo eSpring™ completo
        </h2>
        <p className="mb-8 max-w-2xl text-sm text-stone">
          Sistema encima o bajo el mesón, grifos de diseño y filtros de recambio originales.
        </p>
        <ProductExplorer products={products} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
