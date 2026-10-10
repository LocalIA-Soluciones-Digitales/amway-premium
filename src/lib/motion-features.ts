// Funciones de animación de framer-motion (incluidas las de layoutId, que
// usan la cabecera y las pestañas de la ficha). Se cargan aparte, después
// de la página: los componentes <m.*> pintan con su estado inicial y empiezan
// a animar en cuanto llega este trozo (ver MotionProvider).
import { domMax } from "framer-motion";

export default domMax;
