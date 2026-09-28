import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { waLink, WA_PRESETS } from "@/data/site-config";
import { fechaLarga } from "@/lib/recogida";
import { mensajePedido } from "@/lib/mensaje-pedido";
import { ClearCartOnMount } from "@/components/cart/ClearCartOnMount";
import { registrarPedidoStripe } from "@/lib/amway-pedidos";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export default async function CheckoutExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  // Deja el pedido apuntado en el panel de gestión. Si falla (sin token,
  // Supabase caído) el cliente ya ha pagado: la página se muestra igual.
  const pedido = session_id
    ? await registrarPedidoStripe(session_id).catch((e) => {
        console.error("No se pudo registrar el pedido", e);
        return null;
      })
    : null;
  const recogida = pedido?.recogidaFecha && pedido.recogidaHora ? { fecha: pedido.recogidaFecha, hora: pedido.recogidaHora } : null;
  const waMensaje = pedido
    ? mensajePedido({
        lineas: pedido.items.map((i) => ({
          cantidad: i.cantidad,
          nombre: i.nombre,
          detalle: [i.formato, i.sabor].filter(Boolean).join(" · "),
          importe: i.precio_eur * i.cantidad,
        })),
        total: pedido.total,
        metodo: "tarjeta",
        recogida,
        nombre: pedido.nombre,
      })
    : WA_PRESETS.order;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-cream px-6 pt-24 text-center sm:px-8">
      <ClearCartOnMount />
      <CheckCircle2 className="text-forest" size={56} />
      <h1 className="mt-6 font-display text-3xl text-carbon sm:text-4xl">
        ¡Gracias por tu pedido!
      </h1>
      <p className="mt-4 max-w-md text-stone">
        Hemos recibido tu pago correctamente.
        {recogida
          ? ` Te esperamos el ${fechaLarga(recogida.fecha)} a las ${recogida.hora} h.`
          : ""}{" "}
        Envíanos el resumen por WhatsApp y te confirmamos la dirección de recogida.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <a
          href={waLink(waMensaje)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-forest px-7 py-3.5 text-sm font-medium text-cream transition hover:bg-forest-dim"
        >
          Enviar resumen por WhatsApp
        </a>
        <Link
          href="/catalogo"
          className="rounded-full border border-carbon/20 px-7 py-3.5 text-sm font-medium text-carbon transition hover:border-carbon/40"
        >
          Seguir comprando
        </Link>
      </div>
      <Link href="/cuenta" className="mt-6 text-sm text-stone underline-offset-4 transition hover:text-carbon hover:underline">
        Ver mis pedidos
      </Link>
    </div>
  );
}
