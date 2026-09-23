"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import {
  CATEGORIA_GASTO,
  Card,
  Empty,
  METODO_PAGO,
  PanelHeader,
  Segmented,
  Stat,
  btnGhost,
  btnPrimary,
  downloadCsv,
  eur,
  fecha,
  inputClass,
  type Gasto,
  type Pedido,
} from "./shared";

// Stripe (tarjetas europeas estándar): 1,5 % + 0,25 € por cobro. Es una
// estimación para el cálculo; la cifra exacta está en el panel de Stripe.
const STRIPE_PCT = 0.015;
const STRIPE_FIJO = 0.25;

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export interface Resultado {
  pedidos: number;
  ventas: number;
  envios: number;
  coste: number;
  lineasSinCoste: number;
  comisiones: number;
  gastos: number;
  beneficioBruto: number;
  beneficioNeto: number;
}

export function calcular(pedidos: Pedido[], gastos: Gasto[]): Resultado {
  let ventas = 0;
  let envios = 0;
  let coste = 0;
  let lineasSinCoste = 0;
  let comisiones = 0;
  let n = 0;
  for (const p of pedidos) {
    if (p.estado === "cancelado" || p.estado === "pendiente") continue;
    n++;
    ventas += Number(p.total_eur);
    envios += Number(p.envio_eur);
    if (p.metodo_pago === "tarjeta" && p.origen === "web") comisiones += Number(p.total_eur) * STRIPE_PCT + STRIPE_FIJO;
    for (const i of p.items) {
      if (i.coste_eur == null) lineasSinCoste++;
      else coste += Number(i.coste_eur) * i.cantidad;
    }
  }
  const totalGastos = gastos.reduce((s, g) => s + Number(g.importe_eur), 0);
  const beneficioBruto = ventas - envios - coste;
  return {
    pedidos: n,
    ventas,
    envios,
    coste,
    lineasSinCoste,
    comisiones,
    gastos: totalGastos,
    beneficioBruto,
    beneficioNeto: ventas - coste - comisiones - totalGastos,
  };
}

type Modo = "mes" | "anio" | "todo";

function rango(modo: Modo, mes: string, anio: number): { desde: string | null; hasta: string | null } {
  if (modo === "todo") return { desde: null, hasta: null };
  if (modo === "anio") return { desde: `${anio}-01-01`, hasta: `${anio + 1}-01-01` };
  const [y, m] = mes.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { desde: `${mes}-01`, hasta: next };
}

