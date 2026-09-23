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

// EUR price of one specific variant (size/format), or null when that variant
// has no published price and has to be quoted by WhatsApp.
export function variantPriceEur(p: Product, variantIndex: number): number | null {
  const price = p.variants[variantIndex]?.price;
  return price == null ? null : usdToEur(price);
}

// Index of the cheapest priced variant — the one a card preselects so the
// price it shows matches the "Desde …" sorting of the catalogue.
export function cheapestVariantIndex(p: Product): number {
  let best = 0;
  p.variants.forEach((v, i) => {
    const current = p.variants[best].price;
    if (v.price != null && (current == null || v.price < current)) best = i;
  });
  return best;
}

export function productImageSrc(p: Product): string | null {
  if (!p.image) return null;
  return p.image.includes("/") ? `/images/${p.image}` : `/images/catalog/${p.image}`;
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
