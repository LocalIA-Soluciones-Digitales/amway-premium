// URL y clave publicable de Supabase, sin importar supabase-js: lo que se
// carga en todas las páginas (analítica, anuncios, cuenta de cliente) solo
// necesita esto, y el cliente completo (~60 KB) se descarga cuando hace falta
// (ver amway-db.ts). Son públicas por diseño (acaban en el navegador), así
// que se dejan como valor por defecto para que la tienda funcione aunque
// falten en el entorno.
export const AMWAY_DB_URL =
  process.env.NEXT_PUBLIC_AMWAY_SUPABASE_URL ?? "https://ukhfaphloxlszomccgde.supabase.co";
export const AMWAY_DB_KEY =
  process.env.NEXT_PUBLIC_AMWAY_SUPABASE_ANON_KEY ?? "sb_publishable_CalLFpdGIixVv0fV3ic62w_fUH9qLqK";

// Clave con la que supabase-js guarda la sesión de la cuenta de cliente.
export const CLIENTE_STORAGE_KEY = "amway-premium-cliente-auth";

// Avisa de que el cliente de cuentas ya existe (alguien va a entrar o
// registrarse): ClienteProvider se engancha entonces a sus cambios de sesión.
export const CLIENTE_DB_LISTO = "amway:cliente-db";

// RPC pública (anónima) desde el navegador con fetch, sin cliente ni sesión.
// keepalive: los eventos que salen justo al cambiar de página no se pierden.
export function rpcPublica(fn: string, args: Record<string, unknown>): Promise<Response> {
  return fetch(`${AMWAY_DB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: AMWAY_DB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    keepalive: true,
  });
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
