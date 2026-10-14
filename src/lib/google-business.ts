// Solo servidor. API de Perfiles de Empresa de Google (reseñas): leer todas
// las reseñas y responderlas desde el panel. Necesita que Google haya
// aprobado el acceso del proyecto a la API y estas variables en Vercel:
//   GBP_CLIENT_ID, GBP_CLIENT_SECRET  → cliente OAuth del proyecto de Google Cloud
//   GBP_REFRESH_TOKEN                 → autorización de la cuenta propietaria del perfil
//   GBP_LOCATION                      → «accounts/<id>/locations/<id>»
// Sin ellas, gbpConfigurado() es false y nadie llama a Google.

export interface ResenaPerfil {
  id: string;
  autor: string;
  foto: string | null;
  valoracion: number;
  comentario: string;
  fecha: string;
  respuesta: { texto: string; fecha: string } | null;
}

export interface ResenasPerfil {
  media: number;
  total: number;
  resenas: ResenaPerfil[];
}

const ESTRELLAS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export function gbpConfigurado(): boolean {
  return !!(process.env.GBP_CLIENT_ID && process.env.GBP_CLIENT_SECRET && process.env.GBP_REFRESH_TOKEN && process.env.GBP_LOCATION);
}

// Con «revalidar» (página pública) el token también va en caché: es válido
// una hora y así la página sigue siendo estática.
async function accessToken(revalidar?: number): Promise<string> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.GBP_CLIENT_ID!,
      client_secret: process.env.GBP_CLIENT_SECRET!,
      refresh_token: process.env.GBP_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    ...(revalidar ? { next: { revalidate: 3000 } } : { cache: "no-store" as const }),
  });
  const j = (await r.json()) as { access_token?: string; error?: string };
  if (!r.ok || !j.access_token) throw new Error(`Google no dio acceso (${j.error ?? r.status})`);
  return j.access_token;
}

const base = () => `https://mybusiness.googleapis.com/v4/${process.env.GBP_LOCATION}/reviews`;

interface ReviewV4 {
  reviewId: string;
  reviewer?: { displayName?: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating?: string;
  comment?: string;
  createTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
}

export async function listarResenasPerfil(max = 200, revalidar?: number): Promise<ResenasPerfil> {
  const token = await accessToken(revalidar);
  const resenas: ResenaPerfil[] = [];
  let media = 0;
  let total = 0;
  let pageToken: string | undefined;
  do {
    const url = `${base()}?pageSize=50&orderBy=${encodeURIComponent("updateTime desc")}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      ...(revalidar ? { next: { revalidate: revalidar } } : { cache: "no-store" as const }),
    });
    const j = (await r.json()) as { reviews?: ReviewV4[]; averageRating?: number; totalReviewCount?: number; nextPageToken?: string; error?: { message?: string } };
    if (!r.ok) throw new Error(j.error?.message ?? `Error ${r.status} de Google`);
    media = j.averageRating ?? media;
    total = j.totalReviewCount ?? total;
    for (const v of j.reviews ?? []) {
      resenas.push({
        id: v.reviewId,
        autor: v.reviewer?.isAnonymous ? "Cliente de Google" : (v.reviewer?.displayName ?? "Cliente de Google"),
        foto: v.reviewer?.profilePhotoUrl ?? null,
        valoracion: ESTRELLAS[v.starRating ?? ""] ?? 0,
        comentario: (v.comment ?? "").trim(),
        fecha: v.createTime ?? "",
        respuesta: v.reviewReply?.comment ? { texto: v.reviewReply.comment, fecha: v.reviewReply.updateTime ?? "" } : null,
      });
    }
    pageToken = j.nextPageToken;
  } while (pageToken && resenas.length < max);
  return { media, total, resenas };
}

export async function responderResena(id: string, texto: string): Promise<void> {
  const token = await accessToken();
  const r = await fetch(`${base()}/${encodeURIComponent(id)}/reply`, {
    method: texto ? "PUT" : "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: texto ? JSON.stringify({ comment: texto }) : undefined,
    cache: "no-store",
  });
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(j.error?.message ?? `Error ${r.status} de Google`);
  }
}
