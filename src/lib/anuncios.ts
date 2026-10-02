import { AMWAY_DB_KEY, AMWAY_DB_URL } from "@/lib/amway-db";
import { getProductById, productHref, productImageSrc } from "@/data/products";
import { WA_PRESETS, waLink } from "@/data/site-config";

// Anuncios que el panel publica como pop-up al entrar en la tienda: un
// producto nuevo, un evento en el local o un aviso general (tabla
// amway_anuncios; la RLS solo deja ver a la web los activos y en fecha).

export type TipoAnuncio = "producto" | "evento" | "aviso";

export interface Anuncio {
  id: string;
  tipo: TipoAnuncio;
  titulo: string;
  texto: string | null;
  product_id: string | null;
  imagen_url: string | null;
  video_url?: string | null; // ausente si la columna aún no existe
  boton_texto: string | null;
  enlace: string | null;
  evento_fecha: string | null; // YYYY-MM-DD
  evento_hora: string | null; // HH:MM
  evento_hora_fin: string | null; // HH:MM
  evento_lugar: string | null;
  inicio: string | null;
  fin: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export const TIPO_ANUNCIO: Record<TipoAnuncio, { label: string; eyebrow: string }> = {
  producto: { label: "Producto nuevo", eyebrow: "Novedad" },
  evento: { label: "Evento en la tienda", eyebrow: "Evento en la tienda" },
  aviso: { label: "Aviso", eyebrow: "Aviso" },
};

export const ANUNCIOS_BUCKET = "amway-anuncios";
export const VIDEO_MAX_MB = 30;

// Reduce una foto antes de subirla (lado largo 1600 px, WebP o JPEG): una
// foto de cámara de 10 MB queda en unos cientos de KB y carga al momento.
// Si el navegador no sabe leerla (p. ej. HEIC fuera de Safari) devuelve null.
export async function reducirImagen(file: File, ladoMax = 1600): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const aBlob = (tipo: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, tipo, 0.85));
  const webp = await aBlob("image/webp");
  // Safari antiguo ignora WebP y devuelve PNG: entonces JPEG, que pesa menos.
  return webp?.type === "image/webp" ? webp : aBlob("image/jpeg");
}

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

// Imagen del anuncio: la subida desde el panel o, si no hay, la del producto.
export function imagenAnuncio(a: Pick<Anuncio, "imagen_url" | "product_id">): string | null {
  if (a.imagen_url) return a.imagen_url;
  const p = a.product_id ? getProductById(a.product_id) : undefined;
  return p ? productImageSrc(p) : null;
}

// Botón principal: lo escrito en el panel o uno razonable según el tipo.
export function accionAnuncio(a: Anuncio): { texto: string; href: string; externo: boolean } | null {
  const p = a.product_id ? getProductById(a.product_id) : undefined;
  let href = a.enlace?.trim() || null;
  if (!href && p) href = productHref(p);
  if (!href && a.tipo === "evento") {
    href = waLink(`Hola, me gustaría apuntarme al evento «${a.titulo}»${a.evento_fecha ? ` del ${fechaEvento(a.evento_fecha)}` : ""}. Gracias.`);
  }
  if (!href && a.tipo === "producto") href = waLink(WA_PRESETS.info);
  if (!href) return null;

  const porDefecto = a.tipo === "evento" ? "Reservar plaza" : p || a.tipo === "producto" ? "Ver producto" : "Ver más";
  return { texto: a.boton_texto?.trim() || porDefecto, href, externo: /^https?:\/\//i.test(href) };
}

export function fechaEvento(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

export function horarioEvento(a: Pick<Anuncio, "evento_hora" | "evento_hora_fin">): string | null {
  if (!a.evento_hora) return null;
  return a.evento_hora_fin ? `${a.evento_hora} – ${a.evento_hora_fin}` : `A las ${a.evento_hora}`;
}

// Enlace "Añadir a Google Calendar" (hora de Madrid), si el evento tiene día.
export function calendarioEvento(a: Anuncio): string | null {
  if (a.tipo !== "evento" || !a.evento_fecha) return null;
  const dia = a.evento_fecha.replaceAll("-", "");
  let dates: string;
  if (a.evento_hora) {
    const ini = a.evento_hora.replace(":", "");
    const fin = (a.evento_hora_fin ?? sumarHora(a.evento_hora)).replace(":", "");
    dates = `${dia}T${ini}00/${dia}T${fin}00`;
  } else {
    const siguiente = new Date(`${a.evento_fecha}T12:00:00Z`);
    siguiente.setUTCDate(siguiente.getUTCDate() + 1);
    dates = `${dia}/${siguiente.toISOString().slice(0, 10).replaceAll("-", "")}`;
  }
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: a.titulo,
    dates,
    ctz: "Europe/Madrid",
    details: a.texto ?? "",
    location: a.evento_lugar ?? "",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function sumarHora(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
