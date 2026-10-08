import { usePathname } from "next/navigation";

// usePathname() normalizado. Al regenerar la portada por ISR, Next la
// renderiza con la ruta "/index" (sus segmentos son ["", "index"]), así que
// el HTML del servidor salía con la cabecera de una página interior y el
// navegador, con "/", con la transparente: error de hidratación (#418) en
// cada visita a la home.
export function useRuta(): string {
  const ruta = usePathname();
  return ruta === "/index" ? "/" : ruta;
}
