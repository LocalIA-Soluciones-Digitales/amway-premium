// Real XS™ Power Drink / Power Water+ line-up (EU market, 250 ml), sourced
// from Amway's own official Spanish launch materials (product photography,
// launch deck and sample card) — see ASSETS_NEEDED.md for provenance. Copy
// below is translated near-verbatim from that deck; nothing is invented.

export interface EnergyFlavor {
  id: string;
  /** Official flavor name as printed on the can. */
  name: string;
  /** Spanish flavour descriptor as used in the official materials. */
  flavorEs: string;
  /** Product line this can belongs to. */
  line: string;
  tag?: string;
  /** Catalog product this can is sold as (price + Stripe checkout). */
  productId: string;
  /** One real, verbatim-sourced benefit line for this specific can. */
  benefit: string;
  image: string;
  accent: string;
  accentSoft: string;
}

export const ENERGY_FLAVORS: EnergyFlavor[] = [
  {
    id: "lemon-peach",
    name: "Power Water+",
    flavorEs: "Limón-Melocotón",
    line: "XS™ Power Water+",
    productId: "xs-energy-drink",
    tag: "Sin gas · Colágeno",
    benefit: "Contribuye a revitalizar el cabello y la piel desde el interior.",
    image: "lemon-peach.webp",
    accent: "#0c6c84",
    accentSoft: "rgba(12,108,132,0.55)",
  },
  {
    id: "ginger-passion-fruit",
    name: "Power Drink+",
    flavorEs: "Jengibre y Maracuyá",
    line: "XS™ Power Drink+",
    productId: "xs-energy-drink",
    tag: "Vitamina C + Zinc",
    benefit: "Aporta energía y ayuda a mantener las defensas inmunitarias.",
    image: "ginger-passion-fruit.webp",
    accent: "#c9932a",
    accentSoft: "rgba(201,147,42,0.5)",
  },
  {
    id: "orange-kumquat",
    name: "Orange Kumquat Blast",
    flavorEs: "Sabor Naranja",
    line: "XS™ Power Drink",
    productId: "xs-energy-drink",
    benefit: "Favorece la agilidad mental y combate el cansancio.",
    image: "orange-kumquat.webp",
    accent: "#b44824",
    accentSoft: "rgba(180,72,36,0.5)",
  },
  {
    id: "pink-grapefruit",
    name: "Pink Grapefruit Blast",
    flavorEs: "Sabor Pomelo",
    line: "XS™ Power Drink",
    productId: "xs-energy-drink",
    benefit: "Favorece la agilidad mental y combate el cansancio.",
    image: "pink-grapefruit.webp",
    accent: "#b43060",
    accentSoft: "rgba(180,48,96,0.5)",
  },
  {
    id: "wild-berry",
    name: "Wild Berry Blast",
    flavorEs: "Sabor Baya Silvestre",
    line: "XS™ Power Drink",
    productId: "xs-energy-drink",
    benefit: "Favorece la agilidad mental y combate el cansancio.",
    image: "wild-berry.webp",
    accent: "#543c78",
    accentSoft: "rgba(84,60,120,0.5)",
  },
  {
    id: "tropical",
    name: "Tropical Blast",
    flavorEs: "Sabor Tropical",
    line: "XS™ Power Drink",
    productId: "xs-energy-drink",
    benefit: "Favorece la agilidad mental y combate el cansancio.",
    image: "tropical.webp",
    accent: "#0c3054",
    accentSoft: "rgba(12,48,84,0.5)",
  },
];

// Real, verbatim-sourced facts — used for the typographic benefit reveals.
export const ENERGY_FACTS = [
  {
    id: "b-vitamins",
    value: "Vitaminas B",
    label: "combaten el cansancio",
    detail: "Complejo de vitaminas del grupo B que favorece la agilidad mental y ayuda a mantener la atención.",
  },
  {
    id: "collagen",
    value: "2500 mg",
    label: "de colágeno por lata",
    detail: "XS™ Power Water+ contribuye a revitalizar el cabello y la piel desde el interior.",
  },
  {
    id: "immune",
    value: "Vitamina C + Zinc",
    label: "defensas inmunitarias",
    detail: "XS™ Power Drink+ aporta energía y ayuda a mantener las defensas inmunitarias.",
  },
  {
    id: "clean",
    value: "0",
    label: "azúcares añadidos",
    detail: "Sin colorantes ni aromas artificiales en toda la gama XS™ Power Drink.",
  },
] as const;

export const XS_ANNIVERSARY = {
  years: 20,
  claim: "20 años de aventura",
} as const;
