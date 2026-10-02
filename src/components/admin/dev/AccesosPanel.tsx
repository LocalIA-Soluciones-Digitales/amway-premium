"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertTriangle, ArrowUpRight, KeyRound, Loader2, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, Loading, PanelHeader, btnPrimary, fecha, inputClass } from "../shared";
import { haceCuanto } from "./analitica";

interface Admin {
  email: string;
  nombre: string | null;
  rol: "gestor" | "desarrollador";
  created_at: string;
}

// Lo que dice Supabase Auth de cada correo con acceso (función amway_actividad_admins).
interface Actividad {
  email: string;
  tiene_usuario: boolean;
  confirmado: boolean;
  ultimo_acceso: string | null;
  usuario_desde: string | null;
}

const USUARIOS_AUTH = "https://supabase.com/dashboard/project/ukhfaphloxlszomccgde/auth/users";
const DIA = 86_400_000;

export function AccesosPanel({ session }: { session: Session }) {
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [actividad, setActividad] = useState<Map<string, Actividad>>(new Map());
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Admin["rol"]>("gestor");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const yo = session.user.email?.toLowerCase();

  const cargar = useCallback(async () => {
    const db = amwayDb();
    const [a, act] = await Promise.all([db.from("amway_admins").select("*").order("created_at"), db.rpc("amway_actividad_admins")]);
    setAdmins((a.data as Admin[] | null) ?? []);
    setActividad(new Map(((act.data as Actividad[] | null) ?? []).map((x) => [x.email, x])));
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function add(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: err } = await amwayDb()
      .from("amway_admins")
      .insert({ email: email.trim().toLowerCase(), nombre: nombre.trim() || null, rol });
    setSaving(false);
    if (err) {
      setError(err.code === "23505" ? "Ese correo ya tiene acceso." : "No se pudo dar acceso.");
      return;
    }
    setEmail("");
    setNombre("");
    void cargar();
  }

  async function cambiarRol(a: Admin, nuevo: Admin["rol"]) {
    if (nuevo === "desarrollador" && !confirm(`¿Dar acceso completo (informes, errores y accesos) a ${a.email}?`)) return;
    await amwayDb().from("amway_admins").update({ rol: nuevo }).eq("email", a.email);
    void cargar();
  }

  async function quitar(a: Admin) {
    if (!confirm(`¿Quitar el acceso al panel a ${a.email}?`)) return;
    await amwayDb().from("amway_admins").delete().eq("email", a.email);
    void cargar();
  }

  const sinUsuario = admins?.filter((a) => actividad.size > 0 && !actividad.get(a.email)?.tiene_usuario) ?? [];
  const sinConfirmar = admins?.filter((a) => actividad.get(a.email)?.tiene_usuario && !actividad.get(a.email)?.confirmado) ?? [];
  const activos7 = admins?.filter((a) => {
    const u = actividad.get(a.email)?.ultimo_acceso;
    return u && Date.now() - new Date(u).getTime() < 7 * DIA;
  }).length;
  const inactivos = admins?.filter((a) => {
    const u = actividad.get(a.email)?.ultimo_acceso;
    return a.email !== yo && u && Date.now() - new Date(u).getTime() > 60 * DIA;
  }) ?? [];
  const caduca = session.expires_at ? new Date(session.expires_at * 1000) : null;

  return (
    <div>
      <PanelHeader
        title="Accesos al panel"
        description="Quién puede entrar, con qué rol y cuándo entró por última vez. El gestor lleva la tienda; el desarrollador además ve informes, visitas, errores y esta sección."
      />
      {!admins ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[
              ["Con acceso", admins.length],
              ["Desarrolladores", admins.filter((a) => a.rol === "desarrollador").length],
              ["Gestores", admins.filter((a) => a.rol === "gestor").length],
              ["Activos 7 días", actividad.size ? activos7 ?? 0 : "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-carbon/[0.07] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">{label}</p>
                <p className="mt-1 font-display text-2xl tabular-nums text-carbon">{value}</p>
              </div>
            ))}
          </div>

          {(sinUsuario.length > 0 || sinConfirmar.length > 0 || inactivos.length > 0) && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-carbon">
                <AlertTriangle size={16} className="text-amber-600" /> Revisa estos accesos
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-carbon/85">
                {sinUsuario.map((a) => (
                  <li key={`u${a.email}`}>
                    <b>{a.email}</b> tiene permiso pero no existe en Supabase Auth: no podrá entrar.{" "}
                    <a href={USUARIOS_AUTH} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline underline-offset-2">
                      Crear usuario <ArrowUpRight size={12} />
                    </a>
                  </li>
                ))}
                {sinConfirmar.map((a) => (
                  <li key={`c${a.email}`}>
                    <b>{a.email}</b> no ha confirmado el correo: confírmalo en Supabase → Authentication → Users.
                  </li>
                ))}
                {inactivos.map((a) => (
                  <li key={`i${a.email}`}>
                    <b>{a.email}</b> no entra desde {haceCuanto(actividad.get(a.email)?.ultimo_acceso)}. Si ya no lo necesita, quítale el acceso.
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
            <Card className="p-0">
              <ul className="divide-y divide-carbon/[0.06]">
                {admins.map((a) => {
                  const act = actividad.get(a.email);
                  const reciente = act?.ultimo_acceso && Date.now() - new Date(act.ultimo_acceso).getTime() < DIA;
                  return (
                    <li key={a.email} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <span
                        className={cn(
                          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          a.rol === "desarrollador" ? "bg-carbon text-cream" : "bg-cream text-stone"
                        )}
                      >
                        {a.rol === "desarrollador" ? <ShieldCheck size={17} /> : <UserRound size={17} />}
                        {reciente && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" title="Ha entrado hoy" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-carbon">
                          {a.nombre || a.email}
                          {a.email === yo && <span className="ml-2 text-xs font-normal text-stone">(tú)</span>}
                        </p>
                        <p className="truncate text-xs text-stone">
                          {a.email} · acceso desde {fecha(a.created_at)}
                        </p>
                        <p className="mt-0.5 text-xs">
                          {!actividad.size ? null : !act?.tiene_usuario ? (
                            <span className="text-red-600">Sin usuario en Supabase</span>
                          ) : (
                            <span className={cn(reciente ? "text-emerald-700" : "text-stone")}>
                              Último acceso: {haceCuanto(act.ultimo_acceso)}
                              {!act.confirmado && <span className="text-amber-700"> · sin confirmar</span>}
                            </span>
                          )}
                        </p>
                      </div>
                      {a.email === yo ? (
                        <Badge tone="green">{a.rol === "desarrollador" ? "Desarrollador" : "Gestor"}</Badge>
                      ) : (
                        <>
                          <select
                            value={a.rol}
                            onChange={(e) => cambiarRol(a, e.target.value as Admin["rol"])}
                            className={cn(inputClass, "h-9")}
                            aria-label={`Rol de ${a.email}`}
                          >
                            <option value="gestor">Gestor</option>
                            <option value="desarrollador">Desarrollador</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => quitar(a)}
                            aria-label={`Quitar acceso a ${a.email}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-stone transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardTitle>Dar acceso</CardTitle>
                <form onSubmit={add} className="flex flex-col gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className={inputClass}
                  />
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (opcional)" className={inputClass} />
                  <select value={rol} onChange={(e) => setRol(e.target.value as Admin["rol"])} className={inputClass} aria-label="Rol">
                    <option value="gestor">Gestor · lleva la tienda</option>
                    <option value="desarrollador">Desarrollador · acceso completo</option>
                  </select>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <button type="submit" disabled={saving} className={btnPrimary}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Dar acceso
                  </button>
                  <p className="text-xs leading-relaxed text-stone">
                    La persona necesita además un usuario con ese correo en{" "}
                    <a href={USUARIOS_AUTH} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                      Supabase → Authentication → Users
                    </a>{" "}
                    (con contraseña y confirmado). Usa un correo exclusivo para Amway: el Supabase lo comparten otros productos.
                  </p>
                </form>
              </Card>

              <Card>
                <CardTitle>
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound size={13} /> Tu sesión
                  </span>
                </CardTitle>
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone">Correo</dt>
                    <dd className="truncate text-carbon">{session.user.email}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone">Último acceso</dt>
                    <dd className="text-carbon">{haceCuanto(session.user.last_sign_in_at)}</dd>
                  </div>
                  {caduca && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone">Token renovado hasta</dt>
                      <dd className="tabular-nums text-carbon">{caduca.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone">Método</dt>
                    <dd className="text-carbon">{session.user.app_metadata?.provider ?? "email"}</dd>
                  </div>
                </dl>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
