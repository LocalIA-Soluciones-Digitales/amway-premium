import type { Metadata } from "next";
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
      <section className="mx-auto max-w-7xl px-6 pb-10 sm:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-wellness">
          Catálogo Amway Barakaldo
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl text-paper sm:text-5xl">
          Más de 190 productos originales de Estados Unidos.
        </h1>
        <p className="mt-4 max-w-xl text-mist">
          Usa el buscador y los filtros para encontrar exactamente lo que necesitas, en
          Nutrición, XS Energy, Belleza y Hogar.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8">
        <ProductExplorer products={PRODUCTS} subcategories={ALL_SUBCATEGORIES} brands={brands} />
      </section>
    </div>
  );
}
