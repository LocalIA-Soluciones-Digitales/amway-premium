"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bug, ChevronDown, Clock, Copy, FileCode2, Globe, Monitor, RefreshCw, Smartphone, Trash2 } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { BarList, ColumnChart, Sparkline } from "../charts";
import { Badge, Card, CardTitle, Empty, Loading, PanelHeader, btnGhost, traerTodo } from "../shared";
import { haceCuanto } from "./analitica";
import { Hallazgos, type Hallazgo } from "./ui";

interface ErrorRow {
  id: string;
  mensaje: string;
  detalle: string | null;
  path: string | null;
  user_agent: string | null;
  created_at: string;
}

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;
const DIAS_GRAFICA = 14;

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

// Fallos que no dependen del código de la tienda: se ocultan por defecto.
function esRuido(mensaje: string): boolean {
  return /^Script error\.?$|ResizeObserver|Failed to fetch|NetworkError|Load failed|ChunkLoadError|Loading chunk|dynamically imported module|extension:\/\//i.test(
    mensaje
  );
}

// Primer marco del stack que apunta a código propio: "chunks/app.js:12:34".
function origen(detalle: string | null): string | null {
  if (!detalle) return null;
  for (const linea of detalle.split("\n")) {
    const m = linea.match(/(\/[^\s()]+?\.(?:js|tsx?|mjs)):(\d+):(\d+)/);
    if (m && !/node_modules|extension/.test(m[1])) return `${m[1].split("/").slice(-2).join("/")}:${m[2]}:${m[3]}`;
  }
  return null;
}

function porDia(list: { created_at: string }[], n = DIAS_GRAFICA): number[] {
  const ahora = Date.now();
  const claves = Array.from({ length: n }, (_, i) => new Date(ahora - (n - 1 - i) * DIA).toLocaleDateString("en-CA"));
  const m = new Map(claves.map((k) => [k, 0]));
  for (const r of list) {
    const k = new Date(r.created_at).toLocaleDateString("en-CA");
    if (m.has(k)) m.set(k, m.get(k)! + 1);
  }
  return claves.map((k) => m.get(k)!);
}

