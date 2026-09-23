"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquareQuote,
  Package,
  ShoppingBag,
} from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { SITE } from "@/data/site-config";
import { inputClass, btnGhost, btnPrimary } from "./shared";
import { ResumenPanel } from "./ResumenPanel";
import { PedidosPanel } from "./PedidosPanel";
import { ProductosPanel } from "./ProductosPanel";
import { SolicitudesPanel } from "./SolicitudesPanel";
import { ResenasPanel } from "./ResenasPanel";
import { ContabilidadPanel } from "./ContabilidadPanel";

export type AdminView = "resumen" | "pedidos" | "productos" | "solicitudes" | "resenas" | "contabilidad";

const NAV: { id: AdminView; label: string; icon: typeof Package }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag },
  { id: "productos", label: "Productos y precios", icon: Package },
  { id: "solicitudes", label: "Solicitudes", icon: ClipboardList },
  { id: "resenas", label: "Reseñas", icon: MessageSquareQuote },
  { id: "contabilidad", label: "Contabilidad", icon: BarChart3 },
];

export interface Pendientes {
  pedidos: number;
  solicitudes: number;
  resenas: number;
}

export function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const db = amwayDb();
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const comprobarAdmin = useCallback(async () => {
    const { data } = await amwayDb().rpc("amway_es_admin");
    setEsAdmin(data === true);
  }, []);

  useEffect(() => {
    if (!session) {
      setEsAdmin(null);
      return;
    }
    void comprobarAdmin();
  }, [session, comprobarAdmin]);

  if (loading || (session && esAdmin === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-stone" />
      </div>
    );
  }

  if (!session) return <LoginForm />;

  if (!esAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
        <p className="font-display text-2xl text-carbon">Esta cuenta no tiene acceso al panel</p>
        <p className="text-sm text-stone">{session.user.email}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {/* Access is granted in amway_admins; re-check without logging out. */}
          <button type="button" className={btnPrimary} onClick={() => void comprobarAdmin()}>
            Volver a comprobar
          </button>
          <button type="button" className={btnGhost} onClick={() => amwayDb().auth.signOut()}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <AdminShell session={session} />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error: authError } = await amwayDb().auth.signInWithPassword({ email: email.trim(), password });
    if (authError) setError("Correo o contraseña incorrectos");
    setSending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(28,26,22,0.08)]">
        <p className="font-display text-xl text-carbon">
          {SITE.name}
          <span className="ml-1 text-gold">.</span>
        </p>
        <h1 className="mt-6 font-display text-3xl text-carbon">Panel de gestión</h1>
        <p className="mt-1 text-sm text-stone">Accede con tu cuenta de administración.</p>
        <div className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {error && <p role="alert" className="text-sm text-xs-red">{error}</p>}
          <button type="submit" disabled={sending} className={cn(btnPrimary, "mt-2 h-11")}>
            {sending && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
        </div>
        <Link href="/" className="mt-6 block text-center text-xs text-stone hover:text-carbon">
          ← Volver a la tienda
        </Link>
      </form>
    </div>
  );
}

function AdminShell({ session }: { session: Session }) {
  const [view, setView] = useState<AdminView>("resumen");
  const [pendientes, setPendientes] = useState<Pendientes>({ pedidos: 0, solicitudes: 0, resenas: 0 });

  const refrescarPendientes = useCallback(async () => {
    const db = amwayDb();
    const [p, s, r] = await Promise.all([
      db.from("amway_pedidos").select("id", { count: "exact", head: true }).eq("estado", "pagado"),
      db.from("amway_solicitudes").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
      db.from("amway_resenas").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    ]);
    setPendientes({ pedidos: p.count ?? 0, solicitudes: s.count ?? 0, resenas: r.count ?? 0 });
  }, []);

  useEffect(() => {
    void refrescarPendientes();
  }, [refrescarPendientes, view]);

  const badge: Partial<Record<AdminView, number>> = {
    pedidos: pendientes.pedidos,
    solicitudes: pendientes.solicitudes,
    resenas: pendientes.resenas,
  };

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 z-30 border-b border-carbon/8 bg-cream-soft/95 backdrop-blur lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 pb-2 pt-[calc(1rem+env(safe-area-inset-top))] lg:block lg:px-6 lg:pt-7">
          <Link href="/" className="font-display text-lg text-carbon">
            {SITE.name}
            <span className="ml-1 text-gold">.</span>
          </Link>
          <p className="hidden text-[11px] uppercase tracking-[0.2em] text-stone lg:mt-1 lg:block">Gestión</p>
          <button
            type="button"
            onClick={() => amwayDb().auth.signOut()}
            aria-label="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-carbon/5 lg:hidden"
          >
            <LogOut size={16} />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-6 lg:flex-col lg:overflow-visible lg:px-3">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition lg:py-2.5",
                view === id ? "bg-carbon text-cream" : "text-stone hover:bg-carbon/5 hover:text-carbon"
              )}
            >
              <Icon size={16} />
              <span className="whitespace-nowrap">{label}</span>
              {!!badge[id] && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                    view === id ? "bg-cream text-carbon" : "bg-xs-red text-cream"
                  )}
                >
                  {badge[id]}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-carbon/8 p-4 lg:block">
          <p className="truncate text-xs text-stone">{session.user.email}</p>
          <button
            type="button"
            onClick={() => amwayDb().auth.signOut()}
            className="mt-2 flex items-center gap-2 text-sm text-carbon hover:text-xs-red"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-w-0 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        {view === "resumen" && <ResumenPanel onNavigate={setView} pendientes={pendientes} />}
        {view === "pedidos" && <PedidosPanel onChange={refrescarPendientes} />}
        {view === "productos" && <ProductosPanel session={session} />}
        {view === "solicitudes" && <SolicitudesPanel onChange={refrescarPendientes} />}
        {view === "resenas" && <ResenasPanel session={session} onChange={refrescarPendientes} />}
        {view === "contabilidad" && <ContabilidadPanel />}
      </div>
    </div>
  );
}
