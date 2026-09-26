import type { Metadata } from "next";
import { CategoryHero } from "@/components/product/CategoryHero";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { HogarHighlights } from "@/components/hogar/HogarHighlights";
import { getBrands, getProductsByCategory, getSubcategories, getProductById } from "@/data/products";

export const metadata: Metadata = {
  title: "Hogar — eSpring™, Atmosphere™ e iCook™",
  description:
    "Purificadores de agua eSpring™, tratamiento de aire Atmosphere™, utensilios de cocina iCook™ y limpieza Amway Home™. Tecnología para un hogar más limpio.",
};

export default function HogarPage() {
  const products = getProductsByCategory("hogar");
  const subcategories = getSubcategories("hogar");
  const brands = getBrands("hogar");

  const espring = getProductById("espring-mesón")!;
  const atmosphere = getProductById("atmosphere-sky")!;
  const icook = getProductById("icook-coleccion-19")!;

  const highlights = [
    {
      product: espring,
      scene: "espring" as const,
      video: "/videos/espring/purifier-loop.mp4",
      poster: "/images/espring/purifier-loop-poster.webp",
      tag: "Agua purificada al instante",
    },
    {
      product: atmosphere,
      scene: "atmosphere" as const,
      video: "/videos/hogar/atmosphere-sky.mp4",
      poster: "/images/hogar/atmosphere-sky-poster.webp",
      videoPosition: "center 40%",
      tag: "Aire visiblemente más limpio",
    },
    {
      product: icook,
      scene: "icook" as const,
      video: "/videos/hogar/icook.mp4",
      poster: "/images/hogar/icook-poster.webp",
      videoPosition: "center 60%",
      tag: "Cocina como un profesional",
    },
  ];

  return (
    <>
      <CategoryHero
        eyebrow="eSpring™ · Atmosphere™ · iCook™"
        title="Hábitos para un hogar más limpio."
        description="Desde agua purificada y aire más limpio hasta cocina inteligente y limpieza más segura: tecnología Amway para tu día a día."
        photo="/images/editorial/hogar-cocina.webp"
        accent="tech"
        waMessage="Hola, quiero información sobre los productos para el hogar."
      />

      <section className="bg-carbon-soft py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <h2 className="font-display text-2xl text-cream sm:text-3xl">Tecnología para tu hogar</h2>
          <HogarHighlights items={highlights} />
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <h2 className="mb-8 font-display text-2xl text-carbon sm:text-3xl">
          Catálogo Hogar completo
        </h2>
        <ProductExplorer products={products} subcategories={subcategories} brands={brands} />
      </section>
    </>
  );
}
