"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bot, Clock, Eye, MessageCircle, MousePointerClick, Repeat, ShoppingCart, Trash2, Users } from "lucide-react";
import { getProductById } from "@/data/products";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { BarList, ColumnChart, Funnel, Heatmap, ProjectionChart, TrendChart, type ProjectionPoint } from "../charts";
import {
  DEVICE_LABELS,
  PAGE_LABELS,
  SOURCE_LABELS,
  contactos,
  desdeRango,
  embudo,
  porDiaSemana,
  productosEnCesta,
  resumenAsistente,
  resumenVisitas,
  serie,
  variacion,
  type Rango,
  type Visita,
} from "../report-data";
import { Card, CardTitle, Empty, Loading, PanelHeader, Segmented, Stat, btnGhost, dec, traerTodo } from "../shared";
import { DIAS_LARGOS, anomalias, mapaCalor, pctTxt, picoMapa, prever } from "./analitica";
import { Hallazgos, MiniBarra, TablaMetricas, type Hallazgo } from "./ui";

export const RANGOS: { value: `${Rango}`; label: string }[] = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
  { value: "365", label: "12 meses" },
];

const MIN_SESIONES = 5; // por debajo, un porcentaje no dice nada

interface Sesion {
  id: string;
  fuente: Visita["source_category"];
  dispositivo: Visita["device_type"];
  entrada: string;
  salida: string;
  paginas: number;
  cesta: boolean;
  pago: boolean;
  whatsapp: boolean;
  recurrente: boolean;
  inicio: number;
  fin: number;
  anadidos: string[];
}

// Una fila por sesión: de dónde vino, por dónde entró y salió y hasta dónde llegó.
function sesiones(visitas: Visita[]): Sesion[] {
  const m = new Map<string, Sesion>();
  for (const v of visitas) {
    const t = new Date(v.created_at).getTime();
    let s = m.get(v.session_id);
    if (!s) {
      s = {
        id: v.session_id,
        fuente: v.source_category,
        dispositivo: v.device_type,
        entrada: v.path,
        salida: v.path,
        paginas: 0,
        cesta: false,
        pago: false,
        whatsapp: false,
        recurrente: v.is_returning,
        inicio: t,
        fin: t,
        anadidos: [],
      };
      m.set(v.session_id, s);
    }
    s.fin = Math.max(s.fin, t);
    if (v.event_type === "pageview") {
      if (s.paginas === 0) {
        s.entrada = v.path;
        s.fuente = v.source_category;
      }
      s.paginas++;
      s.salida = v.path;
    } else if (v.event_type === "add_to_cart") {
      s.cesta = true;
      if (v.label) s.anadidos.push(v.label);
    } else if (v.event_type === "checkout_start") s.pago = true;
    else if (v.event_type === "whatsapp_click") s.whatsapp = true;
  }
  return [...m.values()].filter((s) => s.paginas > 0);
}

function segmentar(lista: Sesion[], clave: (s: Sesion) => string) {
  const m = new Map<string, Sesion[]>();
  for (const s of lista) m.set(clave(s), [...(m.get(clave(s)) ?? []), s]);
  return [...m.entries()]
    .map(([k, l]) => ({
      k,
      n: l.length,
      rebote: l.filter((s) => s.paginas === 1).length / l.length,
      cesta: l.filter((s) => s.cesta).length / l.length,
      pago: l.filter((s) => s.pago).length / l.length,
      contacto: l.filter((s) => s.whatsapp).length / l.length,
    }))
    .sort((a, b) => b.n - a.n);
}

