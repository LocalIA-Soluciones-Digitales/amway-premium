"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  BarChart3,
  Bug,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  MessageSquareQuote,
  Package,
  Server,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { hoyMadrid } from "@/lib/recogida";
import { SITE } from "@/data/site-config";
import { AdminLogin } from "./AdminLogin";
import { DashboardShell, type ShellTab } from "./DashboardShell";
import { HoyPanel, type GestionTab } from "./HoyPanel";
import { PedidosPanel } from "./PedidosPanel";
import { ClientesPanel } from "./ClientesPanel";
import { ProductosPanel } from "./ProductosPanel";
import { SolicitudesPanel } from "./SolicitudesPanel";
import { ResenasPanel } from "./ResenasPanel";
import { ContabilidadPanel } from "./ContabilidadPanel";
import { AnunciosPanel } from "./AnunciosPanel";
import { InformesPanel } from "./dev/InformesPanel";
import { VentasInformePanel } from "./dev/VentasInformePanel";
import { EstadoPanel } from "./dev/EstadoPanel";
import { ErroresPanel } from "./dev/ErroresPanel";
import { AccesosPanel } from "./dev/AccesosPanel";
import { AvisosBoton, sonidoActivado } from "./AvisosBoton";
import { registrarSW } from "./useAvisosPush";
import { Loading, btnGhost, btnPrimary, eur, recogidaCorta } from "./shared";

// Two short soft tones via WebAudio, so there's no audio file to ship.
function sonidoPedido() {
  if (!sonidoActivado()) return;
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = i ? 880 : 660;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
  } catch {
    // Audio blocked until the user interacts: the toast is enough.
  }
}

type Rol = "gestor" | "desarrollador";
type DevTab = "informes" | "ventas" | "estado" | "errores" | "accesos";

export interface Pendientes {
  pedidos: number;
  solicitudes: number;
  resenas: number;
  recogidasHoy: number;
  atrasados: number;
}

interface AlertaPedido {
  id: string;
  texto: string;
}

interface UltimoPedido {
  id: string;
  numero: number;
  total_eur: number;
  cliente_nombre: string | null;
  recogida_fecha: string | null;
  recogida_hora: string | null;
}

function textoAlerta(u: UltimoPedido): string {
  const recoge = recogidaCorta(u);
  return `Nuevo pedido #${u.numero}${u.cliente_nombre ? ` de ${u.cliente_nombre}` : ""} · ${eur(u.total_eur)}${
    recoge ? ` · recoge ${recoge}` : ""
  }`;
}

