import { amwayRpc } from "@/lib/amway-db";
import { variantPriceEur, type Product } from "@/data/types";

// Lo que el panel de gestión puede cambiar de cada producto, tal y como lo
// devuelve amway_catalogo_publico() (nunca incluye costes).
export interface ProductoAjuste {
  id: string;
  precios: Record<string, number>;
  agotado: boolean;
  oculto: boolean;
}

export interface Valoracion {
  id: string;
  media: number;
  total: number;
}

export interface CatalogoPublico {
  productos: ProductoAjuste[];
  valoraciones: Valoracion[];
  // Días de cierre puestos desde el panel (YYYY-MM-DD, de hoy a 90 días).
  cierres: string[];
}

export const CATALOGO_VACIO: CatalogoPublico = { productos: [], valoraciones: [], cierres: [] };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function fetchCatalogoPublico(
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
): Promise<CatalogoPublico> {
  try {
    // Los cierres van aparte: si su función aún no existe en la base de
    // datos (migración sin aplicar), el catálogo se sirve igual.
    const [data, cierres] = await Promise.all([
      amwayRpc<CatalogoPublico>("amway_catalogo_publico", undefined, init),
      amwayRpc<unknown>("amway_cierres_publicos", undefined, init).catch(() => []),
    ]);
    return {
      productos: Array.isArray(data?.productos) ? data.productos : [],
      valoraciones: Array.isArray(data?.valoraciones) ? data.valoraciones : [],
      cierres: Array.isArray(cierres) ? cierres.filter((d): d is string => typeof d === "string" && FECHA.test(d)) : [],
    };
  } catch {
    // Sin base de datos la tienda sigue funcionando con el catálogo base.
    return CATALOGO_VACIO;
  }
}

export interface CatalogIndex {
  ajuste(productId: string): ProductoAjuste | undefined;
  valoracion(productId: string): Valoracion | undefined;
}

export function indexCatalogo(data: CatalogoPublico): CatalogIndex {
  const ajustes = new Map(data.productos.map((p) => [p.id, p]));
  const valoraciones = new Map(data.valoraciones.map((v) => [v.id, v]));
  return {
    ajuste: (id) => ajustes.get(id),
    valoracion: (id) => valoraciones.get(id),
  };
}

// Precio de venta final: el fijado en el panel si existe, si no el de catálogo.
// Redondeado a céntimos, que es lo que cobra Stripe por unidad: así la cesta,
// el panel y el cargo suman exactamente lo mismo.
export function precioVenta(index: CatalogIndex, product: Product, variantIndex: number): number | null {
  if (!product.variants[variantIndex]) return null;
  const override = index.ajuste(product.id)?.precios?.[String(variantIndex)];
  const precio = typeof override === "number" && override >= 0 ? override : variantPriceEur(product, variantIndex);
  return precio == null ? null : Math.round(precio * 100) / 100;
}

export function estaAgotado(index: CatalogIndex, productId: string): boolean {
  return index.ajuste(productId)?.agotado === true;
}

export function estaOculto(index: CatalogIndex, productId: string): boolean {
  return index.ajuste(productId)?.oculto === true;
}
