import type { Product, ProductVariant } from "@/data/types";
import { getProductById } from "@/data/products";
import { estaAgotado, estaOculto, fetchCatalogoPublico, indexCatalogo, precioVenta } from "@/lib/catalog-state";
import { recogidaValida, type Recogida } from "@/lib/recogida";

const MAX_LINES = 50;
const MAX_QUANTITY_PER_LINE = 20;

interface RequestedLine {
  productId?: unknown;
  variantIndex?: unknown;
  flavor?: unknown;
  quantity?: unknown;
}

export interface LineaPedido {
  product: Product;
  variant: ProductVariant;
  variantIndex: number;
  flavor: string;
  quantity: number;
  eurPrice: number;
}

export interface PedidoWeb {
  lineas: LineaPedido[];
  total: number;
  recogida: Recogida;
  nombre: string;
  telefono: string;
  notas: string;
}

export type ResultadoPedido = { ok: true; pedido: PedidoWeb } | { ok: false; error: string; status: number };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Valida lo que manda la cesta (tarjeta o efectivo). El navegador solo dice
// qué, cuánto, cuándo lo recoge y quién es: los precios se recalculan aquí
// con el catálogo y los ajustes vigentes del panel (sin caché).
export async function validarPedidoWeb(body: unknown): Promise<ResultadoPedido> {
  const b = (body ?? {}) as Record<string, unknown>;
  const requested: RequestedLine[] = Array.isArray(b.items) ? b.items.slice(0, MAX_LINES) : [];
  if (requested.length === 0) return { ok: false, error: "La cesta está vacía.", status: 400 };

  const recogida = b.recogida as Partial<Recogida> | undefined;
  if (!recogidaValida(recogida)) {
    return { ok: false, error: "Elige un día y una hora de recogida disponibles.", status: 400 };
  }

  const cliente = (b.cliente ?? {}) as Record<string, unknown>;
  const nombre = str(cliente.nombre, 100);
  const telefono = str(cliente.telefono, 30);
  if (!nombre) return { ok: false, error: "Indica tu nombre.", status: 400 };
  if (!/^\+?[\d\s().-]{9,20}$/.test(telefono) || telefono.replace(/\D/g, "").length < 9) {
    return { ok: false, error: "Indica un teléfono válido.", status: 400 };
  }

  const catalog = indexCatalogo(await fetchCatalogoPublico({ cache: "no-store" }));
  const lineas: LineaPedido[] = [];

  for (const line of requested) {
    const product = typeof line.productId === "string" ? getProductById(line.productId) : undefined;
    const variantIndex = Number.isInteger(line.variantIndex) ? (line.variantIndex as number) : 0;
    const variant = product?.variants[variantIndex];
    const eurPrice = product ? precioVenta(catalog, product, variantIndex) : null;
    if (!product || !variant || eurPrice == null) {
      return {
        ok: false,
        error: "Algún producto de la cesta ya no está disponible. Revísala e inténtalo de nuevo.",
        status: 422,
      };
    }
    if (estaAgotado(catalog, product.id) || estaOculto(catalog, product.id)) {
      return { ok: false, error: `"${product.name}" se ha agotado. Quítalo de la cesta para continuar.`, status: 409 };
    }
    // Optional flavour chosen on a per-flavour card (e.g. the XS™ grid), kept
    // short so it can't be used to stuff arbitrary text into the order.
    const flavor = typeof line.flavor === "string" && line.flavor.length <= 80 ? line.flavor.trim() : "";
    const quantity = Number.isInteger(line.quantity)
      ? Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, line.quantity as number))
      : 1;
    lineas.push({ product, variant, variantIndex, flavor, quantity, eurPrice });
  }

  const total = Math.round(lineas.reduce((s, l) => s + l.eurPrice * l.quantity, 0) * 100) / 100;
  return { ok: true, pedido: { lineas, total, recogida, nombre, telefono, notas: str(b.notas, 500) } };
}
