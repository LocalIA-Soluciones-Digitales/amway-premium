import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { CategoryHero } from "@/components/product/CategoryHero";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { CategoryHighlights, type HighlightItem } from "@/components/product/CategoryHighlights";
import { getBrands, getProductsByCategory, getSubcategories, getProductById } from "@/data/products";

export const metadata: Metadata = {
  title: "Cuidado personal — Satinique™, g&h™ y glister™",
  description:
    "Champús y acondicionadores Satinique™, cuidado corporal g&h™ e higiene bucal glister™. Productos originales Amway con atención personal en Barakaldo.",
};

// Uno por marca. El vídeo va en /videos/cuidado-personal/<media>.mp4 con su
// póster en /images/cuidado-personal/<media>-poster.webp; mientras no estén,
// la tarjeta muestra el envase flotando.
const HIGHLIGHT_IDS = [
  { id: "sat-anticaida", media: "satinique-anticaida", tag: "Cabello más fuerte" },
  { id: "gh-locion-nourish", media: "gh-locion-nourish", tag: "Piel nutrida" },
  { id: "glister-pasta-dental", media: "glister-pasta", tag: "Sonrisa sana" },
];

const hasPublicFile = (url: string) => existsSync(path.join(process.cwd(), "public", url));

export default function CuidadoPersonalPage() {
  const products = getProductsByCategory("cuidado-personal");
  const subcategories = getSubcategories("cuidado-personal");
  const brands = getBrands("cuidado-personal");
  const highlights: HighlightItem[] = HIGHLIGHT_IDS.flatMap((h) => {
    const product = getProductById(h.id);
    if (!product) return [];
    const video = `/videos/cuidado-personal/${h.media}.mp4`;
    const poster = `/images/cuidado-personal/${h.media}-poster.webp`;
    const media = hasPublicFile(video) && hasPublicFile(poster) ? { video, poster } : {};
    return [{ product, tag: h.tag, ...media }];
  });

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

      <CategoryHighlights
        eyebrow="Selección Cuidado personal"
        title="Nuestros favoritos"
        accent="gold"
        items={highlights}
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