export function ContabilidadPanel() {
  const hoy = new Date();
  const [modo, setModo] = useState<Modo>("mes");
  const [mes, setMes] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [gastos, setGastos] = useState<Gasto[] | null>(null);

  const { desde, hasta } = rango(modo, mes, anio);

  const cargar = useCallback(async () => {
    setPedidos(null);
    setGastos(null);
    const db = amwayDb();
    let qp = db.from("amway_pedidos").select("*").order("created_at", { ascending: false }).limit(5000);
    let qg = db.from("amway_gastos").select("*").order("fecha", { ascending: false }).limit(5000);
    if (desde && hasta) {
      qp = qp.gte("created_at", desde).lt("created_at", hasta);
      qg = qg.gte("fecha", desde).lt("fecha", hasta);
    }
    const [p, g] = await Promise.all([qp, qg]);
    setPedidos((p.data as Pedido[] | null) ?? []);
    setGastos((g.data as Gasto[] | null) ?? []);
  }, [desde, hasta]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const r = useMemo(() => (pedidos && gastos ? calcular(pedidos, gastos) : null), [pedidos, gastos]);

  const porMes = useMemo(() => {
    if (modo !== "anio" || !pedidos || !gastos) return null;
    return MESES.map((label, m) => {
      const ped = pedidos.filter((p) => new Date(p.created_at).getMonth() === m);
      const gas = gastos.filter((g) => Number(g.fecha.slice(5, 7)) - 1 === m);
      return { label, ...calcular(ped, gas) };
    });
  }, [modo, pedidos, gastos]);

  const porMetodo = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pedidos ?? []) {
      if (p.estado === "cancelado" || p.estado === "pendiente") continue;
      m.set(p.metodo_pago, (m.get(p.metodo_pago) ?? 0) + Number(p.total_eur));
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [pedidos]);

  const topProductos = useMemo(() => {
    const m = new Map<string, { nombre: string; unidades: number; ingresos: number; coste: number; sinCoste: boolean }>();
    for (const p of pedidos ?? []) {
      if (p.estado === "cancelado" || p.estado === "pendiente") continue;
      for (const i of p.items) {
        const key = `${i.product_id ?? i.nombre}|${i.formato ?? ""}`;
        const cur = m.get(key) ?? { nombre: [i.nombre, i.formato].filter(Boolean).join(" · "), unidades: 0, ingresos: 0, coste: 0, sinCoste: false };
        cur.unidades += i.cantidad;
        cur.ingresos += Number(i.precio_eur) * i.cantidad;
        if (i.coste_eur == null) cur.sinCoste = true;
        else cur.coste += Number(i.coste_eur) * i.cantidad;
        m.set(key, cur);
      }
    }
    return Array.from(m.values()).sort((a, b) => b.ingresos - a.ingresos).slice(0, 10);
  }, [pedidos]);

  function exportar() {
    if (!pedidos || !gastos) return;
    const etiqueta = modo === "mes" ? mes : modo === "anio" ? String(anio) : "todo";
    downloadCsv(`amway-ventas-${etiqueta}.csv`, [
      ["Nº", "Fecha", "Estado", "Origen", "Método", "Cliente", "Producto", "Formato", "Cantidad", "Precio ud.", "Coste ud.", "Total pedido", "Envío"],
      ...pedidos.flatMap((p) =>
        p.items.map((i, idx) => [
          p.numero,
          p.created_at.slice(0, 10),
          p.estado,
          p.origen,
          METODO_PAGO[p.metodo_pago],
          p.cliente_nombre,
          i.nombre,
          i.formato,
          i.cantidad,
          Number(i.precio_eur).toFixed(2).replace(".", ","),
          i.coste_eur == null ? "" : Number(i.coste_eur).toFixed(2).replace(".", ","),
          idx === 0 ? Number(p.total_eur).toFixed(2).replace(".", ",") : "",
          idx === 0 ? Number(p.envio_eur).toFixed(2).replace(".", ",") : "",
        ])
      ),
    ]);
    downloadCsv(`amway-gastos-${etiqueta}.csv`, [
      ["Fecha", "Concepto", "Categoría", "Importe", "Notas"],
      ...gastos.map((g) => [g.fecha, g.concepto, CATEGORIA_GASTO[g.categoria], Number(g.importe_eur).toFixed(2).replace(".", ","), g.notas]),
    ]);
  }

  const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - i);

  return (
    <div>
      <PanelHeader
        title="Contabilidad"
        description="Ventas, coste de mercancía, comisiones y gastos del periodo. Los pedidos pendientes o cancelados no cuentan."
        actions={
          <>
            <Segmented
              value={modo}
              onChange={setModo}
              options={[
                { value: "mes", label: "Mes" },
                { value: "anio", label: "Año" },
                { value: "todo", label: "Todo" },
              ]}
            />
            {modo === "mes" && (
              <input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} className={inputClass} aria-label="Mes" />
            )}
            {modo === "anio" && (
              <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className={inputClass} aria-label="Año">
                {anios.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
            <button type="button" className={btnGhost} onClick={exportar} disabled={!pedidos}>
              <Download size={14} /> CSV
            </button>
          </>
        }
      />

      {!r ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Ventas" value={eur(r.ventas)} hint={`${r.pedidos} pedidos · ticket medio ${eur(r.pedidos ? r.ventas / r.pedidos : 0)}`} />
            <Stat
              label="Coste mercancía"
              value={eur(r.coste)}
              hint={r.lineasSinCoste > 0 ? `${r.lineasSinCoste} líneas sin coste configurado` : "Todas las líneas con coste"}
            />
            <Stat label="Gastos + comisiones" value={eur(r.gastos + r.comisiones)} hint={`Comisiones Stripe estimadas ${eur(r.comisiones)}`} />
            <Stat
              label="Beneficio neto"
              value={eur(r.beneficioNeto)}
              tone={r.beneficioNeto >= 0 ? "good" : "bad"}
              hint={r.ventas > 0 ? `Margen ${((r.beneficioNeto / r.ventas) * 100).toFixed(0)} % sobre ventas` : undefined}
            />
          </div>

          <Card className="mt-3">
            <p className="mb-3 text-xs uppercase tracking-wider text-stone">Cuenta de resultados</p>
            <dl className="grid gap-y-1.5 text-sm sm:max-w-md">
              {[
                ["Ventas (con envío)", r.ventas],
                ["− Coste de la mercancía vendida", -r.coste],
                ["− Comisiones de pago (estimadas)", -r.comisiones],
                ["− Otros gastos", -r.gastos],
              ].map(([label, v]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-stone">{label}</dt>
                  <dd className="tabular-nums text-carbon">{eur(v as number)}</dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-carbon/10 pt-2 font-medium">
                <dt className="text-carbon">Resultado</dt>
                <dd className={cn("tabular-nums", r.beneficioNeto >= 0 ? "text-forest" : "text-xs-red")}>{eur(r.beneficioNeto)}</dd>
              </div>
            </dl>
          </Card>

          {porMes && (
            <Card className="mt-3 overflow-x-auto">
              <p className="mb-3 text-xs uppercase tracking-wider text-stone">Por mes · {anio}</p>
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-stone">
                    <th className="pb-2 font-normal">Mes</th>
                    <th className="pb-2 text-right font-normal">Pedidos</th>
                    <th className="pb-2 text-right font-normal">Ventas</th>
                    <th className="pb-2 text-right font-normal">Coste</th>
                    <th className="pb-2 text-right font-normal">Gastos</th>
                    <th className="pb-2 text-right font-normal">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {porMes.map((m) => (
                    <tr key={m.label} className="border-t border-carbon/5 tabular-nums">
                      <td className="py-1.5 text-carbon">{m.label}</td>
                      <td className="py-1.5 text-right text-stone">{m.pedidos || "—"}</td>
                      <td className="py-1.5 text-right">{m.ventas ? eur(m.ventas) : "—"}</td>
                      <td className="py-1.5 text-right text-stone">{m.coste ? eur(m.coste) : "—"}</td>
                      <td className="py-1.5 text-right text-stone">{m.gastos + m.comisiones ? eur(m.gastos + m.comisiones) : "—"}</td>
                      <td className={cn("py-1.5 text-right", m.beneficioNeto > 0 ? "text-forest" : m.beneficioNeto < 0 ? "text-xs-red" : "text-stone")}>
                        {m.ventas || m.gastos ? eur(m.beneficioNeto) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_20rem]">
            <Card className="overflow-x-auto">
              <p className="mb-3 text-xs uppercase tracking-wider text-stone">Productos más vendidos</p>
              {topProductos.length === 0 ? (
                <p className="text-sm text-stone">Sin ventas en este periodo.</p>
              ) : (
                <table className="w-full min-w-[28rem] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-stone">
                      <th className="pb-2 font-normal">Producto</th>
                      <th className="pb-2 text-right font-normal">Uds.</th>
                      <th className="pb-2 text-right font-normal">Ingresos</th>
                      <th className="pb-2 text-right font-normal">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductos.map((t) => (
                      <tr key={t.nombre} className="border-t border-carbon/5 tabular-nums">
                        <td className="max-w-[16rem] truncate py-1.5 pr-3 text-carbon" title={t.nombre}>
                          {t.nombre}
                        </td>
                        <td className="py-1.5 text-right text-stone">{t.unidades}</td>
                        <td className="py-1.5 text-right">{eur(t.ingresos)}</td>
                        <td className="py-1.5 text-right text-stone">{t.sinCoste ? "—" : eur(t.ingresos - t.coste)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card>
              <p className="mb-3 text-xs uppercase tracking-wider text-stone">Por método de pago</p>
              {porMetodo.length === 0 ? (
                <p className="text-sm text-stone">—</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {porMetodo.map(([m, v]) => (
                    <li key={m}>
                      <div className="flex justify-between">
                        <span className="text-carbon">{METODO_PAGO[m as keyof typeof METODO_PAGO]}</span>
                        <span className="tabular-nums text-carbon">{eur(v)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-carbon/5">
                        <div className="h-full rounded-full bg-forest" style={{ width: `${r.ventas ? (v / r.ventas) * 100 : 0}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <GastosSection gastos={gastos ?? []} onChange={cargar} />
        </>
      )}
    </div>
  );
}

function GastosSection({ gastos, onChange }: { gastos: Gasto[]; onChange: () => void }) {
  const [fechaG, setFechaG] = useState(new Date().toISOString().slice(0, 10));
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<Gasto["categoria"]>("mercancia");
  const [importe, setImporte] = useState("");
  const [saving, setSaving] = useState(false);

  async function add(e: FormEvent) {
    e.preventDefault();
    const n = Number(importe.replace(",", "."));
    if (!concepto.trim() || !Number.isFinite(n) || n < 0) return;
    setSaving(true);
    await amwayDb().from("amway_gastos").insert({ fecha: fechaG, concepto: concepto.trim(), categoria, importe_eur: n });
    setSaving(false);
    setConcepto("");
    setImporte("");
    onChange();
  }

  async function borrar(g: Gasto) {
    if (!confirm(`¿Borrar el gasto "${g.concepto}"?`)) return;
    await amwayDb().from("amway_gastos").delete().eq("id", g.id);
    onChange();
  }

  return (
    <div className="mt-8">
      <h2 className="font-display text-2xl text-carbon">Gastos</h2>
      <p className="mt-1 text-sm text-stone">Compras a Amway, envíos, publicidad, embalaje… todo lo que no es una venta.</p>

      <form onSubmit={add} className="mt-4 grid gap-2 rounded-2xl border border-carbon/8 bg-white p-4 sm:grid-cols-[9rem_1fr_12rem_8rem_auto]">
        <input type="date" value={fechaG} onChange={(e) => setFechaG(e.target.value)} className={inputClass} aria-label="Fecha" required />
        <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Concepto" maxLength={200} className={inputClass} required />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value as Gasto["categoria"])} className={inputClass} aria-label="Categoría">
          {Object.entries(CATEGORIA_GASTO).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <input inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} placeholder="Importe €" className={inputClass} required />
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Añadir
        </button>
      </form>

      {gastos.length === 0 ? (
        <div className="mt-3">
          <Empty>No hay gastos en este periodo.</Empty>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-carbon/8 bg-white">
          {gastos.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-carbon/5 px-4 py-3 text-sm last:border-0">
              <span className="w-24 text-stone">{fecha(g.fecha)}</span>
              <span className="min-w-0 flex-1 text-carbon">{g.concepto}</span>
              <span className="text-xs text-stone">{CATEGORIA_GASTO[g.categoria]}</span>
              <span className="w-24 text-right tabular-nums text-carbon">{eur(g.importe_eur)}</span>
              <button type="button" onClick={() => borrar(g)} aria-label="Borrar gasto" className="p-1 text-stone hover:text-xs-red">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
