import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AMWAY_DB_KEY, AMWAY_DB_URL, CLIENTE_DB_LISTO, CLIENTE_STORAGE_KEY, amwayRpc } from "@/lib/amway-config";

// Supabase compartido con otras webs del estudio: esta tienda solo toca
// tablas/funciones con prefijo amway_ (ver supabase/amway_schema.sql) y usa
// sus propios nombres de variables, nunca los de Arrantza (VITE_SUPABASE_*).
// Las constantes viven en amway-config.ts para que el código de todas las
// páginas no arrastre supabase-js.
export { AMWAY_DB_KEY, AMWAY_DB_URL, amwayRpc };

let browserClient: SupabaseClient | null = null;

// Cliente para el navegador (panel de gestión y formularios públicos). La
// sesión del panel se guarda con una clave propia de Amway.
export function amwayDb(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(AMWAY_DB_URL, AMWAY_DB_KEY, {
      auth: { storageKey: "amway-premium-panel-auth", persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}

let clienteClient: SupabaseClient | null = null;

// Cuentas de cliente de la tienda: otra clave de sesión, para que entrar
// como cliente nunca pise (ni muestre) la sesión del panel de gestión.
export function clienteDb(): SupabaseClient {
  if (!clienteClient) {
    clienteClient = createClient(AMWAY_DB_URL, AMWAY_DB_KEY, {
      auth: { storageKey: CLIENTE_STORAGE_KEY, persistSession: true, autoRefreshToken: true },
    });
    if (typeof window !== "undefined") window.dispatchEvent(new Event(CLIENTE_DB_LISTO));
  }
  return clienteClient;
}

// Usuario de la cuenta de cliente que viene en la petición (Authorization:
// Bearer <token de sesión>), comprobado contra Supabase Auth. Sin token o
// con uno caducado devuelve null y el pedido sigue adelante como invitado.
export async function clienteDeRequest(request: Request): Promise<{ id: string; email: string | null } | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const res = await fetch(`${AMWAY_DB_URL}/auth/v1/user`, {
      headers: { apikey: AMWAY_DB_KEY, Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const u = (await res.json()) as { id?: unknown; email?: unknown };
    return typeof u.id === "string" ? { id: u.id, email: typeof u.email === "string" ? u.email : null } : null;
  } catch {
    return null;
  }
}

// IP del cliente que llega a la API (Vercel la pone en x-forwarded-for). Solo
// se usa para los límites anti-abuso; la base de datos guarda un hash.
export function ipDeRequest(request: Request): string | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  return ip ? ip.slice(0, 100) : null;
}

// La función SQL todavía no existe (migración pendiente): PostgREST responde
// PGRST202. Sirve para que la web funcione antes y después de migrar.
export function faltaFuncion(e: unknown): boolean {
  return e instanceof Error && e.message.includes("PGRST202");
}

// Límite por IP desde el servidor. Sin token, sin IP o sin la migración
// aplicada, deja pasar (los límites globales de la base de datos siguen).
export async function dentroDelLimite(accion: string, ip: string | null, max: number, segundos: number): Promise<boolean> {
  const token = process.env.AMWAY_PEDIDOS_TOKEN;
  if (!token || !ip) return true;
  try {
    return await amwayRpc<boolean>(
      "amway_limite_servidor",
      { p_token: token, p_accion: accion, p_ip: ip, p_max: max, p_segundos: segundos },
      { cache: "no-store" }
    );
  } catch {
    return true;
  }
}

// Fallos del servidor que la gestora o el desarrollador deben ver en el
// panel (pestaña Errores), no solo en los logs de Vercel: sobre todo un
// pedido que no se ha podido registrar. Nunca lanza.
export async function registrarErrorServidor(mensaje: string, error: unknown, ruta: string): Promise<void> {
  const detalle = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
  await amwayRpc(
    "amway_registrar_error",
    { p_mensaje: `[servidor] ${mensaje}`, p_detalle: detalle.slice(0, 4000), p_path: ruta, p_user_agent: "servidor" },
    { cache: "no-store" }
  ).catch(() => undefined);
}
