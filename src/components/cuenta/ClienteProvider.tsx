"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { CLIENTE_DB_LISTO, CLIENTE_STORAGE_KEY } from "@/lib/amway-config";
import { useRuta } from "@/hooks/useRuta";

// Cuenta de cliente opcional: la cabecera, la cesta y /cuenta leen de aquí
// la sesión y el perfil. Sin sesión todo funciona como invitado.

// supabase-js (~60 KB) solo se descarga si hay algo que hacer con la cuenta:
// una sesión guardada, estar en /cuenta (adonde llevan los enlaces de los
// correos de alta y de contraseña) o alguien que va a entrar o registrarse
// (clienteDb() avisa con CLIENTE_DB_LISTO). El resto de visitas, invitados
// sin cuenta, no lo cargan nunca.
const db = () => import("@/lib/amway-db").then((mod) => mod.clienteDb());

function haySesionGuardada(): boolean {
  try {
    return localStorage.getItem(CLIENTE_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export interface PerfilCliente {
  nombre: string;
  telefono: string;
  novedades: boolean;
  created_at: string | null;
}

interface ClienteContextValue {
  session: Session | null;
  perfil: PerfilCliente | null;
  cargando: boolean;
  guardarPerfil: (p: Partial<Omit<PerfilCliente, "created_at">>) => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
}

const ClienteContext = createContext<ClienteContextValue | null>(null);

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilCliente | null>(null);
  const [cargando, setCargando] = useState(true);
  const [activo, setActivo] = useState(false);
  const ruta = useRuta();

  useEffect(() => {
    if (activo) return;
    if (haySesionGuardada() || ruta.startsWith("/cuenta")) {
      setActivo(true);
      return;
    }
    setCargando(false);
    const activar = () => setActivo(true);
    window.addEventListener(CLIENTE_DB_LISTO, activar);
    return () => window.removeEventListener(CLIENTE_DB_LISTO, activar);
  }, [activo, ruta]);

  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    let cancelar = () => {};
    setCargando(true);
    void db().then((cliente) => {
      if (!vivo) return;
      const { data } = cliente.auth.onAuthStateChange((_e, s) => setSession(s));
      cancelar = () => data.subscription.unsubscribe();
      cliente.auth.getSession().then(({ data }) => {
        if (!vivo) return;
        setSession(data.session);
        if (!data.session) setCargando(false);
      });
    });
    return () => {
      vivo = false;
      cancelar();
    };
  }, [activo]);

  const userId = session?.user.id ?? null;

  // Perfil de la tienda. La primera vez (p. ej. al confirmar el correo) se
  // crea con lo que el cliente escribió al registrarse.
  useEffect(() => {
    if (!userId || !session) {
      setPerfil(null);
      return;
    }
    let vivo = true;
    (async () => {
      const cliente = await db();
      const { data } = await cliente
        .from("amway_clientes")
        .select("nombre, telefono, novedades, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      let p = data as PerfilCliente | null;
      if (!p) {
        const meta = session.user.user_metadata ?? {};
        const nuevo = {
          user_id: userId,
          nombre: texto(meta.nombre, 100) || null,
          telefono: texto(meta.telefono, 30) || null,
          novedades: meta.novedades === true,
        };
        const { data: creado } = await cliente
          .from("amway_clientes")
          .upsert(nuevo)
          .select("nombre, telefono, novedades, created_at")
          .maybeSingle();
        p = (creado as PerfilCliente | null) ?? { ...nuevo, created_at: null } as unknown as PerfilCliente;
      }
      if (vivo) {
        setPerfil({ nombre: p.nombre ?? "", telefono: p.telefono ?? "", novedades: !!p.novedades, created_at: p.created_at });
        setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
    // Solo al cambiar de usuario, no en cada refresco del token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const guardarPerfil = useCallback<ClienteContextValue["guardarPerfil"]>(
    async (cambios) => {
      if (!userId) return "Inicia sesión para guardar tus datos.";
      const fila = {
        user_id: userId,
        nombre: (cambios.nombre ?? perfil?.nombre ?? "").trim().slice(0, 100) || null,
        telefono: (cambios.telefono ?? perfil?.telefono ?? "").trim().slice(0, 30) || null,
        novedades: cambios.novedades ?? perfil?.novedades ?? false,
      };
      const { error } = await (await db()).from("amway_clientes").upsert(fila);
      if (error) return "No se pudieron guardar los cambios.";
      setPerfil((prev) => ({
        nombre: fila.nombre ?? "",
        telefono: fila.telefono ?? "",
        novedades: fila.novedades,
        created_at: prev?.created_at ?? null,
      }));
      return null;
    },
    [userId, perfil]
  );

  const cerrarSesion = useCallback(async () => {
    await (await db()).auth.signOut();
    setPerfil(null);
  }, []);

  const value = useMemo(
    () => ({ session, perfil, cargando, guardarPerfil, cerrarSesion }),
    [session, perfil, cargando, guardarPerfil, cerrarSesion]
  );
  return <ClienteContext.Provider value={value}>{children}</ClienteContext.Provider>;
}

export function useCliente(): ClienteContextValue {
  const ctx = useContext(ClienteContext);
  if (!ctx) throw new Error("useCliente must be used inside <ClienteProvider>");
  return ctx;
}

// Cabecera Authorization para que el servidor asocie el pedido a la cuenta.
export function cabeceraSesion(session: Session | null): Record<string, string> {
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}
