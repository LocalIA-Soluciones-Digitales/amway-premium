import { NextResponse } from "next/server";
import { amwayRpc } from "@/lib/amway-db";

export const dynamic = "force-dynamic";

// Para un monitor externo (UptimeRobot, Better Stack…): 200 si la web
// llega a la base de datos, 503 si no. Sin datos internos en la respuesta.
export async function GET() {
  const t = performance.now();
  try {
    await amwayRpc("amway_catalogo_publico", undefined, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return NextResponse.json(
      { ok: true, bdMs: Math.round(performance.now() - t) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
