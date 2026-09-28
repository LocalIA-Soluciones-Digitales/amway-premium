import type { Metadata } from "next";
import Image from "next/image";
import { ProductExplorer } from "@/components/product/ProductExplorer";
import { PRODUCTS, getBrands } from "@/data/products";

export const metadata: Metadata = {
  title: "Catálogo completo",
  description:
    "Explora todo el catálogo Amway: Nutrilite, XS Energy, Artistry, Satinique, g&h, Glister, eSpring, Atmosphere e iCook. Busca por categoría, marca o precio.",
};

const ALL_SUBCATEGORIES = Array.from(new Set(PRODUCTS.map((p) => p.subcategory)));

export default function CatalogoPage() {
  const brands = getBrands();

  return (
    <div className="pt-32">
      <section className="relative isolate overflow-hidden border-b border-carbon/10 bg-linen">
        <Image
          src="/images/editorial/hogar-cocina.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-right"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-linen via-linen/85 to-linen/10 sm:via-linen/70"
        />
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-forest">
            Catálogo Amway Barakaldo
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.05] text-carbon sm:text-6xl">
            Más de {Math.floor(PRODUCTS.length / 10) * 10} productos originales de Estados Unidos.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-stone sm:text-lg">
            Elige una categoría o busca directamente lo que necesitas en Nutrición, Belleza
            y Hogar.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <ProductExplorer
          products={PRODUCTS}
          subcategories={ALL_SUBCATEGORIES}
          brands={brands}
          showCategories
        />
      </section>
    </div>
  );
}
