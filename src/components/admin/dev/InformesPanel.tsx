"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Eye, MessageCircle, MousePointerClick, Repeat, Trash2, Users } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { BarList, ColumnChart, Funnel, TrendChart } from "../charts";
import {
  contactos,
  desdeRango,
  embudo,
  paginasTop,
  porDiaSemana,
  porDispositivo,
  porFuente,
  productosEnCesta,
  resumenVisitas,
  serie,
  type Rango,
  type Visita,
} from "../report-data";
import { Card, CardTitle, Empty, Loading, PanelHeader, Segmented, Stat, btnGhost, dec } from "../shared";

export const RANGOS: { value: `${Rango}`; label: string }[] = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
  { value: "365", label: "12 meses" },
];

export function InformesPanel() {
  const [rango, setRango] = useState<`${Rango}`>("30");
  const [visitas, setVisitas] = useState<Visita[] | null>(null);
  const [pedidosWeb, setPedidosWeb] = useState(0);
  const dias = Number(rango) as Rango;

  useEffect(() => {
    setVisitas(null);
    const desde = desdeRango(dias).toISOString();
    const db = amwayDb();
    Promise.all([
      db
        .from("amway_visitas")
        .select("session_id, event_type, path, label, referrer, source_category, utm_campaign, device_type, is_returning, created_at")
        .gte("created_at", desde)
        .order("created_at", { ascending: true })
        .limit(50000),
      db
        .from("amway_pedidos")
        .select("id", { count: "exact", head: true })
        .eq("origen", "web")
        .in("estado", ["pagado", "enviado", "entregado"])
        .gte("created_at", desde),
    ]).then(([v, p]) => {
      setVisitas((v.data as Visita[] | null) ?? []);
      setPedidosWeb(p.count ?? 0);
    });
  }, [dias]);

  const data = useMemo(() => {
    if (!visitas) return null;
    const sesionesPorDia = new Map<string, Set<string>>();
    return {
      resumen: resumenVisitas(visitas),
      serie: serie(
        visitas.filter((v) => v.event_type === "pageview"),
        dias,
        (v) => v.created_at,
        (v) => {
          // Count each session once per bucket day.
          const k = `${v.created_at.slice(0, dias > 90 ? 7 : 10)}`;
          if (!sesionesPorDia.has(k)) sesionesPorDia.set(k, new Set());
          const set = sesionesPorDia.get(k)!;
          if (set.has(v.session_id)) return 0;
          set.add(v.session_id);
          return 1;
        }
      ),
      fuentes: porFuente(visitas),
      dispositivos: porDispositivo(visitas),
      paginas: paginasTop(visitas),
      semana: porDiaSemana(visitas),
      embudo: embudo(visitas, pedidosWeb),
      cesta: productosEnCesta(visitas),
      contactos: contactos(visitas),
      campanas: (() => {
        const m = new Map<string, Set<string>>();
        for (const v of visitas) {
          if (!v.utm_campaign) continue;
          if (!m.has(v.utm_campaign)) m.set(v.utm_campaign, new Set());
          m.get(v.utm_campaign)!.add(v.session_id);
        }
        return Array.from(m.entries())
          .map(([label, s]) => ({ label, value: s.size }))
          .sort((a, b) => b.value - a.value);
      })(),
    };
  }, [visitas, dias, pedidosWeb]);

  async function borrarVisitas() {
    if (!confirm("¿Borrar TODAS las visitas registradas? No se puede deshacer.")) return;
    await amwayDb().from("amway_visitas").delete().gte("created_at", "1970-01-01");
    setVisitas([]);
  }

  return (
    <div>
      <PanelHeader
        title="Visitas y comportamiento"
        description="Analítica propia de la tienda. Solo cuenta a quien acepta las cookies, así que las cifras reales son algo mayores."
        actions={<Segmented value={rango} onChange={setRango} options={RANGOS} />}
      />

      {!data ? (
        <Loading />
      ) : visitas!.length === 0 ? (
        <Empty icon={<Activity size={18} />}>
          Todavía no hay visitas en este periodo. Se registran en cuanto un visitante acepta las cookies.
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label="Visitantes" value={data.resumen.sesiones} icon={<Users size={15} />} hint="Sesiones únicas" />
            <Stat label="Páginas vistas" value={data.resumen.paginas} icon={<Eye size={15} />} />
            <Stat label="Págs. / sesión" value={dec(data.resumen.paginasPorSesion)} icon={<MousePointerClick size={15} />} />
            <Stat label="Rebote" value={`${(data.resumen.rebote * 100).toFixed(0)} %`} hint="Solo vieron 1 página" />
            <Stat label="Recurrentes" value={`${(data.resumen.recurrentes * 100).toFixed(0)} %`} icon={<Repeat size={15} />} />
          </div>

          <Card>
            <CardTitle>Visitantes {dias > 90 ? "por mes" : "por día"}</CardTitle>
            <TrendChart data={data.serie} name="Visitantes" height={260} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardTitle>De dónde vienen</CardTitle>
              <BarList items={data.fuentes} />
            </Card>
            <Card>
              <CardTitle>Dispositivo</CardTitle>
              <BarList items={data.dispositivos} />
            </Card>
            <Card>
              <CardTitle>Día de la semana</CardTitle>
              <ColumnChart data={data.semana} name="Visitantes por día de la semana" height={180} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>Embudo de compra</CardTitle>
              <Funnel steps={data.embudo} />
              <p className="mt-4 text-xs text-stone">
                Conversión global:{" "}
                <span className="font-medium text-carbon">
                  {dec(data.embudo[0].value ? (pedidosWeb / data.embudo[0].value) * 100 : 0)} %
                </span>{" "}
                de las sesiones acaban en pedido web.
              </p>
            </Card>
            <Card>
              <CardTitle>Páginas más vistas</CardTitle>
              <BarList items={data.paginas} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle>Productos más añadidos a la cesta</CardTitle>
              <BarList items={data.cesta} empty="Nadie ha añadido productos todavía en este periodo." />
            </Card>
            <Card>
              <CardTitle>Contactos</CardTitle>
              <ul className="flex flex-col divide-y divide-carbon/[0.06] text-sm">
                <li className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2 text-carbon">
                    <MessageCircle size={15} className="text-stone" /> Clics a WhatsApp
                  </span>
                  <span className="font-display text-xl tabular-nums">{data.contactos.whatsapp}</span>
                </li>
                <li className="flex items-center justify-between py-2.5">
                  <span className="text-carbon">Solicitudes enviadas</span>
                  <span className="font-display text-xl tabular-nums">{data.contactos.solicitudes}</span>
                </li>
                <li className="flex items-center justify-between py-2.5">
                  <span className="text-carbon">Reseñas enviadas</span>
                  <span className="font-display text-xl tabular-nums">{data.contactos.resenas}</span>
                </li>
              </ul>
              {data.campanas.length > 0 && (
                <>
                  <p className="mb-3 mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">Campañas (utm)</p>
                  <BarList items={data.campanas.slice(0, 5)} />
                </>
              )}
            </Card>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={borrarVisitas} className={`${btnGhost} text-xs text-stone`}>
              <Trash2 size={13} /> Borrar histórico de visitas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
