import type { CategorySlug } from "./types";

// Rótulos y enlaces de cada categoría. Sin productos: lo importan la cabecera,
// el asistente y el catálogo, que no deben arrastrar todo el catálogo.
export const CATEGORY_META: Record<
  CategorySlug,
  { label: string; tagline: string; href: string; accent: string }
> = {
  nutricion: {
    label: "Nutrición",
    tagline: "Vitaminas, proteínas e inmunidad basadas en la ciencia de las plantas.",
    href: "/nutricion",
    accent: "forest",
  },
  "xs-energy": {
    label: "XS Energy",
    tagline: "Energía, fuerza y recuperación para tu mejor rendimiento.",
    href: "/xs-energy",
    accent: "xs",
  },
  belleza: {
    label: "Belleza",
    tagline: "Artistry™: cuidado de la piel y maquillaje.",
    href: "/belleza",
    accent: "gold",
  },
  "cuidado-personal": {
    label: "Cuidado personal",
    tagline: "Satinique™, g&h™ y glister™: cabello, cuerpo e higiene bucal.",
    href: "/cuidado-personal",
    accent: "gold",
  },
  hogar: {
    label: "Hogar",
    tagline: "Agua, aire y cocina más limpios con eSpring, Atmosphere e iCook.",
    href: "/hogar",
    accent: "tech",
  },
};
