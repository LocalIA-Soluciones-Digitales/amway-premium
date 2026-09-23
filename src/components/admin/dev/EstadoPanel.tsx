"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertTriangle, CheckCircle2, CircleDashed, Database, GitCommit, Server } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { PRODUCTS } from "@/data/products";
import { Card, CardTitle, Loading, PanelHeader } from "../shared";

interface Estado {
  stripe: "live" | "test" | null;
  webhook: boolean;
  pedidosToken: boolean;
  supabaseEnv: boolean;
  entorno: string;
  commit: string | null;
  commitMensaje: string | null;
  region: string | null;
}

const TABLAS = [
  ["amway_pedidos", "Pedidos"],
  ["amway_productos", "Productos con ajustes"],
  ["amway_solicitudes", "Solicitudes"],
  ["amway_resenas", "Reseñas"],
  ["amway_gastos", "Gastos"],
  ["amway_visitas", "Eventos de visitas"],
  ["amway_errores", "Errores registrados"],
  ["amway_admins", "Usuarios del panel"],
] as const;

function Check({ ok, warn, label, detail }: { ok: boolean; warn?: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {ok ? (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : warn ? (
        <CircleDashed size={18} className="mt-0.5 shrink-0 text-stone" />
      ) : (
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
      )}
      <div>
        <p className="text-sm font-medium text-carbon">{label}</p>
        <p className="text-xs text-stone">{detail}</p>
      </div>
    </li>
  );
}

export function EstadoPanel({ session }: { session: Session }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [conteos, setConteos] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch("/api/admin/estado", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setEstado)
      .catch(() => setEstado(null));
    const db = amwayDb();
    Promise.all(TABLAS.map(([t]) => db.from(t).select("*", { count: "exact", head: true }))).then((res) =>
      setConteos(Object.fromEntries(res.map((r, i) => [TABLAS[i][0], r.count ?? 0])))
    );
  }, [session.access_token]);

  return (
    <div>
      <PanelHeader title="Estado del sistema" description="Integraciones, despliegue y volumen de datos de la tienda." />
      {!conteos ? (
        <Loading />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Integraciones</CardTitle>
            {!estado ? (
              <p className="text-sm text-stone">No se pudo consultar el servidor.</p>
            ) : (
              <ul className="divide-y divide-carbon/[0.06]">
                <Check
                  ok={!!estado.stripe}
                  label={`Pagos con tarjeta (Stripe)${estado.stripe === "test" ? " · modo pruebas" : estado.stripe === "live" ? " · modo real" : ""}`}
                  detail={estado.stripe ? "STRIPE_SECRET_KEY configurada." : "Falta STRIPE_SECRET_KEY en Vercel: el botón de pagar no cobra."}
                />
                <Check
                  ok={estado.pedidosToken}
                  label="Registro de pedidos pagados"
                  detail={estado.pedidosToken ? "AMWAY_PEDIDOS_TOKEN configurado." : "Falta AMWAY_PEDIDOS_TOKEN: los pagos no aparecerán en Pedidos."}
                />
                <Check
                  ok={estado.webhook}
                  warn={!estado.webhook}
                  label="Webhook de Stripe (opcional)"
                  detail={estado.webhook ? "STRIPE_WEBHOOK_SECRET configurado." : "Sin webhook: el pedido se registra al volver a la página de éxito."}
                />
                <Check
                  ok
                  label="Base de datos (Supabase)"
                  detail={estado.supabaseEnv ? "Configurada por variables de entorno." : "Usando la configuración pública por defecto del código."}
                />
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Despliegue</CardTitle>
            {estado && (
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Server size={16} className="text-stone" />
                  <dt className="w-24 text-stone">Entorno</dt>
                  <dd className="text-carbon">
                    {estado.entorno}
                    {estado.region && <span className="text-stone"> · {estado.region}</span>}
                  </dd>
                </div>
                <div className="flex items-start gap-3">
                  <GitCommit size={16} className="mt-0.5 text-stone" />
                  <dt className="w-24 shrink-0 text-stone">Versión</dt>
                  <dd className="min-w-0 text-carbon">
                    {estado.commit ?? "local"}
                    {estado.commitMensaje && <p className="line-clamp-2 text-xs text-stone">{estado.commitMensaje}</p>}
                  </dd>
                </div>
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-stone" />
                  <dt className="w-24 text-stone">Catálogo</dt>
                  <dd className="text-carbon">{PRODUCTS.length} productos en el código</dd>
                </div>
              </dl>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <CardTitle>Datos guardados</CardTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TABLAS.map(([t, label]) => (
                <div key={t} className="rounded-xl bg-cream/70 px-4 py-3">
                  <p className="font-display text-2xl tabular-nums text-carbon">{conteos[t]?.toLocaleString("es-ES")}</p>
                  <p className="text-xs text-stone">{label}</p>
                  <p className="mt-1 font-mono text-[10px] text-stone/70">{t}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-stone">
              Todo lo de esta tienda vive en tablas <code className="font-mono">amway_*</code> del Supabase compartido, aislado del
              resto de productos.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
