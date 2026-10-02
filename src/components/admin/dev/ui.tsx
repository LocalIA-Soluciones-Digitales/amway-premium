"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Info, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Hallazgo {
  tono: "bueno" | "malo" | "aviso" | "info";
  titulo: ReactNode;
  detalle?: ReactNode;
}

const ICONO = {
  bueno: <TrendingUp size={15} />,
  malo: <TrendingDown size={15} />,
  aviso: <AlertTriangle size={15} />,
  info: <Info size={15} />,
};
const COLOR = {
  bueno: "bg-emerald-50 text-emerald-700",
  malo: "bg-red-50 text-red-600",
  aviso: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
};

// Conclusiones calculadas a partir de los datos, en frases: lo primero que
// se lee en cada informe.
export function Hallazgos({ items, titulo = "Lo importante" }: { items: Hallazgo[]; titulo?: string }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-3xl border border-carbon/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(28,26,22,0.04)]">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">
        <Lightbulb size={13} /> {titulo}
      </p>
      <ul className="grid gap-x-6 gap-y-3 md:grid-cols-2">
        {items.map((h, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", COLOR[h.tono])}>{ICONO[h.tono]}</span>
            <span className="min-w-0 text-sm">
              <span className="block text-carbon">{h.titulo}</span>
              {h.detalle && <span className="mt-0.5 block text-xs leading-relaxed text-stone">{h.detalle}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Fila de tabla compacta para métricas por segmento.
export function TablaMetricas({
  columnas,
  filas,
  vacio = "Sin datos todavía.",
}: {
  columnas: { titulo: string; derecha?: boolean }[];
  filas: ReactNode[][];
  vacio?: string;
}) {
  if (filas.length === 0) return <p className="text-sm text-stone">{vacio}</p>;
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.1em] text-stone">
            {columnas.map((c) => (
              <th key={c.titulo} className={cn("px-1 pb-2 font-semibold", c.derecha ? "text-right" : "text-left")}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-carbon/[0.05]">
          {filas.map((f, i) => (
            <tr key={i}>
              {f.map((celda, j) => (
                <td key={j} className={cn("px-1 py-2 tabular-nums", columnas[j]?.derecha ? "text-right" : "text-left", j === 0 ? "text-carbon" : "text-carbon/80")}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Barrita de porcentaje para usar dentro de tablas.
export function MiniBarra({ valor, max = 1 }: { valor: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-carbon/[0.06]">
        <span className="block h-full rounded-full bg-forest" style={{ width: `${max ? Math.min(100, (valor / max) * 100) : 0}%` }} />
      </span>
    </span>
  );
}
