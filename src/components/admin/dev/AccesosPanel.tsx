"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, Loading, PanelHeader, btnPrimary, fecha, inputClass } from "../shared";

interface Admin {
  email: string;
  nombre: string | null;
  rol: "gestor" | "desarrollador";
  created_at: string;
}

export function AccesosPanel({ session }: { session: Session }) {
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Admin["rol"]>("gestor");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const yo = session.user.email?.toLowerCase();

  const cargar = useCallback(async () => {
    const { data } = await amwayDb().from("amway_admins").select("*").order("created_at");
    setAdmins((data as Admin[] | null) ?? []);
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
    await amwayDb().from("amway_admins").update({ rol: nuevo }).eq("email", a.email);
    void cargar();
  }

  async function quitar(a: Admin) {
    if (!confirm(`¿Quitar el acceso al panel a ${a.email}?`)) return;
    await amwayDb().from("amway_admins").delete().eq("email", a.email);
    void cargar();
  }

  return (
    <div>
      <PanelHeader
        title="Accesos al panel"
        description="Quién puede entrar y con qué rol. El gestor lleva la tienda; el desarrollador además ve informes, visitas, errores y esta sección."
      />
      {!admins ? (
        <Loading />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
          <Card className="p-0">
            <ul className="divide-y divide-carbon/[0.06]">
              {admins.map((a) => (
                <li key={a.email} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      a.rol === "desarrollador" ? "bg-carbon text-cream" : "bg-cream text-stone"
                    )}
                  >
                    {a.rol === "desarrollador" ? <ShieldCheck size={17} /> : <UserRound size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-carbon">
                      {a.nombre || a.email}
                      {a.email === yo && <span className="ml-2 text-xs font-normal text-stone">(tú)</span>}
                    </p>
                    <p className="truncate text-xs text-stone">
                      {a.email} · desde {fecha(a.created_at)}
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
              ))}
            </ul>
          </Card>

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
                La persona necesita además un usuario con ese correo en Supabase → Authentication → Users (con contraseña y
                confirmado). Usa un correo exclusivo para Amway: el Supabase lo comparten otros productos.
              </p>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
