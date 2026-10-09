"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  { slug: "cuidado-personal", image: "/images/editorial/cuidado-personal-gh.webp" },
  { slug: "hogar", image: "/images/espring/kitchen-lifestyle.webp" },
];

// XS Energy se filtra dentro de Nutrición, igual que en amway.es.
const groupOf = (c: CategorySlug): CategorySlug => (c === "xs-energy" ? "nutricion" : c);

// Lowercase and strip accents so "vitamina c" matches "Vitamina C" and "nutricion" matches "Nutrición".
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const POR_PAGINA = 24;

const SORT_LABELS = {
  relevancia: "Relevancia",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
} as const;

// Desplegable con la etiqueta y el valor a la vista. El select nativo va
// invisible encima: conserva el menú del sistema (la rueda en iOS) y con sus
// 16 px Safari no hace zoom al tocarlo; el texto visible se recorta con «…».
function FilterSelect({
  label,
  display,
  active,
  value,
  onChange,
  className,
  children,
}: {
  label: string;
  display: string;
  active: boolean;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex h-14 min-w-0 flex-col justify-center rounded-2xl border pl-4 pr-9 transition focus-within:ring-4 focus-within:ring-forest/10",
        active ? "border-forest/50 bg-forest/[0.06]" : "border-carbon/10 bg-cream-soft hover:border-carbon/25",
        className
      )}
    >
      <span
        className={cn(
          "text-[10px] font-medium uppercase leading-none tracking-[0.16em]",
          active ? "text-forest" : "text-stone"
        )}
      >
        {label}
      </span>
      <span className="mt-1.5 truncate text-sm leading-tight text-carbon">{display}</span>
      <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-2xl text-base opacity-0"
      >
        {children}
      </select>
    </div>
  );
}

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
  // Pintar las 300+ tarjetas de golpe dejaba el móvil bloqueado ~2 s
  // (casi 9.000 nodos). Se muestran por tandas; cada filtro vuelve a la
  // primera. Las fichas siguen enlazadas desde el sitemap y las categorías.
  const [limite, setLimite] = useState(POR_PAGINA);
  const catalog = useCatalogState();

  // /catalogo?q=… llega ya filtrado (enlaces del asistente). Se lee al montar
  // y no con useSearchParams para no obligar a la página a renderizarse en
  // el cliente.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q.slice(0, 80));
  }, []);

  useEffect(() => {
    setLimite(POR_PAGINA);
  }, [query, category, subcategory, brand, sort]);

  const visible = useMemo(
    () => products.filter((p) => !catalog.oculto(p.id)),
    [products, catalog]
  );

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<CategorySlug, number>> = {};
    for (const p of visible) {
      for (const c of new Set([p.category, ...(p.alsoIn ?? [])].map(groupOf))) counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [visible]);

  const inCategory = useMemo(
    () =>
      category
        ? visible.filter((p) => [p.category, ...(p.alsoIn ?? [])].some((c) => groupOf(c) === category))
        : visible,
    [visible, category]
  );

  // Marcas del bloque elegido; en las páginas de categoría, todas las recibidas.
  const brandOptions = useMemo(() => {
    if (!category) return brands;
    const present = new Set(inCategory.map((p) => p.brand));
    return brands.filter((b) => present.has(b));
  }, [brands, category, inCategory]);

  // Opciones del desplegable de tipo, solo las que tienen productos en lo que
  // se está viendo. En el catálogo completo sin categoría elegida se agrupan
  // por categoría para que la lista larga se lea de un vistazo.
  const subOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of inCategory) counts.set(p.subcategory, (counts.get(p.subcategory) ?? 0) + 1);
    const items = subcategories.filter((s) => counts.has(s)).map((name) => ({ name, count: counts.get(name)! }));
    if (!showCategories || category) return [{ group: null, items }];
    const groups = new Map<CategorySlug, typeof items>();
    for (const item of items) {
      const g = groupOf(inCategory.find((p) => p.subcategory === item.name)!.category);
      groups.set(g, [...(groups.get(g) ?? []), item]);
    }
    return CATEGORY_TILES.filter(({ slug }) => groups.has(slug)).map(({ slug }) => ({
      group: CATEGORY_META[slug].label,
      items: groups.get(slug)!,
    }));
  }, [inCategory, subcategories, showCategories, category]);
  const subCount = subOptions.reduce((n, g) => n + g.items.length, 0);

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

  return (
    <div>
      {showCategories && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            // En móvil, «Buscar» en el teclado lo cierra para dejar ver los resultados.
            (document.activeElement as HTMLElement | null)?.blur();
          }}
          className="relative min-w-0 flex-1"
        >
          <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-stone" />
          <input
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca producto o necesidad"
            aria-label="Buscar productos"
            className="h-14 w-full rounded-2xl border border-carbon/10 bg-cream-soft pl-12 pr-12 text-base text-carbon placeholder:text-stone/60 transition hover:border-carbon/25 focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-carbon/5 text-stone transition hover:bg-carbon/10 hover:text-carbon"
            >
              <X size={15} />
            </button>
          )}
        </form>

        {(subCount > 1 || brandOptions.length > 1) && (
          <div className={cn("grid gap-3 sm:flex", subCount > 1 && brandOptions.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {subCount > 1 && (
              <FilterSelect
                label={showCategories ? "Tipo" : "Categoría"}
                display={subcategory ?? "Todas"}
                active={subcategory !== null}
                value={subcategory ?? ""}
                onChange={(v) => setSubcategory(v || null)}
                className="sm:w-56"
              >
                <option value="">Todas</option>
                {subOptions.map(({ group, items }) => {
                  const options = items.map((o) => (
                    <option key={o.name} value={o.name}>
                      {o.name} ({o.count})
                    </option>
                  ));
                  return group ? (
                    <optgroup key={group} label={group}>
                      {options}
                    </optgroup>
                  ) : (
                    options
                  );
                })}
              </FilterSelect>
            )}
            {brandOptions.length > 1 && (
              <FilterSelect
                label="Marca"
                display={brand ?? "Todas"}
                active={brand !== null}
                value={brand ?? ""}
                onChange={(v) => setBrand(v || null)}
                className="sm:w-48"
              >
                <option value="">Todas</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </FilterSelect>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-carbon/10 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <p className="truncate text-xs uppercase tracking-wider text-stone" aria-live="polite">
            {filtered.length} producto{filtered.length === 1 ? "" : "s"}
            {category && ` en ${CATEGORY_META[category].label}`}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-forest transition hover:text-carbon"
            >
              <X size={12} />
              Limpiar
            </button>
          )}
        </div>
        <label className="relative flex shrink-0 cursor-pointer items-center gap-1 text-sm text-carbon">
          <span className="text-stone">Ordenar:</span>
          <span className="font-medium">{SORT_LABELS[sort]}</span>
          <ChevronDown size={14} className="text-stone" />
          {/* Select invisible encima: menú nativo y 16 px para que iOS no haga zoom. */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Ordenar por"
            className="absolute inset-0 cursor-pointer appearance-none text-base opacity-0"
          >
            <option value="relevancia">Relevancia</option>
            <option value="precio-asc">Precio: de menor a mayor</option>
            <option value="precio-desc">Precio: de mayor a menor</option>
          </select>
        </label>
      </div>

      <div
        className={cn(
          "mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4",
          filtered.length === 0 && "hidden"
        )}
      >
        {filtered.slice(0, limite).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>

      {filtered.length > limite && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-wider text-stone">
            Viendo {limite} de {filtered.length}
          </p>
          <button
            type="button"
            onClick={() => setLimite((n) => n + POR_PAGINA)}
            className="rounded-full border border-carbon/15 px-6 py-3 text-sm font-medium text-carbon transition hover:border-carbon/40"
          >
            Ver {Math.min(POR_PAGINA, filtered.length - limite)} productos más
          </button>
        </div>
      )}

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