const TABS_GESTION: GestionTab[] = ["hoy", "pedidos", "clientes", "productos", "solicitudes", "contabilidad", "resenas", "anuncios"];

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
  const [pendientes, setPendientes] = useState<Pendientes>({ pedidos: 0, solicitudes: 0, resenas: 0, recogidasHoy: 0, atrasados: 0 });
  const [errores, setErrores] = useState(0);
  const [alertas, setAlertas] = useState<AlertaPedido[]>([]);
  // Pedido a desplegar al llegar desde un aviso (?pedido=…) o desde el toast.
  const [pedidoFoco, setPedidoFoco] = useState<string | null>(null);
  // Sube con cada pedido nuevo para que Hoy y Pedidos recarguen solos.
  const [recarga, setRecarga] = useState(0);
  const ultimoPedido = useRef<number | null>(null);

  // Enlace directo desde el aviso push: /admin?tab=pedidos&pedido=<id>.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("tab") as GestionTab | null;
    const id = q.get("pedido");
    if ((t && TABS_GESTION.includes(t)) || id) {
      setVista("gestion");
      setGTab(id ? "pedidos" : t!);
      if (id) setPedidoFoco(id);
      window.history.replaceState(null, "", "/admin");
    }
    // El service worker controla /admin: así se puede instalar y avisar.
    void registrarSW();
  }, []);

  const nuevoPedido = useCallback((u: UltimoPedido) => {
    if (ultimoPedido.current != null && u.numero <= ultimoPedido.current) return;
    const primeraCarga = ultimoPedido.current == null;
    ultimoPedido.current = u.numero;
    if (primeraCarga) return;
    setAlertas((prev) => [{ id: u.id, texto: textoAlerta(u) }, ...prev.filter((a) => a.id !== u.id)].slice(0, 4));
    setRecarga((n) => n + 1);
    sonidoPedido();
  }, []);

  const refrescarPendientes = useCallback(async () => {
    const db = amwayDb();
    const hoy = hoyMadrid();
    const activos = ["pendiente", "pagado", "enviado"];
    const [p, s, r, rh, at] = await Promise.all([
      db.from("amway_pedidos").select("id", { count: "exact", head: true }).in("estado", ["pendiente", "pagado"]),
      db.from("amway_solicitudes").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
      db.from("amway_resenas").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
      db.from("amway_pedidos").select("id", { count: "exact", head: true }).in("estado", activos).eq("recogida_fecha", hoy),
      db.from("amway_pedidos").select("id", { count: "exact", head: true }).in("estado", activos).lt("recogida_fecha", hoy),
    ]);
    setPendientes({
      pedidos: p.count ?? 0,
      solicitudes: s.count ?? 0,
      resenas: r.count ?? 0,
      recogidasHoy: rh.count ?? 0,
      atrasados: at.count ?? 0,
    });

    // Aviso de pedido nuevo de la web (como en Arrantza): compara el último
    // nº de pedido. Es el respaldo del aviso en directo (Realtime).
    const { data: ult } = await db
      .from("amway_pedidos")
      .select("id, numero, total_eur, cliente_nombre, recogida_fecha, recogida_hora")
      .eq("origen", "web")
      .order("numero", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ult) nuevoPedido(ult as UltimoPedido);
    else ultimoPedido.current ??= 0;

    if (rol === "desarrollador") {
      const hace7 = new Date(Date.now() - 7 * 864e5).toISOString();
      const e = await db.from("amway_errores").select("id", { count: "exact", head: true }).gte("created_at", hace7);
      setErrores(e.count ?? 0);
    }
  }, [rol, nuevoPedido]);

  // Refresh badges on tab change and every 45 s (new web orders arrive on their own).
  useEffect(() => {
    void refrescarPendientes();
    const t = setInterval(refrescarPendientes, 45_000);
    return () => clearInterval(t);
  }, [refrescarPendientes, gTab, dTab]);

  // Al volver a la pestaña o a la app, ponerse al día sin esperar al intervalo.
  useEffect(() => {
    const f = () => {
      if (document.visibilityState === "visible") void refrescarPendientes();
    };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, [refrescarPendientes]);

  // Pedidos nuevos al instante: Realtime de Supabase (la RLS solo deja ver
  // amway_pedidos a los administradores) y el aviso push si el panel está abierto.
  useEffect(() => {
    const db = amwayDb();
    const canal = db
      .channel("amway-pedidos-panel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "amway_pedidos" }, (payload) => {
        const u = payload.new as UltimoPedido & { origen: string };
        if (u.origen === "web") nuevoPedido(u);
        void refrescarPendientes();
      })
      .subscribe();
    const onMensaje = (e: MessageEvent) => {
      if ((e.data as { tipo?: string } | null)?.tipo === "push") void refrescarPendientes();
    };
    navigator.serviceWorker?.addEventListener("message", onMensaje);
    return () => {
      void db.removeChannel(canal);
      navigator.serviceWorker?.removeEventListener("message", onMensaje);
    };
  }, [nuevoPedido, refrescarPendientes]);

  // Trabajo pendiente en el título de la pestaña y en el icono de la app
  // instalada (el numerito, donde el sistema lo admite).
  useEffect(() => {
    const n = pendientes.pedidos + pendientes.solicitudes;
    document.title = `${n > 0 ? `(${n}) ` : ""}Panel · ${SITE.name}`;
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (n > 0) nav.setAppBadge?.(n).catch(() => {});
    else nav.clearAppBadge?.().catch(() => {});
  }, [pendientes]);

  const abrirPedido = useCallback((id: string) => {
    setAlertas((prev) => prev.filter((a) => a.id !== id));
    setVista("gestion");
    setGTab("pedidos");
    setPedidoFoco(id);
  }, []);

  // Los avisos se quedan hasta que se ven o se cierran: si entra un pedido
  // mientras no miras, sigue ahí al volver.
  const toast = alertas.length > 0 && (
    <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[80] flex flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-[24rem]">
      {alertas.map((a) => (
        <div
          key={a.id}
          role="status"
          className="flex items-center gap-3 rounded-2xl bg-forest py-3 pl-4 pr-2 text-sm text-cream shadow-[0_20px_50px_rgba(28,26,22,0.3)]"
        >
          <button type="button" onClick={() => abrirPedido(a.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream/15">
              <ShoppingBag size={17} />
            </span>
            <span className="min-w-0">
              <span className="block font-medium leading-snug">{a.texto}</span>
              <span className="text-xs text-cream/70">Pulsa para verlo</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAlertas((prev) => prev.filter((x) => x.id !== a.id))}
            aria-label="Cerrar aviso"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-cream/70 hover:bg-cream/10 hover:text-cream"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );

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
        actions={<AvisosBoton />}
        viewSwitch={{ current: "Panel de desarrollo", other: "Panel de gestión", onSwitch: () => setVista("gestion") }}
      >
        {dTab === "informes" && <InformesPanel />}
        {dTab === "ventas" && <VentasInformePanel />}
        {dTab === "estado" && <EstadoPanel session={session} />}
        {dTab === "errores" && <ErroresPanel />}
        {dTab === "accesos" && <AccesosPanel session={session} />}
        {toast}
      </DashboardShell>
    );
  }

  const tabs: ShellTab<GestionTab>[] = [
    { id: "hoy", label: "Hoy", icon: LayoutDashboard, badge: pendientes.recogidasHoy + pendientes.atrasados },
    { id: "pedidos", label: "Pedidos", icon: ShoppingBag, badge: pendientes.pedidos },
    { id: "clientes", label: "Clientes", icon: UsersRound },
    { id: "productos", label: "Productos", icon: Package },
    { id: "solicitudes", label: "Solicitudes", icon: ClipboardList, badge: pendientes.solicitudes },
    { id: "contabilidad", label: "Contabilidad", icon: BarChart3 },
    { id: "resenas", label: "Reseñas", icon: MessageSquareQuote, badge: pendientes.resenas },
    { id: "anuncios", label: "Anuncios", icon: Megaphone },
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
      actions={<AvisosBoton />}
      viewSwitch={esDev ? { current: "Panel de gestión", other: "Panel de desarrollo", onSwitch: () => setVista("desarrollo") } : undefined}
    >
      {gTab === "hoy" && (
        <HoyPanel
          key={recarga}
          onNavigate={setGTab}
          onChange={refrescarPendientes}
          pendientes={pendientes}
          nombre={nombre}
        />
      )}
      {gTab === "pedidos" && (
        <PedidosPanel onChange={refrescarPendientes} recarga={recarga} foco={pedidoFoco} onFocoVisto={() => setPedidoFoco(null)} />
      )}
      {gTab === "clientes" && <ClientesPanel />}
      {gTab === "productos" && <ProductosPanel session={session} />}
      {gTab === "solicitudes" && <SolicitudesPanel onChange={refrescarPendientes} />}
      {gTab === "resenas" && <ResenasPanel session={session} onChange={refrescarPendientes} />}
      {gTab === "contabilidad" && <ContabilidadPanel />}
      {gTab === "anuncios" && <AnunciosPanel />}
      {toast}
    </DashboardShell>
  );
}
