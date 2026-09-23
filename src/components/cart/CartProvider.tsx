"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getProductById } from "@/data/products";
import { variantPriceEur } from "@/data/types";

// Same shape of logic as the Arrantza basket (localStorage-backed, cross-tab
// sync, "just added" flash, version counter for the header bump), but with
// its own storage key so the two shops can never read each other's basket.
const STORAGE_KEY = "amway_premium_cesta_v1";
export const MAX_QUANTITY_PER_LINE = 20;

export interface CestaItem {
  productId: string;
  variantIndex: number;
  flavor: string;
  quantity: number;
}

export function cestaItemKey(item: Pick<CestaItem, "productId" | "variantIndex" | "flavor">): string {
  return `${item.productId}|${item.variantIndex}|${item.flavor}`;
}

// Drops anything the catalogue no longer sells at a fixed price, so a stale
// basket from an older deploy never reaches checkout with a missing product.
function sanitize(raw: unknown): CestaItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CestaItem[] = [];
  for (const i of raw) {
    if (!i || typeof i.productId !== "string") continue;
    const product = getProductById(i.productId);
    const variantIndex = Number.isInteger(i.variantIndex) ? i.variantIndex : 0;
    if (!product || variantPriceEur(product, variantIndex) == null) continue;
    const quantity = Number.isInteger(i.quantity) ? i.quantity : 1;
    out.push({
      productId: i.productId,
      variantIndex,
      flavor: typeof i.flavor === "string" ? i.flavor.slice(0, 80) : "",
      quantity: Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, quantity)),
    });
  }
  return out;
}

function readStorage(): CestaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: CestaItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // private mode / quota: the basket still works for this page view
  }
}

interface CestaContextValue {
  items: CestaItem[];
  isLoaded: boolean;
  isOpen: boolean;
  openCesta: () => void;
  closeCesta: () => void;
  addItem: (productId: string, variantIndex?: number, flavor?: string) => void;
  increase: (key: string) => void;
  decrease: (key: string) => void;
  removeItem: (key: string) => void;
  clearCesta: () => void;
  totalUnits: number;
  subtotal: number;
  justAddedKey: string | null;
  cestaVersion: number;
}

const CestaContext = createContext<CestaContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CestaItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const [cestaVersion, setCestaVersion] = useState(0);
  const justAddedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read after mount (never during render) to avoid hydration mismatches.
  useEffect(() => {
    setItems(readStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) writeStorage(items);
  }, [items, isLoaded]);

  // Live sync between tabs, and re-read when Safari restores the page from
  // its back/forward cache (e.g. coming back from Stripe Checkout).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => () => {
    if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
  }, []);

  const addItem = useCallback((productId: string, variantIndex = 0, flavor = "") => {
    const key = cestaItemKey({ productId, variantIndex, flavor });
    setItems((prev) => {
      const existing = prev.find((i) => cestaItemKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          cestaItemKey(i) === key ? { ...i, quantity: Math.min(MAX_QUANTITY_PER_LINE, i.quantity + 1) } : i
        );
      }
      return [...prev, { productId, variantIndex, flavor, quantity: 1 }];
    });
    setJustAddedKey(key);
    if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
    justAddedTimer.current = setTimeout(() => setJustAddedKey(null), 1600);
    setCestaVersion((v) => v + 1);
  }, []);

  const increase = useCallback((key: string) => {
    setItems((prev) =>
      prev.map((i) =>
        cestaItemKey(i) === key ? { ...i, quantity: Math.min(MAX_QUANTITY_PER_LINE, i.quantity + 1) } : i
      )
    );
  }, []);

  const decrease = useCallback((key: string) => {
    setItems((prev) =>
      prev.map((i) => (cestaItemKey(i) === key && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => cestaItemKey(i) !== key));
  }, []);

  const clearCesta = useCallback(() => setItems([]), []);
  const openCesta = useCallback(() => setIsOpen(true), []);
  const closeCesta = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CestaContextValue>(() => {
    let totalUnits = 0;
    let subtotal = 0;
    for (const i of items) {
      const product = getProductById(i.productId);
      const price = product ? variantPriceEur(product, i.variantIndex) : null;
      totalUnits += i.quantity;
      if (price != null) subtotal += price * i.quantity;
    }
    return {
      items,
      isLoaded,
      isOpen,
      openCesta,
      closeCesta,
      addItem,
      increase,
      decrease,
      removeItem,
      clearCesta,
      totalUnits,
      subtotal,
      justAddedKey,
      cestaVersion,
    };
  }, [items, isLoaded, isOpen, openCesta, closeCesta, addItem, increase, decrease, removeItem, clearCesta, justAddedKey, cestaVersion]);

  return <CestaContext.Provider value={value}>{children}</CestaContext.Provider>;
}

export function useCesta(): CestaContextValue {
  const ctx = useContext(CestaContext);
  if (!ctx) throw new Error("useCesta must be used inside <CartProvider>");
  return ctx;
}
