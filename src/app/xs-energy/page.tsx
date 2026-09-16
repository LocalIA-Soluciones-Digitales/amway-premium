import type { Metadata } from "next";
import { CategoryHero } from "@/components/product/CategoryHero";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { XsHighlights } from "@/components/xs-energy/XsHighlights";
import { getBrands, getProductsByCategory, getSubcategories, getProductById } from "@/data/products";

export const metadata: Metadata = {
  title: "XS Energy™ — Energía, fuerza y recuperación",
  description:
    "Bebidas de energía XS™, pre-entrenamiento, creatina, proteínas y recuperación deportiva. Nutrición deportiva Amway importada de Estados Unidos.",
};

const CAN_IDS = [
  { id: "xs-elite-focus", image: "p089_6_300x404.webp" },
  { id: "xs-energy-drink", image: "p089_6_300x404.webp" },
];

export default function XsEnergyPage() {
  const products = getProductsByCategory("xs-energy");
  const subcategories = getSubcategories("xs-energy");
  const brands = getBrands("xs-energy");
  const cans = CAN_IDS.map((c) => {
    const product = getProductById(c.id);
    return product ? { product, image: c.image } : null;
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <CategoryHero
        eyebrow="XS™ · Nutrición deportiva"
        title="Energía activada. Rendimiento sin límites."
        description="Bebidas energéticas de gran sabor, pre-entrenamiento, creatina, proteínas y recuperación para cada etapa de tu entrenamiento."
        image="p086_0_353x1091.webp"
        accent="tech"
        waMessage="Hola, quiero información sobre los productos XS Energy."
      />

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="font-display text-2xl text-paper sm:text-3xl">Siente la energía</h2>
        <XsHighlights items={cans} />
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-6 pb-24 sm:px-8">
        <h2 className="mb-8 font-display text-2xl text-paper sm:text-3xl">
          Catálogo XS Energy completo
        </h2>
        <ProductExplorer products={products} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
