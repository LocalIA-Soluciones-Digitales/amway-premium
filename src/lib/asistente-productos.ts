import { PRODUCTS } from "@/data/products";
import { VACIAS, encajaRaiz, normalizar } from "@/data/asistente";
import type { Product } from "@/data/types";

// Búsqueda de productos del asistente: encuentra por nombre o marca lo que
// el cliente escribe («¿tenéis Double X?», «vitamina c», «purificadr»).

// Palabras de la pregunta que no dicen nada del producto («¿tenéis stock
// del purificador?» → solo cuenta «purificador»).
const RUIDO = new Set(
  (
    "teneis tienes hay queda quedan stock disponible disponibles precio precios cuanto cuesta cuestan vale valen " +
    "quiero querria busco buscando necesito comprar pedir pedido producto productos amway info informacion " +
    "sobre tambien algun alguna algo hola buenas gracias puedo podeis ver"
  ).split(" ")
);

interface Indexado {
  producto: Product;
  nombre: string[];
  resto: string[];
}

let indice: Indexado[] | null = null;

function indexar(): Indexado[] {
  indice ??= PRODUCTS.map((producto) => ({
    producto,
    nombre: normalizar(`${producto.name} ${producto.brand}`).split(" "),
    resto: normalizar(`${producto.subcategory} ${producto.description}`).split(" ").filter((p) => p.length > 3),
  }));
  return indice;
}

export interface ProductoEncontrado {
  producto: Product;
  puntos: number;
}

/**
 * Productos que encajan con la pregunta. Cada palabra puntúa 3 si aparece en
 * el nombre o la marca y 1 si solo aparece en la descripción; hace falta al
 * menos una coincidencia en el nombre para que un producto cuente.
 */
export function buscarProductos(texto: string, visible: (id: string) => boolean, max = 3): ProductoEncontrado[] {
  // Aquí sí cuentan las letras sueltas («vitamina C», «vitamina D»), pero
  // solo como palabra exacta del nombre.
  const palabras = normalizar(texto)
    .split(" ")
    .filter((p) => p && !VACIAS.has(p) && !RUIDO.has(p));
  if (!palabras.some((p) => p.length > 1)) return [];

  const resultados: ProductoEncontrado[] = [];
  for (const { producto, nombre, resto } of indexar()) {
    if (!visible(producto.id)) continue;
    let puntos = 0;
    let enNombre = 0;
    for (const p of palabras) {
      const n =
        p.length === 1
          ? Number(nombre.includes(p))
          : Math.max(0, ...nombre.map((w) => encajaRaiz(w, p, 7)));
      if (n > 0) {
        puntos += 3 * n;
        enNombre++;
      } else if (p.length > 3 && resto.some((w) => w.startsWith(p))) {
        puntos += 1;
      }
    }
    if (enNombre > 0) resultados.push({ producto, puntos: puntos + enNombre / palabras.length });
  }

  resultados.sort((a, b) => b.puntos - a.puntos);
  // Solo los que están a la altura del mejor: «purificador eSpring» no debe
  // arrastrar todo lo que contenga «agua».
  const tope = resultados[0]?.puntos ?? 0;
  return resultados.filter((r) => r.puntos >= tope * 0.6).slice(0, max);
}

/**
 * Texto para /catalogo?q=…: el buscador del catálogo exige que aparezcan
 * todas las palabras, así que solo se pasan las de la pregunta que están
 * tal cual en los productos encontrados (sin «tenéis», «precio», erratas…).
 */
export function consultaCatalogo(texto: string, encontrados: Product[]): string {
  const textos = encontrados.map((p) => normalizar(`${p.name} ${p.brand} ${p.subcategory} ${p.description}`));
  const utiles = normalizar(texto)
    .split(" ")
    .filter((w) => w.length > 1 && !VACIAS.has(w) && !RUIDO.has(w) && textos.some((t) => t.includes(w)));
  return utiles.length > 0 ? utiles.join(" ") : (encontrados[0]?.name ?? "");
}
