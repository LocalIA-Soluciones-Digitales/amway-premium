import { amwayRpc } from "@/lib/amway-db";
import { variantPriceEur, type Product } from "@/data/types";

// Lo que el panel de gestión puede cambiar de cada producto, tal y como lo
// devuelve amway_catalogo_publico() (nunca incluye costes ni stock exacto).
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
}

export const CATALOGO_VACIO: CatalogoPublico = { productos: [], valoraciones: [] };

export async function fetchCatalogoPublico(
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
): Promise<CatalogoPublico> {
  try {
    const data = await amwayRpc<CatalogoPublico>("amway_catalogo_publico", undefined, init);
    return {
      productos: Array.isArray(data?.productos) ? data.productos : [],
      valoraciones: Array.isArray(data?.valoraciones) ? data.valoraciones : [],
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
export function precioVenta(index: CatalogIndex, product: Product, variantIndex: number): number | null {
  if (!product.variants[variantIndex]) return null;
  const override = index.ajuste(product.id)?.precios?.[String(variantIndex)];
  if (typeof override === "number" && override >= 0) return override;
  return variantPriceEur(product, variantIndex);
}

export function estaAgotado(index: CatalogIndex, productId: string): boolean {
  return index.ajuste(productId)?.agotado === true;
}

export function estaOculto(index: CatalogIndex, productId: string): boolean {
  return index.ajuste(productId)?.oculto === true;
}
