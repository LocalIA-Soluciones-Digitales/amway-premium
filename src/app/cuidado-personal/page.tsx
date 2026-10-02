import type { Metadata } from "next";
import { CategoryHero } from "@/components/product/CategoryHero";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { getBrands, getProductsByCategory, getSubcategories } from "@/data/products";

export const metadata: Metadata = {
  title: "Cuidado personal — Satinique™, g&h™ y glister™",
  description:
    "Champús y acondicionadores Satinique™, cuidado corporal g&h™ e higiene bucal glister™. Productos originales Amway con atención personal en Barakaldo.",
};

export default function CuidadoPersonalPage() {
  const products = getProductsByCategory("cuidado-personal");
  const subcategories = getSubcategories("cuidado-personal");
  const brands = getBrands("cuidado-personal");

  return (
    <>
      <CategoryHero
        eyebrow="Satinique™ · g&h™ · glister™"
        title="Cuidado diario, de pies a cabeza."
        description="Cabello, cuerpo e higiene bucal con fórmulas de origen vegetal: Satinique™ para el cabello, g&h™ para el cuerpo y glister™ para una sonrisa sana."
        photo="/images/editorial/cuidado-personal-hero.webp"
        accent="gold"
        waMessage="Hola, quiero información sobre los productos de cuidado personal."
      />

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="mb-8 font-display text-2xl text-carbon sm:text-3xl">
          Catálogo Cuidado personal completo
        </h2>
        <ProductExplorer products={products} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
