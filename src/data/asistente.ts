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
  /** Abre un formulario dentro del chat en vez de ofrecer acciones. */
  formulario?: "pedido";
}


export function waDuda(tema: string): string {
  return `Hola, tengo una duda sobre ${tema} que no he podido resolver en la web. `;
}

export const TEMAS_INICIO = [
  "pedido",
  "estadoPedido",
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
    claves: ["pedir", "comprar", "compra", "encarg", "cesta", "carrito", "hacer un pedido", "hago un pedido", "realizar un pedido", "hacer el pedido", "como se compra"],
    acciones: [
      { tipo: "tema", id: "registro" },
      { tipo: "tema", id: "modificar" },
      { tipo: "tema", id: "listo" },
      { tipo: "enlace", href: "/catalogo", label: "Ver catálogo" },
    ],
  },
  estadoPedido: {
    pregunta: "¿Cómo va mi pedido?",
    respuesta: ["Te lo miro al momento. Escribe el número de pedido y el teléfono que diste al hacerlo:"],
    claves: [
      "estado",
      "seguimiento",
      "como va",
      "va mi pedido",
      "esta mi pedido",
      "numero de pedido",
      "ya esta listo",
      "esta preparado",
      "ha llegado",
    ],
    acciones: [],
    formulario: "pedido",
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
      "Tú eliges el día y la hora de recogida al hacer el pedido en la cesta.",
    ],
    claves: ["tarda", "plazo", "listo", "preparad", "urgente", "cuando estara", "cuando lo tengo", "para hoy", "para manana"],
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
      "Todos los precios están en euros, con IVA incluido, según la lista de precios oficial de Amway España.",
      "No hay gastos de envío: todos los pedidos se recogen en nuestro local.",
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
      `Recogida en nuestro local de ${SITE.city}, ${SITE.horario.texto}.`,
      "Eliges el día y la hora al hacer el pedido en la cesta.",
      "Si te surge un imprevisto, avísanos y lo cambiamos sin problema.",
    ],
    claves: ["recog", "entreg", "horario", "hora", "dia", "cuando paso", "recoger el pedido", "recoger mi pedido"],
    acciones: [
      { tipo: "tema", id: "direccion" },
      { tipo: "tema", id: "cambiarHora" },
      { tipo: "tema", id: "envios" },
    ],
  },
  direccion: {
    pregunta: "¿Dónde se recoge?",
    respuesta: [
      `En nuestro local de ${SITE.city} (${SITE.region}), ${SITE.horario.texto}.`,
      "Al confirmar el pedido te enviamos por WhatsApp la dirección exacta.",
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
    pregunta: "¿Hacéis envíos a domicilio?",
    respuesta: [
      `No, no hacemos envíos. Todos los pedidos se recogen en nuestro local de ${SITE.city}, ${SITE.horario.texto}.`,
      "Así te lo entregamos en mano, revisado y con el asesoramiento que necesites.",
    ],
    claves: ["envi", "mandar", "domicilio", "correo", "mensajer", "casa", "a mi zona", "fuera", "peninsula", "espana", "llevar"],
    acciones: [
      { tipo: "tema", id: "direccion" },
      { tipo: "cesta", label: "Elegir día de recogida" },
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
      { tipo: "enlace", href: "/cuidado-personal", label: "Cuidado personal" },
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
    respuesta: [
      "Por supuesto. Te atendemos personalmente por WhatsApp.",
      `Horario: ${SITE.horario.texto}. Si escribes fuera de ese horario, te respondemos a primera hora.`,
    ],
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
//
// Las faltas de ortografía se toleran con distancia de edición 1 sobre raíces
// de 4+ letras («vizum», «recojer», «tarjta»), puntuando algo menos que la
// coincidencia exacta para que esta gane en caso de duda.

export const VACIAS = new Set(
  "el la los las un una unos unas de del al que en y o a me mi mis se su sus por para con sin es lo le les como muy mas pero si no yo tu te vosotros os este esta esto eso".split(" ")
);

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function palabrasDe(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((p) => p.length > 1 && !VACIAS.has(p));
}

// Distancia de Levenshtein con corte: en cuanto supera `max` deja de contar.
export function distancia(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < minFila) minFila = v;
    }
    if (minFila > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const mismaInicial = (a: string, b: string) =>
  a[0] === b[0] || (a[0] === "b" && b[0] === "v") || (a[0] === "v" && b[0] === "b");

/**
 * 1 si la palabra empieza por la raíz, 0,8 si lo hace con una errata, 0 si no.
 * La errata se admite en raíces de `minErrata`+ letras y con la misma
 * inicial (salvo b/v), que es donde casi nunca se equivoca nadie.
 */
export function encajaRaiz(palabra: string, raiz: string, minErrata = 4): number {
  if (palabra.startsWith(raiz)) return 1;
  if (raiz.length < minErrata || palabra.length < raiz.length - 1 || !mismaInicial(palabra, raiz)) return 0;
  for (const largo of [raiz.length - 1, raiz.length, raiz.length + 1]) {
    if (distancia(palabra.slice(0, largo), raiz, 1) <= 1) return 0.8;
  }
  return 0;
}

export interface Coincidencia {
  id: string;
  puntos: number;
}

export function buscarIntentos(texto: string): Coincidencia[] {
  const frase = ` ${normalizar(texto)} `;
  const palabras = palabrasDe(texto);
  if (palabras.length === 0) return [];

  return Object.entries(INTENTOS)
    .map(([id, intento]) => {
      // Frases enteras: 3 puntos cada una.
      let puntos = 0;
      const raices: string[] = [];
      for (const clave of intento.claves) {
        const c = normalizar(clave);
        if (!c.includes(" ")) raices.push(c);
        else if (frase.includes(` ${c}`)) puntos += 3;
      }
      // Raíces: cada palabra del cliente cuenta una sola vez, con su mejor
      // coincidencia (así «pedido» no suma por «pedido» y por «pedir»).
      for (const p of palabras) puntos += Math.max(0, ...raices.map((c) => encajaRaiz(p, c)));
      // asesorPersonal reconoce productos («vitaminas», «purificador»), que
      // son el tema de la pregunta y no la intención: no lleva el extra.
      const general = TEMAS_INICIO.includes(id) || id === "asesorPersonal";
      return { id, puntos: general ? puntos : puntos * 1.5 };
    })
    .filter((c) => c.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);
}
