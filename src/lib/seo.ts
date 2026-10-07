import type { Metadata } from "next";
import { SITE } from "@/data/site-config";

// Open Graph común. Next no mezcla `openGraph` entre el layout y la página:
// si una página define el suyo, sustituye al del layout entero. Por eso cada
// página parte de esta base y solo cambia url, título y descripción.
export const OG_BASE = {
  type: "website",
  locale: "es_ES",
  siteName: SITE.name,
} as const;

// Metadata de una página con su URL canónica (evita que el dominio de
// Vercel o URLs con parámetros compitan con la buena) y un og:url propio
// (antes todas las páginas compartían el de la portada).
export function conRuta(ruta: string, meta: Metadata & { title: string; description: string }): Metadata {
  return {
    ...meta,
    alternates: { canonical: ruta },
    openGraph: { ...OG_BASE, url: ruta, title: `${meta.title} · ${SITE.name}`, description: meta.description },
  };
}
