"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { Check, Loader2, PackageSearch, Pencil, RotateCcw, Search } from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { productImageSrc, variantPriceEur, type Product } from "@/data/types";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/Dialog";
import { CATEGORIA_LABEL } from "./report-data";
import {
  Badge,
  Empty,
  Loading,
  PanelHeader,
  Segmented,
  btnGhost,
  btnPrimary,
  eur,
  inputClass,
  revalidarTienda,
  type ProductoAjusteRow,
} from "./shared";

type Filtro = "todos" | "agotados" | "ocultos" | "ajustes" | "sin-coste";

function emptyRow(productId: string): ProductoAjusteRow {
  return { product_id: productId, precios_eur: {}, costes_eur: {}, agotado: false, oculto: false, stock: null };
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
type Orden = "nombre" | "precio" | "margen" | "stock";
const VISTA_KEY = "amway_premium_admin_vista_productos";

function minPrecio(p: Product, r: ProductoAjusteRow) {
  const ps = p.variants.map((_, i) => precioFinal(p, r, i)).filter((x): x is number => x != null);
  return ps.length ? Math.min(...ps) : null;
}

function minMargen(p: Product, r: ProductoAjusteRow) {
  const ms = p.variants.map((_, i) => margen(p, r, i)).filter((x): x is number => x != null);
  return ms.length ? Math.min(...ms) : null;
}

type AccionBloque = "agotar" | "reponer" | "ocultar" | "mostrar" | "precio" | "margen";

const ACCIONES_BLOQUE: [AccionBloque, string][] = [
  ["agotar", "Marcar agotado"],
  ["reponer", "Marcar disponible"],
  ["ocultar", "Ocultar"],
  ["mostrar", "Mostrar"],
  ["precio", "Ajustar precio %"],
  ["margen", "Fijar margen %"],
];

export function ProductosPanel({ session }: { session: Session }) {
  const [rows, setRows] = useState<Map<string, ProductoAjusteRow> | null>(null);
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [vista, setVista] = useState<Vista>("lista");
  const [orden, setOrden] = useState<Orden>("nombre");
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
  }, []);

  function cambiarVista(v: Vista) {
    setVista(v);
    try {
      localStorage.setItem(VISTA_KEY, v);
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
            stock: r.stock,
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

  const categorias = useMemo(() => Array.from(new Set(PRODUCTS.map((p) => p.category))), []);

  const resumen = useMemo(() => {
    const all = rows ? Array.from(rows.values()) : [];
    const margenes = PRODUCTS.map((p) => minMargen(p, rowOf(p.id))).filter((x): x is number => x != null);
    return {
      agotados: all.filter((r) => r.agotado).length,
      ocultos: all.filter((r) => r.oculto).length,
      sinCoste: PRODUCTS.filter((p) => p.variants.some((_, i) => rowOf(p.id).costes_eur[String(i)] == null)).length,
      pocoStock: all.filter((r) => !r.agotado && r.stock != null && r.stock <= 3).length,
      margenMedio: margenes.length ? margenes.reduce((a, b) => a + b, 0) / margenes.length : null,
    };
  }, [rows, rowOf]);

  const lista = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    const l = PRODUCTS.filter((p) => {
      const r = rowOf(p.id);
      if (categoria && p.category !== categoria) return false;
      if (q && !`${p.name} ${p.brand} ${p.subcategory} ${p.variants.map((v) => v.sku ?? "").join(" ")}`.toLowerCase().includes(q))
        return false;
      if (filtro === "agotados") return r.agotado;
      if (filtro === "ocultos") return r.oculto;
      if (filtro === "ajustes") return Object.keys(r.precios_eur).length > 0 || r.stock != null;
      if (filtro === "sin-coste") return p.variants.some((_, i) => r.costes_eur[String(i)] == null);
      return true;
    });
    const num = (x: number | null, vacio: number) => (x == null ? vacio : x);
    return [...l].sort((a, b) => {
      const ra = rowOf(a.id);
      const rb = rowOf(b.id);
      if (orden === "precio") return num(minPrecio(a, ra), Infinity) - num(minPrecio(b, rb), Infinity);
      if (orden === "margen") return num(minMargen(a, ra), Infinity) - num(minMargen(b, rb), Infinity);
      if (orden === "stock") return num(ra.stock, Infinity) - num(rb.stock, Infinity);
      return a.name.localeCompare(b.name, "es");
    });
  }, [rows, rowOf, query, categoria, filtro, orden]);

  const seleccionados = lista.filter((p) => seleccion.has(p.id));
  const todosMarcados = lista.length > 0 && seleccionados.length === lista.length;

  function toggleSel(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function enBloque(accion: AccionBloque) {
    let nuevas: ProductoAjusteRow[] = [];
    let saltados = 0;
    if (accion === "precio") {
      const v = prompt("¿Cuánto quieres subir (+) o bajar (−) el precio de venta? En %, por ejemplo 5 o -10");
      const pct = Number(v?.replace(",", "."));
      if (!v || !Number.isFinite(pct) || pct <= -90 || pct > 300) return;
      nuevas = seleccionados.map((p) => {
        const r = rowOf(p.id);
        const precios = { ...r.precios_eur };
        p.variants.forEach((_, i) => {
          const actual = precioFinal(p, r, i);
          if (actual != null) precios[String(i)] = Math.round(actual * (1 + pct / 100) * 100) / 100;
        });
        return { ...r, precios_eur: precios };
      });
    } else if (accion === "margen") {
      const v = prompt("Margen objetivo sobre el precio de venta, en % (por ejemplo 30). Solo cambia formatos con coste.");
      const m = Number(v?.replace(",", "."));
      if (!v || !Number.isFinite(m) || m <= 0 || m >= 95) return;
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
    } else {
      const patch: Partial<ProductoAjusteRow> =
        accion === "agotar"
          ? { agotado: true }
          : accion === "reponer"
            ? { agotado: false }
            : accion === "ocultar"
              ? { oculto: true }
              : { oculto: false };
      nuevas = seleccionados.map((p) => ({ ...rowOf(p.id), ...patch }));
    }
    const ok = await guardarVarios(nuevas);
    if (ok) {
      const n = nuevas.length;
      setAviso(`${n} producto${n === 1 ? "" : "s"} actualizado${n === 1 ? "" : "s"}${saltados ? ` · ${saltados} sin coste, sin cambios` : ""}.`);
      setSeleccion(new Set());
    }
  }

  const kpis: { label: string; value: number; f: Filtro; tone: string }[] = [
    { label: "Agotados", value: resumen.agotados, f: "agotados", tone: resumen.agotados ? "text-red-600" : "text-carbon" },
    { label: "Ocultos", value: resumen.ocultos, f: "ocultos", tone: "text-carbon" },
    { label: "Poco stock (≤ 3)", value: resumen.pocoStock, f: "ajustes", tone: resumen.pocoStock ? "text-amber-700" : "text-carbon" },
    { label: "Sin coste", value: resumen.sinCoste, f: "sin-coste", tone: "text-carbon" },
  ];

  return (
    <div className="pb-20">
      <PanelHeader
        title="Productos y precios"
        description="Disponibilidad al instante, precios editables en la propia lista y cambios en bloque. La tienda se actualiza sola."
        actions={
          <Segmented
            value={vista}
            onChange={cambiarVista}
            options={[
              { value: "lista", label: "Lista" },
              { value: "tarjetas", label: "Tarjetas" },
            ]}
          />
        }
      />

      {rows && (
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {kpis.map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => setFiltro(filtro === k.f ? "todos" : k.f)}
              className={cn(
                "rounded-2xl border bg-white px-4 py-3 text-left transition hover:border-carbon/20",
                filtro === k.f ? "border-carbon/40" : "border-carbon/[0.07]"
              )}
            >
              <p className={cn("font-display text-2xl tabular-nums", k.tone)}>{k.value}</p>
              <p className="text-xs text-stone">{k.label}</p>
            </button>
          ))}
          <div className="col-span-2 rounded-2xl border border-carbon/[0.07] bg-white px-4 py-3 sm:col-span-1">
            <p className="font-display text-2xl tabular-nums text-carbon">
              {resumen.margenMedio == null ? "—" : `${resumen.margenMedio.toFixed(0)} %`}
            </p>
            <p className="text-xs text-stone">Margen medio (con coste)</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, marca o SKU…"
            className={cn(inputClass, "w-full pl-10")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass} aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_LABEL[c] ?? c}
              </option>
            ))}
          </select>
          <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className={inputClass} aria-label="Ordenar">
            <option value="nombre">Orden: nombre</option>
            <option value="precio">Orden: precio</option>
            <option value="margen">Orden: margen (menor primero)</option>
            <option value="stock">Orden: stock (menor primero)</option>
          </select>
        </div>
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "todos", label: "Todos" },
            { value: "agotados", label: "Agotados", count: resumen.agotados },
            { value: "ocultos", label: "Ocultos" },
            { value: "ajustes", label: "Con precio o stock propio" },
            { value: "sin-coste", label: "Sin coste" },
          ]}
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!rows ? (
        <Loading />
      ) : lista.length === 0 ? (
        <Empty icon={<PackageSearch size={18} />}>No hay productos con esos filtros.</Empty>
      ) : vista === "lista" ? (
        <div className="overflow-hidden rounded-2xl border border-carbon/[0.07] bg-white shadow-[0_1px_3px_rgba(28,26,22,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead className="bg-cream-soft">
                <tr className="border-b border-carbon/[0.07] text-left text-[11px] uppercase tracking-wider text-stone">
                  <th className="w-10 py-3 pl-4">
                    <input
                      type="checkbox"
                      checked={todosMarcados}
                      onChange={() => setSeleccion(todosMarcados ? new Set() : new Set(lista.map((p) => p.id)))}
                      aria-label="Seleccionar todos"
                      className="h-4 w-4 accent-carbon"
                    />
                  </th>
                  <th className="py-3 pr-3 font-medium">Producto · {lista.length}</th>
                  <th className="py-3 pr-3 font-medium">Precio venta</th>
                  <th className="py-3 pr-3 font-medium">Coste</th>
                  <th className="py-3 pr-3 font-medium">Margen</th>
                  <th className="py-3 pr-3 font-medium">Stock</th>
                  <th className="py-3 pr-3 font-medium">Disponible</th>
                  <th className="py-3 pr-3 font-medium">Visible</th>
                  <th className="py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <FilaProducto
                    key={p.id}
                    product={p}
                    row={rowOf(p.id)}
                    selected={seleccion.has(p.id)}
                    onSelect={() => toggleSel(p.id)}
                    onPatch={(patch) => guardar({ ...rowOf(p.id), ...patch })}
                    onEdit={() => setEditando(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {lista.map((p) => (
            <ProductoCard
              key={p.id}
              product={p}
              row={rowOf(p.id)}
              onPatch={(patch) => guardar({ ...rowOf(p.id), ...patch })}
              onEdit={() => setEditando(p)}
            />
          ))}
        </div>
      )}

      {/* Barra de acciones en bloque */}
      {seleccionados.length > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-4xl flex-wrap items-center gap-2 rounded-2xl bg-carbon px-4 py-3 text-cream shadow-[0_20px_50px_rgba(28,26,22,0.35)]">
          <span className="mr-2 text-sm font-medium tabular-nums">{seleccionados.length} seleccionados</span>
          {ACCIONES_BLOQUE.map(([a, l]) => (
            <button
              key={a}
              type="button"
              onClick={() => enBloque(a)}
              className="rounded-full bg-cream/10 px-3 py-1.5 text-xs font-medium transition hover:bg-cream/20"
            >
              {l}
            </button>
          ))}
          <button type="button" onClick={() => setSeleccion(new Set())} className="ml-auto text-xs text-cream/60 hover:text-cream">
            Deseleccionar
          </button>
        </div>
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

function FilaProducto({
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
  const unico = product.variants.length === 1;
  const m = minMargen(product, row);
  const precio = minPrecio(product, row);

  return (
    <tr
      className={cn(
        "border-b border-carbon/[0.05] transition last:border-0 hover:bg-cream/40",
        selected && "bg-cream/70",
        row.oculto && "opacity-60"
      )}
    >
      <td className="py-2.5 pl-4">
        <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Seleccionar ${product.name}`} className="h-4 w-4 accent-carbon" />
      </td>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-lg bg-linen">
            {src && <Image src={src} alt="" fill sizes="36px" className="object-contain p-0.5" />}
          </div>
          <div className="min-w-0">
            <p className="max-w-[22rem] truncate font-medium text-carbon" title={product.name}>
              {product.name}
            </p>
            <p className="truncate text-xs text-stone">
              {product.brand} · {unico ? product.variants[0].size : `${product.variants.length} formatos`}
            </p>
          </div>
        </div>
      </td>
      <td className="py-2.5 pr-3">
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
          <button type="button" onClick={onEdit} className="text-left text-carbon hover:underline">
            <span className="text-xs text-stone">desde </span>
            <span className="tabular-nums">{precio != null ? eur(precio) : "—"}</span>
          </button>
        )}
      </td>
      <td className="py-2.5 pr-3">
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
          <button type="button" onClick={onEdit} className="text-xs text-stone hover:text-carbon hover:underline">
            Por formato
          </button>
        )}
      </td>
      <td className={cn("py-2.5 pr-3 tabular-nums", m == null ? "text-stone" : m < 10 ? "text-red-600" : "text-forest")}>
        {m == null ? "—" : `${m.toFixed(0)} %`}
      </td>
      <td className="py-2.5 pr-3">
        {row.stock == null ? (
          <span className="text-xs text-stone">—</span>
        ) : (
          <Badge tone={row.stock === 0 ? "red" : row.stock <= 3 ? "amber" : "green"}>{row.stock}</Badge>
        )}
      </td>
      <td className="py-2.5 pr-3">
        <Switch label="" checked={!row.agotado} onChange={(v) => onPatch({ agotado: !v })} />
      </td>
      <td className="py-2.5 pr-3">
        <Switch label="" checked={!row.oculto} onChange={(v) => onPatch({ oculto: !v })} />
      </td>
      <td className="py-2.5 pr-4 text-right">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${product.name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone transition hover:bg-carbon/[0.05] hover:text-carbon"
        >
          <Pencil size={14} />
        </button>
      </td>
    </tr>
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
  onPatch,
  onEdit,
}: {
  product: Product;
  row: ProductoAjusteRow;
  onPatch: (patch: Partial<ProductoAjusteRow>) => void;
  onEdit: () => void;
}) {
  const src = productImageSrc(product);
  const precios = product.variants.map((_, i) => precioFinal(product, row, i)).filter((x): x is number => x != null);
  const desde = precios.length ? Math.min(...precios) : null;
  const tienePrecioPropio = Object.keys(row.precios_eur).length > 0;
  const margenes = product.variants.map((_, i) => margen(product, row, i)).filter((x): x is number => x != null);
  const margenMin = margenes.length ? Math.min(...margenes) : null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-4 shadow-[0_1px_3px_rgba(28,26,22,0.04)] transition",
        row.agotado ? "border-red-200" : "border-carbon/[0.07]",
        row.oculto && "opacity-60"
      )}
    >
      <div className="flex gap-3.5">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-linen">
          {src && <Image src={src} alt="" fill sizes="64px" className="object-contain p-1.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] uppercase tracking-wider text-stone">
            {product.brand} · {product.subcategory}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-carbon">{product.name}</p>
          <p className="mt-1.5 text-sm tabular-nums text-carbon">
            {desde == null ? (
              <span className="text-stone">Sin precio</span>
            ) : (
              <>
                {product.variants.length > 1 && <span className="text-xs text-stone">desde </span>}
                <span className="font-semibold">{eur(desde)}</span>
              </>
            )}
            {tienePrecioPropio && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-gold">precio propio</span>}
          </p>
        </div>
      </div>

      <div className="mb-4 mt-3 flex flex-wrap gap-1.5">
        {row.agotado && <Badge tone="red">Agotado</Badge>}
        {row.oculto && <Badge>Oculto</Badge>}
        {row.stock != null && <Badge tone={row.stock <= 3 ? "amber" : "green"}>Stock {row.stock}</Badge>}
        {margenMin != null ? (
          <Badge tone={margenMin < 10 ? "red" : "grey"}>Margen {margenMin.toFixed(0)} %</Badge>
        ) : (
          <Badge>Sin coste</Badge>
        )}
        {product.variants.length > 1 && <Badge>{product.variants.length} formatos</Badge>}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-carbon/[0.06] pt-3">
        <div className="flex flex-col gap-2">
          <Switch label="Disponible" checked={!row.agotado} onChange={(v) => onPatch({ agotado: !v })} />
          <Switch label="Visible en tienda" checked={!row.oculto} onChange={(v) => onPatch({ oculto: !v })} />
        </div>
        <button type="button" onClick={onEdit} className={cn(btnGhost, "h-9 px-3 text-xs")}>
          <Pencil size={13} /> Editar
        </button>
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
  const [stock, setStock] = useState(row.stock?.toString() ?? "");
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
    const s = stock.trim() === "" ? null : Math.max(0, Math.floor(Number(stock)));
    await onSave({ ...row, precios_eur, costes_eur, stock: Number.isFinite(s as number) ? s : null });
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
          <p className="text-sm font-medium text-carbon">Control de stock</p>
          <p className="text-xs text-stone">
            Unidades disponibles. Cada venta descuenta sola y al llegar a 0 el producto se marca agotado. Vacío = sin control.
          </p>
        </div>
        <input
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
          placeholder="Sin control"
          aria-label="Stock"
          className={cn(inputClass, "w-36 tabular-nums")}
        />
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
