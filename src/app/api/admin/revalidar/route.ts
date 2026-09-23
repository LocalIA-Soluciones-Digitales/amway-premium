import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { AMWAY_DB_KEY, AMWAY_DB_URL } from "@/lib/amway-db";

// El panel lo llama tras cambiar precios/agotados para que la tienda los
// muestre al momento en vez de esperar al refresco de cada minuto. Solo
// acepta la sesión de un admin de Amway (amway_es_admin()).
export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const db = createClient(AMWAY_DB_URL, AMWAY_DB_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: esAdmin } = await db.rpc("amway_es_admin");
  if (esAdmin !== true) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  revalidateTag("amway-catalogo");
  return NextResponse.json({ ok: true });
}
