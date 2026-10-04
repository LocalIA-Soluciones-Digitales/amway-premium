"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  ChevronRight,
  ClipboardList,
  Clock,
  HandCoins,
  Megaphone,
  MessageSquareQuote,
  PackageCheck,
  PackageX,
  Truck,
} from "lucide-react";
import { getProductById } from "@/data/products";
import { amwayDb } from "@/lib/amway-db";
import { hoyMadrid, sumarDias } from "@/lib/recogida";
import { cn } from "@/lib/utils";
import { APreparar, CabeceraGrupo, FilaRecogida, Miniaturas, agruparPorDia, esActivo, resumenGrupo } from "./recogidas";
import type { Pendientes } from "./AdminApp";
import { ColumnChart } from "./charts";
import { calcular } from "./ContabilidadPanel";
import { anuncioVigente, cargarEstadisticas, type EstadisticaAnuncio } from "./AnunciosPanel";
import { imagenAnuncio, type Anuncio } from "@/lib/anuncios";
import { PedidoDrawer } from "./PedidoDrawer";
import { pedidosValidos, variacion } from "./report-data";
import { Badge, Card, CardTitle, ESTADO_PEDIDO, Kpi, Loading, eur, fecha, type Gasto, type Pedido, type ProductoAjusteRow } from "./shared";

export type GestionTab = "hoy" | "pedidos" | "clientes" | "productos" | "solicitudes" | "contabilidad" | "resenas" | "anuncios";

function saludo() {
  const h = new Date().getHours();
  return h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

// Minutos que faltan para una hora HH:MM de hoy (negativo si ya pasó).
function minutosHasta(hora: string): number {
  const now = new Date();
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5)) - (now.getHours() * 60 + now.getMinutes());
}

