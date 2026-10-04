"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import {
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  EyeOff,
  LayoutGrid,
  List,
  Loader2,
  PackageSearch,
  Pencil,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { productImageSrc, variantPriceEur, type Product } from "@/data/types";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/Dialog";
import { CATEGORIA_LABEL, categoriaTienda } from "./report-data";
import { Badge, Empty, Loading, btnGhost, btnPrimary, eur, inputClass, revalidarTienda, type ProductoAjusteRow } from "./shared";

type Filtro = "todos" | "en-web" | "agotados" | "ocultos" | "sin-coste";

function emptyRow(productId: string): ProductoAjusteRow {
  return { product_id: productId, precios_eur: {}, costes_eur: {}, agotado: false, oculto: false };
}

// Importe con coma decimal, como lo escribe y lee la vendedora.
function fmtNum(n: number | undefined | null): string {
  return n == null ? "" : n.toFixed(2).replace(".", ",");
}

function parseEur(v: string): number | null {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n * 100) / 100;
}

function precioFinal(p: Product, row: ProductoAjusteRow, i: number) {
  return row.precios_eur[String(i)] ?? variantPriceEur(p, i);
}

function margen(p: Product, row: ProductoAjusteRow, i: number): number | null {
  const venta = precioFinal(p, row, i);
  const coste = row.costes_eur[String(i)];
  return venta != null && coste != null && venta > 0 ? ((venta - coste) / venta) * 100 : null;
}

type Vista = "lista" | "tarjetas";
type Orden = "nombre" | "precio" | "margen";
const VISTA_KEY = "amway_premium_admin_vista_productos";
const PLEGADOS_KEY = "amway_premium_admin_gamas_plegadas";

function minPrecio(p: Product, r: ProductoAjusteRow) {
  const ps = p.variants.map((_, i) => precioFinal(p, r, i)).filter((x): x is number => x != null);
  return ps.length ? Math.min(...ps) : null;
}

function minMargen(p: Product, r: ProductoAjusteRow) {
  const ms = p.variants.map((_, i) => margen(p, r, i)).filter((x): x is number => x != null);
  return ms.length ? Math.min(...ms) : null;
}

const sinCoste = (p: Product, r: ProductoAjusteRow) => p.variants.some((_, i) => r.costes_eur[String(i)] == null);

// Color de cada gama (solo un punto de referencia visual).
const GAMA_COLOR: Record<string, string> = {
  Nutrilite: "#1f4438",
  XS: "#e8384f",
  Artistry: "#b8905a",
  Satinique: "#9b6a8c",
  "g&h": "#5f8aa0",
  Glister: "#3d9a8b",
  eSpring: "#2fb2d9",
  Atmosphere: "#7d93a6",
  iCook: "#8a6a48",
  "Amway Home": "#3f6b7d",
  Amway: "#8a8271",
};

