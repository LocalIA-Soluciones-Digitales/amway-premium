"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  BarChart3,
  Bug,
  ClipboardList,
  LayoutDashboard,
  MessageSquareQuote,
  Package,
  Server,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { SITE } from "@/data/site-config";
import { AdminLogin } from "./AdminLogin";
import { DashboardShell, type ShellTab } from "./DashboardShell";
import { HoyPanel, type GestionTab } from "./HoyPanel";
import { PedidosPanel } from "./PedidosPanel";
import { ProductosPanel } from "./ProductosPanel";
import { SolicitudesPanel } from "./SolicitudesPanel";
import { ResenasPanel } from "./ResenasPanel";
import { ContabilidadPanel } from "./ContabilidadPanel";
import { InformesPanel } from "./dev/InformesPanel";
import { VentasInformePanel } from "./dev/VentasInformePanel";
import { EstadoPanel } from "./dev/EstadoPanel";
import { ErroresPanel } from "./dev/ErroresPanel";
import { AccesosPanel } from "./dev/AccesosPanel";
import { Loading, btnGhost, btnPrimary } from "./shared";

type Rol = "gestor" | "desarrollador";
type DevTab = "informes" | "ventas" | "estado" | "errores" | "accesos";

export interface Pendientes {
  pedidos: number;
  solicitudes: number;
  resenas: number;
}

export function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<Rol | null | undefined>(undefined);
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    const db = amwayDb();
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const comprobarRol = useCallback(async () => {
    const db = amwayDb();
    const { data } = await db.rpc("amway_mi_rol");
    setRol((data as Rol | null) ?? null);
    if (data) {
      const email = (await db.auth.getUser()).data.user?.email?.toLowerCase();
      const { data: me } = await db.from("amway_admins").select("nombre").eq("email", email ?? "").maybeSingle();
      setNombre((me as { nombre: string | null } | null)?.nombre ?? null);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setRol(undefined);
      return;
    }
    void comprobarRol();
  }, [session, comprobarRol]);

  if (loading || (session && rol === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loading />
      </div>
    );
  }

  if (!session) return <AdminLogin />;

  if (!rol) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
        <p className="font-display text-2xl text-carbon">Esta cuenta no tiene acceso al panel</p>
        <p className="text-sm text-stone">{session.user.email}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {/* Access is granted in amway_admins; re-check without logging out. */}
          <button type="button" className={btnPrimary} onClick={() => void comprobarRol()}>
            Volver a comprobar
          </button>
          <button type="button" className={btnGhost} onClick={() => amwayDb().auth.signOut()}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <Paneles session={session} rol={rol} nombre={nombre} />;
}

function Paneles({ session, rol, nombre }: { session: Session; rol: Rol; nombre: string | null }) {
  const router = useRouter();
  const [vista, setVista] = useState<"gestion" | "desarrollo">(rol === "desarrollador" ? "desarrollo" : "gestion");
  const [gTab, setGTab] = useState<GestionTab>("hoy");
  const [dTab, setDTab] = useState<DevTab>("informes");
  const [pendientes, setPendientes] = useState<Pendientes>({ pedidos: 0, solicitudes: 0, resenas: 0 });
  const [errores, setErrores] = useState(0);

  const refrescarPendientes = useCallback(async () => {
    const db = amwayDb();
    const [p, s, r] = await Promise.all([
      db.from("amway_pedidos").select("id", { count: "exact", head: true }).eq("estado", "pagado"),
      db.from("amway_solicitudes").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
      db.from("amway_resenas").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    ]);
    setPendientes({ pedidos: p.count ?? 0, solicitudes: s.count ?? 0, resenas: r.count ?? 0 });
    if (rol === "desarrollador") {
      const hace7 = new Date(Date.now() - 7 * 864e5).toISOString();
      const e = await db.from("amway_errores").select("id", { count: "exact", head: true }).gte("created_at", hace7);
      setErrores(e.count ?? 0);
    }
  }, [rol]);

  // Refresh badges on tab change and every minute (new web orders arrive on their own).
  useEffect(() => {
    void refrescarPendientes();
    const t = setInterval(refrescarPendientes, 60_000);
    return () => clearInterval(t);
  }, [refrescarPendientes, gTab, dTab]);

  async function signOut() {
    await amwayDb().auth.signOut();
    router.push("/");
  }

  const esDev = rol === "desarrollador";

  if (vista === "desarrollo" && esDev) {
    const tabs: ShellTab<DevTab>[] = [
      { id: "informes", label: "Visitas", icon: Activity },
      { id: "ventas", label: "Informe de ventas", icon: TrendingUp },
      { id: "estado", label: "Estado", icon: Server },
      { id: "errores", label: "Errores", icon: Bug, badge: errores },
      { id: "accesos", label: "Accesos", icon: ShieldCheck },
    ];
    return (
      <DashboardShell
        title="Desarrollo"
        subtitle={`${SITE.name} · Panel de desarrollo`}
        tabs={tabs}
        tab={dTab}
        onTab={setDTab}
        email={session.user.email}
        onSignOut={signOut}
        viewSwitch={{ current: "Panel de desarrollo", other: "Panel de gestión", onSwitch: () => setVista("gestion") }}
      >
        {dTab === "informes" && <InformesPanel />}
        {dTab === "ventas" && <VentasInformePanel />}
        {dTab === "estado" && <EstadoPanel session={session} />}
        {dTab === "errores" && <ErroresPanel />}
        {dTab === "accesos" && <AccesosPanel session={session} />}
      </DashboardShell>
    );
  }

  const tabs: ShellTab<GestionTab>[] = [
    { id: "hoy", label: "Hoy", icon: LayoutDashboard },
    { id: "pedidos", label: "Pedidos", icon: ShoppingBag, badge: pendientes.pedidos },
    { id: "productos", label: "Productos", icon: Package },
    { id: "solicitudes", label: "Solicitudes", icon: ClipboardList, badge: pendientes.solicitudes },
    { id: "resenas", label: "Reseñas", icon: MessageSquareQuote, badge: pendientes.resenas },
    { id: "contabilidad", label: "Contabilidad", icon: BarChart3 },
  ];

  return (
    <DashboardShell
      title="Gestión"
      subtitle={`${SITE.name} · Panel de gestión`}
      tabs={tabs}
      tab={gTab}
      onTab={setGTab}
      email={session.user.email}
      onSignOut={signOut}
      viewSwitch={esDev ? { current: "Panel de gestión", other: "Panel de desarrollo", onSwitch: () => setVista("desarrollo") } : undefined}
    >
      {gTab === "hoy" && <HoyPanel onNavigate={setGTab} pendientes={pendientes} nombre={nombre} />}
      {gTab === "pedidos" && <PedidosPanel onChange={refrescarPendientes} />}
      {gTab === "productos" && <ProductosPanel session={session} />}
      {gTab === "solicitudes" && <SolicitudesPanel onChange={refrescarPendientes} />}
      {gTab === "resenas" && <ResenasPanel session={session} onChange={refrescarPendientes} />}
      {gTab === "contabilidad" && <ContabilidadPanel />}
    </DashboardShell>
  );
}