function enCuanto(min: number): string {
  if (min <= 0) return min > -30 ? "ahora" : "ya debería haber llegado";
  if (min < 60) return `en ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `en ${h} h${m ? ` ${m} min` : ""}`;
}

const eurCorto = (n: number) => eur(n).replace(",00", "");

export function HoyPanel({
  onNavigate,
  onChange,
  pendientes,
  nombre,
}: {
  onNavigate: (v: GestionTab) => void;
  onChange?: () => void;
  pendientes: Pendientes;
  nombre?: string | null;
}) {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [recogidas, setRecogidas] = useState<Pedido[] | null>(null);
  const [gastosMes, setGastosMes] = useState<Gasto[]>([]);
  const [productos, setProductos] = useState<ProductoAjusteRow[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [anuncio, setAnuncio] = useState<{ a: Anuncio | null; stats?: EstadisticaAnuncio; cola: number } | null>(null);

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

  useEffect(() => {
    const now = new Date();
    // Desde el día 1 del mes anterior: cubre mes actual, mes previo y 14 días.
    const desde = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const db = amwayDb();
    Promise.all([
      db.from("amway_pedidos").select("*").gte("created_at", desde.toISOString()).order("created_at", { ascending: false }).limit(5000),
      db.from("amway_gastos").select("*").gte("fecha", new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)),
      db.from("amway_productos").select("*").eq("agotado", true),
    ]).then(([p, g, pr]) => {
      setPedidos((p.data as Pedido[] | null) ?? []);
      setGastosMes((g.data as Gasto[] | null) ?? []);
      // Solo productos que siguen en el catálogo.
      setProductos(((pr.data as ProductoAjusteRow[] | null) ?? []).filter((r) => getProductById(r.product_id)));
    });
  }, []);

  useEffect(() => {
    Promise.all([amwayDb().from("amway_anuncios").select("*").order("updated_at", { ascending: false }), cargarEstadisticas()]).then(
      ([{ data }, st]) => {
        const vigentes = ((data as Anuncio[] | null) ?? []).filter((a) => anuncioVigente(a));
        setAnuncio({ a: vigentes[0] ?? null, stats: vigentes[0] ? st[vigentes[0].id] : undefined, cola: Math.max(0, vigentes.length - 1) });
      }
    );
  }, []);

  async function actualizar(id: string, cambios: Partial<Pedido>) {
    const aplicar = (prev: Pedido[] | null) => prev?.map((p) => (p.id === id ? { ...p, ...cambios } : p)) ?? null;
    setRecogidas(aplicar);
    setPedidos(aplicar);
    await amwayDb().from("amway_pedidos").update(cambios).eq("id", id);
    onChange?.();
  }

  async function borrar(p: Pedido) {
    if (!confirm(`¿Borrar definitivamente el pedido #${p.numero}? Si solo quieres anularlo, márcalo como cancelado.`)) return;
    await amwayDb().from("amway_pedidos").delete().eq("id", p.id);
    const quitar = (prev: Pedido[] | null) => prev?.filter((x) => x.id !== p.id) ?? null;
    setRecogidas(quitar);
    setPedidos(quitar);
    setAbierto(null);
    onChange?.();
  }

  const pedidoAbierto = (abierto && (recogidas?.find((p) => p.id === abierto) ?? pedidos?.find((p) => p.id === abierto))) || null;

  const grupos = useMemo(() => (recogidas ? agruparPorDia(recogidas).filter((g) => g.key !== "sin-fecha") : []), [recogidas]);
  const hoyKey = hoyMadrid();
  const grupoHoy = grupos.find((g) => g.key === hoyKey);
  const atrasados = grupos.find((g) => g.key === "atrasados");
  const manana = grupos.find((g) => g.key === sumarDias(hoyKey, 1));

  // La siguiente persona que viene hoy y aún no ha recogido.
  const siguiente = useMemo(() => {
    const lista = (grupoHoy?.pedidos ?? []).filter((p) => esActivo(p) && p.recogida_hora);
    return lista.find((p) => minutosHasta(p.recogida_hora!) > -30) ?? null;
  }, [grupoHoy]);

  const porCobrarHoy = useMemo(
    () => resumenGrupo([...(grupoHoy?.pedidos ?? []), ...(atrasados?.pedidos ?? [])]).porCobrar,
    [grupoHoy, atrasados]
  );

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
    const mananaD = new Date(inicioHoy);
    mananaD.setDate(mananaD.getDate() + 1);

    const hoy = calcular(entre(inicioHoy, mananaD), []);
    const ayer = calcular(entre(inicioAyer, inicioHoy), []);
    const mes = calcular(entre(inicioMes, mananaD), gastosMes);
    const mesPrevio = calcular(entre(inicioMesPrevio, mismoDiaMesPrevio), []);

    const dias = Array.from({ length: 14 }, (_, i) => {
      const a = new Date(inicioHoy);
      a.setDate(a.getDate() - (13 - i));
      const b = new Date(a);
      b.setDate(b.getDate() + 1);
      const val = pedidosValidos(entre(a, b));
      return {
        label: a.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        value: val.reduce((s, p) => s + Number(p.total_eur), 0),
        n: val.length,
      };
    });

    return { hoy, ayer, mes, mesPrevio, dias, ultimos: pedidos.slice(0, 6) };
  }, [pedidos, gastosMes]);

  const nombreMes = new Date().toLocaleDateString("es-ES", { month: "long" });
  const agotados = productos.filter((p) => p.agotado);

  const tareas = [
    { tab: "pedidos" as const, n: pendientes.pedidos, label: "Pedidos por preparar, entregar o cobrar", icon: Truck },
    { tab: "solicitudes" as const, n: pendientes.solicitudes, label: "Solicitudes sin contestar", icon: ClipboardList },
    { tab: "resenas" as const, n: pendientes.resenas, label: "Reseñas por revisar", icon: MessageSquareQuote },
  ];

  const nHoy = grupoHoy ? resumenGrupo(grupoHoy.pedidos).activos : 0;
  const nAtrasados = atrasados?.pedidos.length ?? 0;
  const nManana = manana ? resumenGrupo(manana.pedidos).activos : 0;
  const fechaHoy = (() => {
    const s = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  const abrir = (p: Pedido) => setAbierto(p.id);

  return (
    <div>
      {/* Cabecera: saludo y el día de un vistazo */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-stone">{fechaHoy}</p>
          <h2 className="mt-1 font-display text-[2.1rem] leading-tight text-carbon">
            {saludo()}
            {nombre ? `, ${nombre.split(" ")[0]}` : ""}.
          </h2>
        </div>
        {recogidas && (
          <div className="flex flex-wrap gap-2">
            <Resumen icon={<CalendarCheck2 size={14} />} n={nHoy} label={nHoy === 1 ? "recogida hoy" : "recogidas hoy"} />
            {nAtrasados > 0 && <Resumen icon={<AlertTriangle size={14} />} n={nAtrasados} label="atrasada" plural="atrasadas" tone="red" />}
            <Resumen icon={<Clock size={14} />} n={nManana} label="mañana" />
            {porCobrarHoy > 0 && <Resumen icon={<HandCoins size={14} />} n={eur(porCobrarHoy)} label="por cobrar" tone="amber" />}
          </div>
        )}
      </div>

      {!d || !recogidas ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            {/* Agenda de recogidas */}
            <Card className="min-w-0 p-4 sm:p-5">
              <CardTitle
                action={
                  <button type="button" onClick={() => onNavigate("pedidos")} className="inline-flex items-center gap-1 text-xs text-forest hover:underline">
                    Agenda completa <ArrowRight size={12} />
                  </button>
                }
              >
                Recogidas
              </CardTitle>

              {siguiente && (
                <button
                  type="button"
                  onClick={() => abrir(siguiente)}
                  className="mb-5 flex w-full flex-wrap items-center gap-4 rounded-2xl bg-carbon p-4 text-left text-cream transition hover:bg-carbon-soft"
                >
                  <span className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/60">Siguiente</span>
                    <span className="font-display text-3xl leading-none tabular-nums">{siguiente.recogida_hora}</span>
                    <span className="mt-1 text-xs text-gold-soft">{enCuanto(minutosHasta(siguiente.recogida_hora!))}</span>
                  </span>
                  <Miniaturas p={siguiente} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">{siguiente.cliente_nombre || "Sin nombre"}</span>
                    <span className="mt-0.5 block truncate text-xs text-cream/70">
                      {siguiente.items.reduce((s, i) => s + i.cantidad, 0)} ud. · {eur(siguiente.total_eur)}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium",
                        siguiente.preparado_at ? "bg-forest-soft/40 text-cream" : "bg-amber-400/90 text-carbon"
                      )}
                    >
                      {siguiente.preparado_at ? "Bolsa preparada" : "Falta preparar"}
                    </span>
                    {siguiente.estado === "pendiente" && (
                      <span className="rounded-full bg-cream/15 px-2.5 py-1 text-[11px] font-medium">Cobrar {eur(siguiente.total_eur)}</span>
                    )}
                  </span>
                </button>
              )}

              {grupos.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-carbon/15 py-10 text-center text-sm text-stone">
                  <CalendarCheck2 size={22} className="text-stone/60" />
                  Nadie viene a recoger hoy ni mañana.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {!grupoHoy && (
                    <div className="flex items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3 text-sm text-stone">
                      <CalendarCheck2 size={16} className="text-forest" /> Hoy no viene nadie a recoger.
                    </div>
                  )}
                  {grupos.map((g) => (
                    <section key={g.key} className="flex flex-col gap-2">
                      <CabeceraGrupo g={g} />
                      {g.key === hoyKey && <APreparar pedidos={g.pedidos} />}
                      {g.pedidos.map((p) => (
                        <FilaRecogida
                          key={p.id}
                          p={p}
                          mostrarFecha={g.key === "atrasados"}
                          onAbrir={() => abrir(p)}
                          onUpdate={(c) => void actualizar(p.id, c)}
                        />
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </Card>

            {/* Pendiente y disponibilidad */}
            <div className="flex flex-col gap-4">
              <Card className="p-2">
                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">Pendiente</p>
                <ul>
                  {tareas.map(({ tab, n, label, icon: Icon }) => (
                    <li key={tab}>
                      <button
                        type="button"
                        onClick={() => onNavigate(tab)}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-cream"
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            n > 0 ? "bg-carbon text-cream" : "bg-cream text-stone"
                          )}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1 text-sm text-carbon">{label}</span>
                        <span className={cn("font-display text-xl tabular-nums", n > 0 ? "text-carbon" : "text-stone/50")}>{n}</span>
                        <ChevronRight size={15} className="text-stone/50 transition group-hover:translate-x-0.5 group-hover:text-carbon" />
                      </button>
                    </li>
                  ))}
                </ul>
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
                {agotados.length === 0 ? (
                  <div className="flex items-center gap-3 text-sm text-stone">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest/10 text-forest">
                      <PackageCheck size={16} />
                    </span>
                    Todo disponible.
                  </div>
                ) : (
                  <ul className="flex flex-col divide-y divide-carbon/[0.06] text-sm">
                    {agotados.slice(0, 6).map((p) => (
                      <li key={p.product_id} className="flex items-center justify-between gap-3 py-2">
                        <span className="flex min-w-0 items-center gap-2 text-carbon">
                          <PackageX size={14} className="shrink-0 text-stone" />
                          <span className="truncate">{getProductById(p.product_id)?.name ?? p.product_id}</span>
                        </span>
                        <Badge tone="red">Agotado</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {anuncio && <AnuncioEnWeb {...anuncio} onAbrir={() => onNavigate("anuncios")} />}
            </div>
          </div>

          {/* Cifras */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Ventas hoy"
              value={eur(d.hoy.ventas)}
              delta={variacion(d.hoy.ventas, d.ayer.ventas)}
              hint="vs. ayer"
              spark={d.dias.map((x) => x.value)}
            />
            <Kpi
              label="Pedidos hoy"
              value={String(d.hoy.pedidos)}
              delta={variacion(d.hoy.pedidos, d.ayer.pedidos)}
              hint="vs. ayer"
              spark={d.dias.map((x) => x.n)}
            />
            <Kpi
              label={`Ventas ${nombreMes}`}
              value={eur(d.mes.ventas)}
              delta={variacion(d.mes.ventas, d.mesPrevio.ventas)}
              hint="vs. mismo día del mes pasado"
            />
            <Kpi
              label={`Beneficio ${nombreMes}`}
              value={eur(d.mes.beneficioNeto)}
              tone={d.mes.beneficioNeto >= 0 ? "good" : "bad"}
              hint="tras coste, comisiones y gastos"
              onClick={() => onNavigate("contabilidad")}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <Card>
              <CardTitle
                action={
                  <button type="button" onClick={() => onNavigate("contabilidad")} className="text-xs text-forest hover:underline">
                    Ver contabilidad
                  </button>
                }
              >
                Ventas · últimos 14 días
              </CardTitle>
              <ColumnChart data={d.dias} name="Ventas por día" format={eurCorto} height={220} />
            </Card>

            <Card className="p-2">
              <div className="flex items-center justify-between px-3 pb-1 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">Últimos pedidos</p>
                <button type="button" onClick={() => onNavigate("pedidos")} className="text-xs text-forest hover:underline">
                  Ver todos
                </button>
              </div>
              {d.ultimos.length === 0 ? (
                <p className="px-3 py-4 text-sm text-stone">Aún no hay pedidos. Los de la web aparecerán aquí solos.</p>
              ) : (
                <ul>
                  {d.ultimos.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => abrir(p)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-cream"
                      >
                        <Miniaturas p={p} size={36} max={2} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-carbon">
                            <span className="tabular-nums text-stone">#{p.numero}</span> {p.cliente_nombre || "Sin nombre"}
                          </span>
                          <span className="block text-[11px] text-stone">{fecha(p.created_at, true)}</span>
                        </span>
                        <span className="flex flex-col items-end gap-0.5">
                          <span className="text-sm font-medium tabular-nums text-carbon">{eur(p.total_eur)}</span>
                          <Badge tone={ESTADO_PEDIDO[p.estado].tone}>{ESTADO_PEDIDO[p.estado].label}</Badge>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
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

function Resumen({
  icon,
  n,
  label,
  plural,
  tone,
}: {
  icon: ReactNode;
  n: number | string;
  label: string;
  plural?: string;
  tone?: "red" | "amber";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm",
        tone === "red"
          ? "border-red-200 bg-red-50 text-red-700"
          : tone === "amber"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-carbon/[0.08] bg-white text-carbon"
      )}
    >
      <span className="opacity-70">{icon}</span>
      <span className="font-semibold tabular-nums">{n}</span>
      <span className="opacity-80">{plural && n !== 1 ? plural : label}</span>
    </span>
  );
}

// Qué pop-up ven ahora los clientes al entrar en la web, y cómo funciona.
function AnuncioEnWeb({ a, stats, cola, onAbrir }: { a: Anuncio | null; stats?: EstadisticaAnuncio; cola: number; onAbrir: () => void }) {
  const imagen = a ? imagenAnuncio(a) : null;
  return (
    <Card>
      <CardTitle
        action={
          <button type="button" onClick={onAbrir} className="text-xs text-forest hover:underline">
            {a ? "Gestionar" : "Crear anuncio"}
          </button>
        }
      >
        Anuncio en la web
      </CardTitle>
      {a ? (
        <button type="button" onClick={onAbrir} className="flex w-full items-center gap-3 text-left">
          <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-linen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {imagen && <img src={imagen} alt="" className={a.imagen_url ? "h-full w-full object-cover" : "h-full w-full object-contain p-1"} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-carbon">{a.titulo}</span>
            <span className="block text-xs text-stone">
              {stats && stats.vistos > 0 ? `Visto por ${stats.vistos} · ${stats.clics} pulsaron el botón` : "Aún sin visitas registradas"}
              {cola > 0 && ` · ${cola} más en cola`}
            </span>
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3 text-sm text-stone">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-stone">
            <Megaphone size={16} />
          </span>
          Ahora no sale ningún anuncio al entrar en la web.
        </div>
      )}
    </Card>
  );
}
