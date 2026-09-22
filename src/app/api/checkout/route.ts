import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { eurToCents } from "@/lib/currency";
import { getProductById } from "@/data/products";
import { directCheckoutPrice } from "@/data/types";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Los pagos online todavía no están activados en esta tienda." },
      { status: 503 }
    );
  }

  const { productId } = await request.json().catch(() => ({ productId: null }));
  const product = typeof productId === "string" ? getProductById(productId) : undefined;

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const eurPrice = directCheckoutPrice(product);
  if (eurPrice == null) {
    return NextResponse.json(
      { error: "Este producto tiene varias opciones: consúltalo por WhatsApp para confirmar el precio." },
      { status: 422 }
    );
  }

  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: eurToCents(eurPrice),
          product_data: {
            name: product.name,
            description: `${product.brand} · ${product.variants[0].size}`,
            images: product.image
              ? [
                  `${origin}/images/${product.image.includes("/") ? product.image : `catalog/${product.image}`}`,
                ]
              : undefined,
          },
        },
      },
    ],
    metadata: { productId: product.id, sku: product.variants[0].sku ?? "" },
    success_url: `${origin}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancelado`,
  });

  return NextResponse.json({ url: session.url });
}
