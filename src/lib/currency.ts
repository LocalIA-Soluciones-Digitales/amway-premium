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
