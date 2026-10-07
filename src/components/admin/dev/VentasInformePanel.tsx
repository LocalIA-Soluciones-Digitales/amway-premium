"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Euro, Percent, Printer, Receipt, ShoppingBag, TrendingUp, UsersRound } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { SITE } from "@/data/site-config";
import { BarList, Heatmap, ProjectionChart, TrendChart, type ProjectionPoint } from "../charts";
import { calcular } from "../ContabilidadPanel";
import { desdeRango, pedidosValidos, serie, variacion, ventasPor, type Rango } from "../report-data";
import {
  Card,
  CardTitle,
  Loading,
  METODO_PAGO,
  PanelHeader,
  Segmented,
  Stat,
  btnGhost,
  btnPrimary,
  clienteKey,
  dec,
  downloadCsv,
  eur,
  type Gasto,
  type Pedido, traerTodo } from "../shared";
import { DIAS_LARGOS, mapaCalor, pctTxt, picoMapa, prever } from "./analitica";
import { RANGOS } from "./InformesPanel";
import { Hallazgos, TablaMetricas, type Hallazgo } from "./ui";

const DIA_MS = 86_400_000;
const SEMANAS_HISTORIA = 12;
const SEMANAS_PREVISION = 4;

const nombreLinea = (i: Pedido["items"][number]) => [i.nombre, i.formato].filter(Boolean).join(" · ");
const eurCorto = (n: number) => eur(n).replace(",00", "");

function unidadesPor(pedidos: Pedido[]) {
  const m = new Map<string, number>();
  for (const p of pedidos) for (const i of p.items) m.set(i.nombre, (m.get(i.nombre) ?? 0) + i.cantidad);
  return m;
}

