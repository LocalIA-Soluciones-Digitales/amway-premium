import { RECOGIDA } from "@/lib/recogida";
import { SITE, WA_PRESETS } from "@/data/site-config";

// Árbol de respuestas del asistente del botón de WhatsApp. Cada tema responde
// con unas líneas cortas y ofrece los siguientes pasos; si la duda no queda
// resuelta, siempre hay salida a WhatsApp con el mensaje ya preparado.

export type AccionAsistente =
  | { tipo: "tema"; id: TemaId; label: string }
  | { tipo: "enlace"; href: string; label: string }
  | { tipo: "whatsapp"; mensaje: string; label: string }
  | { tipo: "cesta"; label: string };

export interface TemaAsistente {
  pregunta: string;
  respuesta: string[];
  acciones: AccionAsistente[];
}

export type TemaId =
  | "pedido"
  | "disponibilidad"
  | "pagos"
  | "recogida"
  | "originales"
  | "asesoramiento";

const primeraHora = RECOGIDA.horas[0];
const ultimaHora = RECOGIDA.horas[RECOGIDA.horas.length - 1];
const antelacionH = RECOGIDA.antelacionMin / 60;

export const SALUDO_ASISTENTE = [
  "¡Hola! Soy el asistente de " + SITE.name + ".",
  "Resuelvo las dudas más habituales al momento. ¿Sobre qué quieres saber?",
];

export const TEMAS_INICIO: TemaId[] = [
  "pedido",
  "disponibilidad",
  "pagos",
  "recogida",
  "originales",
  "asesoramiento",
];

export const TEMAS: Record<TemaId, TemaAsistente> = {
  pedido: {
    pregunta: "¿Cómo hago un pedido?",
    respuesta: [
      "Muy fácil, en 3 pasos:",
      "1. Añade los productos a la cesta desde el catálogo.",
      "2. Elige el día y la hora a la que pasarás a recogerlo en " + SITE.city + ".",
      "3. Paga con tarjeta en la web o en efectivo al recoger.",
      "Recibirás la confirmación y te avisamos por WhatsApp si hay cualquier cambio.",
    ],
    acciones: [
      { tipo: "enlace", href: "/catalogo", label: "Ver catálogo" },
      { tipo: "cesta", label: "Abrir mi cesta" },
      { tipo: "tema", id: "pagos", label: "Formas de pago" },
      { tipo: "whatsapp", mensaje: WA_PRESETS.order, label: "Prefiero pedir por WhatsApp" },
    ],
  },
  disponibilidad: {
    pregunta: "¿Tenéis stock?",
    respuesta: [
      "La web muestra la disponibilidad actualizada: si un producto se puede añadir a la cesta, lo tenemos.",
      "Los marcados como «Agotado» están pendientes de reposición. Como importamos de Estados Unidos, te podemos dar el plazo estimado o proponerte una alternativa.",
    ],
    acciones: [
      { tipo: "whatsapp", mensaje: WA_PRESETS.availability, label: "Consultar un producto" },
      { tipo: "tema", id: "pedido", label: "Cómo hacer un pedido" },
      { tipo: "enlace", href: "/catalogo", label: "Ver catálogo" },
    ],
  },
  pagos: {
    pregunta: "Formas de pago",
    respuesta: [
      "Puedes elegir al confirmar el pedido:",
      "• Tarjeta: pago seguro en la web, procesado por Stripe.",
      "• Efectivo: pagas en el momento de la recogida.",
      "Todos los precios de la web están en euros.",
    ],
    acciones: [
      { tipo: "tema", id: "recogida", label: "Recogida y entrega" },
      { tipo: "cesta", label: "Ir a pagar" },
      { tipo: "whatsapp", mensaje: WA_PRESETS.info, label: "Tengo otra duda" },
    ],
  },
  recogida: {
    pregunta: "Recogida y entrega",
    respuesta: [
      "Recogida en mano en " + SITE.city + ", de lunes a sábado.",
      `Eliges la hora en la cesta, entre las ${primeraHora} y las ${ultimaHora}, con al menos ${antelacionH} h de antelación.`,
      "¿Estás fuera de " + SITE.region + "? Escríbenos y te confirmamos el envío y su coste según destino.",
    ],
    acciones: [
      { tipo: "cesta", label: "Elegir día de recogida" },
      {
        tipo: "whatsapp",
        mensaje:
          "Hola, me gustaría saber si hacéis envíos a mi zona y cuál sería el coste y el plazo de entrega. Gracias.",
        label: "Consultar envío",
      },
      { tipo: "tema", id: "pagos", label: "Formas de pago" },
    ],
  },
  originales: {
    pregunta: "¿Son productos originales?",
    respuesta: [
      "Sí, 100 %. Son productos Amway originales importados directamente de Estados Unidos, con el mismo packaging y la misma calidad que en origen.",
      SITE.legalNote,
    ],
    acciones: [
      { tipo: "enlace", href: "/sobre-nosotros", label: "Quiénes somos" },
      { tipo: "enlace", href: "/opiniones", label: "Opiniones de clientes" },
      { tipo: "tema", id: "pedido", label: "Cómo hacer un pedido" },
    ],
  },
  asesoramiento: {
    pregunta: "Ayúdame a elegir",
    respuesta: [
      "Encantados. ¿Qué te interesa?",
      "Si lo prefieres, cuéntanos por WhatsApp qué buscas y te recomendamos lo que mejor encaja contigo.",
    ],
    acciones: [
      { tipo: "enlace", href: "/nutricion", label: "Nutrición" },
      { tipo: "enlace", href: "/belleza", label: "Belleza" },
      { tipo: "enlace", href: "/hogar", label: "Hogar" },
      { tipo: "enlace", href: "/xs-energy", label: "XS Energy" },
      { tipo: "whatsapp", mensaje: WA_PRESETS.general, label: "Asesoramiento por WhatsApp" },
    ],
  },
};
