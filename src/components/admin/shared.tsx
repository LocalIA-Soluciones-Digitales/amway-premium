"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatEUR } from "@/lib/currency";

// ---------- Tipos de las tablas amway_* ----------

export interface PedidoItem {
  product_id: string | null;
  variant_index: number;
  nombre: string;
  formato: string | null;
  sabor: string | null;
  cantidad: number;
  precio_eur: number;
  coste_eur: number | null;
}

export type PedidoEstado = "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado";
export type MetodoPago = "tarjeta" | "bizum" | "efectivo" | "transferencia" | "whatsapp" | "otro";

export interface Pedido {
  id: string;
  numero: number;
  origen: "web" | "manual";
  metodo_pago: MetodoPago;
  estado: PedidoEstado;
  stripe_session_id: string | null;
  items: PedidoItem[];
  total_eur: number;
  envio_eur: number;
  cliente_nombre: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  direccion: string | null;
  notas: string | null;
  created_at: string;
}

export interface ProductoAjusteRow {
  product_id: string;
  precios_eur: Record<string, number>;
  costes_eur: Record<string, number>;
  agotado: boolean;
  oculto: boolean;
  stock: number | null;
  updated_at?: string;
}

export interface Gasto {
  id: string;
  fecha: string;
  concepto: string;
  categoria: "mercancia" | "envios" | "publicidad" | "comisiones" | "material" | "otros";
  importe_eur: number;
  notas: string | null;
}

export interface Solicitud {
  id: string;
  tipo: "agotado" | "encargo" | "otro";
  product_id: string | null;
  producto_nombre: string;
  formato: string | null;
  cantidad: number | null;
  nombre: string;
  telefono: string | null;
  email: string | null;
  mensaje: string | null;
  estado: "pendiente" | "atendida" | "descartada";
  created_at: string;
}

export interface Resena {
  id: string;
  product_id: string | null;
  producto_nombre: string | null;
  nombre: string;
  valoracion: number;
  comentario: string;
  respuesta: string | null;
  estado: "pendiente" | "aprobada" | "rechazada";
  created_at: string;
}

// ---------- Etiquetas ----------

export const ESTADO_PEDIDO: Record<PedidoEstado, { label: string; tone: Tone }> = {
  pendiente: { label: "Pendiente de pago", tone: "amber" },
  pagado: { label: "Pagado · por enviar", tone: "blue" },
  enviado: { label: "Enviado", tone: "violet" },
  entregado: { label: "Entregado", tone: "green" },
  cancelado: { label: "Cancelado", tone: "grey" },
};

export const METODO_PAGO: Record<MetodoPago, string> = {
  tarjeta: "Tarjeta",
  bizum: "Bizum",
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  whatsapp: "WhatsApp",
  otro: "Otro",
};

export const CATEGORIA_GASTO: Record<Gasto["categoria"], string> = {
  mercancia: "Compra de mercancía",
  envios: "Envíos",
  publicidad: "Publicidad",
  comisiones: "Comisiones (Stripe, banco…)",
  material: "Material / embalaje",
  otros: "Otros",
};

// ---------- Utilidades ----------

// `|| 0` also turns -0 into 0, so an empty period never shows "-0,00 €".
export const eur = (n: number | null | undefined) => formatEUR(Number(n ?? 0) || 0);

export const dec = (n: number, digits = 1) => n.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function fecha(iso: string, withTime = false): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

// "6 12 34 56 78" / "+34 612…" → enlace wa.me con prefijo español por defecto.
export function waHref(telefono: string, texto?: string): string {
  let digits = telefono.replace(/\D/g, "");
  if (digits.length === 9) digits = `34${digits}`;
  return `https://wa.me/${digits}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\n");
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  // BOM so Excel opens accents correctly; ";" separator for Spanish locale.
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- UI ----------

type Tone = "amber" | "blue" | "violet" | "green" | "grey" | "red";

const TONES: Record<Tone, string> = {
  amber: "bg-amber-50 text-amber-800 ring-amber-200/70",
  blue: "bg-sky-50 text-sky-800 ring-sky-200/70",
  violet: "bg-violet-50 text-violet-800 ring-violet-200/70",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
  grey: "bg-carbon/[0.04] text-stone ring-carbon/10",
  red: "bg-red-50 text-red-700 ring-red-200/70",
};

export function Badge({ tone = "grey", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-carbon/[0.07] bg-white p-5 shadow-[0_1px_3px_rgba(28,26,22,0.04)]", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">{children}</h3>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
  icon,
  delta,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "good" | "bad";
  icon?: ReactNode;
  /** Change vs. previous period, in %. */
  delta?: number | null;
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">{label}</p>
        {icon && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-stone">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-3 font-display text-[2rem] leading-none tabular-nums",
          tone === "good" ? "text-forest" : tone === "bad" ? "text-xs-red" : "text-carbon"
        )}
      >
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone">
        {delta != null && Number.isFinite(delta) && (
          <span className={cn("font-medium tabular-nums", delta > 0 ? "text-emerald-700" : delta < 0 ? "text-red-600" : "text-stone")}>
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} {Math.abs(delta).toFixed(0)} %
          </span>
        )}
        {hint}
      </div>
    </Card>
  );
}

export function PanelHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-[1.75rem] leading-tight text-carbon">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-stone">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-carbon/15 bg-white/50 px-6 py-14 text-center text-sm text-stone">
      {icon && <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-stone">{icon}</span>}
      {children}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-24">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-carbon/15 border-t-carbon" aria-label="Cargando" />
    </div>
  );
}

export const inputClass =
  "h-10 rounded-xl border border-carbon/[0.12] bg-white px-3 text-base text-carbon placeholder:text-stone/60 transition focus:border-carbon/30 focus:outline-none focus:ring-4 focus:ring-carbon/[0.04] sm:text-sm";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-carbon px-4 text-sm font-medium text-cream shadow-sm transition hover:bg-carbon-soft disabled:cursor-not-allowed disabled:opacity-40";

export const btnGhost =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-carbon/[0.12] bg-white px-4 text-sm text-carbon transition hover:border-carbon/25 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-carbon/[0.07] bg-white p-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition",
            value === o.value ? "bg-carbon text-cream" : "text-stone hover:bg-cream hover:text-carbon"
          )}
        >
          {o.label}
          {o.count != null && o.count > 0 && (
            <span
              className={cn(
                "min-w-[1.1rem] rounded-full px-1 text-center text-[10px] tabular-nums",
                value === o.value ? "bg-cream/20" : "bg-xs-red text-cream"
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Pide a la tienda que regenere ya precios/agotados/valoraciones.
export async function revalidarTienda(accessToken: string): Promise<void> {
  await fetch("/api/admin/revalidar", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined);
}
