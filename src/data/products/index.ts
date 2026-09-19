import type { CategorySlug, Product } from "../types";
import { nutricionProducts } from "./nutricion";
import { xsEnergyProducts } from "./xs-energy";
import { bellezaProducts } from "./belleza";
import { hogarProducts } from "./hogar";

export const PRODUCTS: Product[] = [
  ...nutricionProducts,
  ...xsEnergyProducts,
  ...bellezaProducts,
  ...hogarProducts,
];

export function getProductsByCategory(category: CategorySlug): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getSubcategories(category: CategorySlug): string[] {
  const set = new Set<string>();
  for (const p of PRODUCTS) {
    if (p.category === category) set.add(p.subcategory);
  }
  return Array.from(set);
}

export function getBrands(category?: CategorySlug): string[] {
  const set = new Set<string>();
  for (const p of PRODUCTS) {
    if (!category || p.category === category) set.add(p.brand);
  }
  return Array.from(set);
}

export function getFlagshipProducts(): Product[] {
  return PRODUCTS.filter((p) => p.flagship);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

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
    tagline: "Artistry, Satinique y g&h: ciencia de la piel y el cabello.",
    href: "/belleza",
    accent: "gold",
  },
  hogar: {
    label: "Hogar",
    tagline: "Agua, aire y cocina más limpios con eSpring, Atmosphere e iCook.",
    href: "/hogar",
    accent: "tech",
  },
};

export * from "../types";
export { nutricionProducts, xsEnergyProducts, bellezaProducts, hogarProducts };
