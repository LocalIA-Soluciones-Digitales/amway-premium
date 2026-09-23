"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/data/types";
import {
  CATALOGO_VACIO,
  estaAgotado,
  estaOculto,
  fetchCatalogoPublico,
  indexCatalogo,
  precioVenta,
  type CatalogoPublico,
  type Valoracion,
} from "@/lib/catalog-state";

interface CatalogStateValue {
  precio: (product: Product, variantIndex: number) => number | null;
  agotado: (productId: string) => boolean;
  oculto: (productId: string) => boolean;
  valoracion: (productId: string) => Valoracion | undefined;
  refrescar: () => Promise<void>;
}

const CatalogStateContext = createContext<CatalogStateValue | null>(null);

// Recibe del layout los ajustes ya leídos en el servidor (sin parpadeo de
// precios) y los refresca al montar, por si la página venía de caché.
export function CatalogStateProvider({ initial, children }: { initial: CatalogoPublico; children: ReactNode }) {
  const [data, setData] = useState(initial);

  const refrescar = useCallback(async () => {
    const fresh = await fetchCatalogoPublico({ cache: "no-store" });
    // A failed fetch returns the shared empty object: keep what we had.
    if (fresh !== CATALOGO_VACIO) setData(fresh);
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const value = useMemo<CatalogStateValue>(() => {
    const index = indexCatalogo(data);
    return {
      precio: (product, variantIndex) => precioVenta(index, product, variantIndex),
      agotado: (id) => estaAgotado(index, id),
      oculto: (id) => estaOculto(index, id),
      valoracion: (id) => index.valoracion(id),
      refrescar,
    };
  }, [data, refrescar]);

  return <CatalogStateContext.Provider value={value}>{children}</CatalogStateContext.Provider>;
}

export function useCatalogState(): CatalogStateValue {
  const ctx = useContext(CatalogStateContext);
  if (!ctx) throw new Error("useCatalogState must be used inside <CatalogStateProvider>");
  return ctx;
}
