import { RECOGIDA } from "@/lib/recogida";
import { SITE, WA_PRESETS } from "@/data/site-config";

// Base de conocimiento del asistente del botón de WhatsApp.
//
// Cada intención tiene una pregunta (lo que se ve en el chip), la respuesta,
// las palabras clave con las que se reconoce si el cliente la escribe con sus
// palabras y los siguientes pasos. Las respuestas solo cuentan lo que la
// tienda hace de verdad; lo que depende de cada caso se deriva a WhatsApp.

export type AccionAsistente =
  | { tipo: "tema"; id: string; label?: string }
  | { tipo: "enlace"; href: string; label: string }
  | { tipo: "whatsapp"; mensaje: string; label: string }
  | { tipo: "cesta"; label: string };

export interface Intento {
  pregunta: string;
  respuesta: string[];
  /** Palabras (raíces) o frases que identifican la intención al escribir. */
  claves: string[];
  acciones: AccionAsistente[];
}

const primeraHora = RECOGIDA.horas[0];
const ultimaHora = RECOGIDA.horas[RECOGIDA.horas.length - 1];
const antelacionH = RECOGIDA.antelacionMin / 60;

export function waDuda(tema: string): string {
  return `Hola, tengo una duda sobre ${tema} que no he podido resolver en la web. `;
}

export const TEMAS_INICIO = [
  "pedido",
  "disponibilidad",
  "pagos",
  "recogida",
  "originales",
  "asesoramiento",
];

