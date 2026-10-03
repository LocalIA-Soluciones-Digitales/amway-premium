"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, History, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { HistorialPedidos } from "./HistorialPedidos";
import { PedidoDrawer } from "./PedidoDrawer";
import { PRODUCTS, getProductById } from "@/data/products";
import { amwayDb } from "@/lib/amway-db";
import { fetchCatalogoPublico, indexCatalogo, precioVenta } from "@/lib/catalog-state";
import { cn } from "@/lib/utils";
import { APreparar, CabeceraGrupo, FilaRecogida, agruparPorDia, esActivo, proximosDias } from "./recogidas";
import {
  ESTADO_PEDIDO,
  Empty,
  METODO_PAGO,
  PanelHeader,
  Segmented,
  btnPrimary,
  eur,
  inputClass,
  type MetodoPago,
  type Pedido,
  type PedidoEstado,
  type PedidoItem,
} from "./shared";

type Vista = "recogidas" | "historial";

export function PedidosPanel({
  onChange,
  recarga = 0,
  foco,
  onFocoVisto,
}: {
  onChange: () => void;
  recarga?: number;
  foco?: string | null;
  onFocoVisto?: () => void;
}) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [vista, setVista] = useState<Vista>("recogidas");
  const [dia, setDia] = useState<string | null>(null);
  const [plegados, setPlegados] = useState<Set<string>>(new Set());
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
  }, [cargar, recarga]);

  // Llegada desde un aviso: despliega ese pedido y lo trae a la vista.
  useEffect(() => {
    if (!foco || !pedidos) return;
    const p = pedidos.find((x) => x.id === foco);
    if (!p) return;
    if (!esActivo(p)) setVista("historial");
    setDia(null);
    setQuery("");
    setAbierto(foco);
    onFocoVisto?.();
  }, [foco, pedidos, onFocoVisto]);

  async function actualizar(id: string, cambios: Partial<Pedido>) {
    setPedidos((prev) => prev?.map((p) => (p.id === id ? { ...p, ...cambios } : p)) ?? null);
    await amwayDb().from("amway_pedidos").update(cambios).eq("id", id);
    onChange();
  }

  async function borrar(p: Pedido) {
    if (!confirm(`¿Borrar definitivamente el pedido #${p.numero}? Si solo quieres anularlo, márcalo como cancelado.`)) return;
    await amwayDb().from("amway_pedidos").delete().eq("id", p.id);
    setAbierto(null);
    setPedidos((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
    onChange();
  }

  const coincide = useCallback(
    (p: Pedido) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return `${p.numero} ${p.cliente_nombre ?? ""} ${p.cliente_email ?? ""} ${p.cliente_telefono ?? ""} ${p.items
        .map((i) => i.nombre)
        .join(" ")}`
        .toLowerCase()
        .includes(q);
    },
    [query]
  );

  const semana = useMemo(() => proximosDias(pedidos ?? []), [pedidos]);
  const grupos = useMemo(() => {
    const todos = agruparPorDia((pedidos ?? []).filter(coincide));
    return dia ? todos.filter((g) => g.key === dia) : todos;
  }, [pedidos, coincide, dia]);
  const atrasados = useMemo(() => agruparPorDia(pedidos ?? []).find((g) => g.key === "atrasados")?.pedidos.length ?? 0, [pedidos]);

  const pedidoAbierto = (abierto && pedidos?.find((p) => p.id === abierto)) || null;

  return (
    <div>
      <PanelHeader
        title="Pedidos"
        description="Próximas recogidas: quién viene, a qué hora y qué preparar. En Historial ves cualquier día pasado o todos los pedidos de un cliente."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setNuevo(true)}>
            <Plus size={15} /> Venta manual
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Segmented
          value={vista}
          onChange={setVista}
          options={[
            { value: "recogidas", label: "Próximas recogidas" },
            { value: "historial", label: "Historial" },
          ]}
        />
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nº, cliente, teléfono o producto…"
            className={cn(inputClass, "w-full pl-9")}
          />
        </div>
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
      ) : vista === "recogidas" ? (
        <div>
          {/* Tira de la semana: cuántas recogidas hay cada día. */}
          <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setDia(null)}
              className={cn(
                "flex shrink-0 flex-col items-center justify-center rounded-2xl border px-4 py-2 text-xs font-medium transition",
                dia === null ? "border-carbon bg-carbon text-cream" : "border-carbon/10 bg-white text-stone hover:text-carbon"
              )}
            >
              <CalendarDays size={16} />
              <span className="mt-1">Todo</span>
            </button>
            {atrasados > 0 && (
              <button
                type="button"
                onClick={() => setDia(dia === "atrasados" ? null : "atrasados")}
                className={cn(
                  "flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border px-2 py-2 text-center transition",
                  dia === "atrasados" ? "border-xs-red bg-xs-red text-cream" : "border-xs-red/30 bg-white text-xs-red"
                )}
              >
                <span className="text-[11px] font-medium">Atrasados</span>
                <span className="font-display text-xl leading-tight tabular-nums">{atrasados}</span>
              </button>
            )}
            {semana.map((d) => (
              <button
                key={d.fecha}
                type="button"
                onClick={() => setDia(dia === d.fecha ? null : d.fecha)}
                className={cn(
                  "flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border px-2 py-2 text-center transition",
                  dia === d.fecha
                    ? "border-carbon bg-carbon text-cream"
                    : d.n > 0
                      ? "border-carbon/15 bg-white text-carbon hover:border-carbon/30"
                      : "border-carbon/[0.06] bg-white/60 text-stone"
                )}
              >
                <span className="text-[11px] font-medium">{d.dia}</span>
                <span className="font-display text-xl leading-tight tabular-nums">{d.num}</span>
                <span
                  className={cn(
                    "mt-0.5 rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                    d.n > 0 ? (dia === d.fecha ? "bg-cream/20" : "bg-amber-100 text-amber-800") : "opacity-50"
                  )}
                >
                  {d.n > 0 ? `${d.n} ped.` : "—"}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setVista("historial")}
              className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-carbon/15 px-4 py-2 text-xs font-medium text-stone transition hover:border-carbon/30 hover:text-carbon"
            >
              <History size={16} />
              <span className="mt-1">Historial</span>
            </button>
          </div>

          {grupos.length === 0 ? (
            <Empty>
              {dia ? "No hay recogidas ese día." : "No hay recogidas pendientes. Los pedidos nuevos aparecerán aquí en el día que elija el cliente."}
            </Empty>
          ) : (
            <div className="flex flex-col gap-6">
              {grupos.map((g) => {
                const plegado = plegados.has(g.key);
                return (
                  <section key={g.key} className="rounded-3xl border border-carbon/[0.06] bg-white/50 p-2.5 sm:p-3">
                    <CabeceraGrupo
                      g={g}
                      plegado={plegado}
                      onToggle={() =>
                        setPlegados((prev) => {
                          const next = new Set(prev);
                          if (next.has(g.key)) next.delete(g.key);
                          else next.add(g.key);
                          return next;
                        })
                      }
                    />
                    {!plegado && (
                      <div className="mt-2 flex flex-col gap-2">
                        {g.key !== "sin-fecha" && <APreparar pedidos={g.pedidos} />}
                        {g.pedidos.map((p) => (
                          <FilaRecogida
                            key={p.id}
                            p={p}
                            mostrarFecha={g.key === "atrasados"}
                            onAbrir={() => setAbierto(p.id)}
                            onUpdate={(c) => void actualizar(p.id, c)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <HistorialPedidos pedidos={pedidos} query={query} abierto={abierto} onAbrir={setAbierto} />
      )}

      <PedidoDrawer
        pedido={pedidoAbierto}
        onClose={() => setAbierto(null)}
        onUpdate={(id, c) => void actualizar(id, c)}
        onDelete={(p) => void borrar(p)}
      />
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
      notas_internas: notas.trim() || null,
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
        <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas internas" className={inputClass} />
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
