// Lee el formato de venta de cada producto («12 latas de 250 ml», «60
// comprimidos», «750 ml», «4 × 250 g»…) para enseñarlo de forma visual y
// calcular el precio por unidad (€/lata, €/l, €/kg), que es lo que de verdad
// sirve para comparar. Lo que no encaja en ningún patrón («1 conjunto»,
// «15/30 ml») se enseña tal cual, sin cálculos.

export type Envase =
  | "lata"
  | "cápsula"
  | "comprimido"
  | "sobre"
  | "barrita"
  | "perla"
  | "tableta"
  | "pieza"
  | "unidad"
  | "dosis"
  | "toallita"
  | "gominola"
  | "mascarilla";

type Medida = "ml" | "g";

export interface Formato {
  /** Unidades del paquete (12 latas, 60 comprimidos); 1 si es un solo envase. */
  cantidad: number;
  /** Tipo de unidad, si el texto lo dice. */
  envase: Envase | null;
  /** Contenido de cada unidad, en ml o g. */
  contenido: { valor: number; medida: Medida } | null;
}

const ENVASES: [RegExp, Envase][] = [
  [/^latas?$/, "lata"],
  [/^c[aá]psulas?$/, "cápsula"],
  [/^comprimidos?$/, "comprimido"],
  [/^sobres?$/, "sobre"],
  [/^barritas?$/, "barrita"],
  [/^perlas?$/, "perla"],
  [/^tabletas?$/, "tableta"],
  [/^piezas?$/, "pieza"],
  [/^(unidad(es)?|uds?\.?)$/, "unidad"],
  [/^dosis$/, "dosis"],
  [/^toallitas?$/, "toallita"],
  [/^gominolas?$/, "gominola"],
  [/^mascarillas?$/, "mascarilla"],
];

const PLURAL: Record<Envase, string> = {
  lata: "latas",
  cápsula: "cápsulas",
  comprimido: "comprimidos",
  sobre: "sobres",
  barrita: "barritas",
  perla: "perlas",
  tableta: "tabletas",
  pieza: "piezas",
  unidad: "unidades",
  dosis: "dosis",
  toallita: "toallitas",
  gominola: "gominolas",
  mascarilla: "mascarillas",
};

// «cada una» / «cada uno» según el género de la unidad.
const FEMENINO = new Set<Envase>([
  "lata",
  "cápsula",
  "barrita",
  "perla",
  "tableta",
  "pieza",
  "unidad",
  "dosis",
  "toallita",
  "gominola",
  "mascarilla",
]);

function envaseDe(palabra: string | undefined): Envase | null {
  if (!palabra) return null;
  const p = palabra.toLowerCase();
  return ENVASES.find(([re]) => re.test(p))?.[1] ?? null;
}

function numero(texto: string): number {
  return Number(texto.replace(",", "."));
}

// Todo a ml o g para poder sumar y dividir.
function contenidoDe(valor: string, unidad: string): Formato["contenido"] {
  const v = numero(valor);
  if (!Number.isFinite(v) || v <= 0) return null;
  switch (unidad.toLowerCase()) {
    case "ml":
      return { valor: v, medida: "ml" };
    case "cl":
      return { valor: v * 10, medida: "ml" };
    case "l":
      return { valor: v * 1000, medida: "ml" };
    case "g":
      return { valor: v, medida: "g" };
    case "kg":
      return { valor: v * 1000, medida: "g" };
    default:
      return null;
  }
}

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const UNIDAD = String.raw`(ml|cl|l|g|kg)`;

