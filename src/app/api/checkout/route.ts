import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { eurToCents } from "@/lib/currency";
import { getProductById } from "@/data/products";
import { productImageSrc, variantPriceEur } from "@/data/types";

const MAX_LINES = 50;
const MAX_QUANTITY_PER_LINE = 20;

interface RequestedLine {
  productId?: unknown;
  variantIndex?: unknown;
  flavor?: unknown;
  quantity?: unknown;
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Los pagos online todavía no están activados en esta tienda." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const requested: RequestedLine[] = Array.isArray(body?.items) ? body.items.slice(0, MAX_LINES) : [];
  if (requested.length === 0) {
    return NextResponse.json({ error: "La cesta está vacía." }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const summary: string[] = [];

  for (const line of requested) {
    const product = typeof line.productId === "string" ? getProductById(line.productId) : undefined;
    const variantIndex = Number.isInteger(line.variantIndex) ? (line.variantIndex as number) : 0;
    const variant = product?.variants[variantIndex];
    // Price is always recomputed here from the catalogue — never trusted
    // from the browser, which only says what and how many.
    const eurPrice = product ? variantPriceEur(product, variantIndex) : null;
    if (!product || !variant || eurPrice == null) {
      return NextResponse.json(
        { error: "Algún producto de la cesta ya no está disponible. Revísala e inténtalo de nuevo." },
        { status: 422 }
      );
    }
    // Optional flavour chosen on a per-flavour card (e.g. the XS™ grid), kept
    // short so it can't be used to stuff arbitrary text into the Stripe session.
    const flavor = typeof line.flavor === "string" && line.flavor.length <= 80 ? line.flavor.trim() : "";
    const quantity = Number.isInteger(line.quantity)
      ? Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, line.quantity as number))
      : 1;
    const image = productImageSrc(product);

    lineItems.push({
      quantity,
      price_data: {
        currency: "eur",
        unit_amount: eurToCents(eurPrice),
        product_data: {
          name: product.name,
          description: [product.brand, variant.size, flavor].filter(Boolean).join(" · "),
          images: image ? [`${origin}${image}`] : undefined,
        },
      },
    });
    summary.push(`${quantity}x ${variant.sku ?? product.id}${flavor ? ` (${flavor})` : ""}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    // Stripe caps each metadata value at 500 characters.
    metadata: { items: summary.join(", ").slice(0, 500) },
    success_url: `${origin}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancelado`,
  });

  return NextResponse.json({ url: session.url });
}
