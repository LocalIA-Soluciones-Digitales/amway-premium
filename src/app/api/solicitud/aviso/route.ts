import { NextResponse } from "next/server";
import { avisarSolicitudesNuevas } from "@/lib/push";

export const dynamic = "force-dynamic";

// La web la llama justo después de crear una solicitud o un desistimiento.
// No recibe datos: el servidor avisa de las solicitudes recientes que aún no
// se han avisado, así que llamarla de más no envía nada.
export async function POST() {
  await avisarSolicitudesNuevas();
  return NextResponse.json({ ok: true });
}
