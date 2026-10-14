import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AMWAY_DB_KEY, AMWAY_DB_URL } from "@/lib/amway-db";
import { gbpConfigurado, listarResenasPerfil, responderResena } from "@/lib/google-business";

// Reseñas del Perfil de Empresa para el panel: GET las lista, POST responde
// (o borra la respuesta con texto vacío). Solo la gestora.

async function esAdmin(request: NextRequest): Promise<boolean> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const db = createClient(AMWAY_DB_URL, AMWAY_DB_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await db.rpc("amway_es_admin");
  return data === true;
}

export async function GET(request: NextRequest) {
  if (!(await esAdmin(request))) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  if (!gbpConfigurado()) return NextResponse.json({ configurado: false });
  try {
    return NextResponse.json({ configurado: true, ...(await listarResenasPerfil()) });
  } catch (e) {
    return NextResponse.json({ configurado: true, error: e instanceof Error ? e.message : "Error de Google" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await esAdmin(request))) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  if (!gbpConfigurado()) return NextResponse.json({ error: "Las reseñas de Google aún no están conectadas." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as { id?: unknown; texto?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const texto = typeof body?.texto === "string" ? body.texto.trim().slice(0, 4000) : "";
  if (!id) return NextResponse.json({ error: "Falta la reseña." }, { status: 400 });
  try {
    await responderResena(id, texto);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error de Google" }, { status: 502 });
  }
}
