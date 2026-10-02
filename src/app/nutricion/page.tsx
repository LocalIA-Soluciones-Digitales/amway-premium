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

const XS_LINK = { href: "/xs-energy", label: "Descubre XS™ →" };

const HIGHLIGHT_IDS = [
  { id: "double-x", media: "double-x", tag: "El multivitamínico insignia" },
  { id: "xs-power-drink-naranja", media: "xs-energy", tag: "Energía sin azúcar", link: XS_LINK },
  { id: "creatine-plus-xs", media: "creatina", tag: "Fuerza y recuperación", link: XS_LINK },
];

export default function NutricionPage() {
  const products = getProductsByCategory("nutricion");
  const subcategories = getSubcategories("nutricion");
  const brands = getBrands("nutricion");
  const highlights = HIGHLIGHT_IDS.map((h) => {
    const product = getProductById(h.id);
    return product
      ? {
          product,
          video: `/videos/nutricion/${h.media}.mp4`,
          poster: `/images/nutricion/${h.media}-poster.webp`,
          tag: h.tag,
          link: h.link,
        }
      : null;
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
