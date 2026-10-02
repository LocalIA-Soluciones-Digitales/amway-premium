"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  Copy,
  Cpu,
  Database,
  GitBranch,
  GitCommit,
  RefreshCw,
  Server,
  ShieldAlert,
  XCircle,
  Zap,
} from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { PRODUCTS } from "@/data/products";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, Loading, PanelHeader, btnGhost, eur } from "../shared";
import { haceCuanto } from "./analitica";

interface StripeInfo {
  ms: number;
  error: string | null;
  saldo: { disponible: number; pendiente: number } | null;
  webhook: { url: string; estado: string; eventosOk: boolean; faltan: string[] } | null;
  otrosWebhooks: number;
  cobros30d: number;
  sinRegistrar: { id: string; importe: number; fecha: string; email: string | null; nombre: string | null }[];
}

interface Estado {
  stripe: "live" | "test" | null;
  webhook: boolean;
  webhookUrl: string;
  pedidosToken: boolean;
  push: boolean;
  supabaseEnv: boolean;
  entorno: string;
  commit: string | null;
  commitMensaje: string | null;
  commitAutor: string | null;
  rama: string | null;
  repo: string | null;
  region: string | null;
  node: string;
  dbMs: number;
  stripeInfo: StripeInfo | null;
}

// Tabla, etiqueta y columna de fecha para medir volumen y frescura.
const TABLAS = [
  ["amway_pedidos", "Pedidos", "created_at"],
  ["amway_visitas", "Eventos de visitas", "created_at"],
  ["amway_errores", "Errores", "created_at"],
  ["amway_clientes", "Cuentas de cliente", "created_at"],
  ["amway_solicitudes", "Solicitudes", "created_at"],
  ["amway_resenas", "Reseñas", "created_at"],
  ["amway_gastos", "Gastos", "created_at"],
  ["amway_productos", "Productos con ajustes", "updated_at"],
  ["amway_push_suscripciones", "Avisos push", "created_at"],
  ["amway_anuncios", "Anuncios", "created_at"],
  ["amway_admins", "Usuarios del panel", "created_at"],
] as const;

interface Volumen {
  total: number;
  semana: number;
  ultimo: string | null;
}

const ENLACES: [string, string, string][] = [
  ["Supabase · base de datos", "https://supabase.com/dashboard/project/ukhfaphloxlszomccgde/editor", "Tablas amway_*, usuarios, SQL"],
  ["Supabase · usuarios", "https://supabase.com/dashboard/project/ukhfaphloxlszomccgde/auth/users", "Altas y contraseñas del panel"],
  ["Vercel · despliegues", "https://vercel.com/edortadossantos-projects/amway-premium", "Deploys, variables y logs"],
  ["Vercel · variables", "https://vercel.com/edortadossantos-projects/amway-premium/settings/environment-variables", "STRIPE_*, AMWAY_*"],
  ["Stripe · pagos", "https://dashboard.stripe.com/payments", "Cobros, devoluciones y claves"],
  ["Stripe · webhooks", "https://dashboard.stripe.com/webhooks", "Endpoints y entregas"],
  ["GitHub · código", "https://github.com/LocalIA-Soluciones-Digitales/amway-premium", "Commits e historial"],
  ["Search Console", "https://search.google.com/search-console", "Indexación y búsquedas"],
];

type Nivel = "ok" | "aviso" | "error" | "opcional";

