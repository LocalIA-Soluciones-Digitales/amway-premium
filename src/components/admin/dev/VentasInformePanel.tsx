"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Euro, Printer, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { SITE } from "@/data/site-config";
import { BarList, TrendChart } from "../charts";
import { calcular } from "../ContabilidadPanel";
import { desdeRango, pedidosValidos, serie, variacion, ventasPor, type Rango } from "../report-data";
import { Card, CardTitle, Loading, METODO_PAGO, PanelHeader, Segmented, Stat, btnGhost, btnPrimary, dec, downloadCsv, eur, type Gasto, type Pedido } from "../shared";
import { RANGOS } from "./InformesPanel";

export function VentasInformePanel() {
  const [rango, setRango] = useState<`${Rango}`>("30");
  const dias = Number(rango) as Rango;
  const [datos, setDatos] = useState<{ pedidos: Pedido[]; previos: Pedido[]; gastos: Gasto[]; sesiones: number } | null>(null);

  useEffect(() => {
    setDatos(null);
    const desde = desdeRango(dias);
    const desdePrevio = new Date(desde);
    desdePrevio.setDate(desdePrevio.getDate() - dias);
    const db = amwayDb();
    Promise.all([
      db.from("amway_pedidos").select("*").gte("created_at", desdePrevio.toISOString()).order("created_at").limit(10000),
      db.from("amway_gastos").select("*").gte("fecha", desde.toISOString().slice(0, 10)).limit(5000),
      db.from("amway_visitas").select("session_id").eq("event_type", "pageview").gte("created_at", desde.toISOString()).limit(50000),
    ]).then(([p, g, v]) => {
      const todos = (p.data as Pedido[] | null) ?? [];
      setDatos({
        pedidos: todos.filter((x) => new Date(x.created_at) >= desde),
        previos: todos.filter((x) => new Date(x.created_at) < desde),
        gastos: (g.data as Gasto[] | null) ?? [],
        sesiones: new Set(((v.data as { session_id: string }[] | null) ?? []).map((x) => x.session_id)).size,
      });
    });
  }, [dias]);

  const r = useMemo(() => {
    if (!datos) return null;
    const actual = calcular(datos.pedidos, datos.gastos);
    const previo = calcular(datos.previos, []);
    const validos = pedidosValidos(datos.pedidos);
    const web = validos.filter((p) => p.origen === "web").length;
    const topProductos = (() => {
      const m = new Map<string, { value: number; uds: number }>();
      for (const p of validos)
        for (const i of p.items) {
          const k = [i.nombre, i.formato].filter(Boolean).join(" · ");
          const cur = m.get(k) ?? { value: 0, uds: 0 };
          cur.value += Number(i.precio_eur) * i.cantidad;
          cur.uds += i.cantidad;
          m.set(k, cur);
        }
      return Array.from(m.entries())
        .sort((a, b) => b[1].value - a[1].value)
        .slice(0, 10)
        .map(([label, v]) => ({ label, value: v.value, hint: `${v.uds} uds.` }));
    })();
    const metodos = (() => {
      const m = new Map<string, number>();
      for (const p of validos) m.set(METODO_PAGO[p.metodo_pago], (m.get(METODO_PAGO[p.metodo_pago]) ?? 0) + Number(p.total_eur));
      return Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, value]) => ({ label, value }));
    })();
    return {
      actual,
      previo,
      ticket: actual.pedidos ? actual.ventas / actual.pedidos : 0,
      ticketPrevio: previo.pedidos ? previo.ventas / previo.pedidos : 0,
      conversion: datos.sesiones ? (web / datos.sesiones) * 100 : null,
      serie: serie(validos, dias, (p) => p.created_at, (p) => Number(p.total_eur)),
      categorias: ventasPor(datos.pedidos, "category"),
      marcas: ventasPor(datos.pedidos, "brand").slice(0, 8),
      topProductos,
      metodos,
    };
  }, [datos, dias]);

  const periodo = RANGOS.find((x) => x.value === rango)?.label ?? "";

  function exportar() {
    if (!datos) return;
    downloadCsv(`amway-informe-ventas-${rango}d.csv`, [
      ["Nº", "Fecha", "Estado", "Origen", "Método", "Cliente", "Unidades", "Total", "Envío"],
      ...datos.pedidos.map((p) => [
        p.numero,
        p.created_at.slice(0, 10),
        p.estado,
        p.origen,
        METODO_PAGO[p.metodo_pago],
        p.cliente_nombre,
        p.items.reduce((s, i) => s + i.cantidad, 0),
        Number(p.total_eur).toFixed(2).replace(".", ","),
        Number(p.envio_eur).toFixed(2).replace(".", ","),
      ]),
    ]);
  }

  return (
    <div>
      <PanelHeader
        title="Informe de ventas"
        description="Evolución de ingresos, qué se vende y cómo se paga, comparado con el periodo anterior de la misma duración."
        actions={
          <>
            <Segmented value={rango} onChange={setRango} options={RANGOS} />
            <button type="button" className={btnGhost} onClick={exportar} disabled={!datos}>
              <Download size={14} /> CSV
            </button>
            <button type="button" className={btnPrimary} onClick={() => window.print()} disabled={!datos}>
              <Printer size={14} /> Generar informe PDF
            </button>
          </>
        }
      />

      {!r ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Solo en el PDF / impresión */}
          <div className="hidden border-b border-carbon/15 pb-4 print:block">
            <p className="font-display text-2xl">
              {SITE.name} · Informe de ventas ({periodo})
            </p>
            <p className="text-xs text-stone">Generado el {new Date().toLocaleString("es-ES")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 print:grid-cols-4">
            <Stat
              label="Ingresos"
              value={eur(r.actual.ventas)}
              icon={<Euro size={15} />}
              delta={variacion(r.actual.ventas, r.previo.ventas)}
              hint="vs. periodo anterior"
            />
            <Stat
              label="Pedidos"
              value={r.actual.pedidos}
              icon={<ShoppingBag size={15} />}
              delta={variacion(r.actual.pedidos, r.previo.pedidos)}
              hint="vs. periodo anterior"
            />
            <Stat
              label="Ticket medio"
              value={eur(r.ticket)}
              icon={<Receipt size={15} />}
              delta={variacion(r.ticket, r.ticketPrevio)}
              hint="vs. periodo anterior"
            />
            <Stat
              label="Conversión web"
              value={r.conversion == null ? "—" : `${dec(r.conversion)} %`}
              icon={<TrendingUp size={15} />}
              hint="Pedidos web / visitantes"
            />
          </div>

          <Card>
            <CardTitle>Ingresos {dias > 90 ? "por mes" : "por día"}</CardTitle>
            <TrendChart data={r.serie} name="Ingresos" format={(n) => eur(n).replace(",00", "")} height={260} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-3 print:grid-cols-3">
            <Card>
              <CardTitle>Por categoría</CardTitle>
              <BarList items={r.categorias} format={eur} empty="Sin ventas en este periodo." />
            </Card>
            <Card>
              <CardTitle>Por marca</CardTitle>
              <BarList items={r.marcas} format={eur} empty="Sin ventas en este periodo." />
            </Card>
            <Card>
              <CardTitle>Por método de pago</CardTitle>
              <BarList items={r.metodos} format={eur} empty="Sin ventas en este periodo." />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr] print:grid-cols-[2fr_1fr]">
            <Card>
              <CardTitle>Productos que más facturan</CardTitle>
              <BarList items={r.topProductos} format={eur} empty="Sin ventas en este periodo." />
            </Card>
            <Card>
              <CardTitle>Cuenta de resultados</CardTitle>
              <dl className="flex flex-col gap-2 text-sm">
                {[
                  ["Ingresos", r.actual.ventas],
                  ["Coste mercancía", -r.actual.coste],
                  ["Comisiones (estim.)", -r.actual.comisiones],
                  ["Gastos", -r.actual.gastos],
                ].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between">
                    <dt className="text-stone">{l}</dt>
                    <dd className="tabular-nums text-carbon">{eur(v as number)}</dd>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t border-carbon/10 pt-2 font-medium">
                  <dt>Resultado</dt>
                  <dd className={r.actual.beneficioNeto >= 0 ? "tabular-nums text-forest" : "tabular-nums text-xs-red"}>
                    {eur(r.actual.beneficioNeto)}
                  </dd>
                </div>
              </dl>
              {r.actual.lineasSinCoste > 0 && (
                <p className="mt-3 text-xs text-stone">
                  {r.actual.lineasSinCoste} líneas vendidas sin coste configurado: el resultado real es menor.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
