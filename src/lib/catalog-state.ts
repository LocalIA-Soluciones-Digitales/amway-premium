import { amwayRpc } from "@/lib/amway-config";
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
  // El catálogo no se pudo leer pero los cierres sí: productos y
  // valoraciones vienen vacíos y no deben pisar los que ya se tenían.
  incompleto?: boolean;
}

export const CATALOGO_VACIO: CatalogoPublico = { productos: [], valoraciones: [], cierres: [] };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Un fallo del catálogo no rompe la tienda (sirve el catálogo base), así
// que sin esto pasaría desapercibido: queda en la pestaña Errores del
// panel, como mucho una vez cada 15 minutos por instancia del servidor.
let ultimoAviso = 0;
async function avisarFallo(e: unknown): Promise<void> {
  if (typeof window !== "undefined" || Date.now() - ultimoAviso < 15 * 60_000) return;
  ultimoAviso = Date.now();
  // No usa registrarErrorServidor: su cache "no-store" volvería dinámicas
  // las páginas estáticas que se generan mientras el catálogo falla.
  const detalle = e instanceof Error ? e.message : String(e);
  await amwayRpc("amway_registrar_error", {
    p_mensaje: "[servidor] La tienda no puede leer el catálogo del panel (precios, agotados, ocultos)",
    p_detalle: detalle.slice(0, 4000),
    p_path: "catalogo",
    p_user_agent: "servidor",
  }).catch(() => undefined);
}

export async function fetchCatalogoPublico(
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
): Promise<CatalogoPublico> {
  // Catálogo y cierres por separado: si falla uno, el otro se sigue
  // aplicando (un cierre del panel no puede perderse por un fallo ajeno).
  const [data, cierres] = await Promise.all([
    amwayRpc<CatalogoPublico>("amway_catalogo_publico", undefined, init).catch(async (e) => {
      await avisarFallo(e);
      return null;
    }),
    amwayRpc<unknown>("amway_cierres_publicos", undefined, init).catch(() => null),
  ]);
  // Sin base de datos la tienda sigue funcionando con el catálogo base.
  if (!data && !cierres) return CATALOGO_VACIO;
  return {
    productos: Array.isArray(data?.productos) ? data.productos : [],
    valoraciones: Array.isArray(data?.valoraciones) ? data.valoraciones : [],
    cierres: Array.isArray(cierres) ? cierres.filter((d): d is string => typeof d === "string" && FECHA.test(d)) : [],
    ...(!data && { incompleto: true }),
  };
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
