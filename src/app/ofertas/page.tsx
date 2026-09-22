import type { Metadata } from "next";
import { ProductCard } from "@/components/product/ProductCard";
import { PRODUCTS } from "@/data/products";

export const metadata: Metadata = {
  title: "Novedades y destacados",
  description:
    "Los últimos lanzamientos y productos más destacados del catálogo Amway: novedades Nutrilite, Artistry y XS Energy.",
};

export default function OfertasPage() {
  const news = PRODUCTS.filter((p) => p.badge === "¡Nuevo!");
  const flagship = PRODUCTS.filter((p) => p.flagship);

  return (
    <div className="pt-32">
      <section className="border-b border-carbon/10 bg-linen">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
            Novedades y destacados
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.05] text-carbon sm:text-6xl">
            Lo último de nuestro catálogo.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-stone sm:text-lg">
            Los lanzamientos más recientes y los productos más solicitados, tal y como aparecen en
            el catálogo oficial de Estados Unidos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <h2 className="mb-6 font-display text-2xl text-carbon">Novedades ¡Nuevo!</h2>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {news.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <h2 className="mb-6 font-display text-2xl text-carbon">Productos insignia</h2>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {flagship.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
