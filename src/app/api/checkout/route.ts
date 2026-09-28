import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { eurToCents } from "@/lib/currency";
import { productImageSrc } from "@/data/types";
import { validarPedidoWeb } from "@/lib/pedido-web";
import { clienteDeRequest } from "@/lib/amway-db";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "El pago con tarjeta todavía no está activado. Puedes elegir pagar en efectivo al recoger." },
      { status: 503 }
    );
  }

  const res = await validarPedidoWeb(await request.json().catch(() => null));
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  const { lineas, recogida, nombre, telefono, notas } = res.pedido;
  const cliente = await clienteDeRequest(request);

  const origin = request.nextUrl.origin;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lineas.map((l) => {
    const image = productImageSrc(l.product);
    return {
      quantity: l.quantity,
      price_data: {
        currency: "eur",
        unit_amount: eurToCents(l.eurPrice),
        product_data: {
          name: l.product.name,
          description: [l.product.brand, l.variant.size, l.flavor].filter(Boolean).join(" · "),
          images: image ? [`${origin}${image}`] : undefined,
          // Read back when the payment is confirmed to record the order.
          metadata: { product_id: l.product.id, variant_index: String(l.variantIndex), flavor: l.flavor },
        },
      },
    };
  });
  const summary = lineas.map((l) => `${l.quantity}x ${l.variant.sku ?? l.product.id}${l.flavor ? ` (${l.flavor})` : ""}`);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Sin payment_method_types: Stripe ofrece los métodos activados en el
    // Dashboard (tarjeta, Apple Pay, Google Pay, Bizum…) según el cliente.
    locale: "es",
    line_items: lineItems,
    // Stripe caps each metadata value at 500 characters.
    metadata: {
      items: summary.join(", ").slice(0, 500),
      recogida_fecha: recogida.fecha,
      recogida_hora: recogida.hora,
      cliente_nombre: nombre,
      cliente_telefono: telefono,
      notas,
      // Lo pone el servidor tras comprobar la sesión: se puede fiar al registrar.
      cliente_id: cliente?.id ?? "",
    },
    customer_email: cliente?.email ?? undefined,
    success_url: `${origin}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancelado`,
  });

  return NextResponse.json({ url: session.url });
}
