import type { CSSProperties } from "react";

// Entrada de los textos de cabecera animada solo con CSS (keyframes
// hero-fade-up / hero-word en globals.css): el texto llega pintado en el
// HTML y la animación arranca con él, sin esperar a la hidratación ni a
// framer-motion, que en móvil retrasaban el LCP varios segundos.
export function entrada(delay: number, duracion = 0.7, nombre: "hero-fade-up" | "hero-word" = "hero-fade-up"): CSSProperties {
  return { animation: `${nombre} ${duracion}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both` };
}
