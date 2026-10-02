// Estadística ligera para los paneles de desarrollo: tendencia lineal,
// previsión con estacionalidad semanal, anomalías y mapas de calor. Todo
// en el navegador y sin dependencias; con pocos datos se nota en la banda
// de incertidumbre, no en cifras inventadas.

export interface Regresion {
  pendiente: number; // unidades por paso
  origen: number;
  r2: number;
}

export function regresion(y: number[]): Regresion {
  const n = y.length;
  if (n < 2) return { pendiente: 0, origen: y[0] ?? 0, r2: 0 };
  const mx = (n - 1) / 2;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  y.forEach((v, x) => {
    sxy += (x - mx) * (v - my);
    sxx += (x - mx) ** 2;
    syy += (v - my) ** 2;
  });
  const pendiente = sxx ? sxy / sxx : 0;
  return { pendiente, origen: my - pendiente * mx, r2: syy ? (sxy * sxy) / (sxx * syy) : 0 };
}

const media = (l: number[]) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
export const desviacion = (l: number[]) => {
  const m = media(l);
  return Math.sqrt(media(l.map((v) => (v - m) ** 2)));
};

export interface Prevision {
  valores: number[];
  bajo: number[];
  alto: number[];
  total: number;
  totalBajo: number;
  totalAlto: number;
  // Variación semanal de la tendencia, relativa a la media (0.12 = +12 %/semana).
  tendenciaSemanal: number;
  fiabilidad: "baja" | "media" | "alta";
}

// Tendencia lineal × índice estacional por día de la semana (si hay al menos
// dos semanas), con banda del 80 % a partir del error del ajuste. `diaInicio`
// es el día de la semana (0 = lunes) del primer valor de la serie.
export function prever(serie: number[], horizonte: number, diaInicio = 0, semanal = true): Prevision {
  const n = serie.length;
  const m = media(serie);
  const estacional = Array(7).fill(1);
  if (semanal && n >= 14 && m > 0) {
    for (let d = 0; d < 7; d++) {
      const delDia = serie.filter((_, i) => (diaInicio + i) % 7 === d);
      estacional[d] = media(delDia) / m || 0;
    }
  }
  const desest = serie.map((v, i) => (estacional[(diaInicio + i) % 7] ? v / estacional[(diaInicio + i) % 7] : v));
  const r = regresion(desest);
  const ajuste = desest.map((_, i) => Math.max(0, (r.origen + r.pendiente * i) * estacional[(diaInicio + i) % 7]));
  const error = desviacion(serie.map((v, i) => v - ajuste[i]));
  const valores: number[] = [];
  const bajo: number[] = [];
  const alto: number[] = [];
  for (let h = 0; h < horizonte; h++) {
    const i = n + h;
    const v = Math.max(0, (r.origen + r.pendiente * i) * estacional[(diaInicio + i) % 7]);
    // La incertidumbre crece con la distancia al último dato.
    const margen = 1.28 * error * Math.sqrt(1 + (h + 1) / Math.max(n, 1));
    valores.push(v);
    bajo.push(Math.max(0, v - margen));
    alto.push(v + margen);
  }
  const suma = (l: number[]) => l.reduce((a, b) => a + b, 0);
  const cv = m ? error / m : 1;
  return {
    valores,
    bajo,
    alto,
    total: suma(valores),
    // El total de un periodo tiene menos error relativo que cada día.
    totalBajo: Math.max(0, suma(valores) - 1.28 * error * Math.sqrt(horizonte)),
    totalAlto: suma(valores) + 1.28 * error * Math.sqrt(horizonte),
    tendenciaSemanal: m ? (r.pendiente * 7) / m : 0,
    fiabilidad: n < 14 || cv > 1 ? "baja" : cv > 0.5 || r.r2 < 0.2 ? "media" : "alta",
  };
}

// Índices de valores fuera de lo normal (|z| ≥ umbral), ignorando ceros iniciales.
export function anomalias(serie: number[], umbral = 2): { indice: number; z: number }[] {
  const desde = serie.findIndex((v) => v > 0);
  if (desde < 0) return [];
  const util = serie.slice(desde);
  const m = media(util);
  const s = desviacion(util);
  if (!s || util.length < 7) return [];
  return util
    .map((v, i) => ({ indice: i + desde, z: (v - m) / s }))
    .filter((a) => Math.abs(a.z) >= umbral);
}

// Matriz 7×24 (lunes primero) contando claves únicas por día y hora de Madrid.
const FMT_HORA = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", hourCycle: "h23" });
const DIA_IDX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function diaHoraMadrid(iso: string): { dia: number; hora: number } {
  const parts = Object.fromEntries(FMT_HORA.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return { dia: DIA_IDX[parts.weekday] ?? 0, hora: Number(parts.hour) % 24 };
}

export function mapaCalor<T>(items: T[], fecha: (t: T) => string, clave: (t: T) => string): number[][] {
  const sets = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => new Set<string>()));
  for (const it of items) {
    const { dia, hora } = diaHoraMadrid(fecha(it));
    sets[dia][hora].add(clave(it));
  }
  return sets.map((fila) => fila.map((s) => s.size));
}

export function picoMapa(m: number[][]): { dia: number; hora: number; valor: number } | null {
  let best: { dia: number; hora: number; valor: number } | null = null;
  m.forEach((fila, d) => fila.forEach((v, h) => (!best || v > best.valor ? (best = { dia: d, hora: h, valor: v }) : null)));
  return best && (best as { valor: number }).valor > 0 ? best : null;
}

export const DIAS_LARGOS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export const pctTxt = (x: number | null | undefined, dec = 0) =>
  x == null || !Number.isFinite(x) ? "—" : `${(x * 100).toLocaleString("es-ES", { maximumFractionDigits: dec, minimumFractionDigits: dec })} %`;

const MIN = 60_000;
export function haceCuanto(iso: string | null | undefined): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MIN) return "ahora mismo";
  if (diff < 60 * MIN) return `hace ${Math.floor(diff / MIN)} min`;
  if (diff < 24 * 60 * MIN) return `hace ${Math.floor(diff / (60 * MIN))} h`;
  const dias = Math.floor(diff / (24 * 60 * MIN));
  if (dias === 1) return "ayer";
  if (dias < 60) return `hace ${dias} días`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
