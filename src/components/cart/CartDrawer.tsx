"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import { CreditCard, Loader2, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { getProductById } from "@/data/products";
import { productImageSrc, variantPriceEur } from "@/data/types";
import { waLink } from "@/data/site-config";
import { formatEUR } from "@/lib/currency";
import { cestaItemKey, MAX_QUANTITY_PER_LINE, useCesta, type CestaItem } from "./CartProvider";

function lineDetails(item: CestaItem) {
  const product = getProductById(item.productId);
  if (!product) return null;
  const variant = product.variants[item.variantIndex];
  const price = variantPriceEur(product, item.variantIndex);
  if (!variant || price == null) return null;
  return { product, variant, price };
}

function whatsappOrderMessage(items: CestaItem[], subtotal: number): string {
  const lines = items.flatMap((item) => {
    const d = lineDetails(item);
    if (!d) return [];
    const detail = [d.variant.size, item.flavor].filter(Boolean).join(" · ");
    return [`• ${item.quantity} × ${d.product.name} (${detail}) — ${formatEUR(d.price * item.quantity)}`];
  });
  return `Hola, quiero hacer este pedido:\n${lines.join("\n")}\n\nTotal: ${formatEUR(subtotal)}`;
}

export function CartDrawer() {
  const { items, isOpen, closeCesta, increase, decrease, removeItem, totalUnits, subtotal } = useCesta();
  const lenis = useLenis();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCesta();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, lenis, closeCesta]);

  useEffect(() => {
    if (!isOpen) setError(null);
  }, [isOpen]);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ productId, variantIndex, flavor, quantity }) => ({
            productId,
            variantIndex,
            flavor,
            quantity,
          })),
        }),
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
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Tu cesta">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeCesta}
            className="absolute inset-0 bg-carbon/40 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream-soft shadow-[-20px_0_60px_rgba(28,26,22,0.18)]"
          >
            <header className="flex items-center justify-between border-b border-carbon/10 px-6 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone">Tu pedido</p>
                <h2 className="font-display text-2xl text-carbon">
                  Cesta
                  {totalUnits > 0 && <span className="ml-2 text-base text-stone">({totalUnits})</span>}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCesta}
                aria-label="Cerrar cesta"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-carbon/15 text-carbon transition hover:bg-carbon/5"
              >
                <X size={18} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linen text-stone">
                  <ShoppingBag size={24} />
                </div>
                <p className="mt-5 font-display text-xl text-carbon">Tu cesta está vacía</p>
                <p className="mt-2 text-sm text-stone">Añade productos desde el catálogo para pagarlos de una vez.</p>
                <Link
                  href="/catalogo"
                  onClick={closeCesta}
                  className="mt-7 rounded-full bg-carbon px-6 py-3 text-sm font-medium text-cream transition hover:bg-carbon-soft"
                >
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <>
                <ul data-lenis-prevent className="flex-1 divide-y divide-carbon/8 overflow-y-auto overscroll-contain px-6">
                  {items.map((item) => {
                    const d = lineDetails(item);
                    if (!d) return null;
                    const key = cestaItemKey(item);
                    const src = productImageSrc(d.product);
                    return (
                      <li key={key} className="flex gap-4 py-5">
                        <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-linen">
                          {src && (
                            <Image src={src} alt={d.product.name} fill sizes="80px" className="object-contain p-2" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wider text-stone">{d.product.brand}</p>
                              <p className="line-clamp-2 font-display text-base leading-snug text-carbon">
                                {d.product.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-stone">
                                {[d.variant.size, item.flavor].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(key)}
                              aria-label={`Quitar ${d.product.name} de la cesta`}
                              className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-carbon/5 hover:text-carbon"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center rounded-full border border-carbon/15">
                              <button
                                type="button"
                                onClick={() => decrease(key)}
                                disabled={item.quantity <= 1}
                                aria-label="Quitar una unidad"
                                className="flex h-8 w-8 items-center justify-center text-carbon transition disabled:opacity-30"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-6 text-center text-sm tabular-nums text-carbon">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => increase(key)}
                                disabled={item.quantity >= MAX_QUANTITY_PER_LINE}
                                aria-label="Añadir una unidad"
                                className="flex h-8 w-8 items-center justify-center text-carbon transition disabled:opacity-30"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <span className="text-sm font-medium tabular-nums text-carbon">
                              {formatEUR(d.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <footer className="border-t border-carbon/10 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-stone">Subtotal</span>
                    <span className="font-display text-2xl tabular-nums text-carbon">{formatEUR(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone">Te confirmamos el envío por WhatsApp tras el pago.</p>

                  {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-carbon/5 px-3 py-2 text-xs leading-snug text-carbon">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={checkout}
                    disabled={loading}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    Pagar con tarjeta
                  </button>
                  <a
                    href={waLink(whatsappOrderMessage(items, subtotal))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-carbon/15 text-sm font-medium text-carbon transition hover:border-forest/30 hover:bg-forest hover:text-cream"
                  >
                    <MessageCircle size={16} />
                    Pedir por WhatsApp
                  </a>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
