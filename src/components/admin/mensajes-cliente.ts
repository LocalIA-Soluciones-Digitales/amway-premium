import { SITE } from "@/data/site-config";
import { fechaLarga } from "@/lib/recogida";
import { eur, type Pedido } from "./shared";

// Plantillas de WhatsApp de la gestora al cliente. Las usan la ficha del
// pedido (todas) y la agenda de recogidas (la que toca según el estado).

// "el martes 29 de septiembre a las 18:00 h"
export function cuandoRecoge(p: Pedido): string | null {
  if (!p.recogida_fecha) return null;
  return `el ${fechaLarga(p.recogida_fecha)}${p.recogida_hora ? ` a las ${p.recogida_hora} h` : ""}`;
}

export interface MensajeCliente {
  id: "confirmar" | "recordar" | "enviado" | "listo" | "resena";
  label: string;
  texto: string;
}

export function mensajesCliente(p: Pedido): MensajeCliente[] {
  const nombre = p.cliente_nombre?.split(" ")[0] ?? "";
  const lineas = p.items.map((i) => `• ${i.cantidad} × ${i.nombre}`).join("\n");
  const cuando = cuandoRecoge(p);
  const total =
    p.estado === "pendiente" ? `Total a pagar al recoger: *${eur(p.total_eur)}*` : `Total: *${eur(p.total_eur)}* (pagado)`;
  return [
    cuando
      ? {
          id: "confirmar",
          label: "Confirmar pedido y recogida",
          texto: `Hola ${nombre}, soy de ${SITE.name}. Te confirmo tu pedido nº ${p.numero}:\n\n${lineas}\n\n${total}\n*Recogida:* ${cuando}\n\nTe paso por aquí la dirección exacta. ¡Gracias!`,
        }
      : {
          id: "confirmar",
          label: "Confirmar pedido",
          texto: `Hola ${nombre}, soy de ${SITE.name}. ¡Gracias por tu pedido #${p.numero}! 🙌\n\n${lineas}\n\nTotal: ${eur(p.total_eur)}. Te aviso en cuanto salga.`,
        },
    cuando
      ? {
          id: "recordar",
          label: "Recordar la recogida",
          texto: `Hola ${nombre}, te recuerdo que tu pedido nº ${p.numero} está listo para recoger ${cuando}.${
            p.estado === "pendiente" ? ` Son ${eur(p.total_eur)} en efectivo.` : ""
          }\n\nSi te viene mal, dímelo y lo cambiamos sin problema.`,
        }
      : {
          id: "enviado",
          label: "Avisar del envío",
          texto: `Hola ${nombre}, tu pedido #${p.numero} ya está en camino 📦${
            p.seguimiento ? `\n\nNº de seguimiento: ${p.seguimiento}` : ""
          }\n\nCualquier cosa, escríbeme por aquí.`,
        },
    ...(cuando
      ? [
          {
            id: "listo" as const,
            label: "Avisar de que está preparado",
            texto: `Hola ${nombre}, tu pedido nº ${p.numero} ya está preparado 🛍️ Te espero ${cuando}.${
              p.estado === "pendiente" ? ` Recuerda: ${eur(p.total_eur)} en efectivo.` : ""
            }`,
          },
        ]
      : []),
    {
      id: "resena",
      label: "Pedir una reseña",
      texto: `Hola ${nombre}, ¿qué tal con tu pedido #${p.numero}? Si te apetece, me ayudaría muchísimo que dejaras tu opinión aquí: ${SITE.url}/opiniones ¡Gracias! 💚`,
    },
  ];
}

// El mensaje que toca ahora en la agenda: recién entrado → confirmar;
// con la bolsa preparada → avisar de que está listo; ya recogido → reseña.
export function mensajeSiguiente(p: Pedido): MensajeCliente {
  const todos = mensajesCliente(p);
  const id = p.estado === "entregado" ? "resena" : p.preparado_at && p.recogida_fecha ? "listo" : "confirmar";
  return todos.find((m) => m.id === id) ?? todos[0];
}

// Estado al que vuelve un pedido al deshacer "recogido" o reactivar uno
// cancelado: si se iba a pagar en efectivo, otra vez pendiente de cobro.
export const estadoSinCerrar = (p: Pedido): Pedido["estado"] => (p.metodo_pago === "efectivo" ? "pendiente" : "pagado");
