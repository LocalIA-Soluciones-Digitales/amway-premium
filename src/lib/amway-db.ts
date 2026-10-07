import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase compartido con otras webs del estudio: esta tienda solo toca
// tablas/funciones con prefijo amway_ (ver supabase/amway_schema.sql) y usa
// sus propios nombres de variables, nunca los de Arrantza (VITE_SUPABASE_*).
// URL y clave publicable son públicas por diseño (acaban en el navegador),
// así que se dejan como valor por defecto para que la tienda funcione aunque
// falten en el entorno.
export const AMWAY_DB_URL =
  process.env.NEXT_PUBLIC_AMWAY_SUPABASE_URL ?? "https://ukhfaphloxlszomccgde.supabase.co";
export const AMWAY_DB_KEY =
  process.env.NEXT_PUBLIC_AMWAY_SUPABASE_ANON_KEY ?? "sb_publishable_CalLFpdGIixVv0fV3ic62w_fUH9qLqK";

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
      auth: { storageKey: "amway-premium-cliente-auth", persistSession: true, autoRefreshToken: true },
    });
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

// Llamada RPC directa por REST (sin cliente ni sesión), para el servidor.
export async function amwayRpc<T>(
  fn: string,
  args?: Record<string, unknown>,
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
): Promise<T> {
  const headers = { apikey: AMWAY_DB_KEY, "Content-Type": "application/json" };
  const res = args
    ? await fetch(`${AMWAY_DB_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(args), ...init })
    : await fetch(`${AMWAY_DB_URL}/rest/v1/rpc/${fn}`, { headers, ...init });
  if (!res.ok) throw new Error(`${fn}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
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