export const INTENTOS: Record<string, Intento> = {
  // ── Pedido ────────────────────────────────────────────────────────────
  pedido: {
    pregunta: "¿Cómo hago un pedido?",
    respuesta: [
      "Muy fácil, en 3 pasos:",
      "1. Añade los productos a la cesta desde el catálogo.",
      `2. Elige el día y la hora a la que pasarás a recogerlo en ${SITE.city}.`,
      "3. Paga con tarjeta en la web o en efectivo al recoger.",
    ],
    claves: ["pedido", "pedir", "comprar", "compra", "encarg", "cesta", "carrito", "como hago", "como se hace"],
    acciones: [
      { tipo: "tema", id: "registro" },
      { tipo: "tema", id: "modificar" },
      { tipo: "tema", id: "listo" },
      { tipo: "enlace", href: "/catalogo", label: "Ver catálogo" },
    ],
  },
  registro: {
    pregunta: "¿Tengo que registrarme?",
    respuesta: [
      "No, no hace falta crear ninguna cuenta.",
      "Al confirmar solo te pedimos tu nombre y un teléfono con WhatsApp, para avisarte del pedido. Puedes añadir un comentario si lo necesitas.",
    ],
    claves: ["registr", "cuenta", "usuario", "contrasena", "login", "datos personales", "que datos"],
    acciones: [
      { tipo: "cesta", label: "Ir a mi cesta" },
      { tipo: "tema", id: "pagos" },
    ],
  },
  modificar: {
    pregunta: "¿Puedo cambiar o cancelar un pedido?",
    respuesta: [
      "Sí. Escríbenos cuanto antes por WhatsApp con tu nombre y el número de pedido, y lo ajustamos contigo: productos, día u hora de recogida.",
    ],
    claves: ["cancel", "anul", "modific", "cambiar pedido", "cambiar el pedido", "equivoc", "error", "devol", "devuelv"],
    acciones: [
      {
        tipo: "whatsapp",
        mensaje: "Hola, me gustaría modificar/cancelar mi pedido. Mi nombre es ",
        label: "Gestionar mi pedido",
      },
      { tipo: "tema", id: "pedido", label: "Volver a pedidos" },
    ],
  },
  listo: {
    pregunta: "¿Cuándo estará listo?",
    respuesta: [
      "Todo lo que puedes añadir a la cesta está disponible, así que lo tendrás preparado para el día y la hora que elijas.",
      `Puedes reservar desde ${antelacionH} h después de hacer el pedido.`,
    ],
    claves: ["cuando", "tarda", "plazo", "listo", "preparad", "rapido", "urgente", "hoy", "manana"],
    acciones: [
      { tipo: "tema", id: "recogida" },
      { tipo: "cesta", label: "Elegir día de recogida" },
    ],
  },

  // ── Disponibilidad ────────────────────────────────────────────────────
  disponibilidad: {
    pregunta: "¿Tenéis stock?",
    respuesta: [
      "La web muestra la disponibilidad actualizada: si un producto se puede añadir a la cesta, lo tenemos.",
      "Los marcados como «Agotado» están pendientes de reposición.",
    ],
    claves: ["stock", "disponib", "hay", "quedan", "existenc", "tenei"],
    acciones: [
      { tipo: "tema", id: "agotado" },
      { tipo: "tema", id: "encargo" },
      { tipo: "whatsapp", mensaje: WA_PRESETS.availability, label: "Consultar un producto" },
    ],
  },
  agotado: {
    pregunta: "¿Cuándo repondréis un agotado?",
    respuesta: [
      "Importamos de Estados Unidos, así que el plazo depende del catálogo Amway de allí.",
      "Dinos qué producto es y te damos el plazo estimado o te proponemos una alternativa equivalente.",
    ],
    claves: ["agotad", "repon", "reposicion", "sin stock", "no hay", "vuelve", "volvera"],
    acciones: [
      {
        tipo: "whatsapp",
        mensaje: "Hola, me interesa un producto que aparece agotado: ",
        label: "Preguntar por un agotado",
      },
    ],
  },
  encargo: {
    pregunta: "¿Podéis traer algo que no está en la web?",
    respuesta: [
      "Trabajamos con el catálogo Amway de Estados Unidos. Si buscas un producto concreto que no ves en la web, dinos cuál y te confirmamos si podemos conseguirlo, su precio y el plazo.",
    ],
    claves: ["no esta en la web", "no aparece", "no lo encuentro", "traer", "conseguir", "encargar", "catalogo americano", "otro producto"],
    acciones: [
      {
        tipo: "whatsapp",
        mensaje: "Hola, busco un producto Amway que no veo en la web: ",
        label: "Pedir un producto",
      },
    ],
  },

  // ── Pagos y precios ───────────────────────────────────────────────────
  pagos: {
    pregunta: "Formas de pago",
    respuesta: [
      "Eliges al confirmar el pedido:",
      "• Tarjeta: pago seguro en la web.",
      "• Efectivo: pagas en el momento de la recogida.",
    ],
    claves: ["pag", "tarjet", "efectiv", "metodo", "forma de pago", "cobr"],
    acciones: [
      { tipo: "tema", id: "seguro" },
      { tipo: "tema", id: "bizum" },
      { tipo: "tema", id: "precios" },
    ],
  },
  seguro: {
    pregunta: "¿Es seguro pagar con tarjeta?",
    respuesta: [
      "Sí. El pago se hace en la pasarela de Stripe, cifrado y con verificación de tu banco. Nosotros no vemos ni guardamos los datos de tu tarjeta.",
    ],
    claves: ["segur", "stripe", "fiable", "estafa", "datos de la tarjeta", "confianza"],
    acciones: [
      { tipo: "cesta", label: "Ir a pagar" },
      { tipo: "tema", id: "pagos", label: "Volver a pagos" },
    ],
  },
  bizum: {
    pregunta: "¿Aceptáis Bizum o transferencia?",
    respuesta: [
      "En la web puedes pagar con tarjeta o en efectivo al recoger. Si prefieres otro método, escríbenos y lo vemos contigo.",
    ],
    claves: ["bizum", "transferen", "paypal", "otro metodo", "plazos", "financ"],
    acciones: [
      {
        tipo: "whatsapp",
        mensaje: "Hola, me gustaría pagar mi pedido con otro método de pago (Bizum/transferencia). ¿Es posible?",
        label: "Preguntar por WhatsApp",
      },
    ],
  },
  precios: {
    pregunta: "¿Qué incluyen los precios?",
    respuesta: [
      "Todos los precios están en euros, convertidos al cambio oficial desde el catálogo original de Estados Unidos.",
      "La recogida en mano no tiene coste. Si necesitas envío, te confirmamos su coste según destino antes de cerrar el pedido.",
    ],
    claves: ["precio", "cuest", "cuanto vale", "caro", "euro", "dolar", "iva", "descuento", "oferta", "gastos"],
    acciones: [
      { tipo: "enlace", href: "/ofertas", label: "Ver ofertas" },
      { tipo: "tema", id: "envios" },
    ],
  },

  // ── Recogida y envíos ─────────────────────────────────────────────────
  recogida: {
    pregunta: "Recogida y entrega",
    respuesta: [
      `Recogida en mano en ${SITE.city}, de lunes a sábado.`,
      `Eliges la hora en la cesta, entre las ${primeraHora} y las ${ultimaHora}.`,
    ],
    claves: ["recog", "entreg", "horario", "hora", "dia", "cuando paso"],
    acciones: [
      { tipo: "tema", id: "direccion" },
      { tipo: "tema", id: "cambiarHora" },
      { tipo: "tema", id: "envios" },
    ],
  },
  direccion: {
    pregunta: "¿Dónde se recoge?",
    respuesta: [
      `En ${SITE.city} (${SITE.region}). Al confirmar el pedido te enviamos por WhatsApp la dirección exacta de recogida.`,
    ],
    claves: ["donde", "direccion", "ubicacion", "tienda fisica", "local", "barakaldo", "mapa"],
    acciones: [
      { tipo: "tema", id: "cambiarHora" },
      { tipo: "tema", id: "envios" },
    ],
  },
  cambiarHora: {
    pregunta: "¿Puedo cambiar la hora?",
    respuesta: [
      "Claro. Avísanos por WhatsApp con tu nombre y la nueva hora que te viene bien, y lo reorganizamos.",
    ],
    claves: ["cambiar hora", "cambiar la hora", "cambiar dia", "cambiar el dia", "no puedo ir", "retras", "llego tarde", "otro dia"],
    acciones: [
      {
        tipo: "whatsapp",
        mensaje: "Hola, necesito cambiar la hora de recogida de mi pedido. Mi nombre es ",
        label: "Cambiar mi recogida",
      },
    ],
  },
  envios: {
    pregunta: "¿Hacéis envíos?",
    respuesta: [
      `Lo habitual es la recogida en ${SITE.city}. Si estás en otra zona, escríbenos con tu código postal y te confirmamos si podemos enviarlo, el coste y el plazo.`,
    ],
    claves: ["envi", "mandar", "domicilio", "correo", "mensajer", "casa", "bilbao", "madrid", "fuera", "peninsula", "espana"],
    acciones: [
      {
        tipo: "whatsapp",
        mensaje: "Hola, ¿hacéis envíos a mi zona? Mi código postal es ",
        label: "Consultar envío",
      },
    ],
  },

  // ── Confianza ─────────────────────────────────────────────────────────
  originales: {
    pregunta: "¿Son productos originales?",
    respuesta: [
      "Sí, 100 %. Son productos Amway originales importados directamente de Estados Unidos, con el mismo packaging y la misma calidad que en origen.",
      SITE.legalNote,
    ],
    claves: ["origin", "autentic", "falso", "falsific", "imitacion", "fiar", "estados unidos", "import"],
    acciones: [
      { tipo: "tema", id: "garantia" },
      { tipo: "enlace", href: "/opiniones", label: "Opiniones de clientes" },
      { tipo: "enlace", href: "/sobre-nosotros", label: "Quiénes somos" },
    ],
  },
  garantia: {
    pregunta: "¿Tienen garantía?",
    respuesta: [
      "Sí, todos los productos mantienen la garantía de satisfacción Amway.",
      "Si tienes cualquier problema con un producto, escríbenos y lo resolvemos contigo.",
    ],
    claves: ["garant", "roto", "defect", "no funciona", "problema", "reclam", "satisfac"],
    acciones: [
      {
        tipo: "whatsapp",
        mensaje: "Hola, tengo una incidencia con un producto que compré: ",
        label: "Tengo una incidencia",
      },
    ],
  },

  // ── Asesoramiento ─────────────────────────────────────────────────────
  asesoramiento: {
    pregunta: "Ayúdame a elegir",
    respuesta: ["Encantados. ¿Qué te interesa?"],
    claves: ["elegir", "recomiend", "recomend", "aconsej", "asesor", "cual", "mejor", "necesito", "busco"],
    acciones: [
      { tipo: "enlace", href: "/nutricion", label: "Nutrición" },
      { tipo: "enlace", href: "/belleza", label: "Belleza" },
      { tipo: "enlace", href: "/hogar", label: "Hogar" },
      { tipo: "enlace", href: "/xs-energy", label: "XS Energy" },
      { tipo: "tema", id: "asesorPersonal" },
    ],
  },
  asesorPersonal: {
    pregunta: "Quiero una recomendación personal",
    respuesta: [
      "Cuéntanos por WhatsApp qué buscas (para ti, tu familia o tu casa) y te recomendamos los productos que mejor encajan, con su modo de uso.",
    ],
    claves: ["vitamin", "suplement", "nutrilite", "artistry", "piel", "crema", "maquill", "agua", "purificador", "espring", "limpieza", "energ", "deporte", "cansancio", "defensas"],
    acciones: [
      { tipo: "whatsapp", mensaje: WA_PRESETS.general, label: "Pedir recomendación" },
      { tipo: "enlace", href: "/catalogo", label: "Ver catálogo" },
    ],
  },

  // ── Conversación ──────────────────────────────────────────────────────
  persona: {
    pregunta: "Hablar con una persona",
    respuesta: ["Por supuesto. Te atendemos personalmente por WhatsApp."],
    claves: ["persona", "humano", "hablar con", "llamar", "telefono", "contacto", "whatsapp", "agente"],
    acciones: [{ tipo: "whatsapp", mensaje: WA_PRESETS.general, label: "Abrir WhatsApp" }],
  },
  gracias: {
    pregunta: "Gracias",
    respuesta: ["¡A ti! Si te surge cualquier otra duda, aquí estoy."],
    claves: ["gracias", "genial", "perfecto", "vale", "ok"],
    acciones: [],
  },
};

