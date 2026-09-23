import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { registrarPedidoStripe } from "@/lib/amway-pedidos";

// Opcional: si se configura STRIPE_WEBHOOK_SECRET (evento
// checkout.session.completed), el pedido se registra aunque el cliente
// cierre la pestaña antes de volver a la página de éxito.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Falta firma." }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      await registrarPedidoStripe(event.data.object.id);
    } catch (e) {
      console.error("No se pudo registrar el pedido", e);
      return NextResponse.json({ error: "No se pudo registrar el pedido." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
