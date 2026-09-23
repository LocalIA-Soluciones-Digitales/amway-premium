import { getProductById } from "@/data/products";
import type { Pedido } from "./shared";

// ---------- Visitas ----------

export interface Visita {
  session_id: string;
  event_type: "pageview" | "add_to_cart" | "cart_open" | "checkout_start" | "whatsapp_click" | "solicitud" | "resena";
  path: string;
  label: string | null;
  referrer: string | null;
  source_category: "google_ads" | "google_organic" | "social" | "referral" | "direct" | "other";
  utm_campaign: string | null;
  device_type: "mobile" | "tablet" | "desktop" | null;
  is_returning: boolean;
  created_at: string;
}

export const SOURCE_LABELS: Record<Visita["source_category"], string> = {
  google_ads: "Google Ads",
  google_organic: "Google (orgánico)",
  social: "Redes sociales",
  referral: "Otras webs",
  direct: "Directo",
  other: "Otros",
};

export const DEVICE_LABELS: Record<NonNullable<Visita["device_type"]>, string> = {
  mobile: "Móvil",
  tablet: "Tablet",
  desktop: "Escritorio",
};

export const PAGE_LABELS: Record<string, string> = {
  "/": "Inicio",
  "/catalogo": "Catálogo",
  "/ofertas": "Ofertas",
  "/opiniones": "Opiniones",
  "/nutricion": "Nutrición",
  "/belleza": "Belleza",
  "/hogar": "Hogar",
  "/espring": "eSpring",
  "/xs-energy": "XS Energy",
  "/contacto": "Contacto",
  "/sobre-nosotros": "Sobre nosotros",
  "/faq": "Preguntas frecuentes",
  "/checkout/exito": "Pago completado",
  "/checkout/cancelado": "Pago cancelado",
};

export type Rango = 7 | 30 | 90 | 365;

export function desdeRango(dias: Rango): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (dias - 1));
  return d;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Buckets by day (≤ 90 days) or by month (1 year), filling empty buckets
// with 0 so the time axis never skips.
export function serie<T>(items: T[], dias: Rango, fecha: (t: T) => string, valor: (t: T) => number) {
  const porMes = dias > 90;
  const inicio = desdeRango(dias);
  const buckets = new Map<string, { label: string; value: number }>();
  if (porMes) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    const now = new Date();
    while (d <= now) {
      buckets.set(`${d.getFullYear()}-${d.getMonth()}`, {
        label: d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" }),
        value: 0,
      });
      d.setMonth(d.getMonth() + 1);
    }
  } else {
    for (let i = 0; i < dias; i++) {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      buckets.set(dayKey(d), { label: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), value: 0 });
    }
  }
  for (const it of items) {
    const d = new Date(fecha(it));
    const key = porMes ? `${d.getFullYear()}-${d.getMonth()}` : dayKey(d);
    const b = buckets.get(key);
    if (b) b.value += valor(it);
  }
  return Array.from(buckets.values());
}

export function resumenVisitas(visitas: Visita[]) {
  const pageviews = visitas.filter((v) => v.event_type === "pageview");
  const porSesion = new Map<string, number>();
  const sesionesRecurrentes = new Set<string>();
  for (const v of pageviews) {
    porSesion.set(v.session_id, (porSesion.get(v.session_id) ?? 0) + 1);
    if (v.is_returning) sesionesRecurrentes.add(v.session_id);
  }
  const sesiones = porSesion.size;
  const rebotes = Array.from(porSesion.values()).filter((n) => n === 1).length;
  return {
    sesiones,
    paginas: pageviews.length,
    paginasPorSesion: sesiones ? pageviews.length / sesiones : 0,
    rebote: sesiones ? rebotes / sesiones : 0,
    recurrentes: sesiones ? sesionesRecurrentes.size / sesiones : 0,
  };
}

function contarSesionesPor<K extends string>(visitas: Visita[], key: (v: Visita) => K | null) {
  const m = new Map<K, Set<string>>();
  for (const v of visitas) {
    if (v.event_type !== "pageview") continue;
    const k = key(v);
    if (!k) continue;
    if (!m.has(k)) m.set(k, new Set());
    m.get(k)!.add(v.session_id);
  }
  return Array.from(m.entries())
    .map(([k, s]) => ({ key: k, value: s.size }))
    .sort((a, b) => b.value - a.value);
}

export const porFuente = (v: Visita[]) =>
  contarSesionesPor(v, (x) => x.source_category).map((r) => ({ label: SOURCE_LABELS[r.key], value: r.value }));

export const porDispositivo = (v: Visita[]) =>
  contarSesionesPor(v, (x) => x.device_type).map((r) => ({ label: DEVICE_LABELS[r.key], value: r.value }));

export function paginasTop(visitas: Visita[], n = 8) {
  const m = new Map<string, number>();
  for (const v of visitas) if (v.event_type === "pageview") m.set(v.path, (m.get(v.path) ?? 0) + 1);
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([path, value]) => ({ label: PAGE_LABELS[path] ?? path, value }));
}

export function productosEnCesta(visitas: Visita[], n = 8) {
  const m = new Map<string, number>();
  for (const v of visitas) if (v.event_type === "add_to_cart" && v.label) m.set(v.label, (m.get(v.label) ?? 0) + 1);
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, value]) => ({ label: getProductById(id)?.name ?? id, value }));
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export function porDiaSemana(visitas: Visita[]) {
  const counts = DIAS.map(() => new Set<string>());
  for (const v of visitas) {
    if (v.event_type !== "pageview") continue;
    counts[(new Date(v.created_at).getDay() + 6) % 7].add(v.session_id);
  }
  return DIAS.map((label, i) => ({ label: label.slice(0, 3), value: counts[i].size }));
}

export function embudo(visitas: Visita[], pedidosWeb: number) {
  const sesionesCon = (t: Visita["event_type"]) => new Set(visitas.filter((v) => v.event_type === t).map((v) => v.session_id)).size;
  return [
    { label: "Sesiones", value: sesionesCon("pageview") },
    { label: "Añadieron a la cesta", value: sesionesCon("add_to_cart") },
    { label: "Fueron a pagar", value: sesionesCon("checkout_start") },
    { label: "Pedidos web pagados", value: pedidosWeb },
  ];
}

export function contactos(visitas: Visita[]) {
  return {
    whatsapp: visitas.filter((v) => v.event_type === "whatsapp_click").length,
    solicitudes: visitas.filter((v) => v.event_type === "solicitud").length,
    resenas: visitas.filter((v) => v.event_type === "resena").length,
  };
}

// ---------- Ventas ----------

export function pedidosValidos(pedidos: Pedido[]) {
  return pedidos.filter((p) => p.estado !== "cancelado" && p.estado !== "pendiente");
}

export function ventasPor(pedidos: Pedido[], key: "category" | "brand") {
  const m = new Map<string, number>();
  for (const p of pedidosValidos(pedidos)) {
    for (const i of p.items) {
      const prod = i.product_id ? getProductById(i.product_id) : undefined;
      const k = prod ? (key === "brand" ? prod.brand : CATEGORIA_LABEL[prod.category] ?? prod.category) : "Otros";
      m.set(k, (m.get(k) ?? 0) + Number(i.precio_eur) * i.cantidad);
    }
  }
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

export const CATEGORIA_LABEL: Record<string, string> = {
  nutricion: "Nutrición",
  "xs-energy": "XS Energy",
  belleza: "Belleza",
  hogar: "Hogar",
};

export function variacion(actual: number, anterior: number): number | null {
  if (!anterior) return actual ? null : 0;
  return ((actual - anterior) / anterior) * 100;
}
