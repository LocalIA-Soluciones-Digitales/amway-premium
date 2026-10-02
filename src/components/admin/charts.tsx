"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

// One brand hue for single-series magnitude charts (the title names the
// series, so no legend); text stays in ink tokens, never the series color.
export const CHART_COLOR = "#1f4438"; // --color-forest
const GRID = "rgba(28,26,22,0.07)";
const AXIS = "#8a8271"; // --color-stone

export interface Point {
  label: string;
  value: number;
}

function TooltipBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-carbon/[0.08] bg-white px-3 py-2 text-xs shadow-[0_10px_30px_rgba(28,26,22,0.12)]">
      <p className="text-stone">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-carbon">{value}</p>
    </div>
  );
}

export function TrendChart({
  data,
  format = (n) => String(Math.round(n)),
  height = 240,
  name,
}: {
  data: Point[];
  format?: (n: number) => string;
  height?: number;
  name: string;
}) {
  return (
    <div style={{ height }} role="img" aria-label={`Gráfica: ${name}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={`fill-${name.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.18} />
              <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={format} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "rgba(28,26,22,0.25)", strokeWidth: 1 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? <TooltipBox label={String(label)} value={format(Number(payload[0].value))} /> : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            name={name}
            stroke={CHART_COLOR}
            strokeWidth={2}
            fill={`url(#fill-${name.replace(/\W/g, "")})`}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2, fill: CHART_COLOR }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ColumnChart({
  data,
  format = (n) => String(Math.round(n)),
  height = 200,
  name,
}: {
  data: Point[];
  format?: (n: number) => string;
  height?: number;
  name: string;
}) {
  return (
    <div style={{ height }} role="img" aria-label={`Gráfica: ${name}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={format} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(28,26,22,0.04)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? <TooltipBox label={String(label)} value={format(Number(payload[0].value))} /> : null
            }
          />
          <Bar dataKey="value" name={name} fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal "bar list": label, magnitude bar, value and share. Plain HTML,
// so it reads as a table for screen readers and prints cleanly.
export function BarList({
  items,
  format = (n) => String(n),
  empty = "Sin datos todavía.",
}: {
  items: { label: string; value: number; hint?: string }[];
  format?: (n: number) => string;
  empty?: string;
}) {
  const max = Math.max(0, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  if (items.length === 0 || total === 0) return <p className="text-sm text-stone">{empty}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li key={i.label} title={`${i.label}: ${format(i.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-carbon">{i.label}</span>
            <span className="shrink-0 tabular-nums text-carbon">
              {format(i.value)}
              <span className="ml-2 text-xs text-stone">{((i.value / total) * 100).toFixed(0)} %</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-carbon/[0.05]">
            <div className={cn("h-full rounded-full bg-forest")} style={{ width: `${max ? (i.value / max) * 100 : 0}%` }} />
          </div>
          {i.hint && <p className="mt-1 text-[11px] text-stone">{i.hint}</p>}
        </li>
      ))}
    </ul>
  );
}

// Conversion funnel as stepped horizontal bars (share of the first step).
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const first = steps[0]?.value ?? 0;
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, idx) => {
        const pct = first ? (s.value / first) * 100 : 0;
        const prev = idx > 0 ? steps[idx - 1].value : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-carbon">
                <span className="mr-2 text-xs tabular-nums text-stone">{idx + 1}</span>
                {s.label}
              </span>
              <span className="tabular-nums text-carbon">
                {s.value}
                {prev != null && prev > 0 && (
                  <span className="ml-2 text-xs text-stone">{((s.value / prev) * 100).toFixed(0)} % del paso anterior</span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-carbon/[0.05]">
              <div className="h-full rounded-full bg-forest" style={{ width: `${Math.max(pct, s.value ? 2 : 0)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Mini tendencia sin ejes, para acompañar una cifra.
export function Sparkline({ data, height = 36, color = CHART_COLOR }: { data: number[]; height?: number; color?: string }) {
  const id = `spark-${color.replace(/\W/g, "")}`;
  if (data.length < 2 || data.every((v) => v === 0)) return <div style={{ height }} />;
  return (
    <div style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((value, i) => ({ i, value }))} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface ForecastPoint {
  label: string;
  ventas: number | null;
  beneficio: number | null;
  prevision: number | null;
}

// Ventas reales (barras), beneficio (línea) y previsión (barras rayadas)
// en la misma escala de euros.
export function ForecastChart({
  data,
  format,
  height = 280,
}: {
  data: ForecastPoint[];
  format: (n: number) => string;
  height?: number;
}) {
  const firstForecast = data.find((d) => d.prevision != null)?.label;
  return (
    <div style={{ height }} role="img" aria-label="Gráfica: ventas, beneficio y previsión por semana">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap="24%">
          <defs>
            <pattern id="rayas-prevision" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="rgba(31,68,56,0.10)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(31,68,56,0.45)" strokeWidth="2" />
            </pattern>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={60} tickFormatter={format} allowDecimals={false} />
          {firstForecast && <ReferenceLine x={firstForecast} stroke="rgba(28,26,22,0.18)" strokeDasharray="3 3" />}
          <Tooltip
            cursor={{ fill: "rgba(28,26,22,0.04)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as ForecastPoint;
              return (
                <div className="rounded-xl border border-carbon/[0.08] bg-white px-3 py-2 text-xs shadow-[0_10px_30px_rgba(28,26,22,0.12)]">
                  <p className="text-stone">Semana del {String(label)}</p>
                  {d.ventas != null && (
                    <p className="mt-1 flex justify-between gap-4">
                      <span className="text-stone">Ventas</span>
                      <span className="font-semibold tabular-nums text-carbon">{format(d.ventas)}</span>
                    </p>
                  )}
                  {d.beneficio != null && (
                    <p className="flex justify-between gap-4">
                      <span className="text-stone">Beneficio</span>
                      <span className="font-semibold tabular-nums text-gold">{format(d.beneficio)}</span>
                    </p>
                  )}
                  {d.prevision != null && (
                    <p className="mt-1 flex justify-between gap-4">
                      <span className="text-stone">Previsión</span>
                      <span className="font-semibold tabular-nums text-forest">{format(d.prevision)}</span>
                    </p>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="ventas" name="Ventas" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="prevision" name="Previsión" fill="url(#rayas-prevision)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Line
            type="monotone"
            dataKey="beneficio"
            name="Beneficio"
            stroke="#b8905a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2, fill: "#b8905a" }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Anillo de reparto (p. ej. a dónde va cada euro vendido).
export function Donut({
  items,
  format,
  center,
  size = 180,
}: {
  items: { label: string; value: number; color: string }[];
  format: (n: number) => string;
  center?: { value: string; label: string };
  size?: number;
}) {
  const data = items.filter((i) => i.value > 0);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label="Gráfica de reparto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.length ? data : [{ label: "—", value: 1, color: "rgba(28,26,22,0.06)" }]}
            dataKey="value"
            nameKey="label"
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
            isAnimationActive={false}
          >
            {(data.length ? data : [{ color: "rgba(28,26,22,0.06)" }]).map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          {data.length > 0 && (
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TooltipBox label={String(payload[0].name)} value={format(Number(payload[0].value))} />
                ) : null
              }
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {center && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-xl leading-none tabular-nums text-carbon">{center.value}</span>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-stone">{center.label}</span>
        </div>
      )}
    </div>
  );
}

export interface ProjectionPoint {
  label: string;
  real: number | null;
  prevision: number | null;
  rango: [number, number] | null;
}

// Serie real (área) seguida de la previsión (línea discontinua) con su banda
// de incertidumbre del 80 %.
export function ProjectionChart({
  data,
  format = (n) => String(Math.round(n)),
  height = 260,
  name,
}: {
  data: ProjectionPoint[];
  format?: (n: number) => string;
  height?: number;
  name: string;
}) {
  const firstForecast = data.find((d) => d.real == null && d.prevision != null)?.label;
  const gid = `proj-${name.replace(/\W/g, "")}`;
  return (
    <div style={{ height }} role="img" aria-label={`Gráfica: ${name} con previsión`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.18} />
              <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={format} allowDecimals={false} />
          {firstForecast && <ReferenceLine x={firstForecast} stroke="rgba(28,26,22,0.18)" strokeDasharray="3 3" label={{ value: "Previsión", position: "insideTopRight", fill: AXIS, fontSize: 10 }} />}
          <Tooltip
            cursor={{ stroke: "rgba(28,26,22,0.25)", strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as ProjectionPoint;
              return d.real != null ? (
                <TooltipBox label={String(label)} value={format(d.real)} />
              ) : d.prevision != null ? (
                <div className="rounded-xl border border-carbon/[0.08] bg-white px-3 py-2 text-xs shadow-[0_10px_30px_rgba(28,26,22,0.12)]">
                  <p className="text-stone">{String(label)} · previsión</p>
                  <p className="mt-0.5 font-semibold tabular-nums text-carbon">≈ {format(d.prevision)}</p>
                  {d.rango && (
                    <p className="text-stone tabular-nums">
                      {format(d.rango[0])} – {format(d.rango[1])}
                    </p>
                  )}
                </div>
              ) : null;
            }}
          />
          <Area type="monotone" dataKey="rango" stroke="none" fill={CHART_COLOR} fillOpacity={0.08} isAnimationActive={false} connectNulls={false} />
          <Area
            type="monotone"
            dataKey="real"
            name={name}
            stroke={CHART_COLOR}
            strokeWidth={2}
            fill={`url(#${gid})`}
            connectNulls={false}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2, fill: CHART_COLOR }}
          />
          <Line type="monotone" dataKey="prevision" stroke={CHART_COLOR} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

// Mapa de calor día de la semana × hora (Madrid). Celdas HTML para que se
// lea bien en móvil y con lector de pantalla (title con el valor).
export function Heatmap({ data, unidad = "visitantes", desde = 7, hasta = 23 }: { data: number[][]; unidad?: string; desde?: number; hasta?: number }) {
  const max = Math.max(1, ...data.flat());
  const horas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
  return (
    <div className="overflow-x-auto [scrollbar-width:thin]">
      <div className="inline-grid min-w-full gap-[3px]" style={{ gridTemplateColumns: `1.25rem repeat(${horas.length}, minmax(1.1rem, 1fr))` }}>
        <span />
        {horas.map((h) => (
          <span key={h} className="text-center text-[9px] tabular-nums text-stone">
            {h % 3 === 0 ? h : ""}
          </span>
        ))}
        {data.map((fila, d) => (
          <div key={d} className="contents">
            <span className="text-[10px] font-medium leading-[1.1rem] text-stone">{DIAS_CORTOS[d]}</span>
            {horas.map((h) => {
              const v = fila[h] ?? 0;
              return (
                <span
                  key={h}
                  title={`${DIAS_CORTOS[d]} ${h}:00 · ${v} ${unidad}`}
                  className="h-[1.1rem] rounded-[4px]"
                  style={{ background: v ? `rgba(31,68,56,${0.12 + (v / max) * 0.83})` : "rgba(28,26,22,0.04)" }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-stone">
        menos
        {[0.12, 0.35, 0.6, 0.95].map((o) => (
          <span key={o} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: `rgba(31,68,56,${o})` }} />
        ))}
        más
      </div>
    </div>
  );
}
