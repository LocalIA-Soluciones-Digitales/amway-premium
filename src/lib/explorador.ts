import type { Product } from "@/data/types";

const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Productos tal y como los recibe <ProductExplorer> (componente de cliente):
// la descripción solo le sirve al buscador, que comprueba si cada palabra
// buscada aparece en el texto. Basta con sus palabras sin repetir, que dan
// exactamente los mismos resultados y pesan mucho menos en el HTML (la
// descripción entera eran ~140 KB por página de catálogo).
export function paraExplorador(products: Product[]): Product[] {
  return products.map((p) => ({
    ...p,
    description: Array.from(new Set(normalizar(p.description).split(/\s+/).filter(Boolean))).join(" "),
  }));
}