// Gamas ordenadas por nº de productos (las grandes primero).
const GAMAS: { nombre: string; total: number }[] = (() => {
  const m = new Map<string, number>();
  for (const p of PRODUCTS) m.set(p.brand, (m.get(p.brand) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")).map(([nombre, total]) => ({ nombre, total }));
})();

const CATEGORIAS = Array.from(new Set(PRODUCTS.map((p) => categoriaTienda(p.category))));

type AccionBloque = "agotar" | "reponer" | "ocultar" | "mostrar";

function leerPlegados(): Set<string> {
  try {
    const v = JSON.parse(localStorage.getItem(PLEGADOS_KEY) ?? "[]");
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function ProductosPanel({ session }: { session: Session }) {
  const [rows, setRows] = useState<Map<string, ProductoAjusteRow> | null>(null);
  const [query, setQuery] = useState("");
  const [gama, setGama] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [vista, setVista] = useState<Vista>("lista");
  const [orden, setOrden] = useState<Orden>("nombre");
  const [agrupar, setAgrupar] = useState(true);
  const [plegados, setPlegados] = useState<Set<string>>(new Set());
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VISTA_KEY);
      if (v === "lista" || v === "tarjetas") setVista(v);
    } catch {
      // storage blocked: keep default
    }
    setPlegados(leerPlegados());
  }, []);

  function cambiarVista(v: Vista) {
    setVista(v);
    try {
      localStorage.setItem(VISTA_KEY, v);
    } catch {
      // storage blocked
    }
  }

  function guardarPlegados(next: Set<string>) {
    setPlegados(next);
    try {
      localStorage.setItem(PLEGADOS_KEY, JSON.stringify([...next]));
    } catch {
      // storage blocked
    }
  }

  const cargar = useCallback(async () => {
    const { data, error: e } = await amwayDb().from("amway_productos").select("*");
    if (e) setError("No se pudieron cargar los ajustes de productos.");
    setRows(new Map(((data as ProductoAjusteRow[] | null) ?? []).map((r) => [r.product_id, r])));
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const rowOf = useCallback((id: string) => rows?.get(id) ?? emptyRow(id), [rows]);

  // Guarda una o varias filas de golpe (optimista, con vuelta atrás si falla).
  const guardarVarios = useCallback(
    async (nuevas: ProductoAjusteRow[]) => {
      if (nuevas.length === 0) return true;
      const antes = new Map(rows ?? []);
      setRows((m) => {
        const next = new Map(m);
        for (const r of nuevas) next.set(r.product_id, r);
        return next;
      });
      const { data, error: e } = await amwayDb()
        .from("amway_productos")
        .upsert(
          nuevas.map((r) => ({
            product_id: r.product_id,
            precios_eur: r.precios_eur,
            costes_eur: r.costes_eur,
            agotado: r.agotado,
            oculto: r.oculto,
            ...(r.dias_duracion !== undefined && { dias_duracion: r.dias_duracion }),
          }))
        )
        .select();
      if (e || !data) {
        setRows(antes);
        setError("No se pudo guardar. Revisa la conexión e inténtalo otra vez.");
        return false;
      }
      setError(null);
      setRows((m) => {
        const next = new Map(m);
        for (const r of data as ProductoAjusteRow[]) next.set(r.product_id, r);
        return next;
      });
      void revalidarTienda(session.access_token);
      return true;
    },
    [rows, session.access_token]
  );

  const guardar = useCallback((row: ProductoAjusteRow) => guardarVarios([row]), [guardarVarios]);

  // Las cifras salen solo del catálogo actual: la base de datos conserva
  // ajustes de productos antiguos que ya no existen y no deben contar.
  const resumen = useMemo(() => {
    const margenes = PRODUCTS.map((p) => minMargen(p, rowOf(p.id))).filter((x): x is number => x != null);
    const cuenta = (f: (p: Product, r: ProductoAjusteRow) => boolean) => PRODUCTS.filter((p) => f(p, rowOf(p.id))).length;
    return {
      total: PRODUCTS.length,
      enWeb: cuenta((_, r) => !r.oculto && !r.agotado),
      agotados: cuenta((_, r) => r.agotado),
      ocultos: cuenta((_, r) => r.oculto),
      sinCoste: cuenta(sinCoste),
      margenMedio: margenes.length ? margenes.reduce((a, b) => a + b, 0) / margenes.length : null,
    };
  }, [rowOf]);

  const pasaFiltro = useCallback(
    (p: Product) => {
      const r = rowOf(p.id);
      if (filtro === "en-web") return !r.oculto && !r.agotado;
      if (filtro === "agotados") return r.agotado;
      if (filtro === "ocultos") return r.oculto;
      if (filtro === "sin-coste") return sinCoste(p, r);
      return true;
    },
    [rowOf, filtro]
  );

  const coincide = useCallback(
    (p: Product) => {
      const q = query.trim().toLowerCase();
      if (categoria && categoriaTienda(p.category) !== categoria) return false;
      return !q || `${p.name} ${p.brand} ${p.subcategory} ${p.variants.map((v) => v.sku ?? "").join(" ")}`.toLowerCase().includes(q);
    },
    [query, categoria]
  );

  // Productos por gama con los filtros de búsqueda/estado (sin el de gama),
  // para que los chips digan cuántos hay en cada una.
  const porGama = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of PRODUCTS) if (coincide(p) && pasaFiltro(p)) m.set(p.brand, (m.get(p.brand) ?? 0) + 1);
    return m;
  }, [coincide, pasaFiltro]);

  const lista = useMemo(() => {
    if (!rows) return [];
    const l = PRODUCTS.filter((p) => (!gama || p.brand === gama) && coincide(p) && pasaFiltro(p));
    const num = (x: number | null, vacio: number) => (x == null ? vacio : x);
    return [...l].sort((a, b) => {
      const ra = rowOf(a.id);
      const rb = rowOf(b.id);
      if (orden === "precio") return num(minPrecio(a, ra), Infinity) - num(minPrecio(b, rb), Infinity);
      if (orden === "margen") return num(minMargen(a, ra), Infinity) - num(minMargen(b, rb), Infinity);
      return a.name.localeCompare(b.name, "es");
    });
  }, [rows, rowOf, gama, coincide, pasaFiltro, orden]);

  const grupos = useMemo(() => {
    if (!agrupar) return [{ nombre: "", productos: lista }];
    return GAMAS.map((g) => ({ nombre: g.nombre, productos: lista.filter((p) => p.brand === g.nombre) })).filter((g) => g.productos.length);
  }, [agrupar, lista]);

  const seleccionados = lista.filter((p) => seleccion.has(p.id));
  const hayBusqueda = !!(query || gama || categoria || filtro !== "todos");

  function toggleSel(ids: string[], on: boolean) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function togglePlegado(nombre: string) {
    const next = new Set(plegados);
    if (next.has(nombre)) next.delete(nombre);
    else next.add(nombre);
    guardarPlegados(next);
  }

  async function aplicar(nuevas: ProductoAjusteRow[], saltados = 0) {
    const ok = await guardarVarios(nuevas);
    if (ok) {
      const n = nuevas.length;
      setAviso(`${n} producto${n === 1 ? "" : "s"} actualizado${n === 1 ? "" : "s"}${saltados ? ` · ${saltados} sin coste, sin cambios` : ""}.`);
      setSeleccion(new Set());
    }
  }

  function enBloque(accion: AccionBloque) {
    const patch: Partial<ProductoAjusteRow> =
      accion === "agotar" ? { agotado: true } : accion === "reponer" ? { agotado: false } : accion === "ocultar" ? { oculto: true } : { oculto: false };
    void aplicar(seleccionados.map((p) => ({ ...rowOf(p.id), ...patch })));
  }

  function ajustarPrecio(pct: number) {
    void aplicar(
      seleccionados.map((p) => {
        const r = rowOf(p.id);
        const precios = { ...r.precios_eur };
        p.variants.forEach((_, i) => {
          const actual = precioFinal(p, r, i);
          if (actual != null) precios[String(i)] = Math.round(actual * (1 + pct / 100) * 100) / 100;
        });
        return { ...r, precios_eur: precios };
      })
    );
  }

  function fijarMargen(m: number) {
    const nuevas: ProductoAjusteRow[] = [];
    let saltados = 0;
    for (const p of seleccionados) {
      const r = rowOf(p.id);
      const precios = { ...r.precios_eur };
      let cambiado = false;
      p.variants.forEach((_, i) => {
        const coste = r.costes_eur[String(i)];
        if (coste == null) return;
        precios[String(i)] = Math.round((coste / (1 - m / 100)) * 100) / 100;
        cambiado = true;
      });
      if (cambiado) nuevas.push({ ...r, precios_eur: precios });
      else saltados++;
    }
    void aplicar(nuevas, saltados);
  }

  const kpis: { f: Filtro; label: string; value: ReactNode; tone?: string }[] = [
    { f: "en-web", label: "A la venta en la web", value: resumen.enWeb },
    { f: "agotados", label: "Agotados", value: resumen.agotados, tone: resumen.agotados ? "text-red-600" : undefined },
    { f: "ocultos", label: "Ocultos en la web", value: resumen.ocultos },
    { f: "sin-coste", label: "Sin coste", value: resumen.sinCoste, tone: resumen.sinCoste ? "text-amber-700" : undefined },
  ];
  const pctWeb = resumen.total ? (resumen.enWeb / resumen.total) * 100 : 0;
  const todoPlegado = grupos.length > 0 && grupos.every((g) => plegados.has(g.nombre));

  return (
    <div className="pb-24">
      {/* Cabecera */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-[1.75rem] leading-tight text-carbon">Productos</h2>
          <p className="mt-1 text-sm text-stone">
            <span className="font-medium text-carbon">{resumen.total} productos</span> en {GAMAS.length} gamas. Precio y coste se
            editan en la propia lista; la tienda se actualiza sola.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-carbon/[0.07] bg-white p-1">
          {(
            [
              ["lista", "Lista", List],
              ["tarjetas", "Tarjetas", LayoutGrid],
            ] as const
          ).map(([v, l, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => cambiarVista(v)}
              aria-pressed={vista === v}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                vista === v ? "bg-carbon text-cream" : "text-stone hover:text-carbon"
              )}
            >
              <Icon size={13} /> {l}
            </button>
          ))}
        </div>
      </div>

      {/* Cifras: cada una filtra la lista */}
      {rows && (
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k, i) => {
            const activo = filtro === k.f;
            return (
              <button
                key={k.f}
                type="button"
                onClick={() => setFiltro(activo ? "todos" : k.f)}
                aria-pressed={activo}
                className={cn(
                  "relative overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition",
                  activo ? "border-carbon bg-carbon text-cream" : "border-carbon/[0.07] bg-white hover:border-carbon/20",
                  i === 0 && "col-span-2 sm:col-span-1"
                )}
              >
                <p className={cn("font-display text-[1.65rem] leading-none tabular-nums", !activo && (k.tone ?? "text-carbon"))}>
                  {k.value}
                  {i === 0 && <span className={cn("ml-1 text-sm", activo ? "text-cream/60" : "text-stone")}>/ {resumen.total}</span>}
                </p>
                <p className={cn("mt-1.5 text-xs", activo ? "text-cream/70" : "text-stone")}>{k.label}</p>
                {i === 0 && (
                  <span className="absolute inset-x-0 bottom-0 h-1 bg-carbon/[0.05]">
                    <span className="block h-full bg-forest" style={{ width: `${pctWeb}%` }} />
                  </span>
                )}
              </button>
            );
          })}
          <div className="col-span-2 rounded-2xl border border-carbon/[0.07] bg-white px-4 py-3.5 sm:col-span-1">
            <p className="font-display text-[1.65rem] leading-none tabular-nums text-carbon">
              {resumen.margenMedio == null ? "—" : `${resumen.margenMedio.toFixed(0)} %`}
            </p>
            <p className="mt-1.5 text-xs text-stone">Margen medio</p>
          </div>
        </div>
      )}

      {/* Búsqueda, orden y gamas */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-carbon/[0.07] bg-white p-3">
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, gama o SKU…"
              className={cn(inputClass, "w-full border-transparent bg-cream/60 pl-10 focus:bg-white")}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone hover:bg-cream hover:text-carbon"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={cn(inputClass, "flex-1 lg:flex-none")} aria-label="Categoría">
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c] ?? c}
                </option>
              ))}
            </select>
            <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className={cn(inputClass, "flex-1 lg:flex-none")} aria-label="Ordenar">
              <option value="nombre">Ordenar por nombre</option>
              <option value="precio">Por precio</option>
              <option value="margen">Por margen (menor primero)</option>
            </select>
            <button
              type="button"
              onClick={() => setAgrupar((v) => !v)}
              aria-pressed={agrupar}
              className={cn(btnGhost, agrupar && "border-carbon/30 bg-cream")}
            >
              {agrupar ? <Check size={14} /> : <List size={14} />} Por gamas
            </button>
          </div>
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
          <GamaChip activo={!gama} onClick={() => setGama("")} n={[...porGama.values()].reduce((a, b) => a + b, 0)}>
            Todas
          </GamaChip>
          {GAMAS.map((g) => (
            <GamaChip key={g.nombre} activo={gama === g.nombre} onClick={() => setGama(gama === g.nombre ? "" : g.nombre)} n={porGama.get(g.nombre) ?? 0} color={GAMA_COLOR[g.nombre]}>
              {g.nombre}
            </GamaChip>
          ))}
        </div>
      </div>

      <div className="mb-3 flex min-h-8 flex-wrap items-center gap-2 text-sm">
        <span className="text-stone">
          {lista.length === resumen.total ? `${lista.length} productos` : `${lista.length} de ${resumen.total} productos`}
        </span>
        {hayBusqueda && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGama("");
              setCategoria("");
              setFiltro("todos");
            }}
            className="inline-flex items-center gap-1 rounded-full bg-carbon/[0.05] px-2.5 py-1 text-xs text-carbon hover:bg-carbon/10"
          >
            <X size={12} /> Quitar filtros
          </button>
        )}
        {agrupar && grupos.length > 1 && (
          <button
            type="button"
            onClick={() => guardarPlegados(todoPlegado ? new Set() : new Set(grupos.map((g) => g.nombre)))}
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-stone hover:text-carbon"
          >
            {todoPlegado ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
            {todoPlegado ? "Desplegar todas" : "Plegar todas"}
          </button>
        )}
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!rows ? (
        <Loading />
      ) : lista.length === 0 ? (
        <Empty icon={<PackageSearch size={18} />}>No hay productos con esos filtros.</Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {vista === "lista" && (
            <div className="hidden grid-cols-[2.25rem_minmax(0,1fr)_7.5rem_7.5rem_5rem_5.5rem_5.5rem_2.5rem] items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone lg:grid">
              <span />
              <span>Producto</span>
              <span className="text-right">Precio venta</span>
              <span className="text-right">Coste</span>
              <span className="text-right">Margen</span>
              <span className="text-center">Disponible</span>
              <span className="text-center">En la web</span>
              <span />
            </div>
          )}
          {grupos.map((g) => {
            const plegado = agrupar && plegados.has(g.nombre);
            const ids = g.productos.map((p) => p.id);
            const marcados = ids.filter((id) => seleccion.has(id)).length;
            const ocultosG = g.productos.filter((p) => rowOf(p.id).oculto).length;
            const agotadosG = g.productos.filter((p) => rowOf(p.id).agotado).length;
            const ms = g.productos.map((p) => minMargen(p, rowOf(p.id))).filter((x): x is number => x != null);
            const mMedio = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : null;
            return (
              <section
                key={g.nombre || "todos"}
                className="overflow-hidden rounded-2xl border border-carbon/[0.07] bg-white shadow-[0_1px_3px_rgba(28,26,22,0.04)]"
              >
                {agrupar && (
                  <div className={cn("flex items-center gap-3 px-4 py-3", !plegado && "border-b border-carbon/[0.06]")}>
                    <input
                      type="checkbox"
                      checked={marcados === ids.length}
                      ref={(el) => {
                        if (el) el.indeterminate = marcados > 0 && marcados < ids.length;
                      }}
                      onChange={() => toggleSel(ids, marcados !== ids.length)}
                      aria-label={`Seleccionar toda la gama ${g.nombre}`}
                      className="h-4 w-4 accent-carbon"
                    />
                    <button type="button" onClick={() => togglePlegado(g.nombre)} aria-expanded={!plegado} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: GAMA_COLOR[g.nombre] ?? "#8a8271" }} />
                      <span className="font-display text-lg leading-tight text-carbon">{g.nombre}</span>
                      <span className="text-xs tabular-nums text-stone">{g.productos.length}</span>
                      <span className="hidden flex-wrap gap-1.5 sm:flex">
                        {agotadosG > 0 && <Badge tone="red">{agotadosG} agotado{agotadosG === 1 ? "" : "s"}</Badge>}
                        {ocultosG > 0 && <Badge>{ocultosG} oculto{ocultosG === 1 ? "" : "s"}</Badge>}
                      </span>
                      <span className="ml-auto flex items-center gap-3">
                        {mMedio != null && <span className="hidden text-xs text-stone sm:inline">Margen {mMedio.toFixed(0)} %</span>}
                        <ChevronDown size={16} className={cn("text-stone transition", plegado && "-rotate-90")} />
                      </span>
                    </button>
                  </div>
                )}
                {!plegado &&
                  (vista === "lista" ? (
                    <div className="divide-y divide-carbon/[0.05]">
                      {g.productos.map((p) => (
                        <FilaProducto
                          key={p.id}
                          product={p}
                          row={rowOf(p.id)}
                          selected={seleccion.has(p.id)}
                          onSelect={() => toggleSel([p.id], !seleccion.has(p.id))}
                          onPatch={(patch) => guardar({ ...rowOf(p.id), ...patch })}
                          onEdit={() => setEditando(p)}
                          mostrarGama={!agrupar}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3 bg-cream-soft/60 p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {g.productos.map((p) => (
                        <ProductoCard
                          key={p.id}
                          product={p}
                          row={rowOf(p.id)}
                          selected={seleccion.has(p.id)}
                          onSelect={() => toggleSel([p.id], !seleccion.has(p.id))}
                          onPatch={(patch) => guardar({ ...rowOf(p.id), ...patch })}
                          onEdit={() => setEditando(p)}
                        />
                      ))}
                    </div>
                  ))}
              </section>
            );
          })}
        </div>
      )}

      {seleccionados.length > 0 && (
        <BarraBloque
          n={seleccionados.length}
          onAccion={enBloque}
          onPrecio={ajustarPrecio}
          onMargen={fijarMargen}
          onLimpiar={() => setSeleccion(new Set())}
        />
      )}

      {aviso && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-forest px-5 py-2.5 text-sm text-cream shadow-lg">
          {aviso}
        </div>
      )}

      {editando && rows && (
        <EditorProducto
          product={editando}
          row={rowOf(editando.id)}
          onClose={() => setEditando(null)}
          onSave={async (row) => {
            const ok = await guardar(row);
            if (ok) setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function GamaChip({
  activo,
  onClick,
  n,
  color,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  n: number;
  color?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      disabled={!activo && n === 0}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-35",
        activo ? "border-carbon bg-carbon text-cream" : "border-carbon/[0.08] bg-white text-carbon hover:border-carbon/25"
      )}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
      {children}
      <span className={cn("tabular-nums", activo ? "text-cream/60" : "text-stone")}>{n}</span>
    </button>
  );
}

// Barra flotante para cambiar varios productos a la vez. Los ajustes de
// precio y margen piden el % en la propia barra.
function BarraBloque({
  n,
  onAccion,
  onPrecio,
  onMargen,
  onLimpiar,
}: {
  n: number;
  onAccion: (a: AccionBloque) => void;
  onPrecio: (pct: number) => void;
  onMargen: (m: number) => void;
  onLimpiar: () => void;
}) {
  const [modo, setModo] = useState<"precio" | "margen" | null>(null);
  const [valor, setValor] = useState("");
  const num = Number(valor.replace(",", "."));
  const valido = valor.trim() !== "" && Number.isFinite(num) && (modo === "precio" ? num > -90 && num <= 300 && num !== 0 : num > 0 && num < 95);

  function confirmar() {
    if (!valido) return;
    if (modo === "precio") onPrecio(num);
    else onMargen(num);
    setModo(null);
    setValor("");
  }

  const btn = "rounded-full bg-cream/10 px-3 py-1.5 text-xs font-medium transition hover:bg-cream/20";
  return (
    <div className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-4xl flex-wrap items-center gap-2 rounded-2xl bg-carbon px-4 py-3 text-cream shadow-[0_20px_50px_rgba(28,26,22,0.35)]">
      <span className="mr-1 inline-flex items-center gap-2 text-sm font-medium tabular-nums">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-cream px-1.5 text-xs text-carbon">{n}</span>
        seleccionado{n === 1 ? "" : "s"}
      </span>
      {modo ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirmar();
          }}
          className="flex flex-1 flex-wrap items-center gap-2"
        >
          <span className="text-xs text-cream/70">
            {modo === "precio" ? "Subir (+) o bajar (−) el precio un" : "Fijar un margen sobre el precio de venta del"}
          </span>
          <span className="relative">
            <input
              autoFocus
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={modo === "precio" ? "5" : "30"}
              aria-label="Porcentaje"
              className="h-8 w-20 rounded-lg bg-cream/10 px-2 pr-6 text-right text-sm tabular-nums text-cream placeholder:text-cream/40 focus:bg-cream/20 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-cream/60">%</span>
          </span>
          <button type="submit" disabled={!valido} className="rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-carbon disabled:opacity-40">
            Aplicar
          </button>
          <button type="button" onClick={() => setModo(null)} className="text-xs text-cream/60 hover:text-cream">
            Cancelar
          </button>
        </form>
      ) : (
        <>
          <button type="button" onClick={() => onAccion("reponer")} className={btn}>
            Disponible
          </button>
          <button type="button" onClick={() => onAccion("agotar")} className={btn}>
            Agotado
          </button>
          <button type="button" onClick={() => onAccion("mostrar")} className={btn}>
            Mostrar en web
          </button>
          <button type="button" onClick={() => onAccion("ocultar")} className={btn}>
            Ocultar
          </button>
          <span className="mx-1 hidden h-5 w-px bg-cream/15 sm:block" />
          <button type="button" onClick={() => setModo("precio")} className={btn}>
            Ajustar precio %
          </button>
          <button type="button" onClick={() => setModo("margen")} className={btn}>
            Fijar margen %
          </button>
          <button type="button" onClick={onLimpiar} className="ml-auto text-xs text-cream/60 hover:text-cream">
            Deseleccionar
          </button>
        </>
      )}
    </div>
  );
}