const pagina = (p: string) => PAGE_LABELS[p] ?? (p.startsWith("/producto/") ? getProductById(p.slice(10))?.name ?? p : p);
const mediana = (l: number[]) => {
  if (!l.length) return 0;
  const s = [...l].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const duracion = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s`);

export function InformesPanel() {
  const [rango, setRango] = useState<`${Rango}`>("30");
  const [datos, setDatos] = useState<{ actual: Visita[]; previo: Visita[]; pedidos: number; pedidosPrevios: number } | null>(null);
  const [enDirecto, setEnDirecto] = useState<{ sesiones: number; paginas: string[] } | null>(null);
  const dias = Number(rango) as Rango;

  useEffect(() => {
    setDatos(null);
    const desde = desdeRango(dias);
    const desdePrevio = new Date(desde);
    desdePrevio.setDate(desdePrevio.getDate() - dias);
    const db = amwayDb();
    Promise.all([
      traerTodo<Visita>((a, b) =>
        db
          .from("amway_visitas")
          .select("session_id, event_type, path, label, referrer, source_category, utm_campaign, device_type, is_returning, created_at")
          .gte("created_at", desdePrevio.toISOString())
          .order("created_at", { ascending: true })
          .order("id")
          .range(a, b)
      ),
      db
        .from("amway_pedidos")
        .select("created_at")
        .eq("origen", "web")
        .in("estado", ["pagado", "enviado", "entregado"])
        .gte("created_at", desdePrevio.toISOString()),
    ]).then(([v, p]) => {
      const todas = v;
      const ped = (p.data as { created_at: string }[] | null) ?? [];
      setDatos({
        actual: todas.filter((x) => new Date(x.created_at) >= desde),
        previo: todas.filter((x) => new Date(x.created_at) < desde),
        pedidos: ped.filter((x) => new Date(x.created_at) >= desde).length,
        pedidosPrevios: ped.filter((x) => new Date(x.created_at) < desde).length,
      });
    });
  }, [dias]);

  // Quién está en la tienda ahora (actividad en los últimos 5 min), cada minuto.
  useEffect(() => {
    let vivo = true;
    const mirar = async () => {
      const { data } = await amwayDb()
        .from("amway_visitas")
        .select("session_id, path, created_at")
        .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString())
        .order("created_at", { ascending: false });
      if (!vivo) return;
      const l = (data as { session_id: string; path: string }[] | null) ?? [];
      const ult = new Map<string, string>();
      for (const r of l) if (!ult.has(r.session_id)) ult.set(r.session_id, r.path);
      setEnDirecto({ sesiones: ult.size, paginas: [...ult.values()] });
    };
    void mirar();
    const t = setInterval(mirar, 60_000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  const data = useMemo(() => {
    if (!datos) return null;
    const { actual, previo } = datos;
    const res = resumenVisitas(actual);
    const resPrevio = resumenVisitas(previo);
    const ses = sesiones(actual);
    const porMes = dias > 90;

    // Visitantes únicos por día/mes.
    const vistos = new Map<string, Set<string>>();
    const serieVisitantes = serie(
      actual.filter((v) => v.event_type === "pageview"),
      dias,
      (v) => v.created_at,
      (v) => {
        const k = v.created_at.slice(0, porMes ? 7 : 10);
        if (!vistos.has(k)) vistos.set(k, new Set());
        const set = vistos.get(k)!;
        if (set.has(v.session_id)) return 0;
        set.add(v.session_id);
        return 1;
      }
    );

    // Previsión: solo con serie diaria.
    const horizonte = dias === 7 ? 7 : 14;
    const inicio = desdeRango(dias);
    const prev = porMes ? null : prever(serieVisitantes.map((p) => p.value), horizonte, (inicio.getDay() + 6) % 7);
    const proyeccion: ProjectionPoint[] = serieVisitantes.map((p, i) => ({
      label: p.label,
      real: p.value,
      prevision: prev && i === serieVisitantes.length - 1 ? p.value : null,
      rango: prev && i === serieVisitantes.length - 1 ? [p.value, p.value] : null,
    }));
    if (prev) {
      prev.valores.forEach((v, h) => {
        const d = new Date();
        d.setDate(d.getDate() + h + 1);
        proyeccion.push({
          label: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
          real: null,
          prevision: v,
          rango: [prev.bajo[h], prev.alto[h]],
        });
      });
    }
    const raras = porMes ? [] : anomalias(serieVisitantes.map((p) => p.value)).filter((a) => a.z > 0);

    const calor = mapaCalor(
      actual.filter((v) => v.event_type === "pageview"),
      (v) => v.created_at,
      (v) => v.session_id
    );

    const fuentes = segmentar(ses, (s) => s.fuente);
    const dispositivos = segmentar(ses, (s) => s.dispositivo ?? "desktop");
    const entradas = segmentar(ses, (s) => s.entrada).slice(0, 8);
    const nuevosVsRec = segmentar(ses, (s) => (s.recurrente ? "Recurrentes" : "Nuevos"));
    const salidas = (() => {
      const m = new Map<string, number>();
      for (const s of ses) m.set(s.salida, (m.get(s.salida) ?? 0) + 1);
      return [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([p, value]) => ({ label: pagina(p), value }));
    })();

    const conCesta = ses.filter((s) => s.cesta);
    const abandonadas = conCesta.filter((s) => !s.pago);
    const abandonados = (() => {
      const m = new Map<string, number>();
      for (const s of abandonadas) for (const id of new Set(s.anadidos)) m.set(id, (m.get(id) ?? 0) + 1);
      return [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, value]) => ({ label: getProductById(id)?.name ?? id, value }));
    })();
    const duraciones = ses.filter((s) => s.paginas > 1).map((s) => s.fin - s.inicio);

    const conversion = res.sesiones ? datos.pedidos / res.sesiones : 0;
    const conversionPrevia = resPrevio.sesiones ? datos.pedidosPrevios / resPrevio.sesiones : 0;

    // ---- Hallazgos ----
    const h: Hallazgo[] = [];
    const dVis = variacion(res.sesiones, resPrevio.sesiones);
    if (dVis != null && resPrevio.sesiones >= MIN_SESIONES)
      h.push({
        tono: dVis >= 5 ? "bueno" : dVis <= -5 ? "malo" : "info",
        titulo: `${dVis >= 0 ? "+" : ""}${dVis.toFixed(0)} % de visitantes frente a los ${dias} días anteriores`,
        detalle: `${res.sesiones} ahora frente a ${resPrevio.sesiones} antes.`,
      });
    if (prev && res.sesiones >= MIN_SESIONES)
      h.push({
        tono: prev.tendenciaSemanal > 0.05 ? "bueno" : prev.tendenciaSemanal < -0.05 ? "malo" : "info",
        titulo: `Próximos ${horizonte} días: unos ${Math.round(prev.total)} visitantes`,
        detalle: `Entre ${Math.round(prev.totalBajo)} y ${Math.round(prev.totalAlto)} (80 % de confianza). Tendencia ${prev.tendenciaSemanal >= 0 ? "+" : ""}${(prev.tendenciaSemanal * 100).toFixed(0)} % por semana · fiabilidad ${prev.fiabilidad}.`,
      });
    const pico = picoMapa(calor);
    if (pico)
      h.push({
        tono: "info",
        titulo: `Más visitas los ${DIAS_LARGOS[pico.dia]} a las ${pico.hora}:00`,
        detalle: "Buen momento para publicar en redes, lanzar anuncios o tener el WhatsApp a mano.",
      });
    const fuentesUtiles = fuentes.filter((f) => f.n >= MIN_SESIONES);
    if (fuentesUtiles.length > 1) {
      const mejor = [...fuentesUtiles].sort((a, b) => b.cesta - a.cesta)[0];
      const peor = [...fuentesUtiles].sort((a, b) => a.cesta - b.cesta)[0];
      if (mejor.cesta > 0 && mejor.k !== peor.k)
        h.push({
          tono: "bueno",
          titulo: `${SOURCE_LABELS[mejor.k as Visita["source_category"]]} trae el tráfico de más calidad`,
          detalle: `${pctTxt(mejor.cesta)} añade a la cesta, frente a ${pctTxt(peor.cesta)} de ${SOURCE_LABELS[peor.k as Visita["source_category"]]}.`,
        });
    }
    const peorEntrada = entradas.filter((e) => e.n >= MIN_SESIONES).sort((a, b) => b.rebote - a.rebote)[0];
    if (peorEntrada && peorEntrada.rebote >= 0.6)
      h.push({
        tono: "aviso",
        titulo: `«${pagina(peorEntrada.k)}» pierde al ${pctTxt(peorEntrada.rebote)} de quien entra por ella`,
        detalle: `${peorEntrada.n} sesiones empezaron ahí y se fueron sin ver otra página. Revisa el título, la primera pantalla y la velocidad.`,
      });
    if (conCesta.length >= 3)
      h.push({
        tono: abandonadas.length / conCesta.length > 0.7 ? "malo" : "info",
        titulo: `${pctTxt(abandonadas.length / conCesta.length)} de las cestas se abandonan`,
        detalle: `${abandonadas.length} de ${conCesta.length} sesiones añadieron algo y no llegaron a pagar${abandonados[0] ? `; lo que más se queda: ${abandonados[0].label}` : ""}.`,
      });
    const movil = dispositivos.find((d) => d.k === "mobile");
    const escritorio = dispositivos.find((d) => d.k === "desktop");
    if (movil && escritorio && movil.n >= MIN_SESIONES && escritorio.n >= MIN_SESIONES && Math.abs(movil.cesta - escritorio.cesta) > 0.05)
      h.push({
        tono: movil.cesta < escritorio.cesta ? "aviso" : "info",
        titulo: `En móvil se añade a la cesta ${movil.cesta < escritorio.cesta ? "menos" : "más"} que en ordenador`,
        detalle: `${pctTxt(movil.cesta)} en móvil frente a ${pctTxt(escritorio.cesta)} en escritorio. ${movil.cesta < escritorio.cesta ? "Revisa la ficha de producto en móvil." : ""}`,
      });
    for (const a of raras.slice(0, 2))
      h.push({
        tono: "info",
        titulo: `Pico de visitas el ${serieVisitantes[a.indice].label}`,
        detalle: `${serieVisitantes[a.indice].value} visitantes, ${a.z.toFixed(1)} desviaciones por encima de lo normal. ¿Hubo publicación, anuncio o campaña?`,
      });

    return {
      res,
      resPrevio,
      porMes,
      serieVisitantes,
      proyeccion,
      prev,
      calor,
      fuentes,
      dispositivos,
      entradas,
      salidas,
      nuevosVsRec,
      abandonados,
      conCesta: conCesta.length,
      abandonadas: abandonadas.length,
      duracionMediana: mediana(duraciones),
      conversion,
      conversionPrevia,
      semana: porDiaSemana(actual),
      embudo: embudo(actual, datos.pedidos),
      cesta: productosEnCesta(actual),
      contactos: contactos(actual),
      asistente: resumenAsistente(actual),
      campanas: (() => {
        const m = new Map<string, Set<string>>();
        for (const v of actual) {
          if (!v.utm_campaign) continue;
          if (!m.has(v.utm_campaign)) m.set(v.utm_campaign, new Set());
          m.get(v.utm_campaign)!.add(v.session_id);
        }
        return Array.from(m.entries())
          .map(([label, s]) => ({ label, value: s.size }))
          .sort((a, b) => b.value - a.value);
      })(),
      hallazgos: h,
    };
  }, [datos, dias]);

  async function borrarVisitas() {
    if (!confirm("¿Borrar TODAS las visitas registradas? No se puede deshacer.")) return;
    await amwayDb().from("amway_visitas").delete().gte("created_at", "1970-01-01");
    setDatos((d) => d && { ...d, actual: [], previo: [] });
  }

  const tablaSegmento = (l: ReturnType<typeof segmentar>, nombre: (k: string) => string) =>
    l.map((s) => [
      nombre(s.k),
      s.n,
      <span key="r" className={cn(s.n >= MIN_SESIONES && s.rebote >= 0.6 && "text-red-600")}>{pctTxt(s.rebote)}</span>,
      <span key="c" className="inline-flex items-center justify-end gap-2">
        <MiniBarra valor={s.cesta} max={Math.max(...l.map((x) => x.cesta), 0.01)} />
        {pctTxt(s.cesta)}
      </span>,
      pctTxt(s.pago),
    ]);
  const COLS = [{ titulo: "Segmento" }, { titulo: "Sesiones", derecha: true }, { titulo: "Rebote", derecha: true }, { titulo: "Cesta", derecha: true }, { titulo: "A pagar", derecha: true }];

  return (
    <div>
      <PanelHeader
        title="Visitas y comportamiento"
        description="Analítica propia de la tienda, comparada con el periodo anterior y con previsión. Solo cuenta a quien acepta las cookies, así que las cifras reales son algo mayores."
        actions={
          <>
            <span
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm",
                enDirecto?.sesiones ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-carbon/[0.08] bg-white text-stone"
              )}
              title={enDirecto?.paginas.map(pagina).join(" · ") || "Nadie en los últimos 5 minutos"}
            >
              <span className={cn("h-2 w-2 rounded-full", enDirecto?.sesiones ? "animate-pulse bg-emerald-500" : "bg-carbon/20")} />
              <span className="tabular-nums">{enDirecto?.sesiones ?? "–"}</span> en la web ahora
            </span>
            <Segmented value={rango} onChange={setRango} options={RANGOS} />
          </>
        }
      />

      {!data ? (
        <Loading />
      ) : data.res.sesiones === 0 ? (
        <Empty icon={<Activity size={18} />}>
          Todavía no hay visitas en este periodo. Se registran en cuanto un visitante acepta las cookies.
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <Stat label="Visitantes" value={data.res.sesiones} icon={<Users size={15} />} delta={variacion(data.res.sesiones, data.resPrevio.sesiones)} hint="vs. anterior" />
            <Stat label="Páginas vistas" value={data.res.paginas} icon={<Eye size={15} />} delta={variacion(data.res.paginas, data.resPrevio.paginas)} />
            <Stat
              label="Págs. / sesión"
              value={dec(data.res.paginasPorSesion)}
              icon={<MousePointerClick size={15} />}
              delta={variacion(data.res.paginasPorSesion, data.resPrevio.paginasPorSesion)}
            />
            <Stat label="Rebote" value={pctTxt(data.res.rebote)} hint={`antes ${pctTxt(data.resPrevio.rebote)}`} tone={data.res.rebote > 0.7 ? "bad" : undefined} />
            <Stat label="Conversión" value={pctTxt(data.conversion, 1)} icon={<ShoppingCart size={15} />} hint={`antes ${pctTxt(data.conversionPrevia, 1)}`} />
            <Stat label="Duración" value={duracion(data.duracionMediana)} icon={<Clock size={15} />} hint="Mediana, si ven 2+ págs." />
          </div>

          <Hallazgos items={data.hallazgos} />

          <Card>
            <CardTitle>
              Visitantes {data.porMes ? "por mes" : "por día"}
              {data.prev && <span className="ml-2 font-normal normal-case tracking-normal text-stone">· línea discontinua = previsión con banda del 80 %</span>}
            </CardTitle>
            {data.prev ? <ProjectionChart data={data.proyeccion} name="Visitantes" height={260} /> : <TrendChart data={data.serieVisitantes} name="Visitantes" height={260} />}
          </Card>

          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <Card>
              <CardTitle>Cuándo entran (día y hora)</CardTitle>
              <Heatmap data={data.calor} />
            </Card>
            <Card>
              <CardTitle>Día de la semana</CardTitle>
              <ColumnChart data={data.semana} name="Visitantes por día de la semana" height={190} />
            </Card>
          </div>

          <Card>
            <CardTitle>Calidad del tráfico por fuente</CardTitle>
            <TablaMetricas columnas={COLS} filas={tablaSegmento(data.fuentes, (k) => SOURCE_LABELS[k as Visita["source_category"]] ?? k)} />
            {data.campanas.length > 0 && (
              <>
                <p className="mb-3 mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">Campañas (utm)</p>
                <BarList items={data.campanas.slice(0, 5)} />
              </>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>Por dispositivo</CardTitle>
              <TablaMetricas columnas={COLS} filas={tablaSegmento(data.dispositivos, (k) => DEVICE_LABELS[k as keyof typeof DEVICE_LABELS] ?? k)} />
            </Card>
            <Card>
              <CardTitle>Nuevos y recurrentes</CardTitle>
              <TablaMetricas columnas={COLS} filas={tablaSegmento(data.nuevosVsRec, (k) => k)} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <Card>
              <CardTitle>Páginas de entrada</CardTitle>
              <TablaMetricas columnas={[{ titulo: "Página" }, ...COLS.slice(1)]} filas={tablaSegmento(data.entradas, pagina)} />
            </Card>
            <Card>
              <CardTitle>Dónde se van</CardTitle>
              <BarList items={data.salidas} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>Embudo de compra</CardTitle>
              <Funnel steps={data.embudo} />
              <p className="mt-4 text-xs text-stone">
                Conversión global: <span className="font-medium text-carbon">{pctTxt(data.conversion, 1)}</span> de las sesiones acaban en pedido web pagado.
              </p>
            </Card>
            <Card>
              <CardTitle>Cestas abandonadas</CardTitle>
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-display text-[2rem] leading-none tabular-nums text-carbon">{data.conCesta ? pctTxt(data.abandonadas / data.conCesta) : "—"}</span>
                <span className="text-xs text-stone">
                  {data.abandonadas} de {data.conCesta} sesiones con cesta no fueron a pagar
                </span>
              </div>
              <BarList items={data.abandonados} empty="Nadie ha dejado productos en la cesta." />
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
            </Card>
          </div>

          <AsistenteCard datos={data.asistente} />

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

const pct = (x: number | null) => (x == null ? "—" : `${(x * 100).toFixed(0)} %`);

function AsistenteCard({ datos }: { datos: ReturnType<typeof resumenAsistente> }) {
  const sinDatos = datos.conversaciones === 0 && datos.derivaciones === 0;
  return (
    <Card>
      <CardTitle>
        <span className="inline-flex items-center gap-1.5">
          <Bot size={13} /> Asistente del botón de WhatsApp
        </span>
      </CardTitle>
      {sinDatos ? (
        <p className="text-sm text-stone">
          Todavía no hay conversaciones en este periodo. Se registran cuando el visitante acepta las cookies.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label="Conversaciones" value={datos.conversaciones} icon={<Bot size={15} />} hint={`${datos.preguntas} preguntas`} />
            <Stat label="Escritas a mano" value={datos.escritas} hint={`${datos.sinRespuesta} sin respuesta`} />
            <Stat label="Le fue útil" value={pct(datos.satisfaccion)} hint="De quienes valoraron la respuesta" />
            <Stat
              label="Pasan a WhatsApp"
              value={pct(datos.tasaDerivacion)}
              icon={<MessageCircle size={15} />}
              hint={`${datos.derivaciones} clics`}
            />
            <Stat label="Añadidos a la cesta" value={datos.anadidos} hint="Desde el asistente" icon={<Repeat size={15} />} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">Lo que más se pregunta</p>
              <BarList items={datos.temas} empty="Aún no hay preguntas." />
            </div>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">Respuestas a mejorar</p>
              <BarList items={datos.peorValorados} empty="Nadie ha marcado una respuesta como no útil." />
            </div>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">Desde dónde pasan a WhatsApp</p>
              <BarList items={datos.derivacionesPorOrigen} empty="Nadie ha pasado a WhatsApp desde el asistente." />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
