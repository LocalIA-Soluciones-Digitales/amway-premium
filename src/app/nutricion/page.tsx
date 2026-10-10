import type { Metadata } from "next";
import { CategoryHero } from "@/components/product/CategoryHero";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { paraExplorador } from "@/lib/explorador";
import { CategoryHighlights } from "@/components/product/CategoryHighlights";
import { getBrands, getProductsByCategory, getSubcategories, getProductById } from "@/data/products";
import { conRuta } from "@/lib/seo";

export const metadata: Metadata = conRuta("/nutricion", {
  title: "Nutrición Nutrilite™ — Vitaminas, minerales y proteínas",
  description:
    "Nutrilite™: vitaminas, minerales, proteínas, sustitutivos de comida y complementos para hombres, mujeres y niños. Productos originales Amway.",
});

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

      <CategoryHighlights eyebrow="Selección Nutrilite™" title="Nuestros imprescindibles" accent="forest" items={highlights} />

      <section id="catalogo" className="mx-auto max-w-7xl scroll-mt-28 px-6 pb-20 pt-10 sm:px-8 sm:pt-16">
        <h2 className="mb-6 font-display text-2xl text-carbon sm:mb-8 sm:text-3xl">
          Catálogo Nutrición completo
        </h2>
        <ProductExplorer products={paraExplorador(products)} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