function Fila({ nivel, titulo, detalle, extra }: { nivel: Nivel; titulo: ReactNode; detalle: ReactNode; extra?: ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {nivel === "ok" ? (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : nivel === "opcional" ? (
        <CircleDashed size={18} className="mt-0.5 shrink-0 text-stone" />
      ) : nivel === "aviso" ? (
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
      ) : (
        <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-carbon">{titulo}</p>
        <div className="text-xs text-stone">{detalle}</div>
      </div>
      {extra}
    </li>
  );
}

function Latencia({ ms }: { ms: number }) {
  const tono = ms < 300 ? "green" : ms < 1000 ? "amber" : "red";
  return <Badge tone={tono}>{ms} ms</Badge>;
}

function copiar(t: string) {
  void navigator.clipboard?.writeText(t);
}

export function EstadoPanel({ session }: { session: Session }) {
  const [estado, setEstado] = useState<Estado | null | "error">(null);
  const [vol, setVol] = useState<Record<string, Volumen> | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mirado, setMirado] = useState<Date | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const hace7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const db = amwayDb();
    const [e, ...res] = await Promise.all([
      fetch("/api/admin/estado", { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then((r): Promise<Estado | "error"> | "error" => (r.ok ? (r.json() as Promise<Estado>) : "error"))
        .catch((): "error" => "error"),
      ...TABLAS.map(async ([t, , col]) => {
        const [total, semana, ultimo] = await Promise.all([
          db.from(t).select("*", { count: "exact", head: true }),
          db.from(t).select("*", { count: "exact", head: true }).gte(col, hace7),
          db.from(t).select(col).order(col, { ascending: false }).limit(1),
        ]);
        const fila = (ultimo.data as Record<string, string>[] | null)?.[0];
        return { total: total.count ?? 0, semana: semana.count ?? 0, ultimo: fila?.[col] ?? null } satisfies Volumen;
      }),
    ]);
    setEstado(e);
    setVol(Object.fromEntries(res.map((v, i) => [TABLAS[i][0], v as Volumen])));
    setMirado(new Date());
    setCargando(false);
  }, [session.access_token]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const ok = estado && estado !== "error" ? estado : null;
  const si = ok?.stripeInfo;

  // Problemas a resolver, de más a menos grave.
  const problemas: { nivel: "error" | "aviso"; texto: string }[] = [];
  if (estado === "error") problemas.push({ nivel: "error", texto: "No responde /api/admin/estado." });
  if (ok) {
    if (!ok.stripe) problemas.push({ nivel: "error", texto: "Falta STRIPE_SECRET_KEY: el pago con tarjeta no funciona." });
    if (si?.error) problemas.push({ nivel: "error", texto: `Stripe responde con error: ${si.error}` });
    if (si?.sinRegistrar.length)
      problemas.push({ nivel: "error", texto: `${si.sinRegistrar.length} cobro(s) de Stripe sin pedido en el panel.` });
    if (!ok.pedidosToken) problemas.push({ nivel: "error", texto: "Falta AMWAY_PEDIDOS_TOKEN: los pagos no se registran como pedidos." });
    if (ok.stripe === "test") problemas.push({ nivel: "aviso", texto: "Stripe está en modo pruebas: no se cobra dinero real." });
    if (!ok.webhook) problemas.push({ nivel: "aviso", texto: "Webhook de Stripe sin configurar: un pedido se pierde si el cliente cierra antes de volver." });
    else if (si && !si.webhook) problemas.push({ nivel: "aviso", texto: "Hay secreto de webhook, pero Stripe no tiene dado de alta el endpoint de esta web." });
    else if (si?.webhook && (si.webhook.estado !== "enabled" || !si.webhook.eventosOk))
      problemas.push({ nivel: "aviso", texto: "El webhook de Stripe está desactivado o le faltan eventos." });
    if (!ok.push) problemas.push({ nivel: "aviso", texto: "Avisos push sin clave VAPID privada: no llegan notificaciones de pedidos." });
    if (ok.dbMs > 1000) problemas.push({ nivel: "aviso", texto: `La base de datos tarda ${ok.dbMs} ms en responder.` });
  }
  if (vol) {
    const v = vol.amway_visitas;
    if (v.ultimo && Date.now() - new Date(v.ultimo).getTime() > 3 * 86_400_000)
      problemas.push({ nivel: "aviso", texto: `No llegan visitas desde ${haceCuanto(v.ultimo)}: ¿se rompió el seguimiento?` });
    if (vol.amway_errores.semana > 20) problemas.push({ nivel: "aviso", texto: `${vol.amway_errores.semana} errores de JavaScript esta semana.` });
  }
  const graves = problemas.filter((p) => p.nivel === "error").length;

  return (
    <div>
      <PanelHeader
        title="Estado del sistema"
        description="Comprobaciones en vivo de pagos, base de datos, despliegue y datos."
        actions={
          <button type="button" onClick={() => void cargar()} className={btnGhost} disabled={cargando}>
            <RefreshCw size={14} className={cn(cargando && "animate-spin")} /> Comprobar de nuevo
          </button>
        }
      />
      {!vol || estado === null ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Semáforo */}
          <section
            className={cn(
              "flex flex-col gap-3 rounded-3xl border p-5 sm:flex-row sm:items-start",
              graves ? "border-red-200 bg-red-50/70" : problemas.length ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/70"
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                graves ? "bg-red-100 text-red-700" : problemas.length ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              )}
            >
              {graves ? <ShieldAlert size={20} /> : problemas.length ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl text-carbon">
                {graves ? `${graves} problema${graves === 1 ? "" : "s"} que afecta${graves === 1 ? "" : "n"} a las ventas` : problemas.length ? `${problemas.length} cosa${problemas.length === 1 ? "" : "s"} por mejorar` : "Todo funciona"}
              </p>
              {problemas.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {problemas.map((p) => (
                    <li key={p.texto} className="flex items-start gap-2">
                      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", p.nivel === "error" ? "bg-red-500" : "bg-amber-500")} />
                      <span className="text-carbon/85">{p.texto}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-stone">Pagos, registro de pedidos, base de datos y seguimiento responden bien.</p>
              )}
            </div>
            {mirado && <p className="shrink-0 text-xs text-stone">Comprobado a las {mirado.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>}
          </section>

          {si && si.sinRegistrar.length > 0 && (
            <Card className="border-red-200">
              <CardTitle>Cobros de Stripe sin pedido (últimos 30 días)</CardTitle>
              <p className="mb-3 text-sm text-stone">
                Estos clientes pagaron pero el pedido no está en el panel (normalmente cerraron antes de volver a la web y no hay webhook). Créalos como venta
                manual o contacta con ellos.
              </p>
              <ul className="divide-y divide-carbon/[0.06] rounded-xl border border-carbon/[0.07]">
                {si.sinRegistrar.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                    <span className="font-medium tabular-nums text-carbon">{eur(x.importe)}</span>
                    <span className="text-carbon">{x.nombre ?? "Sin nombre"}</span>
                    <span className="text-stone">{x.email}</span>
                    <span className="ml-auto text-xs text-stone">{haceCuanto(x.fecha)}</span>
                    <a
                      href={`https://dashboard.stripe.com/${ok?.stripe === "test" ? "test/" : ""}checkout/sessions/${x.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-carbon underline-offset-2 hover:underline"
                    >
                      Ver en Stripe <ArrowUpRight size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle>Pagos e integraciones</CardTitle>
              {!ok ? (
                <p className="text-sm text-stone">No se pudo consultar el servidor.</p>
              ) : (
                <ul className="divide-y divide-carbon/[0.06]">
                  <Fila
                    nivel={!ok.stripe || si?.error ? "error" : ok.stripe === "test" ? "aviso" : "ok"}
                    titulo={`Stripe${ok.stripe === "test" ? " · modo pruebas" : ok.stripe === "live" ? " · modo real" : ""}`}
                    detalle={
                      si?.error
                        ? si.error
                        : si
                          ? `${si.cobros30d} cobro${si.cobros30d === 1 ? "" : "s"} en 30 días${si.saldo ? ` · saldo ${eur(si.saldo.disponible)} disponible, ${eur(si.saldo.pendiente)} en camino` : ""}`
                          : "Falta STRIPE_SECRET_KEY en Vercel."
                    }
                    extra={si && <Latencia ms={si.ms} />}
                  />
                  <Fila
                    nivel={ok.pedidosToken ? "ok" : "error"}
                    titulo="Registro de pedidos pagados"
                    detalle={ok.pedidosToken ? "AMWAY_PEDIDOS_TOKEN configurado." : "Falta AMWAY_PEDIDOS_TOKEN: los pagos no aparecerán en Pedidos."}
                  />
                  <Fila
                    nivel={ok.webhook && si?.webhook?.estado === "enabled" && si.webhook.eventosOk ? "ok" : ok.webhook ? "aviso" : "aviso"}
                    titulo="Webhook de Stripe"
                    detalle={
                      ok.webhook && si?.webhook
                        ? `Alta en Stripe · ${si.webhook.estado === "enabled" ? "activo" : "desactivado"}${si.webhook.faltan.length ? ` · faltan ${si.webhook.faltan.join(", ")}` : ""}`
                        : ok.webhook
                          ? "Hay secreto, pero Stripe no tiene un endpoint apuntando a esta web."
                          : "Sin STRIPE_WEBHOOK_SECRET: el pedido solo se registra si el cliente vuelve a la página de éxito."
                    }
                  />
                  <Fila
                    nivel={ok.push ? "ok" : "aviso"}
                    titulo="Avisos push de pedidos"
                    detalle={ok.push ? "Clave VAPID configurada." : "Falta AMWAY_VAPID_PRIVATE_KEY."}
                  />
                  <Fila
                    nivel={ok.dbMs < 1000 ? "ok" : "aviso"}
                    titulo="Base de datos (Supabase)"
                    detalle={ok.supabaseEnv ? "Configurada por variables de entorno." : "Configuración pública por defecto del código."}
                    extra={<Latencia ms={ok.dbMs} />}
                  />
                </ul>
              )}
            </Card>

            <Card>
              <CardTitle>Despliegue</CardTitle>
              {ok && (
                <dl className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Server size={16} className="shrink-0 text-stone" />
                    <dt className="w-20 shrink-0 text-stone">Entorno</dt>
                    <dd className="text-carbon">
                      <Badge tone={ok.entorno === "production" ? "green" : "amber"}>{ok.entorno}</Badge>
                      {ok.region && <span className="ml-2 text-stone">región {ok.region}</span>}
                    </dd>
                  </div>
                  <div className="flex items-start gap-3">
                    <GitCommit size={16} className="mt-0.5 shrink-0 text-stone" />
                    <dt className="w-20 shrink-0 text-stone">Versión</dt>
                    <dd className="min-w-0 text-carbon">
                      {ok.commit ? (
                        <a
                          href={ok.repo ? `https://github.com/${ok.repo}/commit/${ok.commit}` : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[13px] underline-offset-2 hover:underline"
                        >
                          {ok.commit.slice(0, 7)}
                        </a>
                      ) : (
                        "local"
                      )}
                      {ok.commitMensaje && <p className="line-clamp-2 text-xs text-stone">{ok.commitMensaje.split("\n")[0]}</p>}
                      {ok.commitAutor && <p className="text-xs text-stone/80">por {ok.commitAutor}</p>}
                    </dd>
                  </div>
                  {ok.rama && (
                    <div className="flex items-center gap-3">
                      <GitBranch size={16} className="shrink-0 text-stone" />
                      <dt className="w-20 shrink-0 text-stone">Rama</dt>
                      <dd className="font-mono text-[13px] text-carbon">{ok.rama}</dd>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Cpu size={16} className="shrink-0 text-stone" />
                    <dt className="w-20 shrink-0 text-stone">Runtime</dt>
                    <dd className="font-mono text-[13px] text-carbon">Node {ok.node}</dd>
                  </div>
                  <div className="flex items-center gap-3">
                    <Database size={16} className="shrink-0 text-stone" />
                    <dt className="w-20 shrink-0 text-stone">Catálogo</dt>
                    <dd className="text-carbon">{PRODUCTS.length} productos en el código</dd>
                  </div>
                </dl>
              )}
            </Card>
          </div>

          {ok && !(ok.webhook && si?.webhook?.estado === "enabled" && si.webhook.eventosOk) && <GuiaWebhook url={ok.webhookUrl} modo={ok.stripe} />}

          <Card>
            <CardTitle>Datos guardados</CardTitle>
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.1em] text-stone">
                    <th className="px-1 pb-2 text-left font-semibold">Tabla</th>
                    <th className="px-1 pb-2 text-right font-semibold">Filas</th>
                    <th className="px-1 pb-2 text-right font-semibold">Últimos 7 días</th>
                    <th className="px-1 pb-2 text-right font-semibold">Último registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon/[0.05]">
                  {TABLAS.map(([t, label]) => {
                    const v = vol[t];
                    return (
                      <tr key={t}>
                        <td className="px-1 py-2">
                          <span className="text-carbon">{label}</span>
                          <span className="ml-2 font-mono text-[10px] text-stone/70">{t}</span>
                        </td>
                        <td className="px-1 py-2 text-right tabular-nums text-carbon">{v.total.toLocaleString("es-ES")}</td>
                        <td className="px-1 py-2 text-right tabular-nums">
                          {v.semana ? <span className="text-emerald-700">+{v.semana.toLocaleString("es-ES")}</span> : <span className="text-stone">—</span>}
                        </td>
                        <td className="px-1 py-2 text-right text-xs text-stone">{haceCuanto(v.ultimo)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-stone">
              Todo lo de esta tienda vive en tablas <code className="font-mono">amway_*</code> del Supabase compartido, aislado del resto de productos.
            </p>
          </Card>

          <Card>
            <CardTitle>Accesos directos</CardTitle>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {ENLACES.map(([t, href, d]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-2 rounded-xl border border-carbon/[0.07] px-4 py-3 transition hover:border-carbon/20 hover:bg-cream/50"
                >
                  <span>
                    <span className="block text-sm font-medium text-carbon">{t}</span>
                    <span className="text-xs text-stone">{d}</span>
                  </span>
                  <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-stone transition group-hover:text-carbon" />
                </a>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function GuiaWebhook({ url, modo }: { url: string; modo: Estado["stripe"] }) {
  const pasos: ReactNode[] = [
    <>
      Abre{" "}
      <a
        href={`https://dashboard.stripe.com/${modo === "test" ? "test/" : ""}webhooks/create`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-carbon underline underline-offset-2"
      >
        Stripe → Webhooks → Añadir destino
      </a>{" "}
      {modo === "test" ? "(en modo pruebas, el mismo que tu clave)" : ""}.
    </>,
    <>
      URL del endpoint:
      <span className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 truncate rounded-lg bg-carbon/[0.05] px-2 py-1 font-mono text-[12px] text-carbon">{url}</code>
        <button type="button" onClick={() => copiar(url)} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-carbon/[0.12] px-2.5 py-1 text-xs hover:bg-cream">
          <Copy size={12} /> Copiar
        </button>
      </span>
    </>,
    <>
      Eventos: <code className="font-mono text-[12px]">checkout.session.completed</code> y{" "}
      <code className="font-mono text-[12px]">checkout.session.async_payment_succeeded</code>.
    </>,
    <>
      Copia el <b>secreto de firma</b> (<code className="font-mono text-[12px]">whsec_…</code>) y añádelo en{" "}
      <a
        href="https://vercel.com/edortadossantos-projects/amway-premium/settings/environment-variables"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-carbon underline underline-offset-2"
      >
        Vercel → Variables
      </a>{" "}
      como <code className="font-mono text-[12px]">STRIPE_WEBHOOK_SECRET</code> (Production).
    </>,
    <>Vuelve a desplegar (Redeploy) y pulsa «Comprobar de nuevo»: esta tarjeta desaparecerá cuando todo esté bien.</>,
  ];
  return (
    <Card className="border-amber-200">
      <CardTitle>
        <span className="inline-flex items-center gap-1.5">
          <Zap size={13} /> Activar el webhook de Stripe · 5 minutos
        </span>
      </CardTitle>
      <p className="mb-4 text-sm text-stone">
        El código ya está listo en <code className="font-mono text-[12px]">/api/stripe/webhook</code>; falta darlo de alta en Stripe. Con él, un pago se registra
        aunque el cliente cierre la pestaña antes de volver a la tienda.
      </p>
      <ol className="flex flex-col gap-3 text-sm text-carbon/85">
        {pasos.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-carbon text-[11px] font-semibold text-cream">{i + 1}</span>
            <span className="min-w-0 pt-0.5">{p}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
