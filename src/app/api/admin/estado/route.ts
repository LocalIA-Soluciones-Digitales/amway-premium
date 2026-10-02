import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AMWAY_DB_KEY, AMWAY_DB_URL } from "@/lib/amway-db";
import { stripe } from "@/lib/stripe";
import { SITE } from "@/data/site-config";

// Estado de integraciones para el panel de desarrollo. Nunca devuelve
// valores de secretos, solo si están configurados. Solo desarrolladores.
// Además de mirar variables, prueba de verdad Stripe y la base de datos
// (latencia), comprueba el webhook en Stripe y concilia los cobros de los
// últimos 30 días con los pedidos registrados.

const RUTA_WEBHOOK = "/api/stripe/webhook";
const EVENTOS_WEBHOOK = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];

async function cronometrar<T>(fn: () => Promise<T>): Promise<{ ms: number; ok: true; valor: T } | { ms: number; ok: false; error: string }> {
  const t = performance.now();
  try {
    const valor = await fn();
    return { ms: Math.round(performance.now() - t), ok: true, valor };
  } catch (e) {
    return { ms: Math.round(performance.now() - t), ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const db = createClient(AMWAY_DB_URL, AMWAY_DB_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ping = await cronometrar(async () => {
    const { data, error } = await db.rpc("amway_es_desarrollador");
    if (error) throw new Error(error.message);
    return data;
  });
  if (!ping.ok || ping.valor !== true) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const webhookUrl = `${SITE.url}${RUTA_WEBHOOK}`;

  let stripeInfo: {
    ms: number;
    error: string | null;
    saldo: { disponible: number; pendiente: number } | null;
    webhook: { url: string; estado: string; eventosOk: boolean; faltan: string[] } | null;
    otrosWebhooks: number;
    cobros30d: number;
    sinRegistrar: { id: string; importe: number; fecha: string; email: string | null; nombre: string | null }[];
  } | null = null;

  if (stripe) {
    const s = stripe;
    const desde = Math.floor(Date.now() / 1000) - 30 * 86400;
    const r = await cronometrar(() =>
      Promise.all([
        s.balance.retrieve().catch(() => null),
        s.webhookEndpoints.list({ limit: 100 }),
        s.checkout.sessions.list({ limit: 100, created: { gte: desde } }),
      ])
    );
    if (!r.ok) {
      stripeInfo = { ms: r.ms, error: r.error, saldo: null, webhook: null, otrosWebhooks: 0, cobros30d: 0, sinRegistrar: [] };
    } else {
      const [balance, endpoints, sesiones] = r.valor;
      const eur = (l: { amount: number; currency: string }[]) => l.filter((x) => x.currency === "eur").reduce((a, x) => a + x.amount, 0) / 100;
      // El de esta web (sirve aunque esté dado de alta con www o el dominio de Vercel).
      const propios = endpoints.data.filter((e) => e.url.endsWith(RUTA_WEBHOOK));
      const host = new URL(SITE.url).hostname.replace(/^www\./, "");
      const nuestro = propios.find((e) => e.url.includes(host)) ?? propios[0];
      const eventos = nuestro?.enabled_events ?? [];
      const faltan = eventos.includes("*") ? [] : EVENTOS_WEBHOOK.filter((e) => !eventos.includes(e));
      // Solo sesiones de esta tienda (la cuenta de Stripe podría usarse para más cosas).
      const pagadas = sesiones.data.filter((x) => x.payment_status === "paid" && x.metadata && "items" in x.metadata);
      const ids = pagadas.map((x) => x.id);
      const { data: registrados } = ids.length
        ? await db.from("amway_pedidos").select("stripe_session_id").in("stripe_session_id", ids)
        : { data: [] as { stripe_session_id: string }[] };
      const hay = new Set((registrados ?? []).map((x) => x.stripe_session_id));
      stripeInfo = {
        ms: r.ms,
        error: null,
        saldo: balance ? { disponible: eur(balance.available), pendiente: eur(balance.pending) } : null,
        webhook: nuestro ? { url: nuestro.url, estado: nuestro.status, eventosOk: faltan.length === 0, faltan } : null,
        otrosWebhooks: endpoints.data.length - (nuestro ? 1 : 0),
        cobros30d: pagadas.length,
        sinRegistrar: pagadas
          .filter((x) => !hay.has(x.id))
          .map((x) => ({
            id: x.id,
            importe: (x.amount_total ?? 0) / 100,
            fecha: new Date(x.created * 1000).toISOString(),
            email: x.customer_details?.email ?? null,
            nombre: x.metadata?.cliente_nombre || x.customer_details?.name || null,
          })),
      };
    }
  }

  return NextResponse.json({
    stripe: stripeKey ? (stripeKey.startsWith("sk_live_") ? "live" : "test") : null,
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookUrl,
    pedidosToken: !!process.env.AMWAY_PEDIDOS_TOKEN,
    push: !!process.env.AMWAY_VAPID_PRIVATE_KEY,
    supabaseEnv: !!process.env.NEXT_PUBLIC_AMWAY_SUPABASE_URL,
    entorno: process.env.VERCEL_ENV ?? "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    commitMensaje: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    commitAutor: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME ?? null,
    rama: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    repo:
      process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
        ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
        : null,
    region: process.env.VERCEL_REGION ?? null,
    node: process.version,
    dbMs: ping.ms,
    stripeInfo,
  });
}
