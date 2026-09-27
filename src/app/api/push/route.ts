import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AMWAY_DB_KEY, AMWAY_DB_URL } from "@/lib/amway-db";
import { VAPID_PUBLIC_KEY, enviarPush, pushConfigurado, type Destino } from "@/lib/push";

export const dynamic = "force-dynamic";

// Clave pública VAPID para suscribirse y si el servidor puede enviar avisos.
export function GET() {
  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY, configurado: pushConfigurado() });
}

// Aviso de prueba a los dispositivos de quien lo pide (solo administradores:
// la RLS de amway_push_suscripciones ya filtra por su correo).
export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!pushConfigurado()) {
    return NextResponse.json({ error: "Los avisos no están configurados en el servidor." }, { status: 503 });
  }

  const db = createClient(AMWAY_DB_URL, AMWAY_DB_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: esAdmin } = await db.rpc("amway_es_admin");
  if (esAdmin !== true) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { endpoint } = ((await request.json().catch(() => ({}))) ?? {}) as { endpoint?: string };
  let consulta = db.from("amway_push_suscripciones").select("endpoint, p256dh, auth");
  if (endpoint) consulta = consulta.eq("endpoint", endpoint);
  const { data } = await consulta;
  const { enviadas, caducadas } = await enviarPush((data as Destino[] | null) ?? [], {
    title: "🔔 Avisos activados",
    body: "Así te llegará cada pedido nuevo de la web.",
    url: "/admin?tab=pedidos",
    tag: "prueba",
  });
  if (caducadas.length > 0) await db.from("amway_push_suscripciones").delete().in("endpoint", caducadas);
  return NextResponse.json({ enviadas });
}
