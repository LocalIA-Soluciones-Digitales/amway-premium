import type { Product } from "../types";

// Catálogo de amway.es (octubre 2026), en el mismo orden que la tienda.
export const xsEnergyProducts: Product[] = [
  {
    id: "xs-muscle-multiplier",
    name: "XS™ Amino Advantage+",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Nuevo complemento alimenticio XS Amino Advantage+ con una mezcla única de los 9 aminoácidos esenciales que tu cuerpo no puede producir por sí mismo. Ayuda a desarrollar y mantener la masa muscular.* * Los aminoácidos son los componentes de las proteínas, que contribuyen a mantener y desarrollar la masa muscular.",
    variants: [{ sku: "126754", size: "219 g", price: 56.76 }],
    image: "xs-energy/catalog/muscle-multiplier.webp",
  },
  {
    id: "xs-magnesio",
    name: "Sobres de Magnesio XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Cómodos gránulos de magnesio que se disuelven en la boca sin necesidad de agua.",
    variants: [{ sku: "121062", size: "30 sobres", price: 14.62 }],
    image: "espana/xs-magnesio.webp",
  },
  {
    id: "xs-enfoque-energia",
    name: "Rhodiola Plus XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Descubre Rhodiola Plus XS™, un complemento alimenticio en comprimidos muy efectivos que contiene 4 concentrados vegetales naturales más vitamina C.",
    variants: [{ sku: "101593", size: "60 comprimidos", price: 37.87 }],
    image: "espana/xs-enfoque-energia.webp",
  },
  {
    id: "xs-power-drink-naranja",
    name: "Bebida Power Drink Orange Kumquat Blast - Sabor Naranja XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Bebidas de energía",
    description:
      "El refrescante nuevo sabor sin azúcares y bajo en calorías de XS™ Power Drink Orange Kumquat Blast",
    variants: [{ sku: "122109", size: "12 latas de 250 ml", price: 32.35 }],
    image: "espana/xs-power-drink-naranja.webp",
  },
  {
    id: "xs-power-drink-pomelo",
    name: "Bebida Power Drink Pink Grapefruit Blast – Sabor Pomelo XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Bebidas de energía",
    description:
      "Bebida Power Drink Pink Grapefruit Blast – Sabor Pomelo XS™.",
    variants: [{ sku: "119802", size: "12 latas de 250 ml", price: 32.35 }],
    image: "espana/xs-power-drink-pomelo.webp",
  },
  {
    id: "xs-high-protein-shake",
    name: "Batidos XS™ High Protein Energy Shake - Sabor chocolate negro",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Batido todo en uno rico en nutrientes con sabor a chocolate negro, con fórmula equilibrada 40-30-30, diseñado en exclusiva para el Nutrilite™ Energy Program.",
    variants: [{ sku: "321579", size: "14 × 67,1 g", price: 67.31 }],
    image: "espana/xs-high-protein-shake.webp",
  },
  {
    id: "xs-power-drink-baya-silvestre",
    name: "Bebida Power Drink Wild Berry Blast - Sabor Baya Silvestre XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Bebidas de energía",
    description:
      "Prepárate para cargar las pilas con el nuevo XS™ Power Drink Wild Berry Blast - Sabor Baya Silvestre",
    variants: [{ sku: "118766", size: "12 latas de 250 ml", price: 32.35 }],
    image: "espana/xs-power-drink-baya-silvestre.webp",
  },
  {
    id: "xs-bebida-rehidratante",
    name: "Bebida Rehidratante XS™ – Sabor Lima-Naranja",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Mantén la forma a un nivel óptimo. Experimenta un nuevo nivel de rehidratación con una bebida deportiva avanzada que mejora el rendimiento. Perfecta para reponer los electrolitos durante el entrenamiento.",
    variants: [{ sku: "121604", size: "15 sobres", price: 26.44 }],
    image: "espana/xs-bebida-rehidratante.webp",
  },
  {
    id: "xs-proteina-hidrolizada",
    name: "Proteína Hidrolizada de Suero en Polvo XS™ – Sabor Cacao-Chocolate",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Recupérate rápidamente, ayuda a tus músculos y prepárate para tu próxima aventura.",
    variants: [{ sku: "121606", size: "700 g", price: 77.32 }],
    image: "espana/xs-proteina-hidrolizada.webp",
  },
  {
    id: "barrita-high-protein-energy-bar-cafe",
    name: "Barrita High Protein Energy Bar - Sabor café XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Barrita de sabor a café con alto contenido de proteínas y colágeno para ayudarte durante el día como parte del Nutrilite™ Energy Program.",
    variants: [{ sku: "341520", size: "14 barritas x 50 g cada una / 700 g", price: 53.27 }],
    image: "espana/barrita-high-protein-energy-bar-cafe.webp",
  },
  {
    id: "barritas-xs-high-protein-energy-bar",
    name: "Barrita XS™ High Protein Energy Bar con sabor a coco y recubrimiento de chocolate",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Barrita con alto contenido de proteínas y sabor a coco, con colágeno hidrolizado y sirope de agave.",
    variants: [{ sku: "127731", size: "14 barritas", price: 53.27 }],
    image: "espana/barritas-xs-high-protein-energy-bar.webp",
  },
  {
    id: "xs-barrita-proteinas",
    name: "Barrita de Proteínas XS™ – Sabor Cacao-chocolate",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "La combinación definitiva de una potente dosis de proteínas para un mejor crecimiento y desarrollo del músculo magro.",
    variants: [{ sku: "121608", size: "12 barritas", price: 47.09 }],
    image: "espana/xs-barrita-proteinas.webp",
  },
  {
    id: "xs-high-protein-bar",
    name: "Barritas XS™ High Protein Energy Bar - Sabor chocolate negro",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Barrita con alto contenido de proteínas, con colágeno hidrolizado y sirope de agave.",
    variants: [{ sku: "127730", size: "14 barritas", price: 53.27 }],
    image: "espana/xs-high-protein-bar.webp",
  },
  {
    id: "batido-high-protein-energy-shake-cappuccino",
    name: "Batido High Protein Energy Shake - Sabor cappuccino XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Batido de sabor a cappuccino, rico en proteínas y con vitaminas del grupo B, que favorece la energía como parte del Nutrilite™ Energy Program.",
    variants: [{ sku: "342052", size: "sobre (68,2 g); 14 sobres/caja", price: 73.79 }],
    image: "espana/batido-high-protein-energy-shake-cappuccino.webp",
  },
  {
    id: "bebida-focus-power-drink-melocoton-guayaba",
    name: "Bebida Focus Power Drink con sabor a melocotón y guayaba XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Bebidas de energía",
    description:
      "Una bebida power drink funcional sin azúcar, con sabor a melocotón y guayaba y con cafeína natural procedente de granos de café verde, combinada con ginseng, vitaminas del grupo B y magnesio.",
    variants: [{ sku: "342214", size: "12 latas de 250 ml", price: 40.37 }],
    image: "espana/bebida-focus-power-drink-melocoton-guayaba.webp",
  },
  {
    id: "xs-power-drink-ginger",
    name: "XS™ Power Drink+ Ginger Passion Fruit Flavour – Sabor Jengibre y Maracuyá",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Bebidas de energía",
    description:
      "Bebida XS™ Power Drink+ sabor jengibre y maracuyá en pack de 12 latas.",
    variants: [{ sku: "298813", size: "12 × 250 ml", price: 36.85 }],
    image: "xs-energy/cans/ginger-passion-fruit.webp",
  },
  {
    id: "creatine-plus-xs",
    name: "Creatine+ XS™",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Fórmula sin sabor que favorece tu cuerpo¹⁻² y tu mente³ todos los días y en cada etapa de la vida.",
    variants: [{ sku: "128619", size: "264 g de polvo, 60 raciones, 4,4 g por ración", price: 55.99 }],
    image: "espana/creatine-plus-xs.webp",
  },
  {
    id: "xs-power-water",
    name: "XS™ Power Water+",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Bebidas de energía",
    description:
      "Una bebida de acción múltiple que te ayuda a mantener la energía* cuando la necesitas, de la mañana a la noche, además de revitalizar el cabello y la piel desde el interior**. *Las vitaminas B3, B5, B6 y B12 ayudan a disminuir el cansancio y la fatiga y contribuyen al metabolismo energético normal. **La biotina contribuye al mantenimiento de la piel y el cabello en condiciones normales.",
    variants: [{ sku: "298812", size: "12 × 250 ml", price: 36.85 }],
    image: "xs-energy/cans/lemon-peach.webp",
  },
  {
    id: "barrita-proteinas-xs-caramelo-vainilla",
    name: "Barrita de Proteínas XS™ – Sabor Caramelo-vainilla",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "La combinación definitiva de una potente dosis de proteínas para un mejor crecimiento y desarrollo del músculo magro.",
    variants: [{ sku: "121609", size: "12 barritas", price: 47.09 }],
    image: "espana/barrita-proteinas-xs-caramelo-vainilla.webp",
  },
  {
    id: "xs-bebida-pre-entrenamiento",
    name: "Bebida Pre-Entrenamiento XS™ – Sabor Lima-Limón",
    brand: "XS",
    category: "xs-energy",
    subcategory: "Nutrición deportiva",
    description:
      "Aporta una fuente esencial de energía antes del ejercicio con su especial Triple Combinación Energética.",
    variants: [{ sku: "121602", size: "15 sobres", price: 43.38 }],
    image: "espana/xs-bebida-pre-entrenamiento.webp",
  },
];
