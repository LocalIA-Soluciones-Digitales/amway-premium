"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Phone, UserRound, X } from "lucide-react";
import { fechaLarga, hoyMadrid } from "@/lib/recogida";
import { cn } from "@/lib/utils";
import { Miniaturas } from "./recogidas";
import { Badge, ESTADO_PEDIDO, Empty, METODO_PAGO, Segmented, clienteKey, eur, fecha, inputClass, waHref, type Pedido } from "./shared";

// Historial de pedidos pensado para buscar rápido: un calendario del mes
// (cuántos pedidos hubo cada día), los clientes de siempre a un toque y la
// lista agrupada por día. Día de un pedido = el de recogida o, si no tiene,
// el día en que se hizo.

type Estado = "todos" | "pendiente" | "entregado" | "cancelado";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const diaDe = (p: Pedido) => p.recogida_fecha ?? hoyMadrid(new Date(p.created_at));
const suma = (l: Pedido[]) => l.filter((p) => p.estado !== "cancelado").reduce((s, p) => s + Number(p.total_eur), 0);
const iniciales = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

function moverMes(mes: string, n: number): string {
  const d = new Date(`${mes}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

interface ClienteResumen {
  key: string;
  nombre: string;
  telefono: string | null;
  n: number;
  total: number;
  primero: string;
  ultimo: string;
}

export function HistorialPedidos({
  pedidos,
  query,
  abierto,
  onAbrir,
}: {
  pedidos: Pedido[];
  query: string;
  abierto: string | null;
  onAbrir: (id: string) => void;
}) {
  const hoy = hoyMadrid();
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [dia, setDia] = useState<string | null>(null);
  const [cliente, setCliente] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("todos");

  const clientes = useMemo(() => {
    const m = new Map<string, ClienteResumen>();
    for (const p of pedidos) {
      const k = clienteKey(p);
      if (!k) continue;
      const d = diaDe(p);
      const c = m.get(k) ?? { key: k, nombre: p.cliente_nombre || p.cliente_telefono || "Cliente", telefono: null, n: 0, total: 0, primero: d, ultimo: d };
      c.n += 1;
      if (p.estado !== "cancelado") c.total += Number(p.total_eur);
      c.telefono ??= p.cliente_telefono;
      if (d < c.primero) c.primero = d;
      if (d > c.ultimo) c.ultimo = d;
      m.set(k, c);
    }
    return [...m.values()];
  }, [pedidos]);
  const frecuentes = useMemo(() => [...clientes].sort((a, b) => b.n - a.n || b.ultimo.localeCompare(a.ultimo)).slice(0, 8), [clientes]);
  const alfabetico = useMemo(() => [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")), [clientes]);
  const elegido = cliente ? clientes.find((c) => c.key === cliente) ?? null : null;

  // Pedidos que encajan con búsqueda, cliente y estado (sin mirar la fecha).
  const base = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (cliente && clienteKey(p) !== cliente) return false;
      if (estado !== "todos" && p.estado !== estado) return false;
      if (!q) return true;
      return `${p.numero} ${p.cliente_nombre ?? ""} ${p.cliente_email ?? ""} ${p.cliente_telefono ?? ""} ${p.items.map((i) => i.nombre).join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [pedidos, query, cliente, estado]);

  const porDia = useMemo(() => {
    const m = new Map<string, Pedido[]>();
    for (const p of base) {
      const d = diaDe(p);
      m.set(d, [...(m.get(d) ?? []), p]);
    }
    return m;
  }, [base]);

  // Qué se lista: el día elegido; si no, todo lo del cliente o de la búsqueda;
  // si no, el mes del calendario.
  const buscando = query.trim() !== "";
  const visibles = useMemo(() => {
    if (dia) return porDia.get(dia) ?? [];
    if (cliente || buscando) return base;
    return base.filter((p) => diaDe(p).startsWith(mes));
  }, [dia, cliente, buscando, base, porDia, mes]);

  const grupos = useMemo(() => {
    const m = new Map<string, Pedido[]>();
    for (const p of visibles) {
      const d = diaDe(p);
      m.set(d, [...(m.get(d) ?? []), p]);
    }
    return [...m.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([d, l]) => ({ dia: d, pedidos: l.sort((a, b) => (a.recogida_hora ?? "99").localeCompare(b.recogida_hora ?? "99") || b.numero - a.numero) }));
  }, [visibles]);

  const nombreMes = capital(new Date(`${mes}-01T12:00:00Z`).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }));
  const titulo = dia
    ? capital(fechaLarga(dia))
    : elegido
      ? `Todos los pedidos de ${elegido.nombre.split(" ")[0]}`
      : buscando
        ? `Resultados de «${query.trim()}»`
        : nombreMes;
  const porCobrar = visibles.filter((p) => p.estado === "pendiente").reduce((s, p) => s + Number(p.total_eur), 0);

  function elegirCliente(k: string | null) {
    setCliente(k);
    setDia(null);
    const c = k && clientes.find((x) => x.key === k);
    if (c) setMes(c.ultimo.slice(0, 7));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_1fr]">
        <Calendario
          mes={mes}
          hoy={hoy}
          dia={dia}
          porDia={porDia}
          titulo={nombreMes}
          onMes={(n) => {
            setMes(moverMes(mes, n));
            setDia(null);
          }}
          onHoy={() => {
            setMes(hoy.slice(0, 7));
            setDia(null);
          }}
          onDia={(d) => setDia(dia === d ? null : d)}
        />

        <div className="flex min-w-0 flex-col gap-4">
          {elegido ? (
            <FichaCliente c={elegido} onQuitar={() => elegirCliente(null)} />
          ) : (
            <div className="rounded-3xl border border-carbon/[0.06] bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-carbon">
                  <UserRound size={15} className="text-stone" /> Ver los pedidos de un cliente
                </p>
                <select
                  value=""
                  onChange={(e) => elegirCliente(e.target.value || null)}
                  className={cn(inputClass, "h-9 max-w-full sm:w-56")}
                  aria-label="Elegir cliente"
                >
                  <option value="">Todos los clientes…</option>
                  {alfabetico.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.nombre} ({c.n})
                    </option>
                  ))}
                </select>
              </div>
              {frecuentes.length === 0 ? (
                <p className="text-xs text-stone">Aún no hay clientes con nombre o teléfono.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {frecuentes.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => elegirCliente(c.key)}
                      className="inline-flex items-center gap-2 rounded-full border border-carbon/[0.1] bg-white py-1 pl-1 pr-3 text-sm text-carbon transition hover:border-carbon/25 hover:bg-cream"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linen text-[11px] font-semibold text-carbon">
                        {iniciales(c.nombre)}
                      </span>
                      <span className="max-w-[9rem] truncate">{c.nombre}</span>
                      <span className="text-xs tabular-nums text-stone">{c.n}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Cifra label="Pedidos" valor={String(visibles.filter((p) => p.estado !== "cancelado").length)} />
            <Cifra label="Vendido" valor={eur(suma(visibles))} />
            <Cifra label="Por cobrar" valor={eur(porCobrar)} aviso={porCobrar > 0} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="font-display text-xl text-carbon">{titulo}</h3>
          {dia && (
            <button
              type="button"
              onClick={() => setDia(null)}
              className="inline-flex items-center gap-1 rounded-full bg-carbon/[0.05] px-2.5 py-1 text-xs text-stone hover:text-carbon"
            >
              Ver {elegido || buscando ? "todos" : "todo el mes"} <X size={12} />
            </button>
          )}
        </div>
        <Segmented
          value={estado}
          onChange={setEstado}
          options={[
            { value: "todos", label: "Todos" },
            { value: "pendiente", label: "Por cobrar" },
            { value: "entregado", label: "Entregados" },
            { value: "cancelado", label: "Cancelados" },
          ]}
        />
      </div>

      {grupos.length === 0 ? (
        <Empty>{dia ? "Ese día no hubo pedidos." : "No hay pedidos aquí. Prueba otro mes en el calendario."}</Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map((g) => (
            <section key={g.dia}>
              <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                <p className="text-sm font-medium text-carbon">
                  {capital(fechaLarga(g.dia))}
                  {!g.dia.startsWith(hoy.slice(0, 4)) && ` de ${g.dia.slice(0, 4)}`}
                  {g.dia === hoy && <span className="ml-2 text-xs font-normal text-amber-700">Hoy</span>}
                </p>
                <p className="text-xs tabular-nums text-stone">
                  {g.pedidos.length} pedido{g.pedidos.length === 1 ? "" : "s"} · <span className="font-medium text-carbon">{eur(suma(g.pedidos))}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {g.pedidos.map((p) => (
                  <FilaHistorial key={p.id} p={p} activo={abierto === p.id} onAbrir={() => onAbrir(p.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Calendario({
  mes,
  hoy,
  dia,
  porDia,
  titulo,
  onMes,
  onHoy,
  onDia,
}: {
  mes: string;
  hoy: string;
  dia: string | null;
  porDia: Map<string, Pedido[]>;
  titulo: string;
  onMes: (n: number) => void;
  onHoy: () => void;
  onDia: (d: string) => void;
}) {
  const inicio = new Date(`${mes}-01T12:00:00Z`);
  const hueco = (inicio.getUTCDay() + 6) % 7; // lunes = 0
  const total = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0)).getUTCDate();
  const dias = Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);
  const max = Math.max(1, ...dias.map((d) => porDia.get(d)?.length ?? 0));

  return (
    <div className="rounded-3xl border border-carbon/[0.06] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMes(-1)}
          aria-label="Mes anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-cream hover:text-carbon"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <p className="font-display text-lg text-carbon">{titulo}</p>
          {mes !== hoy.slice(0, 7) && (
            <button type="button" onClick={onHoy} className="rounded-full bg-carbon/[0.05] px-2 py-0.5 text-[11px] font-medium text-stone hover:text-carbon">
              Hoy
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onMes(1)}
          aria-label="Mes siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-cream hover:text-carbon"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="pb-1 text-[11px] font-medium text-stone">
            {d}
          </span>
        ))}
        {Array.from({ length: hueco }, (_, i) => (
          <span key={`h${i}`} />
        ))}
        {dias.map((d) => {
          const lista = porDia.get(d) ?? [];
          const n = lista.length;
          const sel = dia === d;
          const nivel = n === 0 ? 0 : Math.ceil((n / max) * 3);
          return (
            <button
              key={d}
              type="button"
              disabled={n === 0}
              onClick={() => onDia(d)}
              title={n ? `${n} pedido${n === 1 ? "" : "s"} · ${eur(suma(lista))}` : undefined}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm tabular-nums transition",
                sel
                  ? "bg-carbon text-cream"
                  : n === 0
                    ? "text-stone/50"
                    : ["", "bg-forest/10 text-carbon hover:bg-forest/20", "bg-forest/25 text-carbon hover:bg-forest/35", "bg-forest/45 text-carbon hover:bg-forest/55"][nivel],
                d === hoy && !sel && "ring-2 ring-inset ring-amber-400"
              )}
            >
              <span className={cn(n > 0 && "font-semibold")}>{Number(d.slice(8))}</span>
              {n > 0 && <span className={cn("text-[10px] leading-none", sel ? "text-cream/70" : "text-forest")}>{n} ped.</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-stone">Toca un día para ver sus pedidos</p>
    </div>
  );
}

function FichaCliente({ c, onQuitar }: { c: ClienteResumen; onQuitar: () => void }) {
  const corta = (d: string) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(/\./g, "");
  return (
    <div className="rounded-3xl border border-carbon/[0.06] bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linen font-display text-lg text-carbon">
          {iniciales(c.nombre)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl leading-tight text-carbon">{c.nombre}</p>
          <p className="mt-0.5 text-xs text-stone">
            Cliente desde {corta(c.primero)} · último pedido {corta(c.ultimo)}
          </p>
        </div>
        <button
          type="button"
          onClick={onQuitar}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-carbon/[0.05] px-2.5 py-1 text-xs text-stone hover:text-carbon"
        >
          Quitar <X size={12} />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="grey">
          {c.n} pedido{c.n === 1 ? "" : "s"}
        </Badge>
        <Badge tone="green">{eur(c.total)} en total</Badge>
        <span className="flex-1" />
        {c.telefono && (
          <>
            <a
              href={`tel:${c.telefono.replace(/\s/g, "")}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-carbon/[0.12] px-3 text-xs text-carbon hover:border-carbon/25"
            >
              <Phone size={13} /> Llamar
            </a>
            <a
              href={waHref(c.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest px-3 text-xs font-medium text-cream hover:opacity-90"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function Cifra({ label, valor, aviso }: { label: string; valor: string; aviso?: boolean }) {
  return (
    <div className={cn("rounded-2xl border px-3 py-2.5", aviso ? "border-amber-200 bg-amber-50" : "border-carbon/[0.06] bg-white")}>
      <p className={cn("text-[11px] font-medium", aviso ? "text-amber-800" : "text-stone")}>{label}</p>
      <p className="mt-0.5 truncate font-display text-lg tabular-nums text-carbon sm:text-xl">{valor}</p>
    </div>
  );
}

function FilaHistorial({ p, activo, onAbrir }: { p: Pedido; activo: boolean; onAbrir: () => void }) {
  const unidades = p.items.reduce((s, i) => s + i.cantidad, 0);
  const resumen = p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ");
  const cancelado = p.estado === "cancelado";
  return (
    <button
      type="button"
      id={`pedido-${p.id}`}
      onClick={onAbrir}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-left transition hover:border-carbon/15 hover:shadow-[0_6px_20px_rgba(28,26,22,0.06)] sm:gap-4 sm:px-4",
        activo ? "border-carbon/30" : "border-carbon/[0.08]",
        cancelado && "opacity-55"
      )}
    >
      <span className="hidden w-12 shrink-0 text-center sm:block">
        <span className="block font-display text-base leading-none tabular-nums text-carbon">{p.recogida_hora ?? "—"}</span>
        <span className="mt-1 block text-[10px] tabular-nums text-stone">#{p.numero}</span>
      </span>
      <Miniaturas p={p} size={36} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-carbon">{p.cliente_nombre || "Sin nombre"}</span>
          <span className="shrink-0 text-xs tabular-nums text-stone sm:hidden">#{p.numero}</span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-stone" title={resumen}>
          {unidades} ud. · {resumen}
        </span>
        <span className="mt-0.5 block text-[11px] text-stone/80">
          {METODO_PAGO[p.metodo_pago]}
          {p.origen === "manual" ? " · venta manual" : ` · hecho el ${fecha(p.created_at)}`}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn("font-medium tabular-nums text-carbon", cancelado && "line-through")}>{eur(p.total_eur)}</span>
        <Badge tone={ESTADO_PEDIDO[p.estado].tone}>{p.estado === "entregado" ? "Entregado" : ESTADO_PEDIDO[p.estado].label}</Badge>
      </span>
      <ChevronRight size={16} className="hidden shrink-0 text-stone/60 transition group-hover:translate-x-0.5 group-hover:text-carbon sm:block" />
    </button>
  );
}
