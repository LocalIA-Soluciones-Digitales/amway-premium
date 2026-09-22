import type { Metadata } from "next";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { EnergyHero } from "@/components/xs-energy/EnergyHero";
import { EnergyFacts } from "@/components/xs-energy/EnergyFacts";
import { EnergyVideoMoment } from "@/components/xs-energy/EnergyVideoMoment";
import { EnergyStory } from "@/components/xs-energy/EnergyStory";
import { EnergyFlavorGrid } from "@/components/xs-energy/EnergyFlavorGrid";
import { getBrands, getProductsByCategory, getSubcategories } from "@/data/products";

export const metadata: Metadata = {
  title: "XS Energy™ — Power Drinks, fuerza y recuperación",
  description:
    "XS™ Power Drink y Power Water+ en seis sabores reales, más pre-entrenamiento, creatina, proteínas y recuperación deportiva. Nutrición deportiva Amway importada de Estados Unidos.",
};

export default function XsEnergyPage() {
  const products = getProductsByCategory("xs-energy");
  const subcategories = getSubcategories("xs-energy");
  const brands = getBrands("xs-energy");

  return (
    <>
      <EnergyHero waMessage="Hola, quiero información sobre las bebidas de energía XS." />

      <EnergyFacts />

      <EnergyVideoMoment />

      <EnergyStory />

      <EnergyFlavorGrid />

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="mb-2 font-display text-2xl text-carbon sm:text-3xl">
          Catálogo XS™ completo
        </h2>
        <p className="mb-8 max-w-2xl text-sm text-stone">
          Además de las bebidas de energía: pre-entrenamiento, creatina, proteínas y
          recuperación deportiva XS™.
        </p>
        <ProductExplorer products={products} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
