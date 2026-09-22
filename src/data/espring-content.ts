// Copy and figures sourced from Amway's official eSpring™ dossier (hoja de
// datos de rendimiento, infografías y overview, sep–oct 2025) — nothing here
// is invented. Keep every number traceable to that material when editing.

export const SPRING_FACTS = [
  {
    id: "contaminantes",
    value: "170+",
    label: "Contaminantes reducidos",
    detail:
      "Incluidos microplásticos, PFOA, PFOS y productos farmacéuticos, verificado por NSF International.",
  },
  {
    id: "bacterias",
    value: "99,9999 %",
    label: "Bacterias eliminadas",
    detail:
      "La tecnología LED UV-C elimina además el 99,99 % de los virus y el 99,9 % de los quistes del agua.",
  },
  {
    id: "capacidad",
    value: "5.000 l",
    label: "Filtrados al año",
    detail:
      "Un único Filtro de carbón e3 trata el equivalente a 10.000 botellas de plástico de 500 ml.",
  },
  {
    id: "eficiencia",
    value: "25 %",
    label: "Menos energía",
    detail:
      "Consume menos que el modelo anterior y ocupa un 16 % menos de espacio en la encimera.",
  },
] as const;

export const SPRING_STORY = [
  {
    id: "microplasticos",
    title: "Microplásticos",
    image: "/images/espring/story-microplastics.webp",
    copy:
      "De media, podríamos estar ingiriendo microplásticos equivalentes a una tarjeta de crédito cada semana, la mayoría procedentes del agua potable. El filtro principal del Filtro de carbón e3 captura partículas de hasta 0,2 micras.",
  },
  {
    id: "farmaceuticos",
    title: "Productos farmacéuticos",
    image: "/images/espring/story-rivers.webp",
    copy:
      "Los ríos de 104 países están contaminados con productos químicos por infraestructuras hídricas antiguas y fugas. El bloque de carbón activado reduce 19 categorías de fármacos, pesticidas, herbicidas, PFOA y PFOS.",
  },
  {
    id: "bacterias-virus",
    title: "Bacterias y virus",
    image: "/images/espring/story-bacteria.webp",
    copy:
      "Las tuberías antiguas con mantenimiento deficiente pueden contaminar el agua potable con bacterias y virus. La tecnología LED UV-C destruye el 99,9999 % de las bacterias y el 99,99 % de los virus.",
  },
] as const;

export const SPRING_STORY_SOURCES =
  "Fuentes: Universidad de Newcastle (2019, ingesta de microplásticos) · Pharmaceutical pollution of the world's rivers, PNAS (2022).";

export const SPRING_FILTER_LAYERS = [
  { name: "Prefiltro", detail: "Arena, polvo y suciedad" },
  { name: "Filtro principal", detail: "Microplásticos, amianto y quistes" },
  { name: "Bloque de carbón", detail: "Fármacos, pesticidas, PFOA y PFOS" },
] as const;

export const SPRING_SPECS = [
  { label: "Capacidad del filtro", value: "5.000 l o 1 año de servicio" },
  { label: "Caudal", value: "2,6 l/min" },
  { label: "Certificaciones", value: "NSF/ANSI 42, 53, 55, 401 · CSA B483.1" },
] as const;

export const SPRING_APP_FEATURES = [
  "Consulta la vida útil del filtro y el consumo de agua",
  "Pide filtros de recambio en dos toques",
  "Accede a vídeos de procedimientos de instalación y mantenimiento",
  "Actualiza el software del sistema automáticamente",
] as const;

export const SPRING_MAINTENANCE = [
  { value: "2", unit: "minutos", label: "Lo que tarda el cambio de filtro" },
  { value: "1", unit: "vez al año", label: "Frecuencia recomendada de cambio" },
  { value: "0", unit: "herramientas", label: "No necesitas fontanero ni piezas extra" },
] as const;
