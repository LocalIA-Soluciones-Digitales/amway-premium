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
  general: "Hola, estoy interesado en vuestros productos Amway.",
  info: "Hola, quiero recibir más información sobre este producto.",
  order: "Hola, quiero realizar un pedido.",
  availability: "Hola, ¿está disponible este producto?",
} as const;

export function waProductLink(productName: string): string {
  return waLink(`Hola, estoy interesado en "${productName}". ¿Me dais más información?`);
}
