import { PRODUCTS, getProductById } from "@/data/products";
import { productImageSrc, type Product } from "@/data/types";

// Las líneas de pedido guardan el id y el nombre del producto en el momento de
// la compra. Si el catálogo cambió después (producto renombrado o retirado),
// el id ya no existe: se busca por nombre para seguir mostrando su foto.

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[™®©]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const PALABRAS_VACIAS = new Set(["de", "del", "la", "el", "los", "las", "para", "con", "y", "en", "a"]);
const palabras = (s: string) => norm(s).split(" ").filter((w) => w.length > 1 && !PALABRAS_VACIAS.has(w));

const porNombre = new Map(PRODUCTS.map((p) => [norm(p.name), p]));
const cache = new Map<string, Product | null>();

function buscarPorNombre(nombre: string): Product | null {
  const n = norm(nombre);
  if (cache.has(n)) return cache.get(n)!;
  let hit = porNombre.get(n) ?? null;
  if (!hit) {
    // Coincidencia aproximada: la mayoría de palabras del nombre comprado.
    const ws = palabras(nombre);
    let mejor = 0;
    for (const p of PRODUCTS) {
      const pw = new Set(palabras(p.name));
      const comunes = ws.filter((w) => pw.has(w)).length;
      const score = comunes / Math.max(ws.length, pw.size);
      if (score > mejor) {
        mejor = score;
        hit = p;
      }
    }
    if (mejor < 0.6) hit = null;
  }
  cache.set(n, hit);
  return hit;
}

// Ids del catálogo anterior que ya no existen y cuyo nombre no se parece lo
// bastante al actual: se apuntan a su equivalente para mantener la foto.
const IDS_RETIRADOS: Record<string, string> = {
  "batidos-todo-en-uno": "bodykey-batido",
  "paquete-perfecto": "trio-fundamental-double-x",
  "multivitaminico-hombres": "double-x",
  "multivitaminico-mujeres": "double-x",
  "multigomitas-hombres": "double-x",
  "omega-avanzado": "omega-nutrilite",
  "proteina-vegetal-polvo": "proteina-vegetal",
  "equinacea": "conjunto-vitaminas-inmunidad",
  "protegete-gomitas": "conjunto-vitaminas-inmunidad",
  "xs-energy-drink": "xs-power-drink-naranja",
};

export function productoDeItem(i: { product_id: string | null; nombre: string }): Product | undefined {
  const id = i.product_id ? (IDS_RETIRADOS[i.product_id] ?? i.product_id) : null;
  return (id ? getProductById(id) : undefined) ?? buscarPorNombre(i.nombre) ?? undefined;
}

export function imagenDeItem(i: { product_id: string | null; nombre: string }): string | null {
  const p = productoDeItem(i);
  return p ? productImageSrc(p) : null;
}

// Sin foto: iniciales del producto sobre un color estable, para distinguirlos
// de un vistazo en vez de ver la misma caja repetida.
const TONOS = ["#e7ddc8", "#d8e4dc", "#e9d6cf", "#d9dfe8", "#ece2c4", "#e2d8e6"];

export function inicialesItem(nombre: string): { texto: string; fondo: string } {
  const ws = palabras(nombre).filter((w) => !/^\d/.test(w));
  const texto = (ws.length >= 2 ? ws[0][0] + ws[1][0] : (ws[0] ?? nombre).slice(0, 2)).toUpperCase();
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { texto, fondo: TONOS[h % TONOS.length] };
}
