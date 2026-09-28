"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { clienteDb } from "@/lib/amway-db";

// Cuenta de cliente opcional: la cabecera, la cesta y /cuenta leen de aquí
// la sesión y el perfil. Sin sesión todo funciona como invitado.

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

  useEffect(() => {
    const db = clienteDb();
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setCargando(false);
    });
    const { data } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

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
      const db = clienteDb();
      const { data } = await db
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
        const { data: creado } = await db
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
      const { error } = await clienteDb().from("amway_clientes").upsert(fila);
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
    await clienteDb().auth.signOut();
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
