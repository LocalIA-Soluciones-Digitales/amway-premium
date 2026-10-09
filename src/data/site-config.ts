export const SITE = {
  name: "Nutri Yuly",
  // Acompaña siempre al nombre (portada, Google, redes): «Nutri» no debe
  // hacer pensar que solo hay suplementos.
  tagline: "Nutrición, belleza y hogar en Barakaldo",
  legalNote: "Distribuidora independiente de productos originales Amway. No es una tienda oficial de Amway.",
  // Dominio canónico (canonical, sitemap, Open Graph, JSON-LD). Hasta
  // conectar el definitivo es el de Vercel: apuntar a un dominio que aún no
  // existe dejaba a Google sin una URL válida. Al conectarlo, basta con
  // NEXT_PUBLIC_SITE_URL=https://<dominio> en Vercel (y next.config redirige
  // el de Vercel al nuevo).
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://amway-premium.vercel.app").replace(/\/$/, ""),
  locale: "es-ES",
  city: "Barakaldo",
  region: "Bizkaia",
  country: "España",
  // Testing number provided by the site owner — replace with the definitive
  // business line before going to production.
  whatsapp: "34628409781",
  // El buzón tiene que existir antes de abrir: sale en el aviso legal y en
  // Nosotros. Se cambia con NEXT_PUBLIC_CONTACT_EMAIL al tener el dominio.
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hola@nutriyuly.com",
  // Atención por WhatsApp y recogida en el local (hora de Madrid). No hay
  // envíos a domicilio: todos los pedidos se recogen en el local.
  horario: {
    apertura: "09:00",
    cierre: "19:00",
    cerrado: [0], // 0 = domingo
    texto: "de lunes a sábado, de 9:00 a 19:00",
  },
} as const;

// Titular de la tienda (aviso legal, privacidad y condiciones). Lo exige la
// LSSI (art. 10) y la ley de consumidores (art. 97 TRLGDCU) antes de vender.
// Los campos a null se muestran como «pendiente» en las páginas legales:
// hay que rellenarlos con los datos reales antes de abrir al público.
export const LEGAL = {
  titular: null as string | null, // nombre y apellidos o razón social
  nif: null as string | null,
  domicilio: null as string | null, // dirección del local (también es la de recogida)
  registro: null as string | null, // solo si es sociedad: Registro Mercantil, tomo, folio…
  email: SITE.email,
  emailPrivacidad: SITE.email,
  telefono: null as string | null, // teléfono de atención (puede ser el de WhatsApp)
  actualizado: "7 de octubre de 2026",
} as const;

export const PENDIENTE = "[pendiente de completar]";

// ¿Estamos atendiendo ahora mismo? (hora de Madrid, sea cual sea la del
// visitante).
export function atendiendoAhora(now = new Date()): boolean {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value])
  );
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  const hora = `${p.hour}:${p.minute}`;
  const { apertura, cierre, cerrado } = SITE.horario;
  return !(cerrado as readonly number[]).includes(dia) && hora >= apertura && hora < cierre;
}

// Enlace de WhatsApp con el mensaje ya escrito. Va directo a
// api.whatsapp.com y no a wa.me: la redirección de wa.me cambia cada emoji
// por «�» (comprobado: 👋 llega como %EF%BF%BD) y el resumen del pedido
// llegaba lleno de símbolos rotos.
export function waUrl(telefono: string, texto?: string): string {
  return `https://api.whatsapp.com/send?phone=${telefono}${texto ? `&text=${encodeURIComponent(texto)}` : ""}`;
}

export function waLink(message: string): string {
  return waUrl(SITE.whatsapp, message);
}

export const WA_PRESETS = {
  general:
    "Hola, buenos días. He visitado vuestra web y me gustaría conocer mejor los productos Amway que ofrecéis. " +
    "¿Podríais orientarme sobre cuáles se adaptan mejor a lo que busco? Muchas gracias.",
  info:
    "Hola, me gustaría recibir información más detallada: características, modo de uso, precios " +
    "y condiciones de entrega. ¿Me podéis ayudar? Gracias.",
  order:
    "Hola, me gustaría realizar un pedido. ¿Podríais indicarme los pasos a seguir, las formas de pago " +
    "disponibles y el plazo de entrega en mi zona? Gracias.",
  availability:
    "Hola, quería consultar la disponibilidad actual de un producto y el plazo aproximado de entrega. " +
    "¿Me podéis confirmar si lo tenéis en stock? Gracias.",
} as const;

export function waProductLink(productName: string): string {
  return waLink(
    `Hola, estoy interesado/a en "${productName}". ¿Podríais darme más información sobre ` +
      `sus beneficios, modo de uso, precio y disponibilidad? Muchas gracias.`,
  );
}
