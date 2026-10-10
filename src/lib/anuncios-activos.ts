import { AMWAY_DB_KEY, AMWAY_DB_URL } from "@/lib/amway-config";
import type { Anuncio } from "@/lib/anuncios";

// Aparte de lib/anuncios.ts, que resuelve el producto de cada anuncio con el
// catálogo completo: el pop-up pregunta en cada visita si hay anuncios, y
// solo cuando hay uno descarga la tarjeta (y con ella el catálogo).
// Lectura pública por REST, sin sesión: así nunca arrastra la del panel.
export async function fetchAnunciosActivos(): Promise<Anuncio[]> {
  try {
    const res = await fetch(`${AMWAY_DB_URL}/rest/v1/amway_anuncios?select=*&order=updated_at.desc&limit=10`, {
      headers: { apikey: AMWAY_DB_KEY },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as Anuncio[]) : [];
  } catch {
    return [];
  }
}
