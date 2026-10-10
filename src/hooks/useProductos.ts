import { useEffect, useState } from "react";

// El catálogo completo (315 productos con sus descripciones) pesa demasiado
// para cargarlo en cada visita: lo que lo necesita en el navegador (la cesta
// con productos, el asistente al buscar) lo pide con esto al hacer falta, y
// se descarga una sola vez.
type Productos = typeof import("@/data/products");

let modulo: Productos | null = null;
let promesa: Promise<Productos> | null = null;

export function cargarProductos(): Promise<Productos> {
  promesa ??= import("@/data/products").then((m) => (modulo = m));
  return promesa;
}

// null hasta que llega el catálogo; con `activo` a false no lo pide.
export function useProductos(activo = true): Productos | null {
  const [productos, setProductos] = useState<Productos | null>(modulo);

  useEffect(() => {
    if (!activo || productos) return;
    let vivo = true;
    void cargarProductos().then((m) => vivo && setProductos(m));
    return () => {
      vivo = false;
    };
  }, [activo, productos]);

  return productos;
}
