import { amwayRpc } from "@/lib/amway-config";
import { formatEUR } from "@/lib/currency";
import { fechaLarga } from "@/lib/recogida";

// Consulta del estado de un pedido desde el asistente. La función de la base
// de datos solo responde si el número de pedido y el teléfono coinciden, no
// devuelve datos personales y frena los intentos repetidos.

export interface EstadoPedido {
  numero: number;
  estado: "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado";
  metodo_pago: string | null;
  total_eur: number;
  recogida_fecha: string | null;
  recogida_hora: string | null;
  preparado: boolean;
  seguimiento: string | null;
}

export type ResultadoConsulta =
  | { tipo: "encontrado"; pedido: EstadoPedido }
  | { tipo: "noEncontrado" }
  | { tipo: "bloqueado" }
  | { tipo: "error" };

export async function consultarPedido(numero: number, telefono: string): Promise<ResultadoConsulta> {
  try {
    const r = await amwayRpc<EstadoPedido | { bloqueado: true } | null>(
      "amway_estado_pedido",
      { p_numero: numero, p_telefono: telefono },
      { cache: "no-store" }
    );
    if (!r) return { tipo: "noEncontrado" };
    if ("bloqueado" in r) return { tipo: "bloqueado" };
    return { tipo: "encontrado", pedido: r };
  } catch {
    return { tipo: "error" };
  }
}

export function describirPedido(p: EstadoPedido): string[] {
  const cuando =
    p.recogida_fecha && p.recogida_hora
      ? `el ${fechaLarga(p.recogida_fecha)} a las ${p.recogida_hora}`
      : null;
  const pago =
    p.estado === "pendiente" && p.metodo_pago === "efectivo"
      ? `Pagarás ${formatEUR(Number(p.total_eur))} en efectivo al recogerlo.`
      : p.estado === "pendiente"
        ? `Pendiente de pago: ${formatEUR(Number(p.total_eur))}.`
        : `Pagado: ${formatEUR(Number(p.total_eur))}.`;

  switch (p.estado) {
    case "cancelado":
      return [`El pedido nº ${p.numero} está cancelado.`, "Si no es lo que esperabas, escríbenos y lo revisamos."];
    case "entregado":
      return [`El pedido nº ${p.numero} ya está entregado. ¡Gracias por tu compra!`];
    case "enviado":
      return [
        `El pedido nº ${p.numero} está enviado.`,
        p.seguimiento ? `Número de seguimiento: ${p.seguimiento}` : "Te llegará en breve.",
      ];
    default:
      if (p.preparado) {
        return [
          `¡Tu pedido nº ${p.numero} está preparado! 🛍️`,
          cuando ? `Te esperamos ${cuando}.` : "Ya puedes pasar a recogerlo.",
          pago,
        ];
      }
      return [
        `Tu pedido nº ${p.numero} está confirmado y lo estamos preparando.`,
        cuando ? `Recogida: ${cuando}.` : "Te avisamos por WhatsApp en cuanto esté listo.",
        pago,
      ];
  }
}
