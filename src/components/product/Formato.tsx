import {
  Cookie,
  CupSoda,
  Droplet,
  Layers2,
  Package,
  PackageOpen,
  Pill,
  Sparkles,
  Tablets,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { formatoDetalle, formatoTitulo, leerFormato, precioUnitario, type Formato } from "@/lib/formato";
import { cn } from "@/lib/utils";

const ICONO_ENVASE: Record<NonNullable<Formato["envase"]>, LucideIcon> = {
  lata: CupSoda,
  cápsula: Pill,
  perla: Pill,
  gominola: Pill,
  comprimido: Tablets,
  tableta: Tablets,
  sobre: PackageOpen,
  barrita: Cookie,
  toallita: Layers2,
  mascarilla: Sparkles,
  pieza: Package,
  unidad: Package,
  dosis: Package,
};

export function iconoFormato(f: Formato | null): LucideIcon {
  if (f?.envase && f.envase !== "unidad") return ICONO_ENVASE[f.envase];
  if (f?.contenido) return f.contenido.medida === "ml" ? Droplet : Weight;
  return Package;
}

// Formato de la ficha: icono del envase, cantidad en grande, contenido de
// cada unidad y precio por unidad / por litro o kilo para comparar.
export function FormatoDestacado({ size, precio }: { size: string; precio: number | null }) {
  const f = leerFormato(size);
  const Icono = iconoFormato(f);
  const detalle = f ? formatoDetalle(f) : null;
  const unitario = f ? precioUnitario(f, precio) : null;
  const principal = unitario?.porUnidad ?? unitario?.porMedida;
  const secundario = unitario?.porUnidad ? unitario.porMedida : null;

  return (
    <div className="mt-3 flex items-center gap-3.5 rounded-2xl bg-linen/50 p-3.5 ring-1 ring-carbon/[0.06]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-forest shadow-[0_1px_2px_rgba(28,26,22,0.06)] ring-1 ring-carbon/[0.06]">
        <Icono size={22} strokeWidth={1.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl leading-tight text-carbon">{f ? formatoTitulo(f) : size}</span>
        {detalle && <span className="mt-0.5 block text-xs leading-snug text-stone">{detalle}</span>}
      </span>
      {principal && (
        <span className="shrink-0 text-right">
          <span className="block text-sm font-medium tabular-nums text-carbon">{principal}</span>
          {secundario && <span className="mt-0.5 block text-[11px] tabular-nums text-stone">{secundario}</span>}
        </span>
      )}
    </div>
  );
}

// Línea compacta para las tarjetas del catálogo: icono + formato.
export function FormatoLinea({ size, className }: { size: string; className?: string }) {
  const f = leerFormato(size);
  const Icono = iconoFormato(f);
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5 text-xs text-carbon/75", className)}>
      <Icono size={14} strokeWidth={1.7} className="shrink-0 text-forest" />
      <span className="truncate">{f ? formatoTitulo(f) : size}</span>
    </span>
  );
}

// Precio por unidad más útil para una tarjeta: por lata/cápsula si hay
// varias, si no por litro/kilo (o por 100 ml/g).
export function precioUnitarioCorto(size: string, precio: number | null): string | null {
  const f = leerFormato(size);
  if (!f) return null;
  const u = precioUnitario(f, precio);
  return u.porUnidad ?? u.porMedida;
}
