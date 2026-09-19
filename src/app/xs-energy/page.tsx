import type { Metadata } from "next";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { XsHero } from "@/components/xs-energy/XsHero";
import { XsFlavorGrid } from "@/components/xs-energy/XsFlavorGrid";
import { getBrands, getProductsByCategory, getSubcategories } from "@/data/products";

export const metadata: Metadata = {
  title: "XS Energy™ — Energía, fuerza y recuperación",
  description:
    "Bebidas de energía XS™, pre-entrenamiento, creatina, proteínas y recuperación deportiva. Nutrición deportiva Amway importada de Estados Unidos.",
};

export default function XsEnergyPage() {
  const products = getProductsByCategory("xs-energy");
  const subcategories = getSubcategories("xs-energy");
  const brands = getBrands("xs-energy");

  return (
    <>
      <XsHero waMessage="Hola, quiero información sobre los productos XS Energy." />

      <XsFlavorGrid />

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="mb-8 font-display text-2xl text-carbon sm:text-3xl">
          Catálogo XS Energy completo
        </h2>
        <ProductExplorer products={products} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