export function ErroresPanel() {
  const [rows, setRows] = useState<ErrorRow[] | null>(null);
  const [sesiones7, setSesiones7] = useState<number | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [verRuido, setVerRuido] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const db = amwayDb();
    const [e, v] = await Promise.all([
      db.from("amway_errores").select("*").order("created_at", { ascending: false }).limit(2000),
      traerTodo<{ session_id: string }>((a, b) =>
        db
          .from("amway_visitas")
          .select("session_id")
          .eq("event_type", "pageview")
          .gte("created_at", new Date(Date.now() - 7 * DIA).toISOString())
          .order("id")
          .range(a, b)
      ),
    ]);
    setRows((e.data as ErrorRow[] | null) ?? []);
    setSesiones7(new Set(v.map((x) => x.session_id)).size);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Agrupa por mensaje: el mismo fallo repetido es una sola incidencia.
  const todos = useMemo(() => {
    const m = new Map<string, ErrorRow[]>();
    for (const r of rows ?? []) m.set(r.mensaje, [...(m.get(r.mensaje) ?? []), r]);
    const ahora = Date.now();
    return Array.from(m.entries()).map(([mensaje, list]) => {
      const disp = new Map<string, number>();
      for (const r of list) {
        const t = dispositivo(r.user_agent).texto;
        disp.set(t, (disp.get(t) ?? 0) + 1);
      }
      const serie = porDia(list);
      const ultimos3 = serie.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const antes = serie.slice(0, -3).reduce((a, b) => a + b, 0) / (serie.length - 3);
      const primero = list[list.length - 1];
      return {
        mensaje,
        list,
        ultimo: list[0],
        primero,
        ruido: esRuido(mensaje),
        nuevo: ahora - new Date(primero.created_at).getTime() < DIA,
        alAlza: list.length >= 3 && ultimos3 > 0 && ultimos3 > antes * 1.5,
        serie,
        hoy: list.filter((r) => ahora - new Date(r.created_at).getTime() < DIA).length,
        paths: Array.from(new Set(list.map((r) => r.path).filter(Boolean))) as string[],
        dispositivos: Array.from(disp.entries()).sort((a, b) => b[1] - a[1]),
        origen: list.map((r) => origen(r.detalle)).find(Boolean) ?? null,
      };
    });
  }, [rows]);

  const grupos = useMemo(
    () =>
      todos
        .filter((g) => verRuido || !g.ruido)
        // Primero lo que está pasando ahora; luego lo que sube y lo más frecuente.
        .sort((a, b) => b.hoy - a.hoy || Number(b.alAlza) - Number(a.alAlza) || b.list.length - a.list.length),
    [todos, verRuido]
  );

  const resumen = useMemo(() => {
    const ahora = Date.now();
    const reales = (rows ?? []).filter((r) => !esRuido(r.mensaje));
    const semana = reales.filter((r) => ahora - new Date(r.created_at).getTime() < 7 * DIA);
    const contar = (f: (r: ErrorRow) => string) => {
      const m = new Map<string, number>();
      for (const r of semana) m.set(f(r), (m.get(f(r)) ?? 0) + 1);
      return [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value]) => ({ label, value }));
    };
    return {
      dia: reales.filter((r) => ahora - new Date(r.created_at).getTime() < DIA).length,
      semana: semana.length,
      ruido: (rows ?? []).length - reales.length,
      grafica: porDia(reales).map((value, i) => ({
        label: new Date(ahora - (DIAS_GRAFICA - 1 - i) * DIA).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        value,
      })),
      paginas: contar((r) => r.path ?? "—"),
      navegadores: contar((r) => dispositivo(r.user_agent).texto),
    };
  }, [rows]);

  const tasa = sesiones7 ? (resumen.semana / sesiones7) * 100 : null;
  const hallazgos: Hallazgo[] = [];
  const nuevos = todos.filter((g) => g.nuevo && !g.ruido);
  const alza = todos.filter((g) => g.alAlza && !g.ruido);
  if (nuevos.length)
    hallazgos.push({
      tono: "malo",
      titulo: `${nuevos.length} error${nuevos.length === 1 ? "" : "es"} nuevo${nuevos.length === 1 ? "" : "s"} en las últimas 24 h`,
      detalle: `¿Coincide con el último despliegue? ${nuevos[0].mensaje.slice(0, 90)}`,
    });
  if (alza.length)
    hallazgos.push({
      tono: "aviso",
      titulo: `${alza.length} error${alza.length === 1 ? "" : "es"} al alza`,
      detalle: `Los últimos 3 días ocurre más que antes: ${alza[0].mensaje.slice(0, 90)}`,
    });
  if (tasa != null)
    hallazgos.push({
      tono: tasa > 5 ? "malo" : tasa > 1 ? "aviso" : "bueno",
      titulo: `${tasa.toLocaleString("es-ES", { maximumFractionDigits: 1 })} errores reales por cada 100 visitas`,
      detalle: `${resumen.semana} errores y ${sesiones7} visitantes en 7 días. ${tasa <= 1 ? "Muy sano." : "Por encima de 1 merece revisarse."}`,
    });
  if (resumen.ruido)
    hallazgos.push({
      tono: "info",
      titulo: `${resumen.ruido} avisos de ruido ${verRuido ? "incluidos" : "ocultos"}`,
      detalle: "Scripts externos, cortes de red o avisos del navegador que no dependen de la tienda.",
    });

  async function borrarTodo() {
    if (!confirm("¿Vaciar el registro de errores?")) return;
    await amwayDb().from("amway_errores").delete().gte("created_at", "1970-01-01");
    setRows([]);
  }

  async function borrarGrupo(mensaje: string) {
    await amwayDb().from("amway_errores").delete().eq("mensaje", mensaje);
    setRows((prev) => prev?.filter((r) => r.mensaje !== mensaje) ?? null);
  }

  function copiarIncidencia(g: (typeof todos)[number]) {
    const md = [
      `### ${g.mensaje}`,
      "",
      `- Veces: ${g.list.length} (${g.hoy} en 24 h)`,
      `- Primera: ${g.primero.created_at} · Última: ${g.ultimo.created_at}`,
      `- Páginas: ${g.paths.join(", ") || "—"}`,
      `- Dispositivos: ${g.dispositivos.map(([d, n]) => `${d} (${n})`).join(", ")}`,
      ...(g.origen ? [`- Origen: \`${g.origen}\``] : []),
      ...(g.ultimo.detalle ? ["", "```", g.ultimo.detalle, "```"] : []),
    ].join("\n");
    void navigator.clipboard?.writeText(md);
    setCopiado(g.mensaje);
    setTimeout(() => setCopiado(null), 1500);
  }

  return (
    <div>
      <PanelHeader
        title="Registro de errores"
        description="Fallos de JavaScript de los visitantes, agrupados por mensaje y ordenados por urgencia. El ruido externo se oculta."
        actions={
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-carbon/[0.12] bg-white px-3.5 text-sm text-carbon">
              <input type="checkbox" checked={verRuido} onChange={(e) => setVerRuido(e.target.checked)} className="accent-carbon" />
              Ver ruido{resumen.ruido ? ` (${resumen.ruido})` : ""}
            </label>
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
      ) : todos.length === 0 ? (
        <Empty icon={<Bug size={18} />}>Sin errores registrados. Todo en orden.</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              ["Últimas 24 h", resumen.dia],
              ["Últimos 7 días", resumen.semana],
              ["Por 100 visitas", tasa == null ? "—" : tasa.toLocaleString("es-ES", { maximumFractionDigits: 1 })],
              ["Distintos", todos.filter((g) => !g.ruido).length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-carbon/[0.07] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">{label}</p>
                <p className="mt-1 font-display text-2xl tabular-nums text-carbon">{value}</p>
              </div>
            ))}
          </div>

          <Hallazgos items={hallazgos} titulo="Diagnóstico" />

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
            <Card>
              <CardTitle>Errores reales por día</CardTitle>
              <ColumnChart data={resumen.grafica} name="Errores por día" height={170} />
            </Card>
            <Card>
              <CardTitle>Páginas (7 días)</CardTitle>
              <BarList items={resumen.paginas} empty="Sin errores reales esta semana." />
            </Card>
            <Card>
              <CardTitle>Navegadores (7 días)</CardTitle>
              <BarList items={resumen.navegadores} empty="Sin errores reales esta semana." />
            </Card>
          </div>

          {grupos.length === 0 && <Empty icon={<Bug size={18} />}>Solo hay ruido registrado: ningún fallo de la tienda.</Empty>}

          <div className="flex flex-col gap-2">
            {grupos.map((g) => {
              const open = abierto === g.mensaje;
              const reciente = Date.now() - new Date(g.ultimo.created_at).getTime() < DIA;
              const ayuda = pista(g.mensaje);
              const disp = dispositivo(g.ultimo.user_agent);
              return (
                <div
                  key={g.mensaje}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white transition",
                    open ? "border-carbon/15 shadow-[0_2px_10px_rgba(28,26,22,0.06)]" : "border-carbon/[0.07]",
                    g.ruido && "opacity-70"
                  )}
                >
                  <button type="button" onClick={() => setAbierto(open ? null : g.mensaje)} className="flex w-full items-start gap-3 px-5 py-4 text-left">
                    <span
                      className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", reciente ? "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" : "bg-carbon/20")}
                      title={reciente ? "Ha ocurrido en las últimas 24 h" : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-mono text-[13px] text-carbon", !open && "truncate")}>{g.mensaje}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone">
                        <span className="inline-flex items-center gap-1" title={fechaHora(g.ultimo.created_at)}>
                          <Clock size={12} />
                          <span className={cn(reciente && "font-medium text-carbon")}>{haceCuanto(g.ultimo.created_at)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {disp.movil ? <Smartphone size={12} /> : <Monitor size={12} />}
                          {disp.texto}
                        </span>
                        {g.origen && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                            <FileCode2 size={12} /> {g.origen}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden w-24 shrink-0 sm:block" title={`Últimos ${DIAS_GRAFICA} días`}>
                      <Sparkline data={g.serie} height={28} color={g.alAlza ? "#dc2626" : undefined} />
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      {g.ruido && <Badge>ruido</Badge>}
                      {g.nuevo && <Badge tone="violet">nuevo</Badge>}
                      {g.alAlza && <Badge tone="red">al alza</Badge>}
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
                        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-200/70">{ayuda}</p>
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
                          <pre className="mt-1.5 max-h-64 overflow-auto rounded-xl bg-carbon p-4 font-mono text-[11px] leading-relaxed text-cream/85">{g.ultimo.detalle}</pre>
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
                                <span className="ml-auto inline-flex items-center gap-1 text-stone" title={r.user_agent ?? undefined}>
                                  {d.movil ? <Smartphone size={12} /> : <Monitor size={12} />}
                                  {d.texto}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => copiarIncidencia(g)} className={`${btnGhost} h-8 text-xs`}>
                          <Copy size={13} /> {copiado === g.mensaje ? "Copiado" : "Copiar como incidencia"}
                        </button>
                        <button type="button" onClick={() => borrarGrupo(g.mensaje)} className={`${btnGhost} h-8 text-xs`}>
                          <Trash2 size={13} /> Marcar como resuelto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
