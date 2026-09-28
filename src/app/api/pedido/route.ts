import { NextRequest, NextResponse } from "next/server";
import { amwayRpc, clienteDeRequest } from "@/lib/amway-db";
import { validarPedidoWeb } from "@/lib/pedido-web";
import { avisarPedidoNuevo } from "@/lib/push";

// Pedido con pago en efectivo al recoger: se apunta en el panel como
// "pendiente de pago" y la cesta abre WhatsApp con el nº de pedido.
export async function POST(request: NextRequest) {
  const token = process.env.AMWAY_PEDIDOS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Los pedidos online no están disponibles ahora mismo." }, { status: 503 });
  }

  const res = await validarPedidoWeb(await request.json().catch(() => null));
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
  const { lineas, total, recogida, nombre, telefono, notas } = res.pedido;
  // Con sesión iniciada, el pedido queda en el historial de su cuenta.
  const cliente = await clienteDeRequest(request);

  try {
    const pedido = await amwayRpc<{ id: string; numero: number }>(
      "amway_registrar_pedido_recogida",
      {
        p_token: token,
        p_items: lineas.map((l) => ({
          product_id: l.product.id,
          variant_index: l.variantIndex,
          nombre: l.product.name,
          formato: l.variant.size ?? null,
          sabor: l.flavor || null,
          cantidad: l.quantity,
          precio_eur: l.eurPrice,
        })),
        p_total_eur: total,
        p_cliente_nombre: nombre,
        p_cliente_telefono: telefono,
        p_recogida_fecha: recogida.fecha,
        p_recogida_hora: recogida.hora,
        p_notas: notas,
        p_cliente_id: cliente?.id ?? null,
        p_cliente_email: cliente?.email ?? null,
      },
      { cache: "no-store" }
    );
    await avisarPedidoNuevo(pedido.id);
    return NextResponse.json({ numero: pedido.numero, total });
  } catch (e) {
    console.error("No se pudo registrar el pedido en efectivo", e);
    const saturado = e instanceof Error && e.message.includes("demasiados pedidos");
    return NextResponse.json(
      {
        error: saturado
          ? "Estamos recibiendo muchos pedidos. Inténtalo en unos minutos o escríbenos por WhatsApp."
          : "No se pudo registrar el pedido. Inténtalo de nuevo o escríbenos por WhatsApp.",
      },
      { status: saturado ? 429 : 502 }
    );
  }
}
