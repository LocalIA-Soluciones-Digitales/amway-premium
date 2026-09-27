import { formatEUR } from "@/lib/currency";
import { fechaLarga, type MetodoPagoWeb } from "@/lib/recogida";

export interface LineaMensaje {
  cantidad: number;
  nombre: string;
  detalle?: string | null; // formato · sabor
  importe: number; // precio × cantidad
}

// Mensaje de WhatsApp que el cliente nos envía al cerrar el pedido:
// ordenado por bloques, con negritas de WhatsApp (*…*) y sin emojis, para
// que se lea de un vistazo y se pueda cotejar con el panel por su número.
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
  const titulo = p.numero ? `*Pedido nº ${p.numero}*` : "*Nuevo pedido*";
  const productos = p.lineas
    .map((l) => `• ${l.cantidad} × ${l.nombre}${l.detalle ? ` (${l.detalle})` : ""} — ${formatEUR(l.importe)}`)
    .join("\n");
  const pago =
    p.metodo === "tarjeta" ? "Tarjeta (ya pagado en la web)" : "Efectivo, en el momento de la recogida";
  const recogida = p.recogida ? `${capitalizar(fechaLarga(p.recogida.fecha))}, a las ${p.recogida.hora} h` : "Por concretar";

  return [
    "Hola, buenas:",
    "",
    `Acabo de realizar un pedido en la web. Os dejo el resumen:`,
    "",
    titulo,
    "",
    "*Productos*",
    productos,
    "",
    `*Total: ${formatEUR(p.total)}*`,
    "",
    `*Recogida:* ${recogida}`,
    `*Forma de pago:* ${pago}`,
    `*Nombre:* ${p.nombre}`,
    ...(p.telefono ? [`*Teléfono:* ${p.telefono}`] : []),
    ...(p.notas ? [`*Comentarios:* ${p.notas}`] : []),
    "",
    "¿Me confirmáis el pedido y la dirección de recogida? Muchas gracias.",
  ].join("\n");
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
