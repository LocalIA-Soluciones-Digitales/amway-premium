import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AMWAY_DB_KEY, AMWAY_DB_URL } from "@/lib/amway-db";

// Estado de integraciones para el panel de desarrollo. Nunca devuelve
// valores de secretos, solo si están configurados. Solo desarrolladores.
export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const db = createClient(AMWAY_DB_URL, AMWAY_DB_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: esDev } = await db.rpc("amway_es_desarrollador");
  if (esDev !== true) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  return NextResponse.json({
    stripe: stripeKey ? (stripeKey.startsWith("sk_live_") ? "live" : "test") : null,
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    pedidosToken: !!process.env.AMWAY_PEDIDOS_TOKEN,
    supabaseEnv: !!process.env.NEXT_PUBLIC_AMWAY_SUPABASE_URL,
    entorno: process.env.VERCEL_ENV ?? "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    commitMensaje: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    region: process.env.VERCEL_REGION ?? null,
  });
}
