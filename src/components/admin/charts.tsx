"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
