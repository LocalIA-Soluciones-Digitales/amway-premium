export type CategorySlug = "nutricion" | "xs-energy" | "belleza" | "hogar";

export type FlagshipKey =
  | "xs-energy"
  | "espring"
  | "atmosphere"
  | "nutrilite"
  | "artistry"
  | "icook";

export interface ProductVariant {
  sku?: string;
  size: string;
  price: number | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategorySlug;
  subcategory: string;
  description: string;
  variants: ProductVariant[];
  image?: string;
  badge?: string;
  flagship?: FlagshipKey;
  page: number;
}

export function priceFrom(p: Product): number | null {
  const prices = p.variants.map((v) => v.price).filter((x): x is number => x != null);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function priceRangeLabel(p: Product): string {
  const prices = p.variants.map((v) => v.price).filter((x): x is number => x != null);
  if (prices.length === 0) return "Consultar precio";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(n);
  return min === max ? fmt(min) : `Desde ${fmt(min)}`;
}
