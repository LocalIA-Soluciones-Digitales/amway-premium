import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { amwayRpc } from "@/lib/amway-db";
import { getProductById } from "@/data/products";

// Registra en amway_pedidos un pago confirmado por Stripe. Lo llaman la
// página de éxito y (si está configurado) el webhook; la función SQL es
// idempotente por session id, así que no importa cuál llegue antes.
// Sin AMWAY_PEDIDOS_TOKEN no hace nada: la tienda sigue cobrando igual.
export async function registrarPedidoStripe(sessionId: string): Promise<void> {
  const token = process.env.AMWAY_PEDIDOS_TOKEN;
  if (!stripe || !token || !sessionId.startsWith("cs_")) return;

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });
  if (session.payment_status !== "paid") return;

  const items = (session.line_items?.data ?? []).map((line) => {
    const product = line.price?.product as Stripe.Product | undefined;
    const meta = product?.metadata ?? {};
    const catalogProduct = meta.product_id ? getProductById(meta.product_id) : undefined;
    const variantIndex = Number(meta.variant_index ?? 0);
    const quantity = line.quantity ?? 1;
    return {
      product_id: meta.product_id ?? null,
      variant_index: variantIndex,
      nombre: catalogProduct?.name ?? line.description ?? product?.name ?? "Producto",
      formato: catalogProduct?.variants[variantIndex]?.size ?? null,
      sabor: meta.flavor || null,
      cantidad: quantity,
      precio_eur: (line.amount_total ?? 0) / 100 / quantity,
    };
  });

  const shipping = session.collected_information?.shipping_details;
  const address = shipping?.address ?? session.customer_details?.address;
  const direccion = address
    ? [address.line1, address.line2, [address.postal_code, address.city].filter(Boolean).join(" "), address.state]
        .filter(Boolean)
        .join(", ")
    : "";

  await amwayRpc("amway_registrar_pedido_web", {
    p_token: token,
    p_stripe_session_id: session.id,
    p_items: items,
    p_total_eur: (session.amount_total ?? 0) / 100,
    p_envio_eur: (session.total_details?.amount_shipping ?? 0) / 100,
    p_metodo_pago: "tarjeta",
    p_cliente_nombre: shipping?.name ?? session.customer_details?.name ?? "",
    p_cliente_email: session.customer_details?.email ?? "",
    p_cliente_telefono: session.customer_details?.phone ?? "",
    p_direccion: direccion,
  }, { cache: "no-store" });
}