function EstadoPunto({ row }: { row: ProductoAjusteRow }) {
  if (row.oculto)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-stone">
        <EyeOff size={11} /> Oculto
      </span>
    );
  if (row.agotado) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600">● Agotado</span>;
  return null;
}

function MargenPill({ m }: { m: number | null }) {
  if (m == null) return <span className="text-xs text-stone">—</span>;
  const tono = m < 10 ? "bg-red-50 text-red-700" : m < 20 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800";
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium tabular-nums", tono)}>{m.toFixed(0)} %</span>;
}

function FilaProducto({
  product,
  row,
  selected,
  onSelect,
  onPatch,
  onEdit,
  mostrarGama,
}: {
  product: Product;
  row: ProductoAjusteRow;
  selected: boolean;
  onSelect: () => void;
  onPatch: (patch: Partial<ProductoAjusteRow>) => void;
  onEdit: () => void;
  mostrarGama?: boolean;
}) {
  const src = productImageSrc(product);
  const unico = product.variants.length === 1;
  const m = minMargen(product, row);
  const precio = minPrecio(product, row);

  return (
    <div
      className={cn(
        "grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-4 py-2 transition hover:bg-cream/40 lg:grid-cols-[2.25rem_minmax(0,1fr)_7.5rem_7.5rem_5rem_5.5rem_5.5rem_2.5rem]",
        selected && "bg-cream/70",
        row.oculto && "bg-carbon/[0.015]"
      )}
    >
      <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Seleccionar ${product.name}`} className="h-4 w-4 accent-carbon" />

      <button type="button" onClick={onEdit} className="flex min-w-0 items-center gap-3 text-left">
        <span className={cn("relative h-11 w-10 shrink-0 overflow-hidden rounded-xl bg-linen", row.oculto && "opacity-50")}>
          {src && <Image src={src} alt="" fill sizes="40px" className="object-contain p-1" />}
        </span>
        <span className="min-w-0">
          <span className={cn("line-clamp-2 text-sm font-medium leading-snug lg:line-clamp-1", row.oculto ? "text-stone" : "text-carbon")} title={product.name}>
            {product.name}
          </span>
          <span className="flex items-center gap-2 truncate text-xs text-stone">
            <span className="truncate">
              {mostrarGama && `${product.brand} · `}
              {product.subcategory} · {unico ? product.variants[0].size : `${product.variants.length} formatos`}
            </span>
            <EstadoPunto row={row} />
          </span>
        </span>
      </button>

      {/* Móvil: precio y margen a la derecha del nombre */}
      <span className="flex flex-col items-end gap-1 lg:hidden">
        <span className="text-sm font-medium tabular-nums text-carbon">
          {!unico && <span className="text-[10px] font-normal text-stone">desde </span>}
          {precio != null ? eur(precio) : "—"}
        </span>
        <MargenPill m={m} />
      </span>

      <div className="hidden justify-end lg:flex">
        {unico ? (
          <InlineEur
            value={row.precios_eur["0"]}
            placeholder={variantPriceEur(product, 0)}
            label={`Precio de ${product.name}`}
            onSave={(v) => {
              const precios = { ...row.precios_eur };
              if (v == null) delete precios["0"];
              else precios["0"] = v;
              onPatch({ precios_eur: precios });
            }}
          />
        ) : (
          <button type="button" onClick={onEdit} className="pr-2 text-right text-sm text-carbon hover:underline">
            <span className="text-[10px] text-stone">desde </span>
            <span className="tabular-nums">{precio != null ? eur(precio) : "—"}</span>
          </button>
        )}
      </div>
      <div className="hidden justify-end lg:flex">
        {unico ? (
          <InlineEur
            value={row.costes_eur["0"]}
            placeholder={null}
            label={`Coste de ${product.name}`}
            onSave={(v) => {
              const costes = { ...row.costes_eur };
              if (v == null) delete costes["0"];
              else costes["0"] = v;
              onPatch({ costes_eur: costes });
            }}
          />
        ) : (
          <button type="button" onClick={onEdit} className="pr-2 text-xs text-stone hover:text-carbon hover:underline">
            Por formato
          </button>
        )}
      </div>
      <div className="hidden justify-end lg:flex">
        <MargenPill m={m} />
      </div>

      {/* Interruptores: en el móvil, en una segunda línea */}
      <div className="col-span-3 flex items-center justify-end gap-4 pl-[3.25rem] lg:col-span-1 lg:justify-center lg:pl-0">
        <span className="lg:hidden">
          <Switch label="Disponible" checked={!row.agotado} onChange={(v) => onPatch({ agotado: !v })} />
        </span>
        <span className="hidden lg:inline-flex">
          <Switch label="" checked={!row.agotado} onChange={(v) => onPatch({ agotado: !v })} />
        </span>
        <span className="lg:hidden">
          <Switch label="En la web" checked={!row.oculto} onChange={(v) => onPatch({ oculto: !v })} />
        </span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${product.name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone transition hover:bg-carbon/[0.05] hover:text-carbon lg:hidden"
        >
          <Pencil size={14} />
        </button>
      </div>
      <div className="hidden justify-center lg:flex">
        <Switch label="" checked={!row.oculto} onChange={(v) => onPatch({ oculto: !v })} />
      </div>
      <div className="hidden justify-end lg:flex">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${product.name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone transition hover:bg-carbon/[0.05] hover:text-carbon"
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>
  );
}

// Importe editable en la propia celda: guarda al salir o con Enter,
// Escape deshace. Vacío = volver al valor por defecto.
function InlineEur({
  value,
  placeholder,
  label,
  onSave,
}: {
  value: number | undefined;
  placeholder: number | null;
  label: string;
  onSave: (v: number | null) => void;
}) {
  const inicial = fmtNum(value);
  const [v, setV] = useState(inicial);
  useEffect(() => setV(inicial), [inicial]);

  function commit() {
    if (v === inicial) return;
    const n = parseEur(v);
    if (v.trim() !== "" && n == null) {
      setV(inicial);
      return;
    }
    onSave(n);
  }

  return (
    <div className="relative w-28">
      <input
        inputMode="decimal"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setV(inicial);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder != null ? fmtNum(placeholder) : "—"}
        aria-label={label}
        className={cn(
          "h-8 w-full rounded-lg border border-transparent bg-transparent px-2 pr-6 text-right text-sm tabular-nums text-carbon transition placeholder:text-carbon/70 hover:border-carbon/10 focus:border-carbon/25 focus:bg-white focus:outline-none",
          v !== "" && "font-medium text-forest placeholder:text-stone"
        )}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone">€</span>
    </div>
  );
}

function ProductoCard({
  product,
  row,
  selected,
  onSelect,
  onPatch,
  onEdit,
}: {
  product: Product;
  row: ProductoAjusteRow;
  selected: boolean;
  onSelect: () => void;
  onPatch: (patch: Partial<ProductoAjusteRow>) => void;
  onEdit: () => void;
}) {
  const src = productImageSrc(product);
  const desde = minPrecio(product, row);
  const tienePrecioPropio = Object.keys(row.precios_eur).length > 0;
  const margenMin = minMargen(product, row);

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(28,26,22,0.04)] transition hover:shadow-[0_8px_24px_rgba(28,26,22,0.08)]",
        selected ? "border-carbon/40 ring-2 ring-carbon/10" : row.agotado ? "border-red-200" : "border-carbon/[0.07]"
      )}
    >
      <div className={cn("relative aspect-[4/3] bg-linen/70", row.oculto && "opacity-50")}>
        {src && <Image src={src} alt="" fill sizes="(min-width:1536px) 20vw, (min-width:1280px) 25vw, (min-width:640px) 45vw, 90vw" className="object-contain p-4" />}
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          aria-label={`Seleccionar ${product.name}`}
          className={cn("absolute left-3 top-3 h-4 w-4 accent-carbon transition", !selected && "opacity-0 group-hover:opacity-100 focus:opacity-100")}
        />
        <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1">
          {row.agotado && <Badge tone="red">Agotado</Badge>}
          {row.oculto && <Badge>Oculto</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-[10px] uppercase tracking-wider text-stone">{product.subcategory}</p>
        <button type="button" onClick={onEdit} className="mt-0.5 line-clamp-2 text-left text-sm font-medium leading-snug text-carbon hover:underline">
          {product.name}
        </button>
        <div className="mb-3 mt-2 flex items-center justify-between gap-2">
          <p className="text-sm tabular-nums text-carbon">
            {desde == null ? (
              <span className="text-stone">Sin precio</span>
            ) : (
              <>
                {product.variants.length > 1 && <span className="text-xs text-stone">desde </span>}
                <span className="font-semibold">{eur(desde)}</span>
              </>
            )}
            {tienePrecioPropio && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-gold">propio</span>}
          </p>
          <MargenPill m={margenMin} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-carbon/[0.06] pt-3">
          <div className="flex flex-col gap-2">
            <Switch label="Disponible" checked={!row.agotado} onChange={(v) => onPatch({ agotado: !v })} />
            <Switch label="En la web" checked={!row.oculto} onChange={(v) => onPatch({ oculto: !v })} />
          </div>
          <button type="button" onClick={onEdit} className={cn(btnGhost, "h-9 px-3 text-xs")}>
            <Pencil size={13} /> Editar
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorProducto({
  product,
  row,
  onClose,
  onSave,
}: {
  product: Product;
  row: ProductoAjusteRow;
  onClose: () => void;
  onSave: (row: ProductoAjusteRow) => Promise<void>;
}) {
  const [precios, setPrecios] = useState(product.variants.map((_, i) => fmtNum(row.precios_eur[String(i)])));
  const [costes, setCostes] = useState(product.variants.map((_, i) => fmtNum(row.costes_eur[String(i)])));
  const [dias, setDias] = useState(row.dias_duracion?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const precios_eur: Record<string, number> = {};
    const costes_eur: Record<string, number> = {};
    precios.forEach((v, i) => {
      const n = parseEur(v);
      if (n != null) precios_eur[String(i)] = n;
    });
    costes.forEach((v, i) => {
      const n = parseEur(v);
      if (n != null) costes_eur[String(i)] = n;
    });
    const d = dias.trim() === "" ? null : Math.min(365, Math.max(1, Math.floor(Number(dias))));
    const dias_duracion = Number.isFinite(d as number) ? d : null;
    await onSave({
      ...row,
      precios_eur,
      costes_eur,
      ...((row.dias_duracion !== undefined || dias_duracion != null) && { dias_duracion }),
    });
    setSaving(false);
  }

  return (
    <Dialog open onClose={onClose} title={product.name} eyebrow={`${product.brand} · Editar producto`} wide>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-stone">
              <th className="pb-2 pr-3 font-medium">Formato</th>
              <th className="pb-2 pr-3 font-medium">Catálogo</th>
              <th className="pb-2 pr-3 font-medium">Precio de venta</th>
              <th className="pb-2 pr-3 font-medium">Coste</th>
              <th className="pb-2 font-medium">Margen</th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v, i) => {
              const base = variantPriceEur(product, i);
              const venta = parseEur(precios[i]) ?? base;
              const coste = parseEur(costes[i]);
              const m = venta != null && coste != null && venta > 0 ? ((venta - coste) / venta) * 100 : null;
              return (
                <tr key={i} className="border-t border-carbon/[0.06]">
                  <td className="py-2.5 pr-3 text-carbon">{v.size}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-stone">{base != null ? eur(base) : "—"}</td>
                  <td className="py-2.5 pr-3">
                    <div className="relative">
                      <input
                        inputMode="decimal"
                        value={precios[i]}
                        onChange={(e) => setPrecios((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder={base != null ? fmtNum(base) : "Sin precio"}
                        aria-label={`Precio de venta de ${v.size}`}
                        className={cn(inputClass, "w-32 pr-7 tabular-nums")}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone">€</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="relative">
                      <input
                        inputMode="decimal"
                        value={costes[i]}
                        onChange={(e) => setCostes((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder="—"
                        aria-label={`Coste de ${v.size}`}
                        className={cn(inputClass, "w-28 pr-7 tabular-nums")}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone">€</span>
                    </div>
                  </td>
                  <td className={cn("py-2.5 tabular-nums", m == null ? "text-stone" : m < 10 ? "text-red-600" : "text-forest")}>
                    {m == null ? "—" : `${m.toFixed(0)} %`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone">Deja el precio vacío para usar el de catálogo. El coste solo lo ves tú: sirve para calcular márgenes y beneficio.</p>

      <div className="mt-5 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-medium text-carbon">Duración de una unidad</p>
          <p className="text-xs text-stone">
            Días que le dura a un cliente (p. ej. 30 para un bote mensual). Con esto su cuenta le avisa cuando le toca
            reponer. Vacío = no es un producto de reposición.
          </p>
        </div>
        <div className="relative">
          <input
            inputMode="numeric"
            value={dias}
            onChange={(e) => setDias(e.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="—"
            aria-label="Duración en días"
            className={cn(inputClass, "w-36 pr-12 tabular-nums")}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone">días</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPrecios(product.variants.map(() => ""))}
          className="inline-flex items-center gap-1.5 text-xs text-stone transition hover:text-carbon"
        >
          <RotateCcw size={13} /> Volver a precios de catálogo
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Guardar cambios
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-xs text-carbon"
    >
      <span className={cn("relative h-[18px] w-8 shrink-0 rounded-full transition", checked ? "bg-forest" : "bg-carbon/15")}>
        <span
          className={cn(
            "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-all",
            checked ? "left-[16px]" : "left-[2px]"
          )}
        />
      </span>
      {label ? <span>{label}</span> : <span className="sr-only">{checked ? "Sí" : "No"}</span>}
    </button>
  );
}
