import type { Metadata } from "next";
import { CategoryHero } from "@/components/product/CategoryHero";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { BellezaHighlights } from "@/components/belleza/BellezaHighlights";
import { getBrands, getProductsByCategory, getSubcategories, getProductById } from "@/data/products";

export const metadata: Metadata = {
  title: "Artistry™ Belleza — Skincare, LongXevity y maquillaje",
  description:
    "Artistry Skin Nutrition™, Artistry LongXevity™, Artistry Studio™, Artistry Labs™ y maquillaje Artistry™. Ciencia de la piel con atención personal en Barakaldo.",
};

const HIGHLIGHT_IDS = [
  { id: "art-suero-desafiante", media: "suero-desafiante" },
  { id: "longxevity-crema-enriquecida", media: "longxevity-crema" },
  { id: "art-suero-vitamina-c", media: "suero-vitamina-c" },
];

export default function BellezaPage() {
  const products = getProductsByCategory("belleza");
  const subcategories = getSubcategories("belleza");
  const brands = getBrands("belleza");
  const highlights = HIGHLIGHT_IDS.map((h) => {
    const product = getProductById(h.id);
    return product
      ? {
          product,
          video: `/videos/belleza/${h.media}.mp4`,
          poster: `/images/belleza/${h.media}-poster.webp`,
        }
      : null;
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <CategoryHero
        eyebrow="Artistry™ · Belleza elevada por la ciencia"
        title="Belleza que no tiene edad."
        description="Artistry Skin Nutrition™ y Artistry LongXevity™ combinan décadas de innovación con la ciencia de plantas de Nutrilite™, además de Artistry Studio™, Artistry Labs™ y el maquillaje Artistry™."
        photo="/images/editorial/belleza-editorial.webp"
        accent="gold"
        waMessage="Hola, quiero información sobre los productos Artistry."
      />

      <section className="bg-carbon-soft py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Iconos Artistry™</h2>
          <BellezaHighlights items={highlights} />
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="mb-8 font-display text-2xl text-carbon sm:text-3xl">
          Catálogo Belleza completo
        </h2>
        <ProductExplorer products={products} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
