import { usdToEur, formatEUR } from "@/lib/currency";

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
  const min = usdToEur(Math.min(...prices));
  const max = usdToEur(Math.max(...prices));
  return min === max ? formatEUR(min) : `Desde ${formatEUR(min)}`;
}

// A product can go straight to Stripe Checkout only when its price is
// unambiguous (a single variant) — anything else needs a human to confirm
// which size/flavour before charging a card.
export function directCheckoutPrice(p: Product): number | null {
  if (p.variants.length !== 1) return null;
  const price = p.variants[0].price;
  if (price == null) return null;
  return usdToEur(price);
}
