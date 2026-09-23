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

export const eur = (n: number | null | undefined) => formatEUR(Number(n ?? 0));

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
  amber: "bg-amber-100 text-amber-900",
  blue: "bg-sky-100 text-sky-900",
  violet: "bg-violet-100 text-violet-900",
  green: "bg-emerald-100 text-emerald-900",
  grey: "bg-carbon/8 text-stone",
  red: "bg-red-100 text-red-900",
};

export function Badge({ tone = "grey", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", TONES[tone])}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-carbon/8 bg-white p-5", className)}>{children}</div>;
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "good" | "bad" }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wider text-stone">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-3xl tabular-nums",
          tone === "good" ? "text-forest" : tone === "bad" ? "text-xs-red" : "text-carbon"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone">{hint}</p>}
    </Card>
  );
}

export function PanelHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl text-carbon">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-carbon/15 py-14 text-center text-sm text-stone">{children}</div>;
}

export const inputClass =
  "rounded-lg border border-carbon/15 bg-white px-3 py-2 text-base text-carbon placeholder:text-stone/60 focus:border-forest focus:outline-none sm:text-sm";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-carbon px-4 py-2 text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-carbon/15 px-4 py-2 text-sm text-carbon transition hover:bg-carbon/5 disabled:opacity-50";

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
    <div className="flex flex-wrap gap-1 rounded-full bg-carbon/5 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition",
            value === o.value ? "bg-white text-carbon shadow-sm" : "text-stone hover:text-carbon"
          )}
        >
          {o.label}
          {o.count != null && o.count > 0 && <span className="ml-1.5 tabular-nums text-stone">{o.count}</span>}
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
