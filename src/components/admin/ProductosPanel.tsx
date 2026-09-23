"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Check, Loader2, RotateCcw, Search } from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { variantPriceEur, type Product } from "@/data/types";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import {
  Badge,
  Empty,
  PanelHeader,
  Segmented,
  btnPrimary,
  eur,
  inputClass,
  revalidarTienda,
  type ProductoAjusteRow,
} from "./shared";

type Filtro = "todos" | "cambios" | "agotados" | "ocultos" | "sin-coste";

function emptyRow(productId: string): ProductoAjusteRow {
  return { product_id: productId, precios_eur: {}, costes_eur: {}, agotado: false, oculto: false, stock: null };
}

export function ProductosPanel({ session }: { session: Session }) {
  const [rows, setRows] = useState<Map<string, ProductoAjusteRow> | null>(null);
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
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
        setError("No se pudo guardar el producto. Revisa la conexión e inténtalo otra vez.");
        return false;
      }
      setError(null);
      setRows((prev) => new Map(prev).set(row.product_id, data as ProductoAjusteRow));
      void revalidarTienda(session.access_token);
      return true;
    },
    [session.access_token]
  );

  const categorias = useMemo(() => Array.from(new Set(PRODUCTS.map((p) => p.category))), []);

  const lista = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const r = rows.get(p.id);
      if (categoria && p.category !== categoria) return false;
      if (q && !`${p.name} ${p.brand} ${p.variants.map((v) => v.sku ?? "").join(" ")}`.toLowerCase().includes(q)) return false;
      if (filtro === "cambios") return !!r && (Object.keys(r.precios_eur).length > 0 || r.agotado || r.oculto || r.stock != null);
      if (filtro === "agotados") return !!r?.agotado;
      if (filtro === "ocultos") return !!r?.oculto;
      if (filtro === "sin-coste") return p.variants.some((_, i) => r?.costes_eur?.[String(i)] == null);
      return true;
    });
  }, [rows, query, categoria, filtro]);

  const counts = useMemo(() => {
    const all = rows ? Array.from(rows.values()) : [];
    return { agotados: all.filter((r) => r.agotado).length, ocultos: all.filter((r) => r.oculto).length };
  }, [rows]);

  return (
    <div>
      <PanelHeader
        title="Productos y precios"
        description="Precio de venta, coste, stock y disponibilidad de cada producto. Los cambios se ven en la tienda al momento."
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, marca o SKU…"
            className={cn(inputClass, "w-full pl-9")}
          />
        </div>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "todos", label: "Todos" },
            { value: "cambios", label: "Con ajustes" },
            { value: "agotados", label: "Agotados", count: counts.agotados },
            { value: "ocultos", label: "Ocultos", count: counts.ocultos },
            { value: "sin-coste", label: "Sin coste" },
          ]}
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>}

      {!rows ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : lista.length === 0 ? (
        <Empty>No hay productos con esos filtros.</Empty>
      ) : (
        <>
          <p className="mb-3 text-xs uppercase tracking-wider text-stone">{lista.length} productos</p>
          <div className="flex flex-col gap-3">
            {lista.map((p) => (
              <ProductoRow key={p.id} product={p} row={rows.get(p.id) ?? emptyRow(p.id)} onSave={guardar} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function parseEur(v: string): number | null {
  const n = Number(v.replace(",", ".").trim());
  return v.trim() === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n * 100) / 100;
}

function ProductoRow({
  product,
  row,
  onSave,
}: {
  product: Product;
  row: ProductoAjusteRow;
  onSave: (row: ProductoAjusteRow) => Promise<boolean>;
}) {
  const initial = useMemo(
    () => ({
      precios: product.variants.map((_, i) => row.precios_eur[String(i)]?.toString() ?? ""),
      costes: product.variants.map((_, i) => row.costes_eur[String(i)]?.toString() ?? ""),
      stock: row.stock?.toString() ?? "",
    }),
    [product, row]
  );
  const [precios, setPrecios] = useState(initial.precios);
  const [costes, setCostes] = useState(initial.costes);
  const [stock, setStock] = useState(initial.stock);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrecios(initial.precios);
    setCostes(initial.costes);
    setStock(initial.stock);
  }, [initial]);

  const dirty =
    precios.some((v, i) => v !== initial.precios[i]) || costes.some((v, i) => v !== initial.costes[i]) || stock !== initial.stock;

  function buildRow(overrides: Partial<ProductoAjusteRow> = {}): ProductoAjusteRow {
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
    const stockN = stock.trim() === "" ? null : Math.max(0, Math.floor(Number(stock)));
    return {
      ...row,
      precios_eur,
      costes_eur,
      stock: Number.isFinite(stockN as number) ? stockN : null,
      ...overrides,
    };
  }

  async function save(overrides?: Partial<ProductoAjusteRow>) {
    setSaving(true);
    const ok = await onSave(buildRow(overrides));
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 sm:p-5",
        row.oculto ? "border-carbon/8 opacity-70" : row.agotado ? "border-red-200" : "border-carbon/8"
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 xl:w-64 xl:shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-stone">
            {product.brand} · {product.subcategory}
          </p>
          <p className="font-display text-base leading-snug text-carbon">{product.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {row.agotado && <Badge tone="red">Agotado</Badge>}
            {row.oculto && <Badge>Oculto</Badge>}
            {row.stock != null && <Badge tone={row.stock <= 3 ? "amber" : "green"}>Stock: {row.stock}</Badge>}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-stone">
                <th className="pb-2 pr-3 font-normal">Formato</th>
                <th className="pb-2 pr-3 font-normal">Catálogo</th>
                <th className="pb-2 pr-3 font-normal">Precio venta €</th>
                <th className="pb-2 pr-3 font-normal">Coste €</th>
                <th className="pb-2 font-normal">Margen</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v, i) => {
                const base = variantPriceEur(product, i);
                const venta = parseEur(precios[i]) ?? base;
                const coste = parseEur(costes[i]);
                const margen = venta != null && coste != null && venta > 0 ? ((venta - coste) / venta) * 100 : null;
                return (
                  <tr key={i} className="border-t border-carbon/5">
                    <td className="max-w-[12rem] truncate py-2 pr-3 text-stone" title={v.size}>
                      {v.size}
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-stone">{base != null ? eur(base) : "—"}</td>
                    <td className="py-2 pr-3">
                      <input
                        inputMode="decimal"
                        value={precios[i]}
                        onChange={(e) => setPrecios((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder={base != null ? base.toFixed(2) : "Sin precio"}
                        aria-label={`Precio de venta de ${v.size}`}
                        className={cn(inputClass, "w-28 tabular-nums")}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        inputMode="decimal"
                        value={costes[i]}
                        onChange={(e) => setCostes((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder="—"
                        aria-label={`Coste de ${v.size}`}
                        className={cn(inputClass, "w-24 tabular-nums")}
                      />
                    </td>
                    <td
                      className={cn(
                        "py-2 tabular-nums",
                        margen == null ? "text-stone" : margen < 10 ? "text-xs-red" : "text-forest"
                      )}
                    >
                      {margen == null ? "—" : `${margen.toFixed(0)} %`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:w-56 xl:shrink-0 xl:flex-col xl:items-stretch">
          <label className="flex items-center gap-2 text-sm text-stone">
            Stock
            <input
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
              placeholder="Sin control"
              className={cn(inputClass, "w-28 tabular-nums")}
            />
          </label>
          <Toggle label="Agotado" checked={row.agotado} disabled={saving} onChange={(v) => save({ agotado: v })} tone="red" />
          <Toggle label="Oculto en la tienda" checked={row.oculto} disabled={saving} onChange={(v) => save({ oculto: v })} />
          <div className="flex items-center gap-2">
            <button type="button" disabled={!dirty || saving} onClick={() => save()} className={cn(btnPrimary, "flex-1")}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
              {saved ? "Guardado" : "Guardar"}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={() => {
                  setPrecios(initial.precios);
                  setCostes(initial.costes);
                  setStock(initial.stock);
                }}
                aria-label="Deshacer cambios"
                className="flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-carbon/5"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
  tone,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  tone?: "red";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 text-sm text-carbon disabled:opacity-50"
    >
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition",
          checked ? (tone === "red" ? "bg-xs-red" : "bg-carbon") : "bg-carbon/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            checked ? "left-[1.125rem]" : "left-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}
