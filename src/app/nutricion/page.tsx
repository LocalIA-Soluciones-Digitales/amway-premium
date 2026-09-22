import type { Metadata } from "next";
import { CategoryHero } from "@/components/product/CategoryHero";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { NutricionHighlights } from "@/components/nutricion/NutricionHighlights";
import { getBrands, getProductsByCategory, getSubcategories, getProductById } from "@/data/products";

export const metadata: Metadata = {
  title: "Nutrición Nutrilite™ — Vitaminas, proteínas e inmunidad",
  description:
    "Nutrilite™: vitaminas, proteínas, salud digestiva, inmunológica, huesos, corazón, control de peso y nutrición para hombres, mujeres y niños. Productos originales importados de EE. UU.",
};

const HIGHLIGHT_IDS = [
  { id: "double-x", image: "p027_0_1047x1242.webp", tag: "El multivitamínico insignia" },
  { id: "omega-avanzado", image: "p027_0_1047x1242.webp", tag: "Salud celular y cardiovascular" },
  { id: "begin", image: "p027_0_1047x1242.webp", tag: "Digestión y microbioma" },
];

export default function NutricionPage() {
  const products = getProductsByCategory("nutricion");
  const subcategories = getSubcategories("nutricion");
  const brands = getBrands("nutricion");
  const highlights = HIGHLIGHT_IDS.map((h) => {
    const product = getProductById(h.id);
    return product ? { product, image: h.image, tag: h.tag } : null;
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <CategoryHero
        eyebrow="Nutrilite™ · Ciencia basada en plantas"
        title="La mejor versión de ti, cultivada desde la raíz."
        description="Más de 90 años de innovación agrícola orgánica: vitaminas, proteínas, salud digestiva, inmunológica y nutrición específica para toda la familia."
        photo="/images/editorial/nutricion-botanico.webp"
        accent="forest"
        waMessage="Hola, quiero información sobre los suplementos Nutrilite."
      />

      <section className="bg-carbon-soft py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Nuestros imprescindibles</h2>
          <NutricionHighlights items={highlights} />
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="mb-8 font-display text-2xl text-carbon sm:text-3xl">
          Catálogo Nutrición completo
        </h2>
        <ProductExplorer products={products} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
