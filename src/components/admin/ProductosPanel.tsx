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

export function ProductosPanel({ session }: { session: Session }) {
  const [rows, setRows] = useState<Map<string, ProductoAjusteRow> | null>(null);
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [editando, setEditando] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data, error: e } = await amwayDb().from("amway_productos").select("*");
    if (e) setError("No se pudieron cargar los ajustes de productos.");
    setRows(new Map(((data as ProductoAjusteRow[] | null) ?? []).map((r) => [r.product_id, r])));
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = useCallback(
    async (row: ProductoAjusteRow) => {
      // Optimistic: toggles feel instant; reverted if the write fails.
      const prev = rows?.get(row.product_id);
      setRows((m) => new Map(m).set(row.product_id, row));
      const { data, error: e } = await amwayDb()
        .from("amway_productos")
        .upsert({
          product_id: row.product_id,
          precios_eur: row.precios_eur,
          costes_eur: row.costes_eur,
          agotado: row.agotado,
          oculto: row.oculto,
          stock: row.stock,
        })
        .select()
        .single();
      if (e || !data) {
        setRows((m) => {
          const next = new Map(m);
          if (prev) next.set(row.product_id, prev);
          else next.delete(row.product_id);
          return next;
        });
        setError("No se pudo guardar. Revisa la conexión e inténtalo otra vez.");
        return false;
      }
      setError(null);
      setRows((m) => new Map(m).set(row.product_id, data as ProductoAjusteRow));
      void revalidarTienda(session.access_token);
      return true;
    },
    [rows, session.access_token]
  );

  const categorias = useMemo(() => Array.from(new Set(PRODUCTS.map((p) => p.category))), []);

  const counts = useMemo(() => {
    const all = rows ? Array.from(rows.values()) : [];
    return {
      agotados: all.filter((r) => r.agotado).length,
      ocultos: all.filter((r) => r.oculto).length,
    };
  }, [rows]);

  const lista = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const r = rows.get(p.id) ?? emptyRow(p.id);
      if (categoria && p.category !== categoria) return false;
      if (q && !`${p.name} ${p.brand} ${p.subcategory} ${p.variants.map((v) => v.sku ?? "").join(" ")}`.toLowerCase().includes(q))
        return false;
      if (filtro === "agotados") return r.agotado;
      if (filtro === "ocultos") return r.oculto;
      if (filtro === "ajustes") return Object.keys(r.precios_eur).length > 0 || r.stock != null;
      if (filtro === "sin-coste") return p.variants.some((_, i) => r.costes_eur[String(i)] == null);
      return true;
    });
  }, [rows, query, categoria, filtro]);

  return (
    <div>
      <PanelHeader
        title="Productos y precios"
        description="Disponibilidad y visibilidad al instante. Pulsa Editar para cambiar precios, costes o stock; la tienda se actualiza sola."
      />

      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, marca o SKU…"
            className={cn(inputClass, "w-full pl-10")}
          />
        </div>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LABEL[c] ?? c}
            </option>
          ))}
        </select>
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "todos", label: "Todos" },
            { value: "agotados", label: "Agotados", count: counts.agotados },
            { value: "ocultos", label: "Ocultos", count: counts.ocultos },
            { value: "ajustes", label: "Precio o stock propio" },
            { value: "sin-coste", label: "Sin coste" },
          ]}
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!rows ? (
        <Loading />
      ) : lista.length === 0 ? (
        <Empty icon={<PackageSearch size={18} />}>No hay productos con esos filtros.</Empty>
      ) : (
        <>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">{lista.length} productos</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {lista.map((p) => (
              <ProductoCard
                key={p.id}
                product={p}
                row={rows.get(p.id) ?? emptyRow(p.id)}
                onPatch={(patch) => guardar({ ...(rows.get(p.id) ?? emptyRow(p.id)), ...patch })}
                onEdit={() => setEditando(p)}
              />
            ))}
          </div>
        </>
      )}

      {editando && rows && (
        <EditorProducto
          product={editando}
          row={rows.get(editando.id) ?? emptyRow(editando.id)}
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
  const [precios, setPrecios] = useState(product.variants.map((_, i) => row.precios_eur[String(i)]?.toString() ?? ""));
  const [costes, setCostes] = useState(product.variants.map((_, i) => row.costes_eur[String(i)]?.toString() ?? ""));
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
                        placeholder={base != null ? base.toFixed(2) : "Sin precio"}
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
      {label}
    </button>
  );
}