export function leerFormato(size: string): Formato | null {
  const t = size.trim().replace(/\s+/g, " ");

  // «12 latas de 250 ml», «12 × 250 ml», «14 barritas x 50 g cada una / 700 g»
  let m = t.match(new RegExp(String.raw`^(\d+) ?([a-záéíóú.]+)? ?(?:de|×|x) ?${NUM} ?${UNIDAD}(?: cada .*)?$`, "i"));
  if (m) {
    const contenido = contenidoDe(m[3], m[4]);
    const cantidad = Number(m[1]);
    if (contenido && cantidad > 0) return { cantidad, envase: envaseDe(m[2]), contenido };
  }

  // «750 ml», «1 l», «50 g»
  m = t.match(new RegExp(String.raw`^${NUM} ?${UNIDAD}$`, "i"));
  if (m) {
    const contenido = contenidoDe(m[1], m[2]);
    if (contenido) return { cantidad: 1, envase: null, contenido };
  }

  // «60 comprimidos», «30 sobres», «14 barritas», «1 unidad»
  m = t.match(/^(\d+) ([a-záéíóú.]+)$/i);
  if (m) {
    const envase = envaseDe(m[2]);
    if (envase) return { cantidad: Number(m[1]), envase, contenido: null };
  }

  // «2 × 90 comprimidos» (dos botes)
  m = t.match(/^(\d+) ?[×x] ?(\d+) ([a-záéíóú.]+)$/i);
  if (m) {
    const envase = envaseDe(m[3]);
    if (envase) return { cantidad: Number(m[1]) * Number(m[2]), envase, contenido: null };
  }

  // «5 mascarillas (22 ml cada una)»
  m = t.match(new RegExp(String.raw`^(\d+) ([a-záéíóú]+) \(${NUM} ?${UNIDAD}[^)]*\)$`, "i"));
  if (m) {
    const envase = envaseDe(m[2]);
    const contenido = contenidoDe(m[3], m[4]);
    if (envase && contenido) return { cantidad: Number(m[1]), envase, contenido };
  }

  // «sobre (68,2 g); 14 sobres/caja»
  m = t.match(new RegExp(String.raw`\(${NUM} ?${UNIDAD}\).*?(\d+) ([a-záéíóú]+)`, "i"));
  if (m) {
    const contenido = contenidoDe(m[1], m[2]);
    const envase = envaseDe(m[4]);
    if (contenido && envase) return { cantidad: Number(m[3]), envase, contenido };
  }

  return null;
}

const NUMERO = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const EUROS = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

// 250 ml, 1,5 l, 750 g, 1 kg
export function medidaTexto({ valor, medida }: { valor: number; medida: Medida }): string {
  if (medida === "ml") return valor >= 1000 ? `${NUMERO.format(valor / 1000)} l` : `${NUMERO.format(valor)} ml`;
  return valor >= 1000 ? `${NUMERO.format(valor / 1000)} kg` : `${NUMERO.format(valor)} g`;
}

export function unidadesTexto(f: Formato): string | null {
  if (f.cantidad <= 1 && f.contenido) return null;
  const envase = f.envase ?? "unidad";
  return `${NUMERO.format(f.cantidad)} ${f.cantidad === 1 ? envase : PLURAL[envase]}`;
}

/** Lo que se enseña en grande: «12 latas», «60 comprimidos», «750 ml». */
export function formatoTitulo(f: Formato): string {
  return unidadesTexto(f) ?? medidaTexto(f.contenido!);
}

/** La línea de detalle: «de 250 ml cada una · 3 l en total». */
export function formatoDetalle(f: Formato): string | null {
  if (f.cantidad <= 1 || !f.contenido) return null;
  const cada = FEMENINO.has(f.envase ?? "unidad") ? "cada una" : "cada uno";
  const total = { valor: f.contenido.valor * f.cantidad, medida: f.contenido.medida };
  return `de ${medidaTexto(f.contenido)} ${cada} · ${medidaTexto(total)} en total`;
}

export interface PrecioUnitario {
  /** «2,33 €/lata» (solo si hay varias unidades). */
  porUnidad: string | null;
  /** «9,33 €/l», «25,92 €/kg» o, en envases pequeños, «23,32 €/100 ml». */
  porMedida: string | null;
}

export function precioUnitario(f: Formato, precio: number | null): PrecioUnitario {
  if (precio == null || precio <= 0) return { porUnidad: null, porMedida: null };
  const porUnidad = f.cantidad > 1 ? `${EUROS.format(precio / f.cantidad)}/${f.envase ?? "unidad"}` : null;
  let porMedida: string | null = null;
  if (f.contenido) {
    const total = f.contenido.valor * f.cantidad; // ml o g
    // Por debajo de medio litro/kilo (cosmética, sobres) se compara mejor por
    // 100 ml o 100 g: «2.333 €/l» en un sérum de 12 ml no le dice nada a nadie.
    porMedida =
      total >= 500
        ? `${EUROS.format((precio * 1000) / total)}/${f.contenido.medida === "ml" ? "l" : "kg"}`
        : `${EUROS.format((precio * 100) / total)}/100 ${f.contenido.medida}`;
  }
  return { porUnidad, porMedida };
}
