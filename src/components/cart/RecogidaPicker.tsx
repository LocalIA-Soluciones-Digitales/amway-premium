"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { fechaLarga, sumarDias } from "@/lib/recogida";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

const nombreMes = (mes: string) =>
  new Date(`${mes}-01T12:00:00Z`).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });

function mesSiguiente(mes: string, n: number): string {
  const d = new Date(`${mes}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

// Celdas de un mes (YYYY-MM) empezando en lunes; null = hueco antes del día 1.
function celdasMes(mes: string): (string | null)[] {
  const primero = `${mes}-01`;
  const hueco = (new Date(`${primero}T12:00:00Z`).getUTCDay() + 6) % 7;
  const out: (string | null)[] = Array(hueco).fill(null);
  for (let f = primero; f.startsWith(mes); f = sumarDias(f, 1)) out.push(f);
  return out;
}

const triggerClass =
  "flex h-12 w-full items-center gap-3 rounded-2xl border bg-white px-3.5 text-left text-sm text-carbon transition";

// Día en un calendario desplegable (solo se pueden pulsar los días abiertos)
// y hora en un desplegable con los huecos que quedan libres ese día.
export function RecogidaPicker({
  dias,
  horas,
  fecha,
  hora,
  onFecha,
  onHora,
}: {
  dias: string[];
  horas: string[];
  fecha: string | null;
  hora: string | null;
  onFecha: (fecha: string) => void;
  onHora: (hora: string | null) => void;
}) {
  const abiertos = useMemo(() => new Set(dias), [dias]);
  const primerMes = dias[0]?.slice(0, 7) ?? "";
  const ultimoMes = dias[dias.length - 1]?.slice(0, 7) ?? "";
  const [calendario, setCalendario] = useState(false);
  const [mes, setMes] = useState<string | null>(null);
  const mesVisto = mes ?? fecha?.slice(0, 7) ?? primerMes;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setCalendario((v) => !v)}
        aria-expanded={calendario}
        className={cn(triggerClass, calendario ? "border-carbon/40" : "border-carbon/15 hover:border-carbon/35")}
      >
        <CalendarDays size={16} className="shrink-0 text-stone" />
        <span className={cn("min-w-0 flex-1 truncate first-letter:uppercase", !fecha && "text-stone")}>
          {fecha ? fechaLarga(fecha) : "Elige el día"}
        </span>
        <ChevronDown size={16} className={cn("shrink-0 text-stone transition", calendario && "rotate-180")} />
      </button>

      {calendario && mesVisto && (
        <div className="rounded-2xl border border-carbon/15 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMes(mesSiguiente(mesVisto, -1))}
              disabled={mesVisto <= primerMes}
              aria-label="Mes anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full text-carbon transition hover:bg-carbon/5 disabled:opacity-25"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium capitalize text-carbon">{nombreMes(mesVisto)}</span>
            <button
              type="button"
              onClick={() => setMes(mesSiguiente(mesVisto, 1))}
              disabled={mesVisto >= ultimoMes}
              aria-label="Mes siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full text-carbon transition hover:bg-carbon/5 disabled:opacity-25"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="py-1 text-[10px] uppercase tracking-wider text-stone">
                {d}
              </span>
            ))}
            {celdasMes(mesVisto).map((d, i) => {
              if (!d) return <span key={`h${i}`} />;
              const abierto = abiertos.has(d);
              const activo = d === fecha;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!abierto}
                  onClick={() => {
                    onFecha(d);
                    setCalendario(false);
                  }}
                  aria-pressed={activo}
                  aria-label={fechaLarga(d)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-full text-sm tabular-nums transition",
                    activo
                      ? "bg-carbon text-cream"
                      : abierto
                        ? "text-carbon hover:bg-carbon/8"
                        : "cursor-default text-stone/35 line-through decoration-stone/25"
                  )}
                >
                  {Number(d.slice(8))}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-stone">Solo aparecen los días que abre la tienda.</p>
        </div>
      )}

      <label
        className={cn(
          triggerClass,
          "relative",
          fecha ? "border-carbon/15 hover:border-carbon/35" : "border-carbon/10 opacity-60"
        )}
      >
        <Clock size={16} className="shrink-0 text-stone" />
        <span className={cn("min-w-0 flex-1", !hora && "text-stone")}>
          {hora ? `A las ${hora} h` : fecha ? "Elige la hora" : "Elige primero el día"}
        </span>
        <ChevronDown size={16} className="shrink-0 text-stone" />
        <select
          value={hora ?? ""}
          onChange={(e) => onHora(e.target.value || null)}
          disabled={!fecha}
          aria-label="Hora de recogida"
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        >
          <option value="">Elige la hora</option>
          {horas.map((h) => (
            <option key={h} value={h}>
              {h} h
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
