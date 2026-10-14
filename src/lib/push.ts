import webpush from "web-push";
import { amwayRpc } from "@/lib/amway-db";
import { SITE } from "@/data/site-config";

// Avisos push al móvil de la gestora cuando entra un pedido web (igual que
// en Arrantza, pero enviados desde el propio servidor Next.js en vez de una
// Edge Function). La clave pública es pública por diseño; la privada solo
// vive en AMWAY_VAPID_PRIVATE_KEY. Sin ella no se envía nada y la tienda
// funciona igual.
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_AMWAY_VAPID_PUBLIC_KEY ??
  "BLKbkJc1YGPikos3R24_N9WIvXzjPXhSPNejYoILrjvrW4w1M0w5EdKy5r-eFphbdMNwipqSNUsdNttMvV3mauU";

export const pushConfigurado = () => !!process.env.AMWAY_VAPID_PRIVATE_KEY;

export interface Destino {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface AvisoPush {
  title: string;
  body: string;
  url: string;
  tag: string;
}

let configurado = false;
function configurar(): boolean {
  const privada = process.env.AMWAY_VAPID_PRIVATE_KEY;
  if (!privada) return false;
  if (!configurado) {
    webpush.setVapidDetails(process.env.AMWAY_VAPID_SUBJECT ?? `mailto:${SITE.email}`, VAPID_PUBLIC_KEY, privada);
    configurado = true;
  }
  return true;
}

// Envía a todos los destinos y devuelve los endpoints que el navegador ya
// ha dado de baja (404/410), para borrarlos.
export async function enviarPush(destinos: Destino[], aviso: AvisoPush): Promise<{ enviadas: number; caducadas: string[] }> {
  if (!configurar() || destinos.length === 0) return { enviadas: 0, caducadas: [] };
  const caducadas: string[] = [];
  let enviadas = 0;
  const body = JSON.stringify(aviso);
  await Promise.all(
    destinos.map(async (d) => {
      try {
        // urgency high: que el móvil lo entregue al momento aunque esté en
        // reposo; pasadas 12 h el aviso ya no sirve.
        await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, body, {
          TTL: 12 * 3600,
          urgency: "high",
        });
        enviadas += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) caducadas.push(d.endpoint);
        else console.error("push: fallo al enviar", status, (err as Error).message);
      }
    })
  );
  return { enviadas, caducadas };
}

interface PedidoAviso {
  id: string;
  numero: number;
  total_eur: number;
  metodo_pago: string;
  estado: string;
  cliente_nombre: string | null;
  recogida_fecha: string | null;
  recogida_hora: string | null;
  unidades: number;
}

// "mañana 18:00" / "hoy 11:00" / "mar 30 sep 18:00"
function cuando(fecha: string, hora: string | null): string {
  const madrid = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
  const manana = new Date(`${madrid}T12:00:00Z`);
  manana.setUTCDate(manana.getUTCDate() + 1);
  const dia =
    fecha === madrid
      ? "hoy"
      : fecha === manana.toISOString().slice(0, 10)
        ? "mañana"
        : new Date(`${fecha}T12:00:00Z`)
            .toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
            .replace(/\./g, "");
  return hora ? `${dia} a las ${hora}` : dia;
}

export function textoAvisoPedido(p: PedidoAviso): AvisoPush {
  const importe = Number(p.total_eur).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const efectivo = p.estado === "pendiente";
  return {
    title: efectivo ? `🛍️ Pedido #${p.numero} · paga en efectivo` : `💳 Pedido #${p.numero} pagado con tarjeta`,
    body: [
      p.cliente_nombre || "Cliente",
      `${p.unidades} ud. · ${importe}`,
      p.recogida_fecha ? `Recoge ${cuando(p.recogida_fecha, p.recogida_hora)}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    url: `/admin?tab=pedidos&pedido=${p.id}`,
    tag: `pedido-${p.id}`,
  };
}

// Avisa de un pedido web recién registrado. La función SQL marca el pedido
// como avisado de forma atómica, así que la página de éxito y el webhook de
// Stripe pueden llamar los dos sin que el aviso llegue dos veces. Nunca
// lanza: un fallo del aviso no puede tumbar el pedido.
export async function avisarPedidoNuevo(pedidoId: string | null | undefined): Promise<void> {
  const token = process.env.AMWAY_PEDIDOS_TOKEN;
  if (!pedidoId || !token || !pushConfigurado()) return;
  try {
    const res = await amwayRpc<{ pedido: PedidoAviso; destinos: Destino[] } | null>(
      "amway_push_pedido",
      { p_token: token, p_pedido_id: pedidoId },
      { cache: "no-store" }
    );
    if (!res) return;
    const { caducadas } = await enviarPush(res.destinos, textoAvisoPedido(res.pedido));
    if (caducadas.length > 0) {
      await amwayRpc("amway_push_caducadas", { p_token: token, p_endpoints: caducadas }, { cache: "no-store" });
    }
  } catch (e) {
    console.error("No se pudo enviar el aviso del pedido", e);
  }
}

interface SolicitudAviso {
  id: string;
  tipo: string;
  producto_nombre: string;
  nombre: string;
  pedido_numero: number | null;
}

export function textoAvisoSolicitudes(s: SolicitudAviso[]): AvisoPush {
  const url = "/admin?tab=solicitudes";
  if (s.length > 1) {
    return { title: `📋 ${s.length} solicitudes nuevas`, body: s.map((x) => x.producto_nombre).join(" · "), url, tag: "solicitudes" };
  }
  const [x] = s;
  if (x.tipo === "desistimiento") {
    return { title: `↩️ Desistimiento del pedido #${x.pedido_numero ?? ""}`, body: `${x.nombre} quiere devolver su pedido`, url, tag: `solicitud-${x.id}` };
  }
  return { title: "📋 Solicitud de producto", body: `${x.nombre} busca «${x.producto_nombre}»`, url, tag: `solicitud-${x.id}` };
}

// Avisa de las solicitudes recién llegadas (productos que no están en la
// web y desistimientos). La función SQL las reclama de forma atómica, así
// que cada una se avisa una sola vez. Nunca lanza.
export async function avisarSolicitudesNuevas(): Promise<void> {
  const token = process.env.AMWAY_PEDIDOS_TOKEN;
  if (!token || !pushConfigurado()) return;
  try {
    const res = await amwayRpc<{ solicitudes: SolicitudAviso[]; destinos: Destino[] } | null>(
      "amway_push_solicitudes",
      { p_token: token },
      { cache: "no-store" }
    );
    if (!res?.solicitudes?.length) return;
    const { caducadas } = await enviarPush(res.destinos, textoAvisoSolicitudes(res.solicitudes));
    if (caducadas.length > 0) {
      await amwayRpc("amway_push_caducadas", { p_token: token, p_endpoints: caducadas }, { cache: "no-store" });
    }
  } catch (e) {
    console.error("No se pudo enviar el aviso de la solicitud", e);
  }
}
