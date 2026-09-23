"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import type { Product } from "@/data/types";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { SolicitudModal } from "@/components/catalog/SolicitudModal";

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
  const [solicitudOpen, setSolicitudOpen] = useState(false);
  const catalog = useCatalogState();

  const filtered = useMemo(() => {
    // Cheapest selling price, including any price set in the admin panel.
    const minPrice = (p: Product) => {
      const prices = p.variants.map((_, i) => catalog.precio(p, i)).filter((x): x is number => x != null);
      return prices.length ? Math.min(...prices) : null;
    };
    let list = products.filter((p) => !catalog.oculto(p.id));
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
      list = [...list].sort((a, b) => (minPrice(a) ?? Infinity) - (minPrice(b) ?? Infinity));
    } else if (sort === "precio-desc") {
      list = [...list].sort((a, b) => (minPrice(b) ?? -Infinity) - (minPrice(a) ?? -Infinity));
    }
    return list;
  }, [products, subcategory, brand, query, sort, catalog]);

  const selectClass =
    "w-full min-w-0 cursor-pointer appearance-none truncate rounded-none border-0 border-b border-carbon/15 bg-transparent py-2.5 pr-6 text-base text-carbon focus:border-forest focus:outline-none sm:text-sm";
  const chevron = (
    <ChevronDown size={14} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-stone" />
  );

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-carbon/10 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto, beneficio o marca…"
            className="w-full border-b border-carbon/15 bg-transparent py-2.5 pl-6 pr-4 text-base text-carbon placeholder:text-stone/70 focus:border-forest focus:outline-none sm:text-sm"
          />
        </div>

        {/* Two columns on phones (sort spans both), a single row from sm up. */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:flex sm:items-center sm:gap-6">
          <div className="relative min-w-0">
            <select
              value={subcategory ?? ""}
              onChange={(e) => setSubcategory(e.target.value || null)}
              aria-label="Categoría"
              className={selectClass}
            >
              <option value="">Todas las categorías</option>
              {subcategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {chevron}
          </div>

          <div className="relative min-w-0">
            <select
              value={brand ?? ""}
              onChange={(e) => setBrand(e.target.value || null)}
              aria-label="Marca"
              className={selectClass}
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {chevron}
          </div>

          <div className="relative col-span-2 min-w-0">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              aria-label="Ordenar por"
              className={selectClass}
            >
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
            </select>
            {chevron}
          </div>
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

      <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-carbon/10 pt-8 sm:flex-row sm:items-center">
        <div>
          <p className="font-display text-xl text-carbon">¿No encuentras un producto?</p>
          <p className="mt-1 text-sm text-stone">Pídenoslo y lo buscamos en el catálogo oficial de Amway.</p>
        </div>
        <button
          type="button"
          onClick={() => setSolicitudOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-carbon/15 px-6 py-3 text-sm font-medium text-carbon transition hover:border-carbon/40 sm:w-auto"
        >
          Solicitar producto
          <ArrowRight size={15} />
        </button>
      </div>
      <SolicitudModal open={solicitudOpen} onClose={() => setSolicitudOpen(false)} tipo="otro" />
    </div>
  );
}
