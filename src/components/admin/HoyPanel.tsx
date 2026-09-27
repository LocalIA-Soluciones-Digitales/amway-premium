"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarCheck2, ClipboardList, Euro, MessageSquareQuote, PackageX, ShoppingBag, Truck } from "lucide-react";
import { getProductById } from "@/data/products";
import { amwayDb } from "@/lib/amway-db";
import { hoyMadrid, sumarDias } from "@/lib/recogida";
import { APreparar, CabeceraGrupo, FilaRecogida, agruparPorDia } from "./recogidas";
import type { Pendientes } from "./AdminApp";
import { ColumnChart } from "./charts";
import { calcular } from "./ContabilidadPanel";
import { pedidosValidos, variacion } from "./report-data";
import { Badge, Card, CardTitle, ESTADO_PEDIDO, Loading, Stat, eur, fecha, type Gasto, type Pedido, type ProductoAjusteRow } from "./shared";

export type GestionTab = "hoy" | "pedidos" | "clientes" | "productos" | "solicitudes" | "contabilidad" | "resenas";

function saludo() {
  const h = new Date().getHours();
  return h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

export function HoyPanel({
  onNavigate,
  onAbrirPedido,
  onChange,
  pendientes,
  nombre,
}: {
  onNavigate: (v: GestionTab) => void;
  onAbrirPedido?: (id: string) => void;
  onChange?: () => void;
  pendientes: Pendientes;
  nombre?: string | null;
}) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [recogidas, setRecogidas] = useState<Pedido[] | null>(null);

  // Recogidas de hoy (también las ya hechas), las atrasadas y las de mañana,
  // aunque el pedido se hiciera hace más de un mes.
  const cargarRecogidas = useCallback(async () => {
    const hoy = hoyMadrid();
    const { data } = await amwayDb()
      .from("amway_pedidos")
      .select("*")
      .not("recogida_fecha", "is", null)
      .lte("recogida_fecha", sumarDias(hoy, 1))
      .or(`estado.in.(pendiente,pagado,enviado),recogida_fecha.eq.${hoy}`)
      .limit(300);
    setRecogidas((data as Pedido[] | null) ?? []);
  }, []);

  useEffect(() => {
    void cargarRecogidas();
  }, [cargarRecogidas]);

  async function actualizarRecogida(id: string, cambios: Partial<Pedido>) {
    setRecogidas((prev) => prev?.map((p) => (p.id === id ? { ...p, ...cambios } : p)) ?? null);
    await amwayDb().from("amway_pedidos").update(cambios).eq("id", id);
    onChange?.();
  }

  const gruposRecogida = useMemo(() => (recogidas ? agruparPorDia(recogidas) : []), [recogidas]);
  const grupoHoy = gruposRecogida.find((g) => g.etiqueta === "Hoy");
  const [gastosMes, setGastosMes] = useState<Gasto[]>([]);
  const [productos, setProductos] = useState<ProductoAjusteRow[]>([]);

  useEffect(() => {
    const now = new Date();
    // Desde el día 1 del mes anterior: cubre mes actual, mes previo y 14 días.
    const desde = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const db = amwayDb();
    Promise.all([
      db.from("amway_pedidos").select("*").gte("created_at", desde.toISOString()).order("created_at", { ascending: false }).limit(5000),
      db.from("amway_gastos").select("*").gte("fecha", new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)),
      db.from("amway_productos").select("*").or("agotado.eq.true,stock.lte.3"),
    ]).then(([p, g, pr]) => {
      setPedidos((p.data as Pedido[] | null) ?? []);
      setGastosMes((g.data as Gasto[] | null) ?? []);
      setProductos((pr.data as ProductoAjusteRow[] | null) ?? []);
    });
  }, []);

  const d = useMemo(() => {
    if (!pedidos) return null;
    const now = new Date();
    const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inicioAyer = new Date(inicioHoy);
    inicioAyer.setDate(inicioAyer.getDate() - 1);
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicioMesPrevio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Mes anterior hasta el mismo día, para comparar "a igualdad de días".
    const mismoDiaMesPrevio = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate() + 1);
    const entre = (a: Date, b: Date) => pedidos.filter((p) => new Date(p.created_at) >= a && new Date(p.created_at) < b);
    const manana = new Date(inicioHoy);
    manana.setDate(manana.getDate() + 1);

    const hoy = calcular(entre(inicioHoy, manana), []);
    const ayer = calcular(entre(inicioAyer, inicioHoy), []);
    const mes = calcular(entre(inicioMes, manana), gastosMes);
    const mesPrevio = calcular(entre(inicioMesPrevio, mismoDiaMesPrevio), []);

    const dias = Array.from({ length: 14 }, (_, i) => {
      const a = new Date(inicioHoy);
      a.setDate(a.getDate() - (13 - i));
      const b = new Date(a);
      b.setDate(b.getDate() + 1);
      return {
        label: a.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        value: pedidosValidos(entre(a, b)).reduce((s, p) => s + Number(p.total_eur), 0),
      };
    });

    return { hoy, ayer, mes, mesPrevio, dias, ultimos: pedidos.slice(0, 6) };
  }, [pedidos, gastosMes]);

  const nombreMes = new Date().toLocaleDateString("es-ES", { month: "long" });
  const agotados = productos.filter((p) => p.agotado);
  const pocoStock = productos.filter((p) => !p.agotado && p.stock != null && p.stock <= 3);

  const tareas = [
    { tab: "pedidos" as const, n: pendientes.pedidos, label: "pedidos por preparar, entregar o cobrar", icon: Truck },
    { tab: "solicitudes" as const, n: pendientes.solicitudes, label: "solicitudes de clientes sin contestar", icon: ClipboardList },
    { tab: "resenas" as const, n: pendientes.resenas, label: "reseñas esperando revisión", icon: MessageSquareQuote },
  ];
  const hayTareas = tareas.some((t) => t.n > 0);

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-stone">
          {(() => {
            const s = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
            return s.charAt(0).toUpperCase() + s.slice(1);
          })()}
        </p>
        <h2 className="mt-1 font-display text-[2.1rem] leading-tight text-carbon">
          {saludo()}
          {nombre ? `, ${nombre.split(" ")[0]}` : ""}.
        </h2>
        <p className="mt-1 text-sm text-stone">
          {hayTareas ? "Esto es lo que tienes pendiente hoy." : "No tienes nada pendiente. Todo al día."}
        </p>
      </div>

      {!d ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            {tareas.map(({ tab, n, label, icon: Icon }) => (
              <button
                key={tab}
                type="button"
                onClick={() => onNavigate(tab)}
                className={
                  "group flex items-center gap-4 rounded-2xl border p-5 text-left transition " +
                  (n > 0
                    ? "border-carbon bg-carbon text-cream hover:bg-carbon-soft"
                    : "border-carbon/[0.07] bg-white text-carbon hover:border-carbon/20")
                }
              >
                <span
                  className={
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full " + (n > 0 ? "bg-cream/10" : "bg-cream text-stone")
                  }
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-3xl leading-none tabular-nums">{n}</p>
                  <p className={"mt-1 text-xs " + (n > 0 ? "text-cream/70" : "text-stone")}>{label}</p>
                </div>
                <ArrowRight size={18} className="shrink-0 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          <Card>
            <CardTitle
              action={
                <button type="button" onClick={() => onNavigate("pedidos")} className="text-xs text-forest hover:underline">
                  Ver agenda
                </button>
              }
            >
              Recogidas
            </CardTitle>
            {!recogidas ? (
              <Loading />
            ) : gruposRecogida.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-stone">
                <CalendarCheck2 size={20} className="text-stone/60" />
                Nadie viene a recoger hoy ni mañana.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {!grupoHoy && <p className="text-sm text-stone">Hoy no hay recogidas.</p>}
                {gruposRecogida.map((g) => (
                  <div key={g.key} className="flex flex-col gap-2">
                    <CabeceraGrupo g={g} />
                    {g.etiqueta === "Hoy" && <APreparar pedidos={g.pedidos} />}
                    {g.pedidos.map((p) => (
                      <FilaRecogida
                        key={p.id}
                        p={p}
                        mostrarFecha={g.key === "atrasados"}
                        abierto={false}
                        onAbrir={() => onAbrirPedido?.(p.id)}
                        onUpdate={(c) => void actualizarRecogida(p.id, c)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Ventas hoy" value={eur(d.hoy.ventas)} icon={<Euro size={15} />} delta={variacion(d.hoy.ventas, d.ayer.ventas)} hint="vs. ayer" />
            <Stat label="Pedidos hoy" value={d.hoy.pedidos} icon={<ShoppingBag size={15} />} delta={variacion(d.hoy.pedidos, d.ayer.pedidos)} hint="vs. ayer" />
            <Stat
              label={`Ventas ${nombreMes}`}
              value={eur(d.mes.ventas)}
              delta={variacion(d.mes.ventas, d.mesPrevio.ventas)}
              hint="vs. mismo punto del mes pasado"
            />
            <Stat
              label={`Resultado ${nombreMes}`}
              value={eur(d.mes.beneficioNeto)}
              tone={d.mes.beneficioNeto >= 0 ? "good" : "bad"}
              hint="Tras coste, comisiones y gastos"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardTitle
                action={
                  <button type="button" onClick={() => onNavigate("contabilidad")} className="text-xs text-forest hover:underline">
                    Ver contabilidad
                  </button>
                }
              >
                Ventas de los últimos 14 días
              </CardTitle>
              <ColumnChart data={d.dias} name="Ventas por día" format={(n) => eur(n).replace(",00", "")} height={220} />
            </Card>

            <Card>
              <CardTitle
                action={
                  <button type="button" onClick={() => onNavigate("productos")} className="text-xs text-forest hover:underline">
                    Gestionar
                  </button>
                }
              >
                Disponibilidad
              </CardTitle>
              {agotados.length === 0 && pocoStock.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-stone">
                  <PackageX size={20} className="text-stone/60" />
                  Ningún producto agotado ni con poco stock.
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-carbon/[0.06] text-sm">
                  {[...agotados, ...pocoStock].slice(0, 8).map((p) => (
                    <li key={p.product_id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0 truncate text-carbon">{getProductById(p.product_id)?.name ?? p.product_id}</span>
                      {p.agotado ? <Badge tone="red">Agotado</Badge> : <Badge tone="amber">Quedan {p.stock}</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <CardTitle
              action={
                <button type="button" onClick={() => onNavigate("pedidos")} className="text-xs text-forest hover:underline">
                  Ver todos
                </button>
              }
            >
              Últimos pedidos
            </CardTitle>
            {d.ultimos.length === 0 ? (
              <p className="py-4 text-sm text-stone">Aún no hay pedidos. Los pagos con tarjeta de la web aparecerán aquí solos.</p>
            ) : (
              <ul className="divide-y divide-carbon/[0.06]">
                {d.ultimos.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                    <span className="w-12 font-display text-base tabular-nums text-carbon">#{p.numero}</span>
                    <span className="min-w-0 flex-1 truncate text-carbon">{p.cliente_nombre || "Sin nombre"}</span>
                    <span className="text-xs text-stone">{fecha(p.created_at, true)}</span>
                    <Badge tone={ESTADO_PEDIDO[p.estado].tone}>{ESTADO_PEDIDO[p.estado].label}</Badge>
                    <span className="w-24 text-right font-medium tabular-nums text-carbon">{eur(p.total_eur)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
