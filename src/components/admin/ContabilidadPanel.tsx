"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Download,
  HandCoins,
  Lightbulb,
  Loader2,
  Package,
  Plus,
  Repeat,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getProductById } from "@/data/products";
import { productImageSrc } from "@/data/types";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { BarList, ColumnChart, Donut, ForecastChart, type ForecastPoint } from "./charts";
import { CATEGORIA_LABEL, variacion } from "./report-data";
import {
  CATEGORIA_GASTO,
  Card,
  CardTitle,
  Empty,
  Kpi,
  METODO_PAGO,
  btnGhost,
  btnPrimary,
  dec,
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
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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

const cuenta = (p: Pedido) => p.estado !== "cancelado" && p.estado !== "pendiente";

export function calcular(pedidos: Pedido[], gastos: Gasto[]): Resultado {
  let ventas = 0;
  let envios = 0;
  let coste = 0;
  let lineasSinCoste = 0;
  let comisiones = 0;
  let n = 0;
  for (const p of pedidos) {
    if (!cuenta(p)) continue;
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

interface Periodo {
  desde: Date | null;
  hasta: Date | null;
  // Periodo con el que comparar (mismo tramo del mes/año anterior).
  prevDesde: Date | null;
  prevHasta: Date | null;
  etiqueta: string;
  comparaCon: string;
}

function periodo(modo: Modo, mes: string, anio: number): Periodo {
  const now = new Date();
  if (modo === "todo") return { desde: null, hasta: null, prevDesde: null, prevHasta: null, etiqueta: "Desde el principio", comparaCon: "" };
  if (modo === "anio") {
    const actual = anio === now.getFullYear();
    // Año en curso: se compara con el anterior hasta el mismo día.
    const prevHasta = actual ? new Date(anio - 1, now.getMonth(), now.getDate() + 1) : new Date(anio, 0, 1);
    return {
      desde: new Date(anio, 0, 1),
      hasta: new Date(anio + 1, 0, 1),
      prevDesde: new Date(anio - 1, 0, 1),
      prevHasta,
      etiqueta: String(anio),
      comparaCon: actual ? `vs. ${anio - 1} a estas alturas` : `vs. ${anio - 1}`,
    };
  }
  const [y, m] = mes.split("-").map(Number);
  const actual = y === now.getFullYear() && m - 1 === now.getMonth();
  const desde = new Date(y, m - 1, 1);
  const nombre = desde.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const prevNombre = new Date(y, m - 2, 1).toLocaleDateString("es-ES", { month: "long" });
  return {
    desde,
    hasta: new Date(y, m, 1),
    prevDesde: new Date(y, m - 2, 1),
    prevHasta: actual ? new Date(y, m - 2, now.getDate() + 1) : new Date(y, m - 1, 1),
    etiqueta: nombre.charAt(0).toUpperCase() + nombre.slice(1),
    comparaCon: actual ? `vs. ${prevNombre} a mismo día` : `vs. ${prevNombre}`,
  };
}

const enRango = (iso: string, a: Date | null, b: Date | null) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return (!a || d >= a) && (!b || d < b);
};

// Lunes de la semana de una fecha, a medianoche.
function lunes(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

const eurCorto = (n: number) => (Math.abs(n) >= 1000 ? `${dec(n / 1000, 1)} k€` : eur(n).replace(",00", ""));
const pct = (n: number) => `${n.toFixed(0)} %`;

interface Semana {
  inicio: Date;
  label: string;
  ventas: number;
  beneficio: number;
}

// Previsión de las próximas semanas: media ponderada de las últimas semanas
// cerradas (las recientes pesan más) corregida con la tendencia, nunca
// negativa. Con pocas semanas de historia se marca como poco fiable.
function prever(historia: number[], semanas: number): { valores: number[]; fiabilidad: "baja" | "media" | "alta" } | null {
  const conDatos = historia.filter((v) => v > 0).length;
  if (conDatos < 2) return null;
  const ult = historia.slice(-8);
  const n = ult.length;
  const pesos = ult.map((_, i) => i + 1);
  const wma = ult.reduce((s, v, i) => s + v * pesos[i], 0) / pesos.reduce((a, b) => a + b, 0);
  const xm = (n - 1) / 2;
  const ym = ult.reduce((a, b) => a + b, 0) / n;
  const num = ult.reduce((s, v, i) => s + (i - xm) * (v - ym), 0);
  const den = ult.reduce((s, _, i) => s + (i - xm) ** 2, 0) || 1;
  // Pendiente limitada a ±25 % del nivel por semana para no disparar la previsión.
  const pendiente = Math.max(-0.25 * wma, Math.min(0.25 * wma, num / den));
  const valores = Array.from({ length: semanas }, (_, k) => Math.max(0, wma + pendiente * (k + 1) * 0.5));
  return { valores, fiabilidad: conDatos <= 3 ? "baja" : conDatos <= 7 ? "media" : "alta" };
}

interface Oportunidad {
  icon: ReactNode;
  titulo: string;
  texto: string;
  impacto?: string;
  tono: "forest" | "amber" | "tech" | "gold";
}

type OrdenTop = "ingresos" | "beneficio" | "unidades";

export function ContabilidadPanel() {
  const hoy = new Date();
  const [modo, setModo] = useState<Modo>("mes");
  const [mes, setMes] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [todosPedidos, setTodosPedidos] = useState<Pedido[] | null>(null);
  const [todosGastos, setTodosGastos] = useState<Gasto[] | null>(null);
  const [ordenTop, setOrdenTop] = useState<OrdenTop>("ingresos");

  // Se carga todo una vez: así se comparan periodos y se calcula la
  // previsión con las semanas anteriores sin volver a la base de datos.
  const cargar = useCallback(async () => {
    const db = amwayDb();
    const [p, g] = await Promise.all([
      db.from("amway_pedidos").select("*").order("created_at", { ascending: false }).limit(10000),
      db.from("amway_gastos").select("*").order("fecha", { ascending: false }).limit(10000),
    ]);
    setTodosPedidos((p.data as Pedido[] | null) ?? []);
    setTodosGastos((g.data as Gasto[] | null) ?? []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const per = useMemo(() => periodo(modo, mes, anio), [modo, mes, anio]);

  const pedidos = useMemo(() => todosPedidos?.filter((p) => enRango(p.created_at, per.desde, per.hasta)) ?? null, [todosPedidos, per]);
  const gastos = useMemo(() => todosGastos?.filter((g) => enRango(g.fecha, per.desde, per.hasta)) ?? null, [todosGastos, per]);

  const r = useMemo(() => (pedidos && gastos ? calcular(pedidos, gastos) : null), [pedidos, gastos]);
  const rPrev = useMemo(() => {
    if (!todosPedidos || !todosGastos || !per.prevDesde) return null;
    return calcular(
      todosPedidos.filter((p) => enRango(p.created_at, per.prevDesde, per.prevHasta)),
      todosGastos.filter((g) => enRango(g.fecha, per.prevDesde, per.prevHasta))
    );
  }, [todosPedidos, todosGastos, per]);

  // Últimas 12 semanas (la actual incluida) y previsión de las 4 siguientes.
  const semanal = useMemo(() => {
    if (!todosPedidos || !todosGastos) return null;
    const actual = lunes(new Date());
    const semanas: Semana[] = Array.from({ length: 12 }, (_, i) => {
      const inicio = new Date(actual);
      inicio.setDate(inicio.getDate() - 7 * (11 - i));
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 7);
      const res = calcular(
        todosPedidos.filter((p) => enRango(p.created_at, inicio, fin)),
        todosGastos.filter((g) => enRango(g.fecha, inicio, fin))
      );
      return {
        inicio,
        label: inicio.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", ""),
        ventas: res.ventas,
        beneficio: res.beneficioNeto,
      };
    });
    const cerradas = semanas.slice(0, -1).map((s) => s.ventas);
    // Si aún no hay semanas cerradas con ventas, se usa también la actual.
    const base = cerradas.filter((v) => v > 0).length >= 2 ? cerradas : semanas.map((s) => s.ventas);
    const prev = prever(base, 4);
    const puntos: ForecastPoint[] = semanas.map((s) => ({ label: s.label, ventas: s.ventas, beneficio: s.beneficio, prevision: null }));
    if (prev) {
      prev.valores.forEach((v, k) => {
        const inicio = new Date(actual);
        inicio.setDate(inicio.getDate() + 7 * (k + 1));
        puntos.push({
          label: inicio.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", ""),
          ventas: null,
          beneficio: null,
          prevision: Math.round(v),
        });
      });
    }
    const margenReciente = (() => {
      const v = semanas.reduce((s, x) => s + x.ventas, 0);
      return v > 0 ? semanas.reduce((s, x) => s + x.beneficio, 0) / v : null;
    })();
    const proximoMes = prev ? prev.valores.reduce((a, b) => a + b, 0) : null;
    return { puntos, prev, proximoMes, margenReciente, semanaActual: semanas[semanas.length - 1] };
  }, [todosPedidos, todosGastos]);

  // Cierre previsto del mes en curso: ritmo diario hasta hoy, suavizado con
  // la previsión semanal para que un día flojo o bueno no lo desvíe.
  const cierreMes = useMemo(() => {
    if (modo !== "mes" || !r || !per.desde) return null;
    const now = new Date();
    if (per.desde.getMonth() !== now.getMonth() || per.desde.getFullYear() !== now.getFullYear()) return null;
    const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const transcurridos = now.getDate();
    const restantes = diasMes - transcurridos;
    const ritmoDiario = r.ventas / transcurridos;
    const semanalDiario = semanal?.prev ? semanal.prev.valores[0] / 7 : null;
    // Al principio de mes manda la previsión semanal; según avanza, el ritmo real.
    const w = transcurridos / diasMes;
    const diario = semanalDiario != null ? w * ritmoDiario + (1 - w) * semanalDiario : ritmoDiario;
    const estimado = r.ventas + diario * restantes;
    const anterior =
      todosPedidos && todosGastos
        ? calcular(
            todosPedidos.filter((p) => enRango(p.created_at, new Date(now.getFullYear(), now.getMonth() - 1, 1), per.desde)),
            []
          ).ventas
        : 0;
    return { estimado: Math.max(r.ventas, estimado), anterior, transcurridos, diasMes };
  }, [modo, r, per, semanal, todosPedidos, todosGastos]);

  const porMes = useMemo(() => {
    if (modo !== "anio" || !pedidos || !gastos) return null;
    return MESES.map((label, m) => {
      const ped = pedidos.filter((p) => new Date(p.created_at).getMonth() === m);
      const gas = gastos.filter((g) => Number(g.fecha.slice(5, 7)) - 1 === m);
      return { label, ...calcular(ped, gas) };
    });
  }, [modo, pedidos, gastos]);

  const validos = useMemo(() => (pedidos ?? []).filter(cuenta), [pedidos]);

  const porMetodo = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of validos) m.set(p.metodo_pago, (m.get(p.metodo_pago) ?? 0) + Number(p.total_eur));
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, value]) => ({ label: METODO_PAGO[k as keyof typeof METODO_PAGO] ?? k, value }));
  }, [validos]);

  const productos = useMemo(() => {
    const m = new Map<
      string,
      { key: string; productId: string | null; nombre: string; formato: string | null; unidades: number; ingresos: number; coste: number; sinCoste: boolean }
    >();
    for (const p of validos) {
      for (const i of p.items) {
        const key = `${i.product_id ?? i.nombre}|${i.formato ?? ""}`;
        const cur = m.get(key) ?? {
          key,
          productId: i.product_id,
          nombre: i.nombre,
          formato: i.formato,
          unidades: 0,
          ingresos: 0,
          coste: 0,
          sinCoste: false,
        };
        cur.unidades += i.cantidad;
        cur.ingresos += Number(i.precio_eur) * i.cantidad;
        if (i.coste_eur == null) cur.sinCoste = true;
        else cur.coste += Number(i.coste_eur) * i.cantidad;
        m.set(key, cur);
      }
    }
    return [...m.values()].map((x) => ({ ...x, beneficio: x.sinCoste ? null : x.ingresos - x.coste }));
  }, [validos]);

  const top = useMemo(() => {
    const val = (x: (typeof productos)[number]) => (ordenTop === "unidades" ? x.unidades : ordenTop === "beneficio" ? (x.beneficio ?? -Infinity) : x.ingresos);
    return [...productos].sort((a, b) => val(b) - val(a)).slice(0, 8);
  }, [productos, ordenTop]);

  const porGama = useMemo(() => {
    const m = new Map<string, { ingresos: number; coste: number; conCoste: number }>();
    for (const x of productos) {
      const prod = x.productId ? getProductById(x.productId) : undefined;
      const k = prod?.brand ?? "Otros";
      const cur = m.get(k) ?? { ingresos: 0, coste: 0, conCoste: 0 };
      cur.ingresos += x.ingresos;
      if (!x.sinCoste) {
        cur.coste += x.coste;
        cur.conCoste += x.ingresos;
      }
      m.set(k, cur);
    }
    return [...m.entries()]
      .map(([label, v]) => ({ label, value: v.ingresos, margen: v.conCoste > 0 ? ((v.conCoste - v.coste) / v.conCoste) * 100 : null }))
      .sort((a, b) => b.value - a.value);
  }, [productos]);

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of productos) {
      const prod = x.productId ? getProductById(x.productId) : undefined;
      const k = prod ? (CATEGORIA_LABEL[prod.category] ?? prod.category) : "Otros";
      m.set(k, (m.get(k) ?? 0) + x.ingresos);
    }
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [productos]);

  const porDiaSemana = useMemo(() => {
    const v = Array(7).fill(0) as number[];
    for (const p of validos) v[(new Date(p.created_at).getDay() + 6) % 7] += Number(p.total_eur);
    return DIAS.map((d, i) => ({ label: d.slice(0, 3), value: v[i], nombre: d }));
  }, [validos]);

  const gastosPorCategoria = useMemo(() => {
    const m = new Map<Gasto["categoria"], number>();
    for (const g of gastos ?? []) m.set(g.categoria, (m.get(g.categoria) ?? 0) + Number(g.importe_eur));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [gastos]);

  const clientes = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of (todosPedidos ?? []).filter(cuenta)) {
      const k = (p.cliente_telefono?.replace(/\D/g, "").slice(-9) || p.cliente_email?.toLowerCase() || p.cliente_nombre?.trim().toLowerCase()) ?? "";
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    const total = m.size;
    const repiten = [...m.values()].filter((n) => n > 1).length;
    return { total, repiten, pct: total ? (repiten / total) * 100 : 0 };
  }, [todosPedidos]);

  const porCobrar = useMemo(() => {
    const l = (pedidos ?? []).filter((p) => p.estado === "pendiente");
    return { n: l.length, importe: l.reduce((s, p) => s + Number(p.total_eur), 0) };
  }, [pedidos]);

  // Ideas concretas para ganar más, a partir de los propios números.
  const oportunidades = useMemo<Oportunidad[]>(() => {
    if (!r) return [];
    const o: Oportunidad[] = [];
    const bajoMargen = productos
      .filter((x) => x.beneficio != null && x.ingresos > 0 && x.beneficio / x.ingresos < 0.25)
      .sort((a, b) => b.ingresos - a.ingresos)[0];
    if (bajoMargen) {
      const m = (bajoMargen.beneficio! / bajoMargen.ingresos) * 100;
      o.push({
        icon: <Tag size={16} />,
        titulo: `Sube un 5 % el precio de ${bajoMargen.nombre}`,
        texto: `Es de lo que más vendes y deja solo un ${pct(m)} de margen. Con las mismas ventas ganarías más sin apenas notarse en el precio.`,
        impacto: `+${eur(bajoMargen.ingresos * 0.05)}`,
        tono: "forest",
      });
    }
    const mejorGama = porGama.filter((g) => g.margen != null && g.label !== "Otros").sort((a, b) => b.margen! - a.margen!)[0];
    const margenMedioGamas = (() => {
      const l = porGama.filter((g) => g.margen != null);
      return l.length ? l.reduce((s, g) => s + g.margen!, 0) / l.length : null;
    })();
    if (mejorGama && porGama.length > 1 && margenMedioGamas != null && mejorGama.margen! - margenMedioGamas >= 3) {
      o.push({
        icon: <Sparkles size={16} />,
        titulo: `${mejorGama.label} es la gama que más margen te deja`,
        texto: `Gana un ${pct(mejorGama.margen!)} de cada venta. Dale protagonismo en anuncios y en el escaparate de la web.`,
        tono: "gold",
      });
    }
    const totalDias = porDiaSemana.reduce((s, d) => s + d.value, 0);
    const mejorDia = [...porDiaSemana].sort((a, b) => b.value - a.value)[0];
    const diasConVentas = porDiaSemana.filter((d) => d.value > 0).length;
    if (totalDias > 0 && validos.length >= 6 && diasConVentas >= 3 && mejorDia.value > (totalDias / diasConVentas) * 1.3) {
      o.push({
        icon: <CalendarRange size={16} />,
        titulo: `Los ${mejorDia.nombre.toLowerCase()} vendes más`,
        texto: `Un ${pct((mejorDia.value / totalDias) * 100)} de las ventas entra ese día. Publica novedades u ofertas el día antes para aprovecharlo.`,
        tono: "tech",
      });
    }
    if (porCobrar.n > 0) {
      o.push({
        icon: <HandCoins size={16} />,
        titulo: `${eur(porCobrar.importe)} por cobrar`,
        texto: `${porCobrar.n} pedido${porCobrar.n === 1 ? "" : "s"} pendiente${porCobrar.n === 1 ? "" : "s"} de pago. No cuentan como venta hasta que se cobran.`,
        tono: "amber",
      });
    }
    if (clientes.total >= 3 && clientes.pct < 40) {
      o.push({
        icon: <Repeat size={16} />,
        titulo: `Solo ${pct(clientes.pct)} de tus clientes repite`,
        texto: "Un mensaje cuando se les acabe el producto (complementos, cremas, filtros…) es la venta más fácil. Pon la duración en cada producto para que su cuenta les avise.",
        tono: "forest",
      });
    }
    if (r.comisiones > 0) {
      o.push({
        icon: <Wallet size={16} />,
        titulo: `${eur(r.comisiones)} en comisiones de tarjeta`,
        texto: `Un ${dec((r.comisiones / Math.max(r.ventas, 1)) * 100, 1)} % de lo vendido. En pedidos grandes que recogen en mano, el efectivo o Bizum te lo ahorran.`,
        tono: "tech",
      });
    }
    if (r.lineasSinCoste > 0) {
      o.push({
        icon: <Package size={16} />,
        titulo: `${r.lineasSinCoste} línea${r.lineasSinCoste === 1 ? "" : "s"} vendida${r.lineasSinCoste === 1 ? "" : "s"} sin coste`,
        texto: "Sin el coste no se puede saber cuánto has ganado con ellas: añádelo en Productos para que el beneficio sea real.",
        tono: "amber",
      });
    }
    if (r.ventas > 0 && r.gastos > r.ventas * 0.2) {
      o.push({
        icon: <ArrowDownRight size={16} />,
        titulo: "Los gastos se comen buena parte de las ventas",
        texto: `Los gastos son un ${pct((r.gastos / r.ventas) * 100)} de lo vendido en el periodo. Revisa qué partidas puedes recortar.`,
        tono: "amber",
      });
    }
    return o.slice(0, 6);
  }, [r, productos, porGama, porDiaSemana, validos.length, porCobrar, clientes]);

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
  const delta = (a: number, b: number | undefined) => (rPrev && b != null ? variacion(a, b) : null);

  const reparto = r
    ? [
        { label: "Coste de la mercancía", value: r.coste, color: "#b7ae9b" },
        { label: "Comisiones de pago", value: r.comisiones, color: "#e4cba3" },
        { label: "Otros gastos", value: r.gastos, color: "#3f6b7d" },
        ...(r.beneficioNeto >= 0 ? [{ label: "Beneficio", value: r.beneficioNeto, color: "#1f4438" }] : []),
      ]
    : [];
  const margenNeto = r && r.ventas > 0 ? (r.beneficioNeto / r.ventas) * 100 : null;
  const maxTop = Math.max(1, ...top.map((t) => (ordenTop === "unidades" ? t.unidades : ordenTop === "beneficio" ? (t.beneficio ?? 0) : t.ingresos)));

  return (
    <div>
      {/* Cabecera y periodo */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-[1.75rem] leading-tight text-carbon">Contabilidad</h2>
          <p className="mt-1 max-w-2xl text-sm text-stone">
            {per.etiqueta}. Cuánto entra, cuánto sale y cuánto queda. Los pedidos pendientes de pago o cancelados no cuentan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full border border-carbon/[0.07] bg-white p-1">
            {(
              [
                ["mes", "Mes"],
                ["anio", "Año"],
                ["todo", "Todo"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setModo(v)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
                  modo === v ? "bg-carbon text-cream" : "text-stone hover:text-carbon"
                )}
              >
                {l}
              </button>
            ))}
          </div>
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
        </div>
      </div>

      {!r || !semanal ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Cifras clave */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Ventas" value={eur(r.ventas)} delta={delta(r.ventas, rPrev?.ventas)} hint={per.comparaCon || `${r.pedidos} pedidos`} />
            <Kpi
              label="Beneficio neto"
              value={eur(r.beneficioNeto)}
              tone={r.beneficioNeto >= 0 ? "good" : "bad"}
              delta={delta(r.beneficioNeto, rPrev?.beneficioNeto)}
              hint={margenNeto != null ? `${pct(margenNeto)} de lo vendido` : undefined}
            />
            <Kpi
              label="Gastado"
              value={eur(r.coste + r.comisiones + r.gastos)}
              hint={`mercancía ${eurCorto(r.coste)} · gastos ${eurCorto(r.gastos + r.comisiones)}`}
            />
            <Kpi
              label="Ticket medio"
              value={eur(r.pedidos ? r.ventas / r.pedidos : 0)}
              delta={rPrev && rPrev.pedidos ? variacion(r.pedidos ? r.ventas / r.pedidos : 0, rPrev.ventas / rPrev.pedidos) : null}
              hint={`${r.pedidos} pedido${r.pedidos === 1 ? "" : "s"}`}
            />
          </div>

          {/* Tendencia y previsión */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <Card>
              <CardTitle
                action={
                  <span className="flex flex-wrap items-center gap-3 text-[11px] text-stone">
                    <Leyenda color="#1f4438">Ventas</Leyenda>
                    <Leyenda color="#b8905a" linea>
                      Beneficio
                    </Leyenda>
                    <Leyenda rayas>Previsión</Leyenda>
                  </span>
                }
              >
                Últimas 12 semanas y previsión
              </CardTitle>
              <ForecastChart data={semanal.puntos} format={eurCorto} height={280} />
              {!semanal.prev && (
                <p className="mt-3 rounded-xl bg-cream/70 px-3 py-2 text-xs text-stone">
                  La previsión aparece en cuanto haya ventas en al menos dos semanas. Cuantas más semanas, más fiable.
                </p>
              )}
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="bg-carbon text-cream">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/60">
                  <TrendingUp size={13} /> Próximas 4 semanas
                </p>
                {semanal.proximoMes != null ? (
                  <>
                    <p className="mt-3 font-display text-[2.2rem] leading-none tabular-nums">{eur(semanal.proximoMes)}</p>
                    <p className="mt-1.5 text-xs text-cream/70">en ventas previstas</p>
                    {semanal.margenReciente != null && (
                      <p className="mt-3 text-sm">
                        ≈ <span className="font-semibold text-gold-soft">{eur(semanal.proximoMes * semanal.margenReciente)}</span>{" "}
                        <span className="text-cream/70">de beneficio</span>
                      </p>
                    )}
                    <p className="mt-4 inline-flex rounded-full bg-cream/10 px-2.5 py-1 text-[11px] text-cream/80">
                      Fiabilidad {semanal.prev!.fiabilidad} · según tus últimas semanas
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-cream/70">Aún no hay historia suficiente para prever.</p>
                )}
              </Card>

              {cierreMes && (
                <Card>
                  <CardTitle>Cierre previsto del mes</CardTitle>
                  <p className="font-display text-[1.9rem] leading-none tabular-nums text-carbon">{eur(cierreMes.estimado)}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-carbon/[0.06]">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{ width: `${cierreMes.estimado > 0 ? Math.min(100, (r.ventas / cierreMes.estimado) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="mt-2 flex justify-between text-xs text-stone">
                    <span>
                      Llevas <span className="font-medium text-carbon">{eur(r.ventas)}</span>
                    </span>
                    <span>
                      día {cierreMes.transcurridos} de {cierreMes.diasMes}
                    </span>
                  </p>
                  {cierreMes.anterior > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-stone">
                      {cierreMes.estimado >= cierreMes.anterior ? (
                        <ArrowUpRight size={14} className="text-emerald-700" />
                      ) : (
                        <ArrowDownRight size={14} className="text-red-600" />
                      )}
                      El mes pasado cerró en {eur(cierreMes.anterior)}
                    </p>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* A dónde va el dinero + oportunidades */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>A dónde va lo que vendes</CardTitle>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <Donut
                  items={reparto}
                  format={eur}
                  center={{ value: margenNeto != null ? pct(margenNeto) : "—", label: margenNeto != null && margenNeto < 0 ? "pérdida" : "te queda" }}
                  size={170}
                />
                <ul className="flex w-full flex-1 flex-col gap-2.5 text-sm">
                  {reparto.map((x) => (
                    <li key={x.label} className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: x.color }} />
                      <span className="min-w-0 flex-1 text-carbon">{x.label}</span>
                      <span className="tabular-nums text-carbon">{eur(x.value)}</span>
                      <span className="w-11 text-right text-xs tabular-nums text-stone">
                        {r.ventas > 0 ? pct((x.value / r.ventas) * 100) : "—"}
                      </span>
                    </li>
                  ))}
                  {r.beneficioNeto < 0 && (
                    <li className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-xs-red" />
                      <span className="min-w-0 flex-1 text-xs-red">Pérdida (se gasta más de lo que se vende)</span>
                      <span className="tabular-nums text-xs-red">{eur(r.beneficioNeto)}</span>
                      <span className="w-11" />
                    </li>
                  )}
                  <li className="mt-1 flex items-center justify-between border-t border-carbon/[0.08] pt-2.5 font-medium">
                    <span className="text-carbon">Ventas</span>
                    <span className="tabular-nums text-carbon">{eur(r.ventas)}</span>
                  </li>
                </ul>
              </div>
              {r.ventas > 0 && r.beneficioNeto >= 0 && (
                <p className="mt-4 rounded-xl bg-cream/70 px-3 py-2 text-xs text-stone">
                  De cada <span className="font-medium text-carbon">100 €</span> que vendes, te quedan{" "}
                  <span className="font-medium text-forest">{eur(Math.max(0, r.beneficioNeto / r.ventas) * 100)}</span> limpios.
                </p>
              )}
            </Card>

            <Card>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Lightbulb size={13} /> Dónde puedes ganar más
                </span>
              </CardTitle>
              {oportunidades.length === 0 ? (
                <p className="text-sm text-stone">Con más ventas en el periodo aparecerán aquí ideas concretas para mejorar el beneficio.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {oportunidades.map((o) => (
                    <li key={o.titulo} className="flex gap-3 rounded-xl border border-carbon/[0.06] p-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          {
                            forest: "bg-forest/10 text-forest",
                            amber: "bg-amber-50 text-amber-700",
                            tech: "bg-tech/10 text-tech",
                            gold: "bg-gold/15 text-gold",
                          }[o.tono]
                        )}
                      >
                        {o.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-carbon">{o.titulo}</span>
                          {o.impacto && (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-800">
                              {o.impacto}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone">{o.texto}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Productos estrella */}
          <Card>
            <CardTitle
              action={
                <div className="flex gap-1 rounded-full bg-cream p-0.5">
                  {(
                    [
                      ["ingresos", "Ingresos"],
                      ["beneficio", "Beneficio"],
                      ["unidades", "Unidades"],
                    ] as const
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setOrdenTop(v)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                        ordenTop === v ? "bg-white text-carbon shadow-sm" : "text-stone hover:text-carbon"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              }
            >
              Productos que más venden
            </CardTitle>
            {top.length === 0 ? (
              <p className="text-sm text-stone">Sin ventas en este periodo.</p>
            ) : (
              <ol className="flex flex-col">
                {top.map((t, i) => {
                  const prod = t.productId ? getProductById(t.productId) : undefined;
                  const src = prod ? productImageSrc(prod) : null;
                  const v = ordenTop === "unidades" ? t.unidades : ordenTop === "beneficio" ? (t.beneficio ?? 0) : t.ingresos;
                  const m = t.beneficio != null && t.ingresos > 0 ? (t.beneficio / t.ingresos) * 100 : null;
                  return (
                    <li key={t.key} className="flex items-center gap-3 border-b border-carbon/[0.05] py-2.5 last:border-0">
                      <span className="w-5 text-right font-display text-base tabular-nums text-stone">{i + 1}</span>
                      <span className="relative h-11 w-10 shrink-0 overflow-hidden rounded-lg bg-linen">
                        {src && <Image src={src} alt="" fill sizes="40px" className="object-contain p-0.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-carbon" title={t.nombre}>
                          {t.nombre}
                        </span>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-carbon/[0.05]">
                          <span className="block h-full rounded-full bg-forest" style={{ width: `${(Math.max(0, v) / maxTop) * 100}%` }} />
                        </span>
                      </span>
                      <span className="hidden w-16 text-right text-xs tabular-nums text-stone sm:block">{t.unidades} ud.</span>
                      <span className="w-20 text-right text-sm tabular-nums text-carbon">{eur(t.ingresos)}</span>
                      <span className="hidden w-24 text-right text-sm tabular-nums sm:block">
                        {t.beneficio == null ? (
                          <span className="text-xs text-stone">sin coste</span>
                        ) : (
                          <span className="text-forest">
                            {eur(t.beneficio)}
                            {m != null && <span className="ml-1 text-[10px] text-stone">{pct(m)}</span>}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          {/* Repartos */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardTitle>Ventas por gama</CardTitle>
              <BarList
                items={porGama.slice(0, 6).map((g) => ({ label: g.label, value: g.value, hint: g.margen != null ? `Margen ${pct(g.margen)}` : undefined }))}
                format={eur}
                empty="Sin ventas en este periodo."
              />
            </Card>
            <Card>
              <CardTitle>Qué día se vende más</CardTitle>
              <ColumnChart data={porDiaSemana} name="Ventas por día de la semana" format={eurCorto} height={200} />
            </Card>
            <Card>
              <CardTitle>Por categoría y forma de pago</CardTitle>
              <BarList items={porCategoria} format={eur} empty="Sin ventas en este periodo." />
              {porMetodo.length > 0 && (
                <div className="mt-5 border-t border-carbon/[0.06] pt-4">
                  <BarList items={porMetodo} format={eur} />
                </div>
              )}
            </Card>
          </div>

          {porMes && (
            <Card>
              <CardTitle>Mes a mes · {anio}</CardTitle>
              <ForecastChart
                data={porMes.map((m) => ({ label: m.label, ventas: m.ventas, beneficio: m.ventas || m.gastos ? m.beneficioNeto : null, prevision: null }))}
                format={eurCorto}
                height={240}
              />
              <div className="mt-4 overflow-x-auto">
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
              </div>
            </Card>
          )}

          {/* Cuenta de resultados */}
          <Card>
            <CardTitle>Cuenta de resultados · {per.etiqueta}</CardTitle>
            <dl className="grid gap-y-2 text-sm sm:max-w-lg">
              {(
                [
                  ["Ventas (con envío)", r.ventas, rPrev?.ventas],
                  ["− Coste de la mercancía vendida", -r.coste, rPrev ? -rPrev.coste : undefined],
                  ["− Comisiones de pago (estimadas)", -r.comisiones, rPrev ? -rPrev.comisiones : undefined],
                  ["− Otros gastos", -r.gastos, rPrev ? -rPrev.gastos : undefined],
                ] as const
              ).map(([label, v, prev]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-stone">{label}</dt>
                  <dd className="flex items-baseline gap-3 tabular-nums text-carbon">
                    {prev != null && <span className="text-xs text-stone/70">{eur(prev)}</span>}
                    {eur(v)}
                  </dd>
                </div>
              ))}
              <div className="mt-1 flex items-baseline justify-between border-t border-carbon/10 pt-2 font-medium">
                <dt className="text-carbon">Resultado</dt>
                <dd className="flex items-baseline gap-3 tabular-nums">
                  {rPrev && <span className="text-xs font-normal text-stone/70">{eur(rPrev.beneficioNeto)}</span>}
                  <span className={r.beneficioNeto >= 0 ? "text-forest" : "text-xs-red"}>{eur(r.beneficioNeto)}</span>
                </dd>
              </div>
              {rPrev && <p className="text-right text-[11px] text-stone">En gris, el periodo anterior ({per.comparaCon.replace("vs. ", "")})</p>}
            </dl>
          </Card>

          <GastosSection gastos={gastos ?? []} porCategoria={gastosPorCategoria} onChange={cargar} />
        </div>
      )}
    </div>
  );
}

function Leyenda({ color, linea, rayas, children }: { color?: string; linea?: boolean; rayas?: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {rayas ? (
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ background: "repeating-linear-gradient(45deg, rgba(31,68,56,0.5) 0 2px, rgba(31,68,56,0.12) 2px 4px)" }}
        />
      ) : linea ? (
        <span className="h-0.5 w-3 rounded-full" style={{ background: color }} />
      ) : (
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      )}
      {children}
    </span>
  );
}

function GastosSection({
  gastos,
  porCategoria,
  onChange,
}: {
  gastos: Gasto[];
  porCategoria: [Gasto["categoria"], number][];
  onChange: () => void;
}) {
  const [fechaG, setFechaG] = useState(new Date().toISOString().slice(0, 10));
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<Gasto["categoria"]>("mercancia");
  const [importe, setImporte] = useState("");
  const [saving, setSaving] = useState(false);
  const total = porCategoria.reduce((s, [, v]) => s + v, 0);

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
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl text-carbon">Gastos</h3>
          <p className="mt-1 text-sm text-stone">Compras a Amway, envíos, publicidad, embalaje… todo lo que no es una venta.</p>
        </div>
        {total > 0 && (
          <p className="text-sm text-stone">
            Total del periodo <span className="font-display text-xl tabular-nums text-carbon">{eur(total)}</span>
          </p>
        )}
      </div>

      {porCategoria.length > 0 && (
        <div className="mt-4">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-carbon/[0.05]">
            {porCategoria.map(([c, v], i) => (
              <span
                key={c}
                title={`${CATEGORIA_GASTO[c]}: ${eur(v)}`}
                style={{ width: `${(v / total) * 100}%`, background: GASTO_COLOR[i % GASTO_COLOR.length] }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
            {porCategoria.map(([c, v], i) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: GASTO_COLOR[i % GASTO_COLOR.length] }} />
                {CATEGORIA_GASTO[c]} <span className="tabular-nums text-carbon">{eur(v)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={add} className="mt-4 grid gap-2 rounded-2xl border border-carbon/8 bg-white p-3 sm:grid-cols-[9.5rem_1fr_13rem_8rem_auto]">
        <input type="date" value={fechaG} onChange={(e) => setFechaG(e.target.value)} className={inputClass} aria-label="Fecha" required />
        <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Concepto (p. ej. pedido a Amway)" maxLength={200} className={inputClass} required />
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
              <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-stone">{CATEGORIA_GASTO[g.categoria]}</span>
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

const GASTO_COLOR = ["#3f6b7d", "#b8905a", "#4d7a68", "#9b6a8c", "#b7ae9b", "#e4cba3"];
