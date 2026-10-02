"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bug, ChevronDown, Clock, Globe, Monitor, RefreshCw, Smartphone, Trash2 } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { Badge, Empty, Loading, PanelHeader, btnGhost } from "../shared";

interface ErrorRow {
  id: string;
  mensaje: string;
  detalle: string | null;
  path: string | null;
  user_agent: string | null;
  created_at: string;
}

// ---------- Formato de fechas ----------

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

// "hace 5 min", "hace 3 h", "ayer", "hace 4 días"
function haceCuanto(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MIN) return "ahora mismo";
  if (diff < HORA) return `hace ${Math.floor(diff / MIN)} min`;
  if (diff < DIA) return `hace ${Math.floor(diff / HORA)} h`;
  const dias = Math.floor(diff / DIA);
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// "Hoy, 19:10" / "Ayer, 13:30" / "lun 25 sept, 11:51"
function fechaHora(iso: string): string {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const hoy = new Date();
  const ayer = new Date(hoy.getTime() - DIA);
  if (d.toDateString() === hoy.toDateString()) return `Hoy, ${hora}`;
  if (d.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;
  const dia = d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== hoy.getFullYear() ? { year: "numeric" } : {}),
  });
  return `${dia}, ${hora}`;
}

// ---------- Navegador legible ----------

interface Dispositivo {
  texto: string;
  movil: boolean;
}

function dispositivo(ua: string | null): Dispositivo {
  if (!ua) return { texto: "Desconocido", movil: false };
  const ios = ua.match(/(iPhone|iPad)[^)]*OS (\d+)[_.](\d+)/);
  const android = ua.match(/Android (\d+(?:\.\d+)?)/);
  const so = ios
    ? `${ios[1]} · iOS ${ios[2]}.${ios[3]}`
    : android
      ? `Android ${android[1]}`
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "Otro";
  const nav = /Edg\//.test(ua)
    ? "Edge"
    : /SamsungBrowser/.test(ua)
      ? "Samsung Internet"
      : /CriOS|Chrome\//.test(ua)
        ? "Chrome"
        : /FxiOS|Firefox\//.test(ua)
          ? "Firefox"
          : /Instagram/.test(ua)
            ? "Instagram"
            : /FBAN|FBAV/.test(ua)
              ? "Facebook"
              : /Safari\//.test(ua)
                ? "Safari"
                : "Navegador";
  return { texto: `${nav} · ${so}`, movil: /Mobile|iPhone|Android/.test(ua) };
}

// Pista en castellano para los fallos más habituales.
function pista(mensaje: string): string | null {
  if (/^Script error\.?$/i.test(mensaje))
    return "Fallo en un script de otro dominio (analítica, widgets, extensiones). El navegador oculta los detalles; normalmente no es de la tienda.";
  if (/WebGL/i.test(mensaje)) return "El dispositivo no pudo iniciar los gráficos 3D (WebGL desactivado o sin memoria). Suele ser del móvil, no del código.";
  if (/SyntaxError/i.test(mensaje)) return "El navegador no entiende parte del código: suele ser un navegador antiguo o un script externo.";
  if (/ChunkLoadError|Loading chunk|dynamically imported module/i.test(mensaje))
    return "No cargó un trozo de la web, normalmente porque se publicó una versión nueva mientras navegaba. Se arregla recargando.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(mensaje)) return "Fallo de conexión del visitante.";
  if (/ResizeObserver/i.test(mensaje)) return "Aviso inofensivo del navegador; se puede ignorar.";
  return null;
}

