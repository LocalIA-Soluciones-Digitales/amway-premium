"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronDown, Search, X } from "lucide-react";
import type { CategorySlug, Product } from "@/data/types";
import { CATEGORY_META } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { SolicitudModal } from "@/components/catalog/SolicitudModal";

const CATEGORY_TILES: { slug: CategorySlug; image: string }[] = [
  { slug: "nutricion", image: "/images/editorial/nutricion-botanico.webp" },
  { slug: "belleza", image: "/images/editorial/belleza-editorial.webp" },
  { slug: "cuidado-personal", image: "/images/editorial/cuidado-personal.webp" },
  { slug: "hogar", image: "/images/editorial/hogar-familia.webp" },
];

// XS Energy se filtra dentro de Nutrición, igual que en amway.es.
const groupOf = (c: CategorySlug): CategorySlug => (c === "xs-energy" ? "nutricion" : c);

// Lowercase and strip accents so "vitamina c" matches "Vitamina C" and "nutricion" matches "Nutrición".
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function ProductExplorer({
  products,
  subcategories,
  brands,
  showCategories = false,
}: {
  products: Product[];
  subcategories: string[];
  brands: string[];
  showCategories?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategorySlug | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [sort, setSort] = useState<"relevancia" | "precio-asc" | "precio-desc">("relevancia");
  const [solicitudOpen, setSolicitudOpen] = useState(false);
  const catalog = useCatalogState();

  // /catalogo?q=… llega ya filtrado (enlaces del asistente). Se lee al montar
  // y no con useSearchParams para no obligar a la página a renderizarse en
  // el cliente.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q.slice(0, 80));
  }, []);

  const visible = useMemo(
    () => products.filter((p) => !catalog.oculto(p.id)),
    [products, catalog]
  );

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<CategorySlug, number>> = {};
    for (const p of visible) counts[groupOf(p.category)] = (counts[groupOf(p.category)] ?? 0) + 1;
    return counts;
  }, [visible]);

  const inCategory = useMemo(
    () => (category ? visible.filter((p) => groupOf(p.category) === category) : visible),
    [visible, category]
  );

  // Marcas del bloque elegido; en las páginas de categoría, todas las recibidas.
  const brandOptions = useMemo(() => {
    if (!category) return brands;
    const present = new Set(inCategory.map((p) => p.brand));
    return brands.filter((b) => present.has(b));
  }, [brands, category, inCategory]);

  // Subcategory chips (solo en las páginas de categoría), each with its product count.
  const chips = useMemo(() => {
    if (showCategories) return [];
    return subcategories
      .map((s) => ({ name: s, count: inCategory.filter((p) => p.subcategory === s).length }))
      .filter((c) => c.count > 0);
  }, [inCategory, showCategories, subcategories]);

  const filtered = useMemo(() => {
    // Cheapest selling price, including any price set in the admin panel.
    const minPrice = (p: Product) => {
      const prices = p.variants.map((_, i) => catalog.precio(p, i)).filter((x): x is number => x != null);
      return prices.length ? Math.min(...prices) : null;
    };
    let list = inCategory;
    if (subcategory) list = list.filter((p) => p.subcategory === subcategory);
    if (brand) list = list.filter((p) => p.brand === brand);
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (words.length) {
      list = list.filter((p) => {
        const haystack = normalize(
          [p.name, p.description, p.brand, p.subcategory, CATEGORY_META[p.category].label].join(" ")
        );
        return words.every((w) => haystack.includes(w));
      });
    }
    if (sort === "precio-asc") {
      list = [...list].sort((a, b) => (minPrice(a) ?? Infinity) - (minPrice(b) ?? Infinity));
    } else if (sort === "precio-desc") {
      list = [...list].sort((a, b) => (minPrice(b) ?? -Infinity) - (minPrice(a) ?? -Infinity));
    }
    return list;
  }, [inCategory, subcategory, brand, query, sort, catalog]);

  const hasFilters = Boolean(query.trim() || category || subcategory || brand || sort !== "relevancia");
  const clearAll = () => {
    setQuery("");
    setCategory(null);
    setSubcategory(null);
    setBrand(null);
    setSort("relevancia");
  };
  const pickCategory = (slug: CategorySlug) => {
    setCategory((current) => (current === slug ? null : slug));
    setSubcategory(null);
    setBrand(null);
  };

  const selectClass =
    "h-12 w-full min-w-0 cursor-pointer appearance-none truncate rounded-full border border-carbon/10 bg-cream-soft pl-5 pr-10 text-base text-carbon transition hover:border-carbon/25 focus:border-forest focus:outline-none sm:text-sm";
  const chevron = (
    <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone" />
  );
  const chipClass = (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
      active
        ? "border-carbon bg-carbon text-cream"
        : "border-carbon/10 bg-cream-soft text-carbon hover:border-carbon/30"
    );

  return (
    <div>
      {showCategories && (
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {CATEGORY_TILES.map(({ slug, image }) => {
            const active = category === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => pickCategory(slug)}
                aria-pressed={active}
                className={cn(
                  "group relative flex h-28 items-end overflow-hidden rounded-2xl p-4 text-left ring-offset-2 ring-offset-cream transition sm:h-36 sm:p-5",
                  active ? "ring-2 ring-forest" : "ring-0"
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t transition",
                    active ? "from-forest-dim/90 via-forest-dim/50 to-forest-dim/20" : "from-carbon/80 via-carbon/25 to-transparent"
                  )}
                />
                <div className="relative">
                  <p className="font-display text-lg leading-tight text-cream sm:text-2xl">
                    {CATEGORY_META[slug].label}
                  </p>
                  <p className="mt-0.5 text-xs text-cream/75">
                    {categoryCounts[slug] ?? 0} productos
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_auto] sm:gap-4">
        <div className="relative col-span-2 sm:col-span-1">
          <Search size={17} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-stone" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca un producto, necesidad o marca…"
            aria-label="Buscar productos"
            className="h-12 w-full rounded-full border border-carbon/10 bg-cream-soft pl-12 pr-11 text-base text-carbon placeholder:text-stone/70 transition hover:border-carbon/25 focus:border-forest focus:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone transition hover:bg-carbon/5 hover:text-carbon"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="relative min-w-0 sm:w-48">
          <select
            value={brand ?? ""}
            onChange={(e) => setBrand(e.target.value || null)}
            aria-label="Marca"
            className={selectClass}
          >
            <option value="">Todas las marcas</option>
            {brandOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {chevron}
        </div>

        <div className="relative min-w-0 sm:w-56">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Ordenar por"
            className={selectClass}
          >
            <option value="relevancia">Ordenar: relevancia</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
          </select>
          {chevron}
        </div>
      </div>

      {chips.length > 1 && (
        <div className="-mx-6 mt-5 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button type="button" onClick={() => setSubcategory(null)} className={chipClass(subcategory === null)}>
            Todo
          </button>
          {chips.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setSubcategory(subcategory === c.name ? null : c.name)}
              className={chipClass(subcategory === c.name)}
            >
              {c.name}
              <span className={cn("text-xs", subcategory === c.name ? "text-cream/60" : "text-stone")}>
                {c.count}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-carbon/10 pt-5">
        <p className="text-xs uppercase tracking-wider text-stone">
          {filtered.length} producto{filtered.length === 1 ? "" : "s"}
          {category && ` en ${CATEGORY_META[category].label}`}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-forest transition hover:text-carbon"
          >
            <X size={13} />
            Limpiar filtros
          </button>
        )}
      </div>

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
        <div className="mt-8 rounded-2xl border border-carbon/10 px-6 py-16 text-center">
          <p className="font-display text-xl text-carbon">No hay productos con esos filtros.</p>
          <p className="mt-2 text-sm text-stone">Prueba con otra palabra o quita algún filtro.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-6 rounded-full border border-carbon/15 px-5 py-2.5 text-sm font-medium text-carbon transition hover:border-carbon/40"
            >
              Limpiar filtros
            </button>
          )}
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