// ── Reconocimiento de lo que escribe el cliente ─────────────────────────
//
// Coincidencia por raíces sin tildes: cada raíz suma 1 punto, cada frase 3.
// Las frases pesan más porque separan las preguntas concretas ("cambiar la
// hora") de los temas generales ("hora"), y por lo mismo las preguntas
// concretas puntúan un 50 % más que los temas de inicio: «cancelar mi
// pedido» es «¿Puedo cancelar?», no «¿Cómo hago un pedido?».

const VACIAS = new Set(
  "el la los las un una unos unas de del al que en y o a me mi mis se su sus por para con sin es lo le les como muy mas pero si no yo tu te vosotros os este esta esto eso".split(" ")
);

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface Coincidencia {
  id: string;
  puntos: number;
}

export function buscarIntentos(texto: string): Coincidencia[] {
  const frase = ` ${normalizar(texto)} `;
  const palabras = frase.trim().split(" ").filter((p) => p.length > 1 && !VACIAS.has(p));
  if (palabras.length === 0) return [];

  return Object.entries(INTENTOS)
    .map(([id, intento]) => {
      let puntos = 0;
      for (const clave of intento.claves) {
        const c = normalizar(clave);
        if (c.includes(" ")) {
          if (frase.includes(` ${c}`)) puntos += 3;
        } else if (palabras.some((p) => p.startsWith(c))) {
          puntos += 1;
        }
      }
      // asesorPersonal reconoce productos («vitaminas», «purificador»), que
      // son el tema de la pregunta y no la intención: no lleva el extra.
      const general = TEMAS_INICIO.includes(id) || id === "asesorPersonal";
      return { id, puntos: general ? puntos : puntos * 1.5 };
    })
    .filter((c) => c.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);
}