export function ErroresPanel() {
  const [rows, setRows] = useState<ErrorRow[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await amwayDb().from("amway_errores").select("*").order("created_at", { ascending: false }).limit(1000);
    setRows((data as ErrorRow[] | null) ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Agrupa por mensaje: el mismo fallo repetido es una sola incidencia.
  const grupos = useMemo(() => {
    const m = new Map<string, ErrorRow[]>();
    for (const r of rows ?? []) m.set(r.mensaje, [...(m.get(r.mensaje) ?? []), r]);
    return Array.from(m.entries()).map(([mensaje, list]) => {
      const disp = new Map<string, number>();
      for (const r of list) {
        const t = dispositivo(r.user_agent).texto;
        disp.set(t, (disp.get(t) ?? 0) + 1);
      }
      return {
        mensaje,
        list,
        ultimo: list[0],
        primero: list[list.length - 1],
        hoy: list.filter((r) => Date.now() - new Date(r.created_at).getTime() < DIA).length,
        paths: Array.from(new Set(list.map((r) => r.path).filter(Boolean))) as string[],
        dispositivos: Array.from(disp.entries()).sort((a, b) => b[1] - a[1]),
      };
    });
  }, [rows]);

  const resumen = useMemo(() => {
    const list = rows ?? [];
    return {
      total: list.length,
      dia: list.filter((r) => Date.now() - new Date(r.created_at).getTime() < DIA).length,
      semana: list.filter((r) => Date.now() - new Date(r.created_at).getTime() < 7 * DIA).length,
    };
  }, [rows]);

  async function borrarTodo() {
    if (!confirm("¿Vaciar el registro de errores?")) return;
    await amwayDb().from("amway_errores").delete().gte("created_at", "1970-01-01");
    setRows([]);
  }

  async function borrarGrupo(mensaje: string) {
    await amwayDb().from("amway_errores").delete().eq("mensaje", mensaje);
    setRows((prev) => prev?.filter((r) => r.mensaje !== mensaje) ?? null);
  }

  return (
    <div>
      <PanelHeader
        title="Registro de errores"
        description="Fallos de JavaScript que han tenido los visitantes en la tienda, agrupados por mensaje."
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => void cargar()} className={btnGhost} disabled={cargando}>
              <RefreshCw size={14} className={cn(cargando && "animate-spin")} /> Actualizar
            </button>
            {rows && rows.length > 0 && (
              <button type="button" onClick={borrarTodo} className={btnGhost}>
                <Trash2 size={14} /> Vaciar
              </button>
            )}
          </div>
        }
      />
      {!rows ? (
        <Loading />
      ) : grupos.length === 0 ? (
        <Empty icon={<Bug size={18} />}>Sin errores registrados. Todo en orden.</Empty>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              ["Últimas 24 h", resumen.dia],
              ["Últimos 7 días", resumen.semana],
              ["Distintos", grupos.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-carbon/[0.07] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">{label}</p>
                <p className="mt-1 font-display text-2xl tabular-nums text-carbon">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {grupos.map((g) => {
              const open = abierto === g.mensaje;
              const reciente = Date.now() - new Date(g.ultimo.created_at).getTime() < DIA;
              const ayuda = pista(g.mensaje);
              return (
                <div
                  key={g.mensaje}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white transition",
                    open ? "border-carbon/15 shadow-[0_2px_10px_rgba(28,26,22,0.06)]" : "border-carbon/[0.07]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setAbierto(open ? null : g.mensaje)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        reciente ? "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" : "bg-carbon/20"
                      )}
                      title={reciente ? "Ha ocurrido en las últimas 24 h" : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-mono text-[13px] text-carbon", !open && "truncate")}>{g.mensaje}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone">
                        <span className="inline-flex items-center gap-1" title={fechaHora(g.ultimo.created_at)}>
                          <Clock size={12} />
                          <span className={cn(reciente && "font-medium text-carbon")}>{haceCuanto(g.ultimo.created_at)}</span>
                          <span className="text-stone/70">· {fechaHora(g.ultimo.created_at)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {dispositivo(g.ultimo.user_agent).movil ? <Smartphone size={12} /> : <Monitor size={12} />}
                          {dispositivo(g.ultimo.user_agent).texto}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {g.hoy > 0 && <Badge tone="red">{g.hoy} hoy</Badge>}
                      <Badge tone={g.list.length > 5 ? "red" : "amber"}>
                        {g.list.length} {g.list.length === 1 ? "vez" : "veces"}
                      </Badge>
                      <ChevronDown size={16} className={cn("text-stone transition", open && "rotate-180")} />
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-carbon/[0.06] bg-cream/40 px-5 py-4 text-xs">
                      {ayuda && (
                        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-200/70">
                          {ayuda}
                        </p>
                      )}

                      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">Primera vez</dt>
                          <dd className="mt-0.5 text-carbon">{fechaHora(g.primero.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">Última vez</dt>
                          <dd className="mt-0.5 text-carbon">{fechaHora(g.ultimo.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">Páginas</dt>
                          <dd className="mt-0.5 flex flex-wrap gap-1">
                            {g.paths.length ? (
                              g.paths.map((p) => (
                                <code key={p} className="rounded bg-carbon/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-carbon">
                                  {p}
                                </code>
                              ))
                            ) : (
                              <span className="text-stone">—</span>
                            )}
                          </dd>
                        </div>
                      </dl>

                      {g.dispositivos.length > 1 && (
                        <div className="mt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">Dispositivos</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {g.dispositivos.map(([d, n]) => (
                              <Badge key={d}>
                                {d} · {n}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {g.ultimo.detalle && (
                        <div className="mt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">Detalle técnico</p>
                          <pre className="mt-1.5 max-h-64 overflow-auto rounded-xl bg-carbon p-4 font-mono text-[11px] leading-relaxed text-cream/85">
                            {g.ultimo.detalle}
                          </pre>
                        </div>
                      )}

                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone">
                          Apariciones {g.list.length > 20 && <span className="normal-case tracking-normal">(últimas 20)</span>}
                        </p>
                        <ul className="mt-1.5 divide-y divide-carbon/[0.06] rounded-xl border border-carbon/[0.07] bg-white">
                          {g.list.slice(0, 20).map((r) => {
                            const d = dispositivo(r.user_agent);
                            return (
                              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
                                <span className="w-36 shrink-0 tabular-nums text-carbon">{fechaHora(r.created_at)}</span>
                                <span className="inline-flex min-w-0 items-center gap-1 text-stone">
                                  <Globe size={12} />
                                  <code className="font-mono text-[11px]">{r.path ?? "—"}</code>
                                </span>
                                <span
                                  className="ml-auto inline-flex items-center gap-1 text-stone"
                                  title={r.user_agent ?? undefined}
                                >
                                  {d.movil ? <Smartphone size={12} /> : <Monitor size={12} />}
                                  {d.texto}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <button type="button" onClick={() => borrarGrupo(g.mensaje)} className={`${btnGhost} mt-4 h-8 text-xs`}>
                        <Trash2 size={13} /> Marcar como resuelto
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
