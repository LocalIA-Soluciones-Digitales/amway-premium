import { inCategory, type CategorySlug, type Product } from "../types";
import { nutricionProducts } from "./nutricion";
import { xsEnergyProducts } from "./xs-energy";
import { bellezaProducts } from "./belleza";
import { hogarProducts } from "./hogar";
import { cuidadoPersonalProducts } from "./cuidado-personal";

export const PRODUCTS: Product[] = [
  ...nutricionProducts,
  ...xsEnergyProducts,
  ...bellezaProducts,
  ...cuidadoPersonalProducts,
  ...hogarProducts,
];

export function getProductsByCategory(category: CategorySlug): Product[] {
  return PRODUCTS.filter((p) => inCategory(p, category));
}

export function getSubcategories(category: CategorySlug): string[] {
  const set = new Set<string>();
  for (const p of PRODUCTS) {
    if (inCategory(p, category)) set.add(p.subcategory);
  }
  return Array.from(set);
}

export function getBrands(category?: CategorySlug): string[] {
  const set = new Set<string>();
  for (const p of PRODUCTS) {
    if (!category || inCategory(p, category)) set.add(p.brand);
  }
  return Array.from(set);
}

export function getFlagshipProducts(): Product[] {
  return PRODUCTS.filter((p) => p.flagship);
}

export function getEspringProducts(): Product[] {
  return hogarProducts.filter((p) => p.brand === "eSpring");
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

// En un módulo aparte para que lo que solo necesita las categorías no
// cargue los 315 productos en el navegador.
export { CATEGORY_META } from "../categorias";

export * from "../types";
export { nutricionProducts, xsEnergyProducts, bellezaProducts, cuidadoPersonalProducts, hogarProducts };
