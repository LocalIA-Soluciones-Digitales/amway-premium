"use client";

import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

const cargarFunciones = () => import("@/lib/motion-features").then((mod) => mod.default);

// Todas las animaciones usan <m.*> (importado como `motion`) en lugar de
// <motion.*>: así el motor de framer-motion (~40 KB) no va en el JavaScript
// inicial de cada página. `strict` avisa si alguien vuelve a importar
// `motion` directamente, que lo volvería a meter.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={cargarFunciones} strict>
      {children}
    </LazyMotion>
  );
}
