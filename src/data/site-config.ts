export const SITE = {
  name: "Amway Barakaldo",
  legalNote:
    "Distribuidor independiente de productos originales Amway, importados de Estados Unidos.",
  url: "https://amwaybarakaldo.es",
  locale: "es-ES",
  city: "Barakaldo",
  region: "Bizkaia",
  country: "España",
  // Testing number provided by the site owner — replace with the definitive
  // business line before going to production.
  whatsapp: "34628409781",
  email: "hola@amwaybarakaldo.es",
} as const;

export function waLink(message: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
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
