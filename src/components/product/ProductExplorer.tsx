"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Product } from "@/data/types";
import { priceFrom } from "@/data/types";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";

export function ProductExplorer({
  products,
  subcategories,
  brands,
}: {
  products: Product[];
  subcategories: string[];
  brands: string[];
}) {
  const [query, setQuery] = useState("");
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [sort, setSort] = useState<"relevancia" | "precio-asc" | "precio-desc">("relevancia");

  const filtered = useMemo(() => {
    let list = products;
    if (subcategory) list = list.filter((p) => p.subcategory === subcategory);
    if (brand) list = list.filter((p) => p.brand === brand);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    if (sort === "precio-asc") {
      list = [...list].sort((a, b) => (priceFrom(a) ?? Infinity) - (priceFrom(b) ?? Infinity));
    } else if (sort === "precio-desc") {
      list = [...list].sort((a, b) => (priceFrom(b) ?? -Infinity) - (priceFrom(a) ?? -Infinity));
    }
    return list;
  }, [products, subcategory, brand, query, sort]);

  const selectClass =
    "appearance-none rounded-none border-0 border-b border-carbon/15 bg-transparent py-2.5 pr-6 text-sm text-carbon focus:border-forest focus:outline-none";

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-carbon/10 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto, beneficio o marca…"
            className="w-full border-b border-carbon/15 bg-transparent py-2.5 pl-6 pr-4 text-sm text-carbon placeholder:text-stone/70 focus:border-forest focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <select
            value={subcategory ?? ""}
            onChange={(e) => setSubcategory(e.target.value || null)}
            className={selectClass}
          >
            <option value="">Todas las categorías</option>
            {subcategories.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={brand ?? ""}
            onChange={(e) => setBrand(e.target.value || null)}
            className={selectClass}
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className={selectClass}
          >
            <option value="relevancia">Relevancia</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      <p className="mt-5 text-xs uppercase tracking-wider text-stone">
        {filtered.length} producto{filtered.length === 1 ? "" : "s"} encontrado
        {filtered.length === 1 ? "" : "s"}
      </p>

      <div
        className={cn(
          "mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4",
          filtered.length === 0 && "hidden"
        )}
      >
        {filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 border border-carbon/10 py-16 text-center text-stone">
          No encontramos productos con esos filtros. Prueba con otra búsqueda.
        </div>
      )}
    </div>
  );
}