export function VentasInformePanel() {
  const [rango, setRango] = useState<`${Rango}`>("30");
  const dias = Number(rango) as Rango;
  const [datos, setDatos] = useState<{ todos: Pedido[]; gastos: Gasto[]; sesiones: number } | null>(null);

  useEffect(() => {
    setDatos(null);
    const desde = desdeRango(dias);
    const db = amwayDb();
    Promise.all([
      // Todo el histórico: hace falta para clientes, recurrencia y previsión.
      traerTodo<Pedido>((a, b) => db.from("amway_pedidos").select("*").order("created_at").order("id").range(a, b)),
      traerTodo<Gasto>((a, b) =>
        db.from("amway_gastos").select("*").gte("fecha", desde.toISOString().slice(0, 10)).order("fecha").order("id").range(a, b)
      ),
      traerTodo<{ session_id: string }>((a, b) =>
        db.from("amway_visitas").select("session_id").eq("event_type", "pageview").gte("created_at", desde.toISOString()).order("id").range(a, b)
      ),
    ]).then(([p, g, v]) => {
      setDatos({
        todos: p,
        gastos: g,
        sesiones: new Set(v.map((x) => x.session_id)).size,
      });
    });
  }, [dias]);

  const r = useMemo(() => {
    if (!datos) return null;
    const desde = desdeRango(dias);
    const desdePrevio = new Date(desde.getTime() - dias * DIA_MS);
    const pedidos = datos.todos.filter((x) => new Date(x.created_at) >= desde);
    const previos = datos.todos.filter((x) => new Date(x.created_at) >= desdePrevio && new Date(x.created_at) < desde);
    const actual = calcular(pedidos, datos.gastos);
    const previo = calcular(previos, []);
    const validos = pedidosValidos(pedidos);
    const validosPrevios = pedidosValidos(previos);
    const todosValidos = pedidosValidos(datos.todos);
    const web = validos.filter((p) => p.origen === "web").length;

    // ---- Previsión semanal de ingresos ----
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const lunes = new Date(hoy.getTime() - ((hoy.getDay() + 6) % 7) * DIA_MS);
    const semanas = Array.from({ length: SEMANAS_HISTORIA }, (_, i) => {
      const ini = new Date(lunes.getTime() - (SEMANAS_HISTORIA - 1 - i) * 7 * DIA_MS);
      return { ini, label: ini.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), value: 0 };
    });
    for (const p of todosValidos) {
      const t = new Date(p.created_at).getTime();
      const s = semanas.findLast((w) => t >= w.ini.getTime());
      if (s && t < s.ini.getTime() + 7 * DIA_MS) s.value += Number(p.total_eur);
    }
    // La semana en curso está a medias: se proyecta por días transcurridos.
    const diasSemana = ((hoy.getDay() + 6) % 7) + 1;
    const historia = semanas.map((s, i) => (i === semanas.length - 1 ? (s.value * 7) / diasSemana : s.value));
    const primera = historia.findIndex((v) => v > 0);
    const util = primera < 0 ? [] : historia.slice(primera);
    const prev = util.length >= 3 ? prever(util, SEMANAS_PREVISION, 0, false) : null;
    const proyeccion: ProjectionPoint[] = semanas.map((s, i) => ({
      label: s.label,
      real: s.value,
      prevision: prev && i === semanas.length - 1 ? s.value : null,
      rango: prev && i === semanas.length - 1 ? [s.value, s.value] : null,
    }));
    if (prev)
      prev.valores.forEach((v, h) => {
        const ini = new Date(lunes.getTime() + (h + 1) * 7 * DIA_MS);
        proyeccion.push({ label: ini.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), real: null, prevision: v, rango: [prev.bajo[h], prev.alto[h]] });
      });
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const ventasMes = todosValidos
      .filter((p) => {
        const d = new Date(p.created_at);
        return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
      })
      .reduce((s, p) => s + Number(p.total_eur), 0);
    const ritmoDiario = prev ? prev.valores[0] / 7 : 0;
    const cierreMes = ventasMes + ritmoDiario * (finMes - hoy.getDate());

    // ---- Productos: en alza y en caída ----
    const uAct = unidadesPor(validos);
    const uPrev = unidadesPor(validosPrevios);
    const cambios = [...new Set([...uAct.keys(), ...uPrev.keys()])].map((k) => ({ k, a: uAct.get(k) ?? 0, b: uPrev.get(k) ?? 0 }));
    const enAlza = cambios
      .filter((c) => c.a > c.b)
      .sort((x, y) => y.a - y.b - (x.a - x.b))
      .slice(0, 5)
      .map((c) => ({ label: c.k, value: c.a - c.b, hint: `${c.b} → ${c.a} uds.` }));
    const enCaida = cambios
      .filter((c) => c.b > c.a)
      .sort((x, y) => y.b - y.a - (x.b - x.a))
      .slice(0, 5)
      .map((c) => ({ label: c.k, value: c.b - c.a, hint: `${c.b} → ${c.a} uds.` }));

    // ---- Se compran juntos (todo el histórico) ----
    const pares = new Map<string, number>();
    for (const p of todosValidos) {
      const nombres = [...new Set(p.items.map((i) => i.nombre))].sort();
      for (let i = 0; i < nombres.length; i++) for (let j = i + 1; j < nombres.length; j++) pares.set(`${nombres[i]} + ${nombres[j]}`, (pares.get(`${nombres[i]} + ${nombres[j]}`) ?? 0) + 1);
    }
    const juntos = [...pares.entries()]
      .filter(([, n]) => n > 1 || todosValidos.length < 30)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value, hint: `${value} pedido${value === 1 ? "" : "s"} con los dos` }));

    // ---- Clientes (todo el histórico) ----
    const clientes = new Map<string, { nombre: string; fechas: number[]; total: number }>();
    for (const p of todosValidos) {
      const k = clienteKey(p);
      if (!k) continue;
      const c = clientes.get(k) ?? { nombre: p.cliente_nombre || p.cliente_telefono || "Cliente", fechas: [], total: 0 };
      c.fechas.push(new Date(p.created_at).getTime());
      c.total += Number(p.total_eur);
      clientes.set(k, c);
    }
    const lc = [...clientes.values()];
    const repiten = lc.filter((c) => c.fechas.length > 1);
    const intervalos = repiten.flatMap((c) => c.fechas.slice(1).map((t, i) => (t - c.fechas[i]) / DIA_MS));
    const intervaloMedio = intervalos.length ? intervalos.reduce((a, b) => a + b, 0) / intervalos.length : null;
    const ahora = Date.now();
    const enRiesgo = lc
      .map((c) => {
        const ultima = c.fechas[c.fechas.length - 1];
        const propios = c.fechas.slice(1).map((t, i) => (t - c.fechas[i]) / DIA_MS);
        const esperado = propios.length ? propios.reduce((a, b) => a + b, 0) / propios.length : intervaloMedio ?? 45;
        return { ...c, sinComprar: (ahora - ultima) / DIA_MS, esperado };
      })
      .filter((c) => c.sinComprar > Math.max(c.esperado * 1.5, 30))
      .sort((a, b) => b.total - a.total);
    const primerPedido = new Map<string, number>();
    for (const [k, c] of clientes) primerPedido.set(k, c.fechas[0]);
    const clientesPeriodo = new Set(validos.map(clienteKey).filter(Boolean) as string[]);
    const nuevos = [...clientesPeriodo].filter((k) => (primerPedido.get(k) ?? 0) >= desde.getTime()).length;

    const metodos = (() => {
      const m = new Map<string, number>();
      for (const p of validos) m.set(METODO_PAGO[p.metodo_pago], (m.get(METODO_PAGO[p.metodo_pago]) ?? 0) + Number(p.total_eur));
      return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
    })();
    const topProductos = (() => {
      const m = new Map<string, { value: number; uds: number; coste: number; conCoste: boolean }>();
      for (const p of validos)
        for (const i of p.items) {
          const k = nombreLinea(i);
          const cur = m.get(k) ?? { value: 0, uds: 0, coste: 0, conCoste: true };
          cur.value += Number(i.precio_eur) * i.cantidad;
          cur.uds += i.cantidad;
          if (i.coste_eur == null) cur.conCoste = false;
          else cur.coste += Number(i.coste_eur) * i.cantidad;
          m.set(k, cur);
        }
      return [...m.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 10);
    })();
    const origen = [
      { label: "Web", value: validos.filter((p) => p.origen === "web").reduce((s, p) => s + Number(p.total_eur), 0) },
      { label: "Venta manual / WhatsApp", value: validos.filter((p) => p.origen === "manual").reduce((s, p) => s + Number(p.total_eur), 0) },
    ];
    const pendienteCobro = datos.todos.filter((p) => p.estado === "pendiente");
    const calor = mapaCalor(validos, (p) => p.created_at, (p) => p.id);
    const margen = actual.ventas ? (actual.ventas - actual.coste - actual.envios) / actual.ventas : null;
    const margenPrevio = previo.ventas ? (previo.ventas - previo.coste - previo.envios) / previo.ventas : null;
    const ticket = actual.pedidos ? actual.ventas / actual.pedidos : 0;
    const ticketPrevio = previo.pedidos ? previo.ventas / previo.pedidos : 0;

    // ---- Hallazgos ----
    const h: Hallazgo[] = [];
    const dIng = variacion(actual.ventas, previo.ventas);
    if (dIng != null)
      h.push({
        tono: dIng >= 5 ? "bueno" : dIng <= -5 ? "malo" : "info",
        titulo: `Ingresos ${dIng >= 0 ? "+" : ""}${dIng.toFixed(0)} % frente a los ${dias} días anteriores`,
        detalle: `${eur(actual.ventas)} ahora frente a ${eur(previo.ventas)} antes · ticket medio ${eur(ticket)}.`,
      });
    if (prev)
      h.push({
        tono: prev.tendenciaSemanal > 0.03 ? "bueno" : prev.tendenciaSemanal < -0.03 ? "malo" : "info",
        titulo: `Cierre de ${hoy.toLocaleDateString("es-ES", { month: "long" })} estimado: ${eurCorto(cierreMes)}`,
        detalle: `Llevas ${eurCorto(ventasMes)}. Próximas 4 semanas: ${eurCorto(prev.total)} (${eurCorto(prev.totalBajo)}–${eurCorto(prev.totalAlto)}), fiabilidad ${prev.fiabilidad}.`,
      });
    if (enAlza[0]) h.push({ tono: "bueno", titulo: `En alza: ${enAlza[0].label}`, detalle: `${enAlza[0].hint} respecto al periodo anterior. Asegura stock.` });
    if (enCaida[0]) h.push({ tono: "aviso", titulo: `En caída: ${enCaida[0].label}`, detalle: `${enCaida[0].hint}. ¿Precio, stock o temporada?` });
    if (lc.length >= 3)
      h.push({
        tono: repiten.length / lc.length >= 0.3 ? "bueno" : "info",
        titulo: `${pctTxt(repiten.length / lc.length)} de los clientes repite`,
        detalle: `${repiten.length} de ${lc.length}${intervaloMedio ? ` · vuelven de media cada ${Math.round(intervaloMedio)} días` : ""} · valor medio por cliente ${eur(lc.reduce((s, c) => s + c.total, 0) / lc.length)}.`,
      });
    if (enRiesgo.length)
      h.push({
        tono: "aviso",
        titulo: `${enRiesgo.length} cliente${enRiesgo.length === 1 ? "" : "s"} tarda${enRiesgo.length === 1 ? "" : "n"} más de lo normal en volver`,
        detalle: `${enRiesgo
          .slice(0, 3)
          .map((c) => c.nombre.split(" ")[0])
          .join(", ")}… Un WhatsApp a tiempo suele recuperar la compra.`,
      });
    if (pendienteCobro.length)
      h.push({
        tono: "aviso",
        titulo: `${eur(pendienteCobro.reduce((s, p) => s + Number(p.total_eur), 0))} pendientes de cobro`,
        detalle: `${pendienteCobro.length} pedido${pendienteCobro.length === 1 ? "" : "s"} en estado «pendiente» (no cuentan como ingresos).`,
      });
    const pico = picoMapa(calor);
    if (pico && validos.length >= 5) h.push({ tono: "info", titulo: `Se pide sobre todo los ${DIAS_LARGOS[pico.dia]} hacia las ${pico.hora}:00`, detalle: "Programa las publicaciones y ofertas un poco antes." });
    if (actual.lineasSinCoste > 0)
      h.push({ tono: "aviso", titulo: `${actual.lineasSinCoste} líneas vendidas sin coste`, detalle: "El margen y el resultado salen inflados. Configura el coste en Productos." });

    return {
      actual,
      previo,
      ticket,
      ticketPrevio,
      margen,
      margenPrevio,
      clientesPeriodo: clientesPeriodo.size,
      nuevos,
      conversion: datos.sesiones ? web / datos.sesiones : null,
      serie: serie(validos, dias, (p) => p.created_at, (p) => Number(p.total_eur)),
      proyeccion,
      prev,
      categorias: ventasPor(pedidos, "category"),
      marcas: ventasPor(pedidos, "brand").slice(0, 8),
      topProductos,
      metodos,
      origen,
      enAlza,
      enCaida,
      juntos,
      enRiesgo,
      calor,
      hallazgos: h,
      pedidos,
      lc,
      repiten,
      intervaloMedio,
    };
  }, [datos, dias]);

  const periodo = RANGOS.find((x) => x.value === rango)?.label ?? "";

  function exportar() {
    if (!r) return;
    downloadCsv(`amway-informe-ventas-${rango}d.csv`, [
      ["Nº", "Fecha", "Estado", "Origen", "Método", "Cliente", "Unidades", "Total", "Envío"],
      ...r.pedidos.map((p) => [
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
        description="Ingresos, márgenes, clientes y previsión, comparados con el periodo anterior de la misma duración."
        actions={
          <>
            <Segmented value={rango} onChange={setRango} options={RANGOS} />
            <button type="button" className={btnGhost} onClick={exportar} disabled={!r}>
              <Download size={14} /> CSV
            </button>
            <button type="button" className={btnPrimary} onClick={() => window.print()} disabled={!r}>
              <Printer size={14} /> PDF
            </button>
          </>
        }
      />

      {!r ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="hidden border-b border-carbon/15 pb-4 print:block">
            <p className="font-display text-2xl">
              {SITE.name} · Informe de ventas ({periodo})
            </p>
            <p className="text-xs text-stone">Generado el {new Date().toLocaleString("es-ES")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6 print:grid-cols-3">
            <Stat label="Ingresos" value={eurCorto(r.actual.ventas)} icon={<Euro size={15} />} delta={variacion(r.actual.ventas, r.previo.ventas)} hint="vs. anterior" />
            <Stat label="Pedidos" value={r.actual.pedidos} icon={<ShoppingBag size={15} />} delta={variacion(r.actual.pedidos, r.previo.pedidos)} />
            <Stat label="Ticket medio" value={eurCorto(r.ticket)} icon={<Receipt size={15} />} delta={variacion(r.ticket, r.ticketPrevio)} />
            <Stat
              label="Margen bruto"
              value={pctTxt(r.margen)}
              icon={<Percent size={15} />}
              hint={r.margenPrevio != null ? `antes ${pctTxt(r.margenPrevio)}` : "Ventas − coste − envíos"}
              tone={r.margen != null && r.margen < 0.15 ? "bad" : undefined}
            />
            <Stat label="Clientes" value={r.clientesPeriodo} icon={<UsersRound size={15} />} hint={`${r.nuevos} nuevos`} />
            <Stat label="Conversión web" value={r.conversion == null ? "—" : pctTxt(r.conversion, 1)} icon={<TrendingUp size={15} />} hint="Pedidos web / visitantes" />
          </div>

          <Hallazgos items={r.hallazgos} />

          <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
            <Card>
              <CardTitle>Ingresos {dias > 90 ? "por mes" : "por día"}</CardTitle>
              <TrendChart data={r.serie} name="Ingresos" format={eurCorto} height={240} />
            </Card>
            <Card>
              <CardTitle>Por semana y previsión a 4 semanas</CardTitle>
              {r.prev ? (
                <ProjectionChart data={r.proyeccion} name="Ingresos semanales" format={eurCorto} height={240} />
              ) : (
                <p className="text-sm text-stone">Hacen falta al menos 3 semanas con ventas para prever.</p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 print:grid-cols-3">
            <Card>
              <CardTitle>En alza</CardTitle>
              <BarList items={r.enAlza} format={(n) => `+${n} uds.`} empty="Nada sube respecto al periodo anterior." />
            </Card>
            <Card>
              <CardTitle>En caída</CardTitle>
              <BarList items={r.enCaida} format={(n) => `−${n} uds.`} empty="Nada baja respecto al periodo anterior." />
            </Card>
            <Card>
              <CardTitle>Se compran juntos</CardTitle>
              <BarList items={r.juntos} empty="Aún no hay pedidos con varios productos." />
              <p className="mt-3 text-[11px] text-stone">Ideas para packs y para recomendar en la cesta.</p>
            </Card>
          </div>

          <Card>
            <CardTitle>Productos que más facturan · margen</CardTitle>
            <TablaMetricas
              columnas={[{ titulo: "Producto" }, { titulo: "Uds.", derecha: true }, { titulo: "Ingresos", derecha: true }, { titulo: "Margen", derecha: true }]}
              filas={r.topProductos.map(([k, v]) => [
                k,
                v.uds,
                eur(v.value),
                v.conCoste && v.value ? (
                  <span key="m" className={(v.value - v.coste) / v.value < 0.15 ? "text-red-600" : "text-forest"}>
                    {pctTxt((v.value - v.coste) / v.value)}
                  </span>
                ) : (
                  <span key="m" className="text-stone">sin coste</span>
                ),
              ])}
              vacio="Sin ventas en este periodo."
            />
          </Card>

          <div className="grid gap-4 lg:grid-cols-[3fr_2fr] print:grid-cols-2">
            <Card>
              <CardTitle>Clientes que tardan en volver</CardTitle>
              <TablaMetricas
                columnas={[{ titulo: "Cliente" }, { titulo: "Pedidos", derecha: true }, { titulo: "Gastado", derecha: true }, { titulo: "Sin comprar", derecha: true }, { titulo: "Suele volver", derecha: true }]}
                filas={r.enRiesgo.slice(0, 8).map((c) => [c.nombre, c.fechas.length, eur(c.total), `${Math.round(c.sinComprar)} días`, `cada ${Math.round(c.esperado)} días`])}
                vacio="Nadie se está retrasando. 👌"
              />
              {r.lc.length > 0 && (
                <p className="mt-3 text-xs text-stone">
                  {r.lc.length} clientes en total · {r.repiten.length} repiten
                  {r.intervaloMedio != null && ` · intervalo medio entre compras ${Math.round(r.intervaloMedio)} días`}.
                </p>
              )}
            </Card>
            <Card>
              <CardTitle>Cuándo se hacen los pedidos</CardTitle>
              <Heatmap data={r.calor} unidad="pedidos" />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-4 print:grid-cols-4">
            <Card>
              <CardTitle>Por categoría</CardTitle>
              <BarList items={r.categorias} format={eur} empty="Sin ventas." />
            </Card>
            <Card>
              <CardTitle>Por marca</CardTitle>
              <BarList items={r.marcas} format={eur} empty="Sin ventas." />
            </Card>
            <Card>
              <CardTitle>Método de pago</CardTitle>
              <BarList items={r.metodos} format={eur} empty="Sin ventas." />
            </Card>
            <Card>
              <CardTitle>Canal</CardTitle>
              <BarList items={r.origen.filter((o) => o.value > 0)} format={eur} empty="Sin ventas." />
            </Card>
          </div>

          <Card>
            <CardTitle>Cuenta de resultados</CardTitle>
            <dl className="grid gap-x-10 gap-y-2 text-sm sm:grid-cols-2">
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
              <div className="flex justify-between border-t border-carbon/10 pt-2 font-medium sm:col-span-2">
                <dt>Resultado</dt>
                <dd className={r.actual.beneficioNeto >= 0 ? "tabular-nums text-forest" : "tabular-nums text-xs-red"}>
                  {eur(r.actual.beneficioNeto)}
                  {r.actual.ventas > 0 && <span className="ml-2 text-xs font-normal text-stone">{dec((r.actual.beneficioNeto / r.actual.ventas) * 100)} % de lo vendido</span>}
                </dd>
              </div>
            </dl>
            {r.actual.lineasSinCoste > 0 && (
              <p className="mt-3 text-xs text-stone">{r.actual.lineasSinCoste} líneas vendidas sin coste configurado: el resultado real es menor.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
