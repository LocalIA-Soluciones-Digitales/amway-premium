import { gbpConfigurado, listarResenasPerfil } from "./google-business";

function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (!(dias >= 0)) return "";
  if (dias < 1) return "hoy";
  if (dias < 7) return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
  if (dias < 31) return Math.floor(dias / 7) === 1 ? "hace 1 semana" : `hace ${Math.floor(dias / 7)} semanas`;
  if (dias < 365) return Math.floor(dias / 30) === 1 ? "hace 1 mes" : `hace ${Math.floor(dias / 30)} meses`;
  return Math.floor(dias / 365) === 1 ? "hace 1 año" : `hace ${Math.floor(dias / 365)} años`;
}

// Solo servidor (usa claves privadas). Reseñas del Perfil de Empresa de
// Google para mostrarlas en /opiniones. Las reseñas viven solo en Google: la
// web no recoge ni modera opiniones propias. Fuentes, por orden:
//  1. API de Perfiles de Empresa (GBP_*): gratis, todas las reseñas.
//  2. Places API (GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID): como mucho 5.
// Sin ninguna, devuelve null y la página enseña solo los enlaces a Google.

export interface ResenaGoogle {
  autor: string;
  autorUrl: string | null;
  valoracion: number;
  texto: string;
  hace: string; // «hace 2 semanas», ya en castellano
  fecha: string;
}

export interface ResumenGoogle {
  media: number;
  total: number;
  mapsUrl: string | null;
  resenas: ResenaGoogle[];
}

interface PlaceReview {
  rating?: number;
  relativePublishTimeDescription?: string;
  publishTime?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string };
}

export async function resenasGoogle(): Promise<ResumenGoogle | null> {
  // Con la API de Perfiles de Empresa conectada (gratis, todas las reseñas)
  // no hace falta la clave de Places.
  if (gbpConfigurado()) {
    try {
      const d = await listarResenasPerfil(50, 86400);
      return {
        media: d.media,
        total: d.total,
        mapsUrl: null,
        resenas: d.resenas
          .filter((r) => r.valoracion > 0)
          .slice(0, 12)
          .map((r) => ({ autor: r.autor, autorUrl: null, valoracion: r.valoracion, texto: r.comentario, hace: haceCuanto(r.fecha), fecha: r.fecha })),
      };
    } catch {
      // Si falla, se intenta con Places.
    }
  }
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" },
      // Una consulta al día como mucho: queda dentro del uso gratuito.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { rating?: number; userRatingCount?: number; googleMapsUri?: string; reviews?: PlaceReview[] };
    if (!d.userRatingCount) return { media: 0, total: 0, mapsUrl: d.googleMapsUri ?? null, resenas: [] };
    return {
      media: d.rating ?? 0,
      total: d.userRatingCount,
      mapsUrl: d.googleMapsUri ?? null,
      resenas: (d.reviews ?? [])
        .map((r) => ({
          autor: r.authorAttribution?.displayName ?? "Cliente de Google",
          autorUrl: r.authorAttribution?.uri ?? null,
          valoracion: r.rating ?? 0,
          texto: (r.originalText?.text ?? r.text?.text ?? "").trim(),
          hace: r.relativePublishTimeDescription ?? "",
          fecha: r.publishTime ?? "",
        }))
        .filter((r) => r.valoracion > 0),
    };
  } catch {
    return null;
  }
}
