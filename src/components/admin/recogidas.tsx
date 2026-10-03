"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, ChevronRight, HandCoins, MessageCircle, PackageCheck, PackageOpen, Phone, Undo2 } from "lucide-react";
import { fechaLarga, hoyMadrid, sumarDias } from "@/lib/recogida";
import { cn } from "@/lib/utils";
import { imagenDeItem, inicialesItem } from "./producto-item";
import { estadoSinCerrar, mensajeSiguiente } from "./mensajes-cliente";
import { Badge, METODO_PAGO, eur, waHref, type Pedido, type PedidoItem } from "./shared";

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

const NOTA_GRUPO: Record<string, string> = {
  atrasados: "Tenían que pasar antes de hoy. Escríbeles para cambiar el día o márcalos como recogidos.",
  "sin-fecha": "Envíos y ventas sin día de recogida.",
};

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
  const pct = r.activos ? (r.preparados / r.activos) * 100 : 100;
  const contenido = (
    <>
      <span className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
        <span className={cn("h-9 w-1.5 shrink-0 self-start rounded-full sm:self-center", acento)} />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg leading-tight text-carbon">{g.titulo}</span>
            {g.etiqueta && <Badge tone={g.tono === "blue" ? "blue" : g.tono === "red" ? "red" : "amber"}>{g.etiqueta}</Badge>}
          </span>
          <span className="mt-0.5 block text-xs text-stone">
            {NOTA_GRUPO[g.key] ??
              `${r.activos} por recoger${r.recogidos ? ` · ${r.recogidos} recogido${r.recogidos === 1 ? "" : "s"}` : ""}`}
          </span>
        </span>
      </span>
      <span className="flex w-full items-center gap-3 pl-[1.125rem] text-xs sm:w-auto sm:gap-4 sm:pl-0">
        {r.activos > 0 && (
          <span className="flex items-center gap-2" title="Bolsas preparadas">
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-carbon/[0.08]">
              <span className="block h-full rounded-full bg-forest transition-all" style={{ width: `${pct}%` }} />
            </span>
            <span className="whitespace-nowrap tabular-nums text-stone">
              <span className="font-semibold text-carbon">{r.preparados}</span>/{r.activos} preparados
            </span>
          </span>
        )}
        {r.porCobrar > 0 && (
          <span className="whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 font-medium tabular-nums text-amber-800 ring-1 ring-inset ring-amber-200/70">
            {eur(r.porCobrar)} por cobrar
          </span>
        )}
        {onToggle && <ChevronDown size={16} className={cn("ml-auto shrink-0 text-stone transition sm:ml-0", plegado && "-rotate-90")} />}
      </span>
    </>
  );
  const cls = "flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-1 py-1 text-left";
  return onToggle ? (
    <button type="button" onClick={onToggle} aria-expanded={!plegado} className={cls}>
      {contenido}
    </button>
  ) : (
    <div className={cls}>{contenido}</div>
  );
}

export function APreparar({ pedidos }: { pedidos: Pedido[] }) {
  const [open, setOpen] = useState(false);
  const lista = aPreparar(pedidos);
  if (lista.length === 0) return null;
  const total = lista.reduce((s, l) => s + l.cantidad, 0);
  return (
    <div className="rounded-xl border border-dashed border-carbon/[0.12] px-3 py-2">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left text-xs">
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-carbon">
          <PackageOpen size={14} className="shrink-0 text-stone" /> Lista para preparar · {total} ud. de {lista.length} producto
          {lista.length === 1 ? "" : "s"}
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-stone transition", open && "rotate-180")} />
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

// Foto del producto de una línea de pedido (o sus iniciales si no hay foto),
// con la cantidad en la esquina cuando lleva más de una.
export function FotoItem({ item, size = 40, className }: { item: Pick<PedidoItem, "product_id" | "nombre" | "cantidad">; size?: number; className?: string }) {
  const src = imagenDeItem(item);
  const ini = src ? null : inicialesItem(item.nombre);
  return (
    <span
      title={`${item.cantidad}× ${item.nombre}`}
      style={{ width: size, height: size, background: ini?.fondo }}
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linen", className)}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-contain p-1" />
      ) : (
        <span className="font-display text-carbon/70" style={{ fontSize: Math.max(10, size * 0.32) }}>
          {ini!.texto}
        </span>
      )}
      {item.cantidad > 1 && (
        <span className="absolute bottom-0 right-0 rounded-tl-md bg-carbon px-1 text-[9px] font-semibold leading-tight text-cream">
          {item.cantidad}
        </span>
      )}
    </span>
  );
}

// Miniaturas de lo que se lleva (hasta 3 y "+n").
export function Miniaturas({ p, size = 40, max = 3 }: { p: Pick<Pedido, "items">; size?: number; max?: number }) {
  const items = p.items.slice(0, max);
  const resto = p.items.length - items.length;
  return (
    <span className="flex shrink-0 -space-x-2">
      {items.map((i, k) => (
        <FotoItem key={k} item={i} size={size} className="ring-2 ring-white" />
      ))}
      {resto > 0 && (
        <span
          style={{ width: size, height: size }}
          className="flex items-center justify-center rounded-xl bg-cream text-[11px] font-semibold text-stone ring-2 ring-white"
        >
          +{resto}
        </span>
      )}
    </span>
  );
}

