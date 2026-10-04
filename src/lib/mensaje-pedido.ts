import { formatEUR } from "@/lib/currency";
import { fechaLarga, type MetodoPagoWeb } from "@/lib/recogida";

export interface LineaMensaje {
  cantidad: number;
  nombre: string;
  detalle?: string | null; // formato · sabor
  importe: number; // precio × cantidad
}

// Mensaje de WhatsApp que el cliente nos envía al cerrar el pedido. Va por
// bloques con un icono y un título en negrita (*…*) cada uno, separados por
// una raya, para que en el chat se lea de un vistazo y se pueda cotejar con
// el panel por su número.
const RAYA = "━━━━━━━━━━━━━━━";

export function mensajePedido(p: {
  numero?: number | null;
  lineas: LineaMensaje[];
  total: number;
  metodo: MetodoPagoWeb;
  recogida: { fecha: string; hora: string } | null;
  nombre: string;
  telefono?: string;
  notas?: string;
}): string {
  const titulo = p.numero ? `🧾 *PEDIDO Nº ${p.numero}*` : "🧾 *NUEVO PEDIDO*";
  const productos = p.lineas.flatMap((l) => [
    `▪️ *${l.cantidad} ×* ${l.nombre}`,
    `      ${l.detalle ? `_${l.detalle}_ · ` : ""}${formatEUR(l.importe)}`,
  ]);
  const pago = p.metodo === "tarjeta" ? "Tarjeta · _ya pagado en la web_ ✅" : "Efectivo · _al recoger_";
  const recogida = p.recogida
    ? `${capitalizar(fechaLarga(p.recogida.fecha))} · *${p.recogida.hora} h*`
    : "Por concretar";
  const cliente = [p.nombre, p.telefono].filter(Boolean).join(" · ");

  return [
    "¡Hola! 👋 Acabo de hacer un pedido en la web.",
    "",
    titulo,
    RAYA,
    "",
    "🛍️ *Productos*",
    ...productos,
    "",
    `💶 *Total: ${formatEUR(p.total)}*`,
    RAYA,
    "",
    "📅 *Recogida*",
    recogida,
    "",
    "💳 *Pago*",
    pago,
    "",
    "👤 *Cliente*",
    cliente,
    ...(p.notas ? ["", "📝 *Comentarios*", `_${p.notas.replace(/[_*~]/g, "")}_`] : []),
    RAYA,
    "",
    "¿Me lo confirmáis? ¡Muchas gracias!",
  ].join("\n");
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
