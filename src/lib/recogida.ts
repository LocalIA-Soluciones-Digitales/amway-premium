// Recogida en mano: días y horas que se ofrecen en la cesta. Lo usan tanto
// el navegador (para pintar las opciones) como el servidor (para validar lo
// que llega), siempre en hora de Madrid aunque el servidor esté en UTC.

export const RECOGIDA = {
  zona: "Europe/Madrid",
  diasVista: 10, // días hábiles que se ofrecen
  cerrado: [0], // 0 = domingo
  horas: ["10:00", "11:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00"],
  antelacionMin: 120, // la primera hora de hoy tiene que quedar a 2 h vista
  // Día y hora a elección del cliente ("Otro día" / "Otra hora").
  maxDias: 60,
  horaMin: "08:00",
  horaMax: "22:00",
  antelacionLibreMin: 60,
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

// Aritmética de calendario sobre YYYY-MM-DD (a mediodía UTC, sin saltos de hora).
function sumarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const diaSemana = (fecha: string) => new Date(`${fecha}T12:00:00Z`).getUTCDay();
const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

// Horas sugeridas para una fecha (las de hoy, solo las que quedan a tiempo).
export function horasDisponibles(fecha: string, now = new Date()): string[] {
  const hoy = ahoraMadrid(now);
  if (fecha < hoy.fecha) return [];
  if (fecha > hoy.fecha) return [...RECOGIDA.horas];
  return RECOGIDA.horas.filter((h) => aMinutos(h) >= hoy.minutos + RECOGIDA.antelacionMin);
}

export function diasRecogida(now = new Date()): string[] {
  const out: string[] = [];
  let fecha = ahoraMadrid(now).fecha;
  for (let i = 0; out.length < RECOGIDA.diasVista && i < 31; i++, fecha = sumarDias(fecha, 1)) {
    const cerrado = (RECOGIDA.cerrado as readonly number[]).includes(diaSemana(fecha));
    if (!cerrado && horasDisponibles(fecha, now).length > 0) out.push(fecha);
  }
  return out;
}

// Límites del selector de fecha libre (min/max del <input type="date">).
export function rangoFechas(now = new Date()): { min: string; max: string } {
  const hoy = ahoraMadrid(now).fecha;
  return { min: hoy, max: sumarDias(hoy, RECOGIDA.maxDias) };
}

// Una hora concreta vale si cae en el horario y, si es hoy, aún da tiempo.
export function horaValida(fecha: string, hora: string, now = new Date()): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return false;
  if (hora < RECOGIDA.horaMin || hora > RECOGIDA.horaMax) return false;
  const hoy = ahoraMadrid(now);
  return fecha !== hoy.fecha || aMinutos(hora) >= hoy.minutos + RECOGIDA.antelacionLibreMin;
}

// Cualquier día de hoy a +60 días (también los que no se sugieren) y
// cualquier hora dentro del horario: el cliente puede proponer la suya.
export function recogidaValida(r: Partial<Recogida> | null | undefined, now = new Date()): r is Recogida {
  if (!r || typeof r.fecha !== "string" || typeof r.hora !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.fecha) || Number.isNaN(Date.parse(`${r.fecha}T12:00:00Z`))) return false;
  const { min, max } = rangoFechas(now);
  return r.fecha >= min && r.fecha <= max && horaValida(r.fecha, r.hora, now);
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