// Una recogida en la agenda: hora, cliente, qué se lleva, cómo paga y las
// acciones de un toque (preparado, recogido, WhatsApp, llamar). Pulsar la
// fila abre la ficha completa en el panel lateral.
export function FilaRecogida({
  p,
  onAbrir,
  onUpdate,
  mostrarFecha,
}: {
  p: Pedido;
  onAbrir: () => void;
  onUpdate: (c: Partial<Pedido>) => void;
  mostrarFecha?: boolean;
}) {
  const hecho = p.estado === "entregado";
  const cobrar = p.estado === "pendiente";
  const preparado = !!p.preparado_at;
  const unidades = p.items.reduce((s, i) => s + i.cantidad, 0);
  const resumen = p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ");
  const fechaCorta = p.recogida_fecha
    ? new Date(`${p.recogida_fecha}T12:00:00Z`)
        .toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
        .replace(/\./g, "")
    : null;
  const estado = hecho ? "bg-carbon/20" : preparado ? "bg-forest" : "bg-amber-400";
  // WhatsApp con el mensaje que toca (confirmar / ya está listo / reseña);
  // con la bolsa preparada se muestra como "Avisar", que es lo siguiente.
  const aviso = mensajeSiguiente(p);
  const avisarListo = preparado && !hecho && aviso.id === "listo";

  return (
    <div
      id={`pedido-${p.id}`}
      className={cn(
        "group relative flex scroll-mt-40 flex-col overflow-hidden rounded-2xl border bg-white transition hover:border-carbon/15 hover:shadow-[0_6px_20px_rgba(28,26,22,0.06)] md:flex-row md:items-center",
        hecho ? "border-carbon/[0.05] opacity-60" : "border-carbon/[0.08]"
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", estado)} aria-hidden />
      <button type="button" onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-3 text-left sm:gap-4 sm:pl-5">
        <span className="w-12 shrink-0 sm:w-14">
          <span className={cn("block font-display text-lg leading-none tabular-nums sm:text-xl", p.recogida_hora ? "text-carbon" : "text-stone/60")}>
            {p.recogida_hora ?? "--:--"}
          </span>
          {mostrarFecha && fechaCorta && <span className="mt-1 block text-[10px] uppercase tracking-wide text-xs-red">{fechaCorta}</span>}
        </span>
        <span className="sm:hidden">
          <Miniaturas p={p} size={34} max={2} />
        </span>
        <span className="hidden sm:block">
          <Miniaturas p={p} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-carbon">{p.cliente_nombre || "Sin nombre"}</span>
            <span className="shrink-0 text-xs tabular-nums text-stone">#{p.numero}</span>
          </span>
          <span className="mt-0.5 block text-xs sm:hidden">
            <span className="font-medium tabular-nums text-carbon">{eur(p.total_eur)}</span>
            {hecho ? (
              <span className="text-stone"> · recogido</span>
            ) : cobrar ? (
              <span className="text-amber-700"> · cobrar en {METODO_PAGO[p.metodo_pago].toLowerCase()}</span>
            ) : (
              <span className="text-forest"> · pagado</span>
            )}
          </span>
          <span className="mt-0.5 line-clamp-2 text-xs text-stone sm:line-clamp-1" title={resumen}>
            {unidades} ud. · {resumen}
          </span>
        </span>
        <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className="font-medium tabular-nums text-carbon">{eur(p.total_eur)}</span>
          {hecho ? (
            <Badge tone="green">Recogido</Badge>
          ) : cobrar ? (
            <Badge tone="amber">Cobrar en {METODO_PAGO[p.metodo_pago].toLowerCase()}</Badge>
          ) : (
            <Badge tone="blue">Pagado · {METODO_PAGO[p.metodo_pago]}</Badge>
          )}
        </span>
        <ChevronRight size={16} className="hidden shrink-0 text-stone/60 transition group-hover:translate-x-0.5 group-hover:text-carbon md:block" />
      </button>

      <div className="flex items-center gap-1.5 border-t border-carbon/[0.05] py-2 pl-4 pr-3 md:border-l md:border-t-0 md:py-3 md:pl-3">
        {hecho ? (
          <button
            type="button"
            onClick={() => onUpdate({ estado: estadoSinCerrar(p) })}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs text-stone hover:bg-cream hover:text-carbon"
          >
            <Undo2 size={13} /> Deshacer
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onUpdate({ preparado_at: preparado ? null : new Date().toISOString() })}
              aria-pressed={preparado}
              title={preparado ? "Bolsa preparada (pulsa para desmarcar)" : "Marcar la bolsa como preparada"}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition",
                preparado ? "border-forest/25 bg-forest/10 text-forest" : "border-carbon/[0.12] text-carbon hover:border-carbon/25"
              )}
            >
              <Check size={13} /> {preparado ? "Preparado" : "Preparar"}
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ estado: "entregado" })}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-carbon px-3.5 text-xs font-medium text-cream hover:bg-carbon-soft"
            >
              {cobrar ? <HandCoins size={13} /> : <PackageCheck size={13} />}
              {cobrar ? (
                <>
                  Cobrado<span className="hidden sm:inline"> y recogido</span>
                </>
              ) : (
                "Recogido"
              )}
            </button>
          </>
        )}
        {p.cliente_telefono && (
          <>
            <span className="flex-1 md:hidden" />
            <a
              href={`tel:${p.cliente_telefono.replace(/\s/g, "")}`}
              aria-label="Llamar"
              title="Llamar"
              // En el móvil no caben llamar y "Avisar" a la vez: llamar sigue en la ficha.
              className={cn(
                "h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-cream hover:text-carbon",
                avisarListo ? "hidden sm:flex" : "flex"
              )}
            >
              <Phone size={14} />
            </a>
            <a
              href={waHref(p.cliente_telefono, aviso.texto)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp: ${aviso.label}`}
              title={`WhatsApp: ${aviso.label}`}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-full transition",
                avisarListo
                  ? "bg-forest/10 px-3 text-xs font-medium text-forest hover:bg-forest/15"
                  : "w-9 text-stone hover:bg-cream hover:text-forest"
              )}
            >
              <MessageCircle size={14} />
              {avisarListo && "Avisar"}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
