"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import type { AdminView, Pendientes } from "./AdminApp";
import { calcular, type Resultado } from "./ContabilidadPanel";
import { Badge, Card, ESTADO_PEDIDO, PanelHeader, Stat, eur, fecha, type Gasto, type Pedido } from "./shared";

export function ResumenPanel({ onNavigate, pendientes }: { onNavigate: (v: AdminView) => void; pendientes: Pendientes }) {
  const [mes, setMes] = useState<Resultado | null>(null);
  const [hoy, setHoy] = useState<Resultado | null>(null);
  const [ultimos, setUltimos] = useState<Pedido[] | null>(null);
  const [agotados, setAgotados] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const inicioDia = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const db = amwayDb();
    Promise.all([
      db.from("amway_pedidos").select("*").gte("created_at", inicioMes).order("created_at", { ascending: false }),
      db.from("amway_gastos").select("*").gte("fecha", inicioMes.slice(0, 10)),
      db.from("amway_pedidos").select("*").order("created_at", { ascending: false }).limit(6),
      db.from("amway_productos").select("product_id", { count: "exact", head: true }).eq("agotado", true),
    ]).then(([pm, gm, ult, ag]) => {
      const pedidosMes = (pm.data as Pedido[] | null) ?? [];
      setMes(calcular(pedidosMes, (gm.data as Gasto[] | null) ?? []));
      setHoy(calcular(pedidosMes.filter((p) => p.created_at >= inicioDia), []));
      setUltimos((ult.data as Pedido[] | null) ?? []);
      setAgotados(ag.count ?? 0);
    });
  }, []);

  const nombreMes = new Date().toLocaleDateString("es-ES", { month: "long" });

  return (
    <div>
      <PanelHeader title="Resumen" description={`Hoy es ${new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}.`} />

      {!mes || !hoy ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Ventas hoy" value={eur(hoy.ventas)} hint={`${hoy.pedidos} pedidos`} />
            <Stat label={`Ventas en ${nombreMes}`} value={eur(mes.ventas)} hint={`${mes.pedidos} pedidos`} />
            <Stat label={`Resultado ${nombreMes}`} value={eur(mes.beneficioNeto)} tone={mes.beneficioNeto >= 0 ? "good" : "bad"} hint="Tras coste, comisiones y gastos" />
            <Stat label="Productos agotados" value={agotados ?? "—"} hint="Marcados en Productos" />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { view: "pedidos" as const, n: pendientes.pedidos, label: "Pedidos pagados por enviar" },
              { view: "solicitudes" as const, n: pendientes.solicitudes, label: "Solicitudes sin atender" },
              { view: "resenas" as const, n: pendientes.resenas, label: "Reseñas por revisar" },
            ].map((t) => (
              <button
                key={t.view}
                type="button"
                onClick={() => onNavigate(t.view)}
                className="group flex items-center justify-between rounded-2xl border border-carbon/8 bg-white p-5 text-left transition hover:border-carbon/20"
              >
                <div>
                  <p className="font-display text-3xl tabular-nums text-carbon">{t.n}</p>
                  <p className="text-sm text-stone">{t.label}</p>
                </div>
                <ArrowRight size={18} className="text-stone transition group-hover:translate-x-1 group-hover:text-carbon" />
              </button>
            ))}
          </div>

          <Card className="mt-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-stone">Últimos pedidos</p>
              <button type="button" onClick={() => onNavigate("pedidos")} className="text-xs text-forest hover:underline">
                Ver todos
              </button>
            </div>
            {ultimos?.length === 0 ? (
              <p className="text-sm text-stone">Aún no hay pedidos. Los pagos con tarjeta de la web aparecerán aquí solos.</p>
            ) : (
              <ul className="divide-y divide-carbon/5">
                {ultimos?.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                    <span className="font-medium tabular-nums text-carbon">#{p.numero}</span>
                    <span className="min-w-0 flex-1 truncate text-carbon">{p.cliente_nombre || "Sin nombre"}</span>
                    <span className="text-xs text-stone">{fecha(p.created_at, true)}</span>
                    <Badge tone={ESTADO_PEDIDO[p.estado].tone}>{ESTADO_PEDIDO[p.estado].label}</Badge>
                    <span className="w-20 text-right tabular-nums text-carbon">{eur(p.total_eur)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
