"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronDown, Loader2, MessageCircle, Plus, Search, Trash2, X } from "lucide-react";
import { PRODUCTS, getProductById } from "@/data/products";
import { amwayDb } from "@/lib/amway-db";
import { fetchCatalogoPublico, indexCatalogo, precioVenta } from "@/lib/catalog-state";
import { cn } from "@/lib/utils";
import {
  Badge,
  ESTADO_PEDIDO,
  Empty,
  METODO_PAGO,
  PanelHeader,
  Segmented,
  btnGhost,
  btnPrimary,
  eur,
  fecha,
  inputClass,
  waHref,
  type MetodoPago,
  type Pedido,
  type PedidoEstado,
  type PedidoItem,
} from "./shared";

type Filtro = "activos" | PedidoEstado | "todos";

export function PedidosPanel({ onChange }: { onChange: () => void }) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [query, setQuery] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await amwayDb()
      .from("amway_pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setPedidos((data as Pedido[] | null) ?? []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function actualizar(id: string, cambios: Partial<Pedido>) {
    setPedidos((prev) => prev?.map((p) => (p.id === id ? { ...p, ...cambios } : p)) ?? null);
    await amwayDb().from("amway_pedidos").update(cambios).eq("id", id);
    onChange();
  }

  async function borrar(p: Pedido) {
    if (!confirm(`¿Borrar definitivamente el pedido #${p.numero}? Si solo quieres anularlo, márcalo como cancelado.`)) return;
    await amwayDb().from("amway_pedidos").delete().eq("id", p.id);
    setPedidos((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
    onChange();
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of pedidos ?? []) c[p.estado] = (c[p.estado] ?? 0) + 1;
    return c;
  }, [pedidos]);

  const lista = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (pedidos ?? []).filter((p) => {
      if (filtro === "activos" && !["pendiente", "pagado", "enviado"].includes(p.estado)) return false;
      if (filtro !== "activos" && filtro !== "todos" && p.estado !== filtro) return false;
      if (!q) return true;
      return `${p.numero} ${p.cliente_nombre ?? ""} ${p.cliente_email ?? ""} ${p.cliente_telefono ?? ""} ${p.items
        .map((i) => i.nombre)
        .join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [pedidos, filtro, query]);

  return (
    <div>
      <PanelHeader
        title="Pedidos"
        description="Pagos con tarjeta de la web (se registran solos) y ventas manuales por WhatsApp, Bizum o en mano."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setNuevo(true)}>
            <Plus size={15} /> Venta manual
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nº, cliente, teléfono o producto…"
            className={cn(inputClass, "w-full pl-9")}
          />
        </div>
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "activos", label: "En curso" },
            { value: "pagado", label: "Por enviar", count: counts.pagado },
            { value: "enviado", label: "Enviados" },
            { value: "entregado", label: "Entregados" },
            { value: "cancelado", label: "Cancelados" },
            { value: "todos", label: "Todos" },
          ]}
        />
      </div>

      {nuevo && (
        <VentaManualForm
          onClose={() => setNuevo(false)}
          onCreated={() => {
            setNuevo(false);
            void cargar();
            onChange();
          }}
        />
      )}

      {!pedidos ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : lista.length === 0 ? (
        <Empty>No hay pedidos en esta vista.</Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((p) => {
            const open = abierto === p.id;
            const unidades = p.items.reduce((s, i) => s + i.cantidad, 0);
            return (
              <div key={p.id} className="rounded-2xl border border-carbon/8 bg-white">
                <button
                  type="button"
                  onClick={() => setAbierto(open ? null : p.id)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 text-left sm:px-5"
                >
                  <span className="font-display text-lg tabular-nums text-carbon">#{p.numero}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-carbon">
                    {p.cliente_nombre || "Sin nombre"}
                    <span className="ml-2 text-stone">
                      · {unidades} ud. · {METODO_PAGO[p.metodo_pago]}
                      {p.origen === "manual" && " · manual"}
                    </span>
                  </span>
                  <span className="text-xs text-stone">{fecha(p.created_at, true)}</span>
                  <Badge tone={ESTADO_PEDIDO[p.estado].tone}>{ESTADO_PEDIDO[p.estado].label}</Badge>
                  <span className="w-24 text-right font-medium tabular-nums text-carbon">{eur(p.total_eur)}</span>
                  <ChevronDown size={16} className={cn("text-stone transition", open && "rotate-180")} />
                </button>

                {open && (
                  <div className="grid gap-6 border-t border-carbon/8 px-4 py-5 sm:px-5 lg:grid-cols-[1fr_18rem]">
                    <div>
                      <table className="w-full text-sm">
                        <tbody>
                          {p.items.map((i, idx) => (
                            <tr key={idx} className="border-b border-carbon/5 last:border-0">
                              <td className="py-2 pr-3 tabular-nums text-stone">{i.cantidad}×</td>
                              <td className="py-2 pr-3">
                                <p className="text-carbon">{i.nombre}</p>
                                <p className="text-xs text-stone">{[i.formato, i.sabor].filter(Boolean).join(" · ")}</p>
                              </td>
                              <td className="py-2 text-right tabular-nums text-carbon">{eur(i.precio_eur * i.cantidad)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {p.envio_eur > 0 && <p className="mt-2 text-right text-xs text-stone">Envío: {eur(p.envio_eur)}</p>}
                      <textarea
                        defaultValue={p.notas ?? ""}
                        onBlur={(e) => e.target.value !== (p.notas ?? "") && actualizar(p.id, { notas: e.target.value || null })}
                        placeholder="Notas internas (nº de seguimiento, incidencias…)"
                        rows={2}
                        className={cn(inputClass, "mt-4 w-full")}
                      />
                    </div>
                    <div className="flex flex-col gap-3 text-sm">
                      <div className="rounded-xl bg-cream p-3">
                        <p className="font-medium text-carbon">{p.cliente_nombre || "—"}</p>
                        {p.cliente_telefono && <p className="text-stone">{p.cliente_telefono}</p>}
                        {p.cliente_email && <p className="break-all text-stone">{p.cliente_email}</p>}
                        {p.direccion && <p className="mt-1 text-stone">{p.direccion}</p>}
                      </div>
                      <label className="flex flex-col gap-1 text-xs text-stone">
                        Estado
                        <select
                          value={p.estado}
                          onChange={(e) => actualizar(p.id, { estado: e.target.value as PedidoEstado })}
                          className={inputClass}
                        >
                          {Object.entries(ESTADO_PEDIDO).map(([v, { label }]) => (
                            <option key={v} value={v}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {p.cliente_telefono && (
                          <a
                            href={waHref(p.cliente_telefono, `Hola ${p.cliente_nombre ?? ""}, te escribimos por tu pedido #${p.numero}.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={btnGhost}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </a>
                        )}
                        <button type="button" onClick={() => borrar(p)} className={cn(btnGhost, "text-xs-red")}>
                          <Trash2 size={14} /> Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface LineaForm {
  productId: string;
  variantIndex: number;
  cantidad: number;
  precio: string;
}

function VentaManualForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [lineas, setLineas] = useState<LineaForm[]>([]);
  const [productoSel, setProductoSel] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>("bizum");
  const [estado, setEstado] = useState<PedidoEstado>("entregado");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [envio, setEnvio] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precios, setPrecios] = useState<ReturnType<typeof indexCatalogo> | null>(null);

  useEffect(() => {
    fetchCatalogoPublico({ cache: "no-store" }).then((d) => setPrecios(indexCatalogo(d)));
  }, []);

  function precioSugerido(productId: string, variantIndex: number): string {
    const p = getProductById(productId);
    if (!p || !precios) return "";
    return precioVenta(precios, p, variantIndex)?.toFixed(2) ?? "";
  }

  function addLinea(productId: string) {
    if (!productId) return;
    setLineas((prev) => [...prev, { productId, variantIndex: 0, cantidad: 1, precio: precioSugerido(productId, 0) }]);
    setProductoSel("");
  }

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const total = lineas.reduce((s, l) => s + num(l.precio) * l.cantidad, 0) + num(envio);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lineas.length === 0) {
      setError("Añade al menos un producto.");
      return;
    }
    setSaving(true);
    setError(null);
    const items: Omit<PedidoItem, "coste_eur">[] = lineas.map((l) => {
      const p = getProductById(l.productId)!;
      return {
        product_id: p.id,
        variant_index: l.variantIndex,
        nombre: p.name,
        formato: p.variants[l.variantIndex]?.size ?? null,
        sabor: null,
        cantidad: l.cantidad,
        precio_eur: num(l.precio),
      };
    });
    const { error: e2 } = await amwayDb().from("amway_pedidos").insert({
      origen: "manual",
      metodo_pago: metodo,
      estado,
      items,
      total_eur: Math.round(total * 100) / 100,
      envio_eur: num(envio),
      cliente_nombre: nombre.trim() || null,
      cliente_telefono: telefono.trim() || null,
      direccion: direccion.trim() || null,
      notas: notas.trim() || null,
    });
    setSaving(false);
    if (e2) {
      setError("No se pudo guardar la venta.");
      return;
    }
    onCreated();
  }

  return (
    <form onSubmit={submit} className="mb-6 rounded-2xl border border-carbon/10 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-xl text-carbon">Nueva venta manual</p>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="text-stone hover:text-carbon">
          <X size={18} />
        </button>
      </div>

      <select value={productoSel} onChange={(e) => addLinea(e.target.value)} className={cn(inputClass, "w-full")} aria-label="Añadir producto">
        <option value="">+ Añadir producto…</option>
        {PRODUCTS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.brand} · {p.name}
          </option>
        ))}
      </select>

      {lineas.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {lineas.map((l, idx) => {
            const p = getProductById(l.productId)!;
            const set = (c: Partial<LineaForm>) => setLineas((prev) => prev.map((x, j) => (j === idx ? { ...x, ...c } : x)));
            return (
              <div key={idx} className="flex flex-wrap items-center gap-2 rounded-xl bg-cream p-2.5">
                <p className="min-w-[10rem] flex-1 text-sm text-carbon">{p.name}</p>
                {p.variants.length > 1 && (
                  <select
                    value={l.variantIndex}
                    onChange={(e) => {
                      const vi = Number(e.target.value);
                      set({ variantIndex: vi, precio: precioSugerido(p.id, vi) });
                    }}
                    className={cn(inputClass, "max-w-[12rem]")}
                    aria-label="Formato"
                  >
                    {p.variants.map((v, i) => (
                      <option key={i} value={i}>
                        {v.size}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  min={1}
                  value={l.cantidad}
                  onChange={(e) => set({ cantidad: Math.max(1, Number(e.target.value) || 1) })}
                  className={cn(inputClass, "w-20")}
                  aria-label="Cantidad"
                />
                <input
                  inputMode="decimal"
                  value={l.precio}
                  onChange={(e) => set({ precio: e.target.value })}
                  placeholder="Precio ud."
                  className={cn(inputClass, "w-28")}
                  aria-label="Precio por unidad"
                />
                <button
                  type="button"
                  onClick={() => setLineas((prev) => prev.filter((_, j) => j !== idx))}
                  aria-label="Quitar"
                  className="p-1.5 text-stone hover:text-xs-red"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Cliente" className={inputClass} />
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className={inputClass} />
        <select value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)} className={inputClass} aria-label="Método de pago">
          {Object.entries(METODO_PAGO).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value as PedidoEstado)} className={inputClass} aria-label="Estado">
          {Object.entries(ESTADO_PEDIDO).map(([v, { label }]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección (opcional)" className={cn(inputClass, "sm:col-span-2")} />
        <input inputMode="decimal" value={envio} onChange={(e) => setEnvio(e.target.value)} placeholder="Envío € (opcional)" className={inputClass} />
        <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas" className={inputClass} />
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-xs-red">{error}</p>}

      <div className="mt-5 flex items-center justify-end gap-4">
        <p className="text-sm text-stone">
          Total <span className="ml-1 font-display text-2xl tabular-nums text-carbon">{eur(total)}</span>
        </p>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          Guardar venta
        </button>
      </div>
    </form>
  );
}
