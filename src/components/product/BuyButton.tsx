"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export function BuyButton({
  productId,
  className,
  label = "Comprar",
}: {
  productId: string;
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "No se pudo iniciar el pago.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("No se pudo conectar con el servidor de pago.");
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label="Comprar ahora con tarjeta"
        className={
          className ??
          "flex h-9 items-center gap-1.5 rounded-full bg-carbon px-3 text-xs font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
        }
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
        {label}
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-2 w-48 rounded-lg bg-carbon p-2 text-[11px] leading-snug text-cream/70 shadow-lg ring-1 ring-white/10">
          {error}
        </p>
      )}
    </div>
  );
}
