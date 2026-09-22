import { xsEnergyProducts } from "./products/xs-energy";

// The flagship canned energy-drink line inside the broader XS catalog — the
// four products whose subcategory is the literal "Bebidas de energía".
// Everything below is sourced from real fields in xs-energy.ts; nothing here
// is invented. Where a can's printed flavor couldn't be verified legibly, it
// stays generic instead of guessing.
export const energyDrinkProducts = xsEnergyProducts.filter(
  (p) => p.subcategory === "Bebidas de energía"
);

export function energyProduct(id: string) {
  const p = xsEnergyProducts.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown XS energy product: ${id}`);
  return p;
}

export interface EnergyFlavor {
  id: string;
  /** Flavor/variant name as printed on the can or listed verbatim in the product description. */
  name: string;
  /** Product line this can belongs to. */
  line: string;
  tag?: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  /** Dominant accent color sampled from the can artwork itself. */
  accent: string;
  accentSoft: string;
  productId: string;
  verified: boolean;
}

export const ENERGY_FLAVORS: EnergyFlavor[] = [
  {
    id: "watermelon-lemonade",
    name: "Watermelon Lemonade",
    line: "XS™ Energy Drink",
    tag: "Zero Sugar",
    image: "p089_6_300x404.webp",
    imageWidth: 320,
    imageHeight: 431,
    accent: "#f07890",
    accentSoft: "rgba(240,120,144,0.5)",
    productId: "xs-energy-drink",
    verified: true,
  },
  {
    id: "tropical",
    name: "Tropical",
    line: "XS™ Energy Drink",
    tag: "Zero Sugar",
    image: "p089_1_280x404.webp",
    imageWidth: 280,
    imageHeight: 404,
    accent: "#4890cc",
    accentSoft: "rgba(72,144,204,0.5)",
    productId: "xs-energy-drink",
    verified: true,
  },
  {
    id: "cranberry-grape",
    name: "Arándano-Uva",
    line: "XS™ Energy Drink",
    tag: "Zero Sugar",
    image: "p089_7_280x386.webp",
    imageWidth: 280,
    imageHeight: 386,
    accent: "#c03ca8",
    accentSoft: "rgba(192,60,168,0.5)",
    productId: "xs-energy-drink",
    verified: true,
  },
  {
    id: "naranja",
    name: "Naranja",
    line: "XS™ Energy Drink",
    image: "p089_5_174x250.webp",
    imageWidth: 174,
    imageHeight: 250,
    accent: "#f07848",
    accentSoft: "rgba(240,120,72,0.5)",
    productId: "xs-energy-drink",
    verified: false,
  },
  {
    id: "energy-burn-blue-razz",
    name: "Frambuesa azul",
    line: "XS™ Energy + Burn",
    image: "p089_2_116x220.webp",
    imageWidth: 320,
    imageHeight: 607,
    accent: "#489ccc",
    accentSoft: "rgba(72,156,204,0.5)",
    productId: "xs-energy-burn",
    verified: true,
  },
  {
    id: "energy-burn-kiwi-fresa",
    name: "Kiwi y fresa",
    line: "XS™ Energy + Burn",
    image: "p089_3_141x216.webp",
    imageWidth: 141,
    imageHeight: 216,
    accent: "#9cc054",
    accentSoft: "rgba(156,192,84,0.5)",
    productId: "xs-energy-burn",
    verified: true,
  },
  {
    id: "jugos-mango-pina-guayaba",
    name: "Mango-piña-guayaba",
    line: "XS™ Jugos burbujeantes",
    tag: "25% jugo real",
    image: "p089_0_174x250.webp",
    imageWidth: 174,
    imageHeight: 250,
    accent: "#f09c54",
    accentSoft: "rgba(240,156,84,0.5)",
    productId: "xs-jugos-burbujeantes",
    verified: true,
  },
  {
    id: "classic",
    name: "Selección clásica",
    line: "XS™ Energy Drink",
    image: "p089_4_174x250.webp",
    imageWidth: 174,
    imageHeight: 250,
    accent: "#e4609c",
    accentSoft: "rgba(228,96,156,0.5)",
    productId: "xs-energy-drink",
    verified: false,
  },
];

// Real, verbatim facts pulled from product descriptions — used for the
// typographic "benefit" reveals during the scroll story. Nothing invented.
export const ENERGY_FACTS = [
  {
    id: "caffeine",
    value: "114 mg",
    label: "de cafeína",
    detail: "Una explosión de energía sin azúcar, con sabores naturales.",
  },
  {
    id: "vitamins",
    value: "Megadosis",
    label: "de vitaminas B",
    detail: "En cada lata de la línea XS™ Energy Drink.",
  },
  {
    id: "juice",
    value: "25%",
    label: "jugo de fruta real",
    detail: "Los jugos de energía burbujeantes XS™, con 250% de vitamina C y sin colorantes artificiales.",
  },
  {
    id: "burn",
    value: "EGCG",
    label: "extracto de té verde",
    detail: "XS™ Energy + Burn añade cromo y vitamina C para impulsar el metabolismo.",
  },
] as const;
