"use client";

import { useState, type ReactNode } from "react";
import { Check, ChevronDown, HandCoins, MessageCircle, PackageCheck, PackageOpen, Phone, Undo2 } from "lucide-react";
import { fechaLarga, hoyMadrid, sumarDias } from "@/lib/recogida";
import { cn } from "@/lib/utils";
import { Badge, METODO_PAGO, eur, waHref, type Pedido } from "./shared";

// Agenda de recogidas: los pedidos agrupados por el día en que el cliente
// pasa a recogerlos (como la vista por fecha de Arrantza), para saber qué
// preparar cada día, a qué hora viene cada uno y qué queda por cobrar.

export const ACTIVOS: Pedido["estado"][] = ["pendiente", "pagado", "enviado"];
export const esActivo = (p: Pedido) => ACTIVOS.includes(p.estado);

export interface GrupoDia {
  key: string; // YYYY-MM-DD | "atrasados" | "sin-fecha"
  titulo: string;
  etiqueta: string | null; // Hoy / Mañana / Atrasados
  tono: "red" | "amber" | "blue" | "grey";
  pedidos: Pedido[];
}

const porHora = (a: Pedido, b: Pedido) =>
  (a.recogida_fecha ?? "").localeCompare(b.recogida_fecha ?? "") ||
  (a.recogida_hora ?? "99").localeCompare(b.recogida_hora ?? "99") ||
  a.numero - b.numero;

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Activos con fecha pasada → "Atrasados"; de hoy en adelante, un grupo por
// día (con los ya recogidos de ese día al final, para ver lo hecho); activos
// sin fecha de recogida (envíos, ventas manuales) → "Sin fecha".
export function agruparPorDia(pedidos: Pedido[], hoy = hoyMadrid()): GrupoDia[] {
  const manana = sumarDias(hoy, 1);
  const atrasados = pedidos.filter((p) => esActivo(p) && p.recogida_fecha && p.recogida_fecha < hoy).sort(porHora);
  const sinFecha = pedidos.filter((p) => esActivo(p) && !p.recogida_fecha).sort((a, b) => a.numero - b.numero);
  const porDia = new Map<string, Pedido[]>();
  for (const p of pedidos) {
    if (!p.recogida_fecha || p.recogida_fecha < hoy) continue;
    if (!esActivo(p) && p.estado !== "entregado") continue;
    porDia.set(p.recogida_fecha, [...(porDia.get(p.recogida_fecha) ?? []), p]);
  }

  const grupos: GrupoDia[] = [];
  if (atrasados.length) {
    grupos.push({ key: "atrasados", titulo: "Sin recoger de días pasados", etiqueta: "Atrasados", tono: "red", pedidos: atrasados });
  }
  for (const [fecha, lista] of [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    // Solo días con algo pendiente, salvo hoy (para ver lo ya recogido).
    if (fecha !== hoy && !lista.some(esActivo)) continue;
    const ordenados = [...lista.filter(esActivo).sort(porHora), ...lista.filter((p) => !esActivo(p)).sort(porHora)];
    grupos.push({
      key: fecha,
      titulo: capital(fechaLarga(fecha)),
      etiqueta: fecha === hoy ? "Hoy" : fecha === manana ? "Mañana" : null,
      tono: fecha === hoy ? "amber" : fecha === manana ? "blue" : "grey",
      pedidos: ordenados,
    });
  }
  if (sinFecha.length) {
    grupos.push({ key: "sin-fecha", titulo: "Sin fecha de recogida", etiqueta: null, tono: "grey", pedidos: sinFecha });
  }
  return grupos;
}

// Total por producto de un grupo: "qué tengo que preparar ese día".
export function aPreparar(pedidos: Pedido[]): { nombre: string; detalle: string; cantidad: number }[] {
  const m = new Map<string, { nombre: string; detalle: string; cantidad: number }>();
  for (const p of pedidos.filter(esActivo)) {
    for (const i of p.items) {
      const detalle = [i.formato, i.sabor].filter(Boolean).join(" · ");
      const k = `${i.nombre}|${detalle}`;
      const prev = m.get(k);
      m.set(k, { nombre: i.nombre, detalle, cantidad: (prev?.cantidad ?? 0) + i.cantidad });
    }
  }
  return [...m.values()].sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
}

export function resumenGrupo(pedidos: Pedido[]) {
  const activos = pedidos.filter(esActivo);
  return {
    activos: activos.length,
    recogidos: pedidos.filter((p) => p.estado === "entregado").length,
    preparados: activos.filter((p) => p.preparado_at).length,
    porCobrar: activos.filter((p) => p.estado === "pendiente").reduce((s, p) => s + Number(p.total_eur), 0),
    importe: pedidos.filter((p) => p.estado !== "cancelado").reduce((s, p) => s + Number(p.total_eur), 0),
  };
}

// Días de hoy en adelante con el nº de recogidas pendientes (tira semanal).
export function proximosDias(pedidos: Pedido[], n = 7, hoy = hoyMadrid()) {
  return Array.from({ length: n }, (_, i) => {
    const fecha = sumarDias(hoy, i);
    const d = new Date(`${fecha}T12:00:00Z`);
    const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("es-ES", { ...o, timeZone: "UTC" }).replace(".", "");
    return {
      fecha,
      dia: i === 0 ? "Hoy" : i === 1 ? "Mañana" : capital(f({ weekday: "short" })),
      num: f({ day: "numeric" }),
      mes: f({ month: "short" }),
      n: pedidos.filter((p) => esActivo(p) && p.recogida_fecha === fecha).length,
    };
  });
}

export function CabeceraGrupo({
  g,
  plegado,
  onToggle,
}: {
  g: GrupoDia;
  plegado?: boolean;
  onToggle?: () => void;
}) {
  const r = resumenGrupo(g.pedidos);
  const acento = { red: "bg-xs-red", amber: "bg-amber-500", blue: "bg-forest", grey: "bg-carbon/30" }[g.tono];
  return (
    <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-1 py-1 text-left">
      <span className={cn("h-8 w-1.5 shrink-0 rounded-full", acento)} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg leading-tight text-carbon">{g.titulo}</span>
          {g.etiqueta && <Badge tone={g.tono === "blue" ? "blue" : g.tono === "red" ? "red" : "amber"}>{g.etiqueta}</Badge>}
        </span>
        <span className="mt-0.5 block text-xs text-stone">
          {r.activos} por recoger
          {r.recogidos > 0 && ` · ${r.recogidos} recogido${r.recogidos === 1 ? "" : "s"}`}
          {r.activos > 0 && ` · ${r.preparados}/${r.activos} preparados`}
          {r.porCobrar > 0 && (
            <>
              {" · "}
              <span className="font-medium text-amber-700">{eur(r.porCobrar)} por cobrar</span>
            </>
          )}
        </span>
      </span>
      {onToggle && <ChevronDown size={16} className={cn("text-stone transition", plegado && "-rotate-90")} />}
    </button>
  );
}

export function APreparar({ pedidos }: { pedidos: Pedido[] }) {
  const [open, setOpen] = useState(false);
  const lista = aPreparar(pedidos);
  if (lista.length === 0) return null;
  const total = lista.reduce((s, l) => s + l.cantidad, 0);
  return (
    <div className="rounded-xl bg-cream/70 px-3 py-2">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left text-xs">
        <span className="flex items-center gap-1.5 font-medium text-carbon">
          <PackageOpen size={14} className="text-stone" /> Qué preparar · {total} ud. de {lista.length} producto{lista.length === 1 ? "" : "s"}
        </span>
        <ChevronDown size={14} className={cn("text-stone transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-2 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">
          {lista.map((l) => (
            <li key={`${l.nombre}|${l.detalle}`} className="flex items-baseline gap-2">
              <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-carbon">{l.cantidad}×</span>
              <span className="min-w-0 text-carbon">
                {l.nombre}
                {l.detalle && <span className="text-stone"> · {l.detalle}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Una recogida en la agenda: hora, cliente, qué se lleva, cómo paga y las
// acciones de un toque (preparado, recogido, WhatsApp, llamar).
export function FilaRecogida({
  p,
  abierto,
  onAbrir,
  onUpdate,
  mostrarFecha,
  children,
}: {
  p: Pedido;
  abierto: boolean;
  onAbrir: () => void;
  onUpdate: (c: Partial<Pedido>) => void;
  mostrarFecha?: boolean;
  children?: ReactNode;
}) {
  const hecho = p.estado === "entregado";
  const efectivo = p.estado === "pendiente";
  const unidades = p.items.reduce((s, i) => s + i.cantidad, 0);
  const resumen = p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ");
  const fechaCorta = p.recogida_fecha
    ? new Date(`${p.recogida_fecha}T12:00:00Z`)
        .toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
        .replace(/\./g, "")
    : null;

  return (
    <div id={`pedido-${p.id}`} className={cn("scroll-mt-40 rounded-2xl border bg-white transition", hecho ? "border-carbon/[0.05] opacity-60" : "border-carbon/8")}>
      <div className="flex items-stretch gap-3 px-3 py-3 sm:px-4">
        <button type="button" onClick={onAbrir} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <span className="w-14 shrink-0 pt-0.5 text-center">
            <span className={cn("block font-display text-xl leading-none tabular-nums", p.recogida_hora ? "text-carbon" : "text-stone/60")}>
              {p.recogida_hora ?? "--:--"}
            </span>
            {mostrarFecha && fechaCorta && <span className="mt-1 block text-[10px] uppercase tracking-wide text-stone">{fechaCorta}</span>}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate font-medium text-carbon">{p.cliente_nombre || "Sin nombre"}</span>
              <span className="text-xs tabular-nums text-stone">#{p.numero}</span>
              {hecho ? (
                <Badge tone="green">Recogido</Badge>
              ) : efectivo ? (
                <Badge tone="amber">Cobrar {eur(p.total_eur)}</Badge>
              ) : (
                <Badge tone="blue">Pagado · {METODO_PAGO[p.metodo_pago]}</Badge>
              )}
              {!hecho && p.preparado_at && <Badge tone="green">Preparado</Badge>}
            </span>
            <span className="mt-1 line-clamp-2 block text-xs text-stone">
              {unidades} ud. · {resumen}
            </span>
          </span>
        </button>
        <ChevronDown size={16} className={cn("mt-1 shrink-0 self-start text-stone transition", abierto && "rotate-180")} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-carbon/[0.05] px-3 py-2 sm:px-4">
        {hecho ? (
          <button
            type="button"
            onClick={() => onUpdate({ estado: p.metodo_pago === "efectivo" ? "pendiente" : "pagado" })}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-stone hover:bg-cream hover:text-carbon"
          >
            <Undo2 size={13} /> Deshacer
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onUpdate({ estado: "entregado" })}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-carbon px-3.5 text-xs font-medium text-cream hover:bg-carbon-soft"
            >
              {efectivo ? <HandCoins size={13} /> : <PackageCheck size={13} />}
              {efectivo ? "Recogido y cobrado" : "Recogido"}
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ preparado_at: p.preparado_at ? null : new Date().toISOString() })}
              aria-pressed={!!p.preparado_at}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition",
                p.preparado_at ? "border-forest/30 bg-forest/10 text-forest" : "border-carbon/10 text-stone hover:text-carbon"
              )}
            >
              <Check size={13} /> {p.preparado_at ? "Preparado" : "Marcar preparado"}
            </button>
          </>
        )}
        <span className="flex-1" />
        {p.cliente_telefono && (
          <>
            <a
              href={`tel:${p.cliente_telefono.replace(/\s/g, "")}`}
              aria-label="Llamar"
              title="Llamar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone hover:bg-cream hover:text-carbon"
            >
              <Phone size={14} />
            </a>
            <a
              href={waHref(p.cliente_telefono)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone hover:bg-cream hover:text-forest"
            >
              <MessageCircle size={14} />
            </a>
          </>
        )}
      </div>
      {abierto && children}
    </div>
  );
}
