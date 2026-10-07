// Recogida en mano: días y horas que se ofrecen en la cesta. Lo usan tanto
// el navegador (para pintar las opciones) como el servidor (para validar lo
// que llega), siempre en hora de Madrid aunque el servidor esté en UTC.

import { SITE } from "@/data/site-config";

export const RECOGIDA = {
  zona: "Europe/Madrid",
  cerrado: SITE.horario.cerrado,
  // Solo dentro del horario del local, en huecos de media hora. La última
  // es media hora antes de cerrar: a la hora de cierre ya no se atiende.
  horaMin: SITE.horario.apertura,
  horaMax: SITE.horario.cierre,
  intervaloMin: 30,
  maxDias: 60, // hasta cuándo se puede apartar
} as const;

export type MetodoPagoWeb = "tarjeta" | "efectivo";

export interface Recogida {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
}

// Fecha y minutos del día "ahora" en Madrid.
function ahoraMadrid(now: Date): { fecha: string; minutos: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: RECOGIDA.zona,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return { fecha: `${parts.year}-${parts.month}-${parts.day}`, minutos: Number(parts.hour) * 60 + Number(parts.minute) };
}

// Fecha de hoy en Madrid (YYYY-MM-DD).
export function hoyMadrid(now = new Date()): string {
  return ahoraMadrid(now).fecha;
}

// Aritmética de calendario sobre YYYY-MM-DD (a mediodía UTC, sin saltos de hora).
export function sumarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const diaSemana = (fecha: string) => new Date(`${fecha}T12:00:00Z`).getUTCDay();
const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

// Festivos nacionales fijos (cierra aunque caigan entre semana). Los
// autonómicos, locales y vacaciones los pone la gestora en el panel
// (amway_cierres) y llegan como `cierres` desde el catálogo público.
const FESTIVOS_NACIONALES = ["01-01", "01-06", "05-01", "08-15", "10-12", "11-01", "12-06", "12-08", "12-25"];

export type Cierres = readonly string[];

const cerradoEse = (fecha: string, cierres: Cierres) =>
  (RECOGIDA.cerrado as readonly number[]).includes(diaSemana(fecha)) ||
  FESTIVOS_NACIONALES.includes(fecha.slice(5)) ||
  cierres.includes(fecha);

// Horas que se ofrecen para una fecha: huecos de media hora dentro del
// horario, ninguno si ese día cierra, y hoy desde la hora actual en adelante
// (todo está en tienda, así que se puede recoger en cuanto se compra).
export function horasDisponibles(fecha: string, now = new Date(), cierres: Cierres = []): string[] {
  const hoy = ahoraMadrid(now);
  if (fecha < hoy.fecha || cerradoEse(fecha, cierres)) return [];
  const out: string[] = [];
  for (let m = aMinutos(RECOGIDA.horaMin); m < aMinutos(RECOGIDA.horaMax); m += RECOGIDA.intervaloMin) {
    if (fecha === hoy.fecha && m < hoy.minutos) continue;
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

// Días en los que se puede recoger: abiertos y con alguna hora libre.
export function diasRecogida(now = new Date(), cierres: Cierres = []): string[] {
  const { min, max } = rangoFechas(now);
  const out: string[] = [];
  for (let fecha = min; fecha <= max; fecha = sumarDias(fecha, 1)) {
    if (horasDisponibles(fecha, now, cierres).length > 0) out.push(fecha);
  }
  return out;
}

// Límites del selector de fecha libre (min/max del <input type="date">).
export function rangoFechas(now = new Date()): { min: string; max: string } {
  const hoy = ahoraMadrid(now).fecha;
  return { min: hoy, max: sumarDias(hoy, RECOGIDA.maxDias) };
}

// Una hora concreta vale si cae en el horario y, si es hoy, no ha pasado.
export function horaValida(fecha: string, hora: string, now = new Date()): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return false;
  if (hora < RECOGIDA.horaMin || hora >= RECOGIDA.horaMax) return false;
  const hoy = ahoraMadrid(now);
  return fecha !== hoy.fecha || aMinutos(hora) >= hoy.minutos;
}

// Un día abierto de hoy a +60 días y una hora dentro del horario.
export function recogidaValida(
  r: Partial<Recogida> | null | undefined,
  now = new Date(),
  cierres: Cierres = []
): r is Recogida {
  if (!r || typeof r.fecha !== "string" || typeof r.hora !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.fecha) || Number.isNaN(Date.parse(`${r.fecha}T12:00:00Z`))) return false;
  const { min, max } = rangoFechas(now);
  return r.fecha >= min && r.fecha <= max && !cerradoEse(r.fecha, cierres) && horaValida(r.fecha, r.hora, now);
}

// "martes 29 de septiembre"
export function fechaLarga(fecha: string): string {
  return new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// { dia: "mar", num: "29", mes: "sep" } para los chips del selector.
export function fechaCorta(fecha: string): { dia: string; num: string; mes: string } {
  const d = new Date(`${fecha}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("es-ES", { ...o, timeZone: "UTC" }).replace(".", "");
  return { dia: f({ weekday: "short" }), num: f({ day: "numeric" }), mes: f({ month: "short" }) };
}

export function etiquetaRelativa(fecha: string, now = new Date()): string | null {
  const hoy = ahoraMadrid(now).fecha;
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  return null;
}
