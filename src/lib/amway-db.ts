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
