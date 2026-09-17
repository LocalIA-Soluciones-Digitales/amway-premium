// Catalog prices are sourced in USD from the official Amway US catalog.
// Converted to EUR at the market rate (no import/customs/shipping margin
// added — that's a separate business decision, not a currency conversion).
// Source: Frankfurter/ECB reference rate, 2026-09-17.
export const USD_TO_EUR_RATE = 0.871;

export function usdToEur(usd: number): number {
  return usd * USD_TO_EUR_RATE;
}

export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Stripe expects the smallest currency unit (cents for EUR).
export function eurToCents(eur: number): number {
  return Math.round(eur * 100);
}
