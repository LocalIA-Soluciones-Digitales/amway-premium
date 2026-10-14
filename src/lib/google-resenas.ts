// Solo servidor (usa la clave privada). Reseñas del Perfil de Empresa de Google (Places API New), para mostrarlas
// en /opiniones. Las reseñas viven solo en Google: la web no recoge ni
// modera opiniones propias. Sin GOOGLE_PLACES_API_KEY y GOOGLE_PLACE_ID en
// Vercel devuelve null y la página enseña solo los enlaces a Google.
// Google entrega como mucho 5 reseñas (las que considera más relevantes).

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
