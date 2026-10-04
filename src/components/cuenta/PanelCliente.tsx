"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Link2,
  Loader2,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  RefreshCw,
  Repeat,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import { getProductById } from "@/data/products";
import { productImageSrc } from "@/data/types";
import { SITE, waLink } from "@/data/site-config";
import { clienteDb } from "@/lib/amway-db";
import { formatEUR } from "@/lib/currency";
import { fechaLarga } from "@/lib/recogida";
import { cn } from "@/lib/utils";
import { useCesta } from "@/components/cart/CartProvider";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { useCliente } from "./ClienteProvider";
import { campoClase } from "./AccesoCliente";

interface MiPedidoItem {
  product_id: string | null;
  variant_index: number;
  nombre: string;
  formato: string | null;
  sabor: string | null;
  cantidad: number;
  precio_eur: number;
}

interface MiPedido {
  numero: number;
  created_at: string;
  estado: "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado";
  metodo_pago: string;
  total_eur: number;
  recogida_fecha: string | null;
  recogida_hora: string | null;
  preparado: boolean;
  seguimiento: string | null;
  notas: string | null;
  items: MiPedidoItem[];
  puede_cancelar: boolean;
}

type Pestana = "pedidos" | "perfil";
type Filtro = "activos" | "anteriores" | "todos";

const esActivo = (p: MiPedido) => p.estado !== "cancelado" && p.estado !== "entregado";

function estadoVisible(p: MiPedido): { texto: string; tono: string; punto: string } {
  if (p.estado === "cancelado") return { texto: "Cancelado", tono: "bg-red-50 text-red-700", punto: "bg-red-500" };
  if (p.estado === "entregado") return { texto: "Recogido", tono: "bg-carbon/[0.05] text-stone", punto: "bg-stone/60" };
  if (p.estado === "enviado") return { texto: "Enviado", tono: "bg-sky-50 text-sky-800", punto: "bg-sky-500" };
  if (p.preparado) return { texto: "Listo para recoger", tono: "bg-forest text-cream", punto: "bg-cream" };
  if (p.estado === "pagado") return { texto: "Pagado · en preparación", tono: "bg-forest/10 text-forest", punto: "bg-forest" };
  return { texto: "Confirmado · pagas al recoger", tono: "bg-amber-50 text-amber-800", punto: "bg-amber-500" };
}

// Pasos del seguimiento: 0 = confirmado, 1 = listo para recoger, 2 = recogido.
const PASOS = ["Confirmado", "Listo para recoger", "Recogido"] as const;
const pasoActual = (p: MiPedido) => (p.estado === "entregado" ? 2 : p.preparado ? 1 : 0);

// { dia: "lun", num: "5", mes: "oct" } para la caja de la fecha de recogida.
function fechaCaja(fecha: string) {
  const d = new Date(`${fecha}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("es-ES", { ...o, timeZone: "UTC" }).replace(".", "");
  return { dia: f({ weekday: "short" }), num: f({ day: "numeric" }), mes: f({ month: "short" }) };
}

const fechaPedido = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" });

// Evento de calendario (.ics) para la recogida: 30 minutos a la hora elegida.
function descargarCalendario(p: MiPedido) {
  if (!p.recogida_fecha || !p.recogida_hora) return;
  const inicio = `${p.recogida_fecha.replaceAll("-", "")}T${p.recogida_hora.replace(":", "")}00`;
  const [h, m] = p.recogida_hora.split(":").map(Number);
  const finMin = h * 60 + m + 30;
  const fin = `${p.recogida_fecha.replaceAll("-", "")}T${String(Math.floor(finMin / 60)).padStart(2, "0")}${String(finMin % 60).padStart(2, "0")}00`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amway Barakaldo//Pedidos//ES",
    "BEGIN:VEVENT",
    `UID:pedido-${p.numero}@amwaybarakaldo.es`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;TZID=Europe/Madrid:${inicio}`,
    `DTEND;TZID=Europe/Madrid:${fin}`,
    `SUMMARY:Recoger pedido nº ${p.numero} · ${SITE.name}`,
    `DESCRIPTION:${p.items.map((i) => `${i.cantidad}x ${i.nombre}`).join("\\n")}\\nTotal: ${formatEUR(Number(p.total_eur))}`,
    `LOCATION:${SITE.name}\\, ${SITE.city}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `recogida-pedido-${p.numero}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PanelCliente() {
  const { session, perfil } = useCliente();
  const [pestana, setPestana] = useState<Pestana>("pedidos");
  const [pedidos, setPedidos] = useState<MiPedido[] | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error } = await clienteDb().rpc("amway_mis_pedidos");
    if (error) {
      setErrorCarga(true);
      setPedidos([]);
    } else {
      setErrorCarga(false);
      setPedidos((data as MiPedido[] | null) ?? []);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const validos = useMemo(() => (pedidos ?? []).filter((p) => p.estado !== "cancelado"), [pedidos]);
  const gastado = validos.reduce((s, p) => s + Number(p.total_eur), 0);
  const proxima = useMemo(
    () =>
      (pedidos ?? [])
        .filter((p) => esActivo(p) && p.recogida_fecha)
        .sort((a, b) => `${a.recogida_fecha}${a.recogida_hora}`.localeCompare(`${b.recogida_fecha}${b.recogida_hora}`))[0],
    [pedidos]
  );
  const nombreCorto = (perfil?.nombre || session?.user.email || "").split(/[\s@]/)[0];
  const desde = perfil?.created_at ?? session?.user.created_at;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[11px] uppercase tracking-[0.24em] text-stone">Mi cuenta</p>
      <h1 className="mt-2 font-display text-4xl text-carbon sm:text-5xl">
        Hola{nombreCorto ? `, ${nombreCorto}` : ""}
      </h1>

      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Pedidos", valor: pedidos ? String(validos.length) : "—" },
          { label: "Total comprado", valor: pedidos ? formatEUR(gastado) : "—" },
          {
            label: "Cliente desde",
            valor: desde
              ? new Date(desde).toLocaleDateString("es-ES", { month: "short", year: "numeric" })
              : "—",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-carbon/10 bg-white/70 p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-stone sm:text-[11px]">{s.label}</p>
            <p className="mt-1.5 font-display text-xl tabular-nums text-carbon sm:text-2xl">{s.valor}</p>
          </div>
        ))}
      </div>

      {proxima && (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-carbon p-5 text-cream sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cream/60">
              {proxima.preparado ? "Tu pedido está listo" : "Próxima recogida"}
            </p>
            <p className="mt-1.5 font-display text-2xl">
              {fechaLarga(proxima.recogida_fecha!)} · {proxima.recogida_hora} h
            </p>
            <p className="mt-1 text-sm text-cream/70">
              Pedido nº {proxima.numero} · {formatEUR(Number(proxima.total_eur))}
              {proxima.estado === "pendiente" && proxima.metodo_pago === "efectivo" ? " en efectivo al recoger" : " pagado"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => descargarCalendario(proxima)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-cream px-5 text-sm font-medium text-carbon transition hover:bg-cream/90"
          >
            <CalendarPlus size={16} /> Añadir al calendario
          </button>
        </div>
      )}

      <div className="mt-10 flex gap-6 border-b border-carbon/10">
        {(
          [
            { id: "pedidos", label: "Mis pedidos", icon: Package },
            { id: "perfil", label: "Mis datos", icon: UserRound },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPestana(t.id)}
            aria-pressed={pestana === t.id}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition",
              pestana === t.id ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon"
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="py-8">
        {pestana === "pedidos" ? (
          <PedidosCliente pedidos={pedidos} errorCarga={errorCarga} recargar={cargar} />
        ) : (
          <PerfilCliente />
        )}
      </div>
    </div>
  );
}

function PedidosCliente({
  pedidos,
  errorCarga,
  recargar,
}: {
  pedidos: MiPedido[] | null;
  errorCarga: boolean;
  recargar: () => Promise<void>;
}) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abierto, setAbierto] = useState<number | null>(null);

  if (!pedidos) {
    return (
      <div className="flex justify-center py-16 text-stone">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const lista = pedidos.filter((p) =>
    filtro === "todos" ? true : filtro === "activos" ? esActivo(p) : !esActivo(p)
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="mb-5 flex gap-2">
          {(["todos", "activos", "anteriores"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              aria-pressed={filtro === f}
              className={cn(
                "h-9 rounded-full border px-4 text-xs font-medium transition",
                filtro === f ? "border-carbon bg-carbon text-cream" : "border-carbon/15 text-carbon hover:border-carbon/35"
              )}
            >
              {f === "activos" ? "En curso" : f === "todos" ? "Todos" : "Anteriores"}
            </button>
          ))}
        </div>

        {errorCarga && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            No se pudieron cargar tus pedidos. Recarga la página en un momento.
          </p>
        )}

        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-carbon/15 px-6 py-12 text-center">
            <ShoppingBag className="mx-auto text-stone" size={26} />
            <p className="mt-4 font-display text-xl text-carbon">
              {pedidos.length === 0 ? "Aún no tienes pedidos en tu cuenta" : "Nada por aquí"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone">
              {pedidos.length === 0
                ? "Los pedidos que hagas con la sesión iniciada aparecerán aquí. ¿Pediste antes sin cuenta? Vincúlalo con el formulario."
                : "Prueba con otro filtro."}
            </p>
            {pedidos.length === 0 && (
              <Link
                href="/catalogo"
                className="mt-6 inline-flex rounded-full bg-carbon px-6 py-3 text-sm font-medium text-cream transition hover:bg-carbon-soft"
              >
                Ver catálogo
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {lista.map((p) => (
              <PedidoTarjeta
                key={p.numero}
                pedido={p}
                abierto={abierto === p.numero}
                alternar={() => setAbierto((a) => (a === p.numero ? null : p.numero))}
                recargar={recargar}
              />
            ))}
          </ul>
        )}
      </div>

      <aside className="space-y-6">
        <Reposiciones pedidos={pedidos} />
        <Habituales pedidos={pedidos} />
        <VincularPedido recargar={recargar} />
      </aside>
    </div>
  );
}

function PedidoTarjeta({
  pedido: p,
  abierto,
  alternar,
  recargar,
}: {
  pedido: MiPedido;
  abierto: boolean;
  alternar: () => void;
  recargar: () => Promise<void>;
}) {
  const { addItem, openCesta } = useCesta();
  const catalog = useCatalogState();
  const [aviso, setAviso] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const estado = estadoVisible(p);
  const activo = esActivo(p);
  const pasoN = pasoActual(p);
  const caja = p.recogida_fecha ? fechaCaja(p.recogida_fecha) : null;
  const miniaturas = p.items
    .map((i) => (i.product_id ? getProductById(i.product_id) : undefined))
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((product) => productImageSrc(product))
    .filter((src): src is string => !!src)
    .slice(0, 3);
  const resto = p.items.length - miniaturas.length;

  function repetir() {
    let fuera = 0;
    for (const i of p.items) {
      const product = i.product_id ? getProductById(i.product_id) : undefined;
      if (
        !product ||
        !product.variants[i.variant_index] ||
        catalog.agotado(product.id) ||
        catalog.oculto(product.id) ||
        catalog.precio(product, i.variant_index) == null
      ) {
        fuera++;
        continue;
      }
      for (let n = 0; n < i.cantidad; n++) addItem(product.id, i.variant_index, i.sabor ?? "");
    }
    if (fuera === p.items.length) {
      setAviso("Ninguno de estos productos está disponible ahora mismo.");
      return;
    }
    setAviso(fuera ? `Añadido a la cesta. ${fuera} producto${fuera > 1 ? "s no están" : " no está"} disponible${fuera > 1 ? "s" : ""} ahora.` : null);
    openCesta();
  }

  async function cancelar() {
    if (!window.confirm(`¿Cancelar el pedido nº ${p.numero}? Esta acción no se puede deshacer.`)) return;
    setCancelando(true);
    const { data, error } = await clienteDb().rpc("amway_cancelar_mi_pedido", { p_numero: p.numero });
    setCancelando(false);
    if (error || !data) {
      setAviso("No se pudo cancelar: puede que ya lo estemos preparando. Escríbenos por WhatsApp.");
      return;
    }
    await recargar();
  }

  const waMensaje = `Hola, os escribo por mi pedido nº ${p.numero}${
    p.recogida_fecha ? ` (recogida el ${fechaLarga(p.recogida_fecha)} a las ${p.recogida_hora} h)` : ""
  }.`;

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border bg-white/80 shadow-[0_1px_2px_rgba(28,26,22,0.04)] transition",
        abierto ? "border-carbon/20" : "border-carbon/10 hover:border-carbon/20",
        p.estado === "cancelado" && "opacity-70"
      )}
    >
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className="flex w-full items-start gap-3.5 p-4 text-left transition hover:bg-carbon/[0.02] sm:gap-4 sm:p-5"
      >
        {caja ? (
          <span
            className={cn(
              "flex w-14 shrink-0 flex-col items-center rounded-xl py-1.5 leading-none",
              activo ? "bg-carbon text-cream" : "bg-carbon/[0.05] text-stone"
            )}
            aria-hidden
          >
            <span className="text-[10px] uppercase tracking-wider opacity-70">{caja.dia}</span>
            <span className="mt-1 font-display text-2xl tabular-nums">{caja.num}</span>
            <span className="mt-0.5 text-[10px] uppercase tracking-wider opacity-70">{caja.mes}</span>
          </span>
        ) : (
          <span className="flex h-[3.75rem] w-14 shrink-0 items-center justify-center rounded-xl bg-carbon/[0.05] text-stone" aria-hidden>
            <Package size={18} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-stone">Pedido nº {p.numero}</p>
              <p className="mt-0.5 truncate font-display text-lg leading-snug text-carbon">
                {activo && p.recogida_fecha
                  ? `Recogida a las ${p.recogida_hora} h`
                  : p.items.length > 1
                    ? `${p.items[0].nombre} y ${p.items.length - 1} más`
                    : (p.items[0]?.nombre ?? "Pedido")}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-lg tabular-nums leading-snug text-carbon">{formatEUR(Number(p.total_eur))}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-stone">
                {p.metodo_pago === "tarjeta" ? <CreditCard size={12} /> : <Banknote size={12} />}
                {p.metodo_pago === "tarjeta" ? "Tarjeta" : "Efectivo"}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", estado.tono)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", estado.punto)} />
              {estado.texto}
            </span>
            {miniaturas.length > 0 && (
              <span className="flex items-center">
                {miniaturas.map((src, k) => (
                  <span
                    key={k}
                    className="relative -ml-1.5 h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-linen first:ml-0"
                  >
                    <Image src={src} alt="" fill sizes="32px" className="object-contain p-0.5" />
                  </span>
                ))}
                {resto > 0 && (
                  <span className="-ml-1.5 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-carbon/[0.07] px-1 text-[10px] font-medium text-stone">
                    +{resto}
                  </span>
                )}
              </span>
            )}
            <span className="text-[11px] text-stone">Pedido el {fechaPedido(p.created_at)}</span>
          </div>

          {activo && p.estado !== "enviado" && (
            <ol className="mt-3.5 grid grid-cols-3 gap-1.5" aria-label="Seguimiento del pedido">
              {PASOS.map((paso, k) => (
                <li key={paso} className="min-w-0">
                  <span className={cn("block h-1 rounded-full", k <= pasoN ? "bg-forest" : "bg-carbon/10")} />
                  <span
                    className={cn(
                      "mt-1.5 block truncate text-[10.5px]",
                      k === pasoN ? "font-medium text-carbon" : k < pasoN ? "text-stone" : "text-stone/60"
                    )}
                  >
                    {paso}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <ChevronDown size={16} className={cn("mt-1 shrink-0 text-stone transition-transform", abierto && "rotate-180")} />
      </button>

      {abierto && (
        <div className="border-t border-carbon/8 px-4 pb-5 pt-4 sm:px-5">
          <ul className="divide-y divide-carbon/6">
            {p.items.map((i, idx) => {
              const product = i.product_id ? getProductById(i.product_id) : undefined;
              const src = product ? productImageSrc(product) : null;
              return (
                <li key={idx} className="flex items-center gap-3 py-2.5">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-linen">
                    {src && <Image src={src} alt="" fill sizes="48px" className="object-contain p-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-carbon">{i.nombre}</p>
                    <p className="truncate text-xs text-stone">
                      {[i.formato, i.sabor].filter(Boolean).join(" · ") || " "}
                    </p>
                  </div>
                  <span className="rounded-full bg-carbon/[0.05] px-2 py-0.5 text-[11px] tabular-nums text-stone">× {i.cantidad}</span>
                  <span className="w-16 text-right text-sm tabular-nums text-carbon">
                    {formatEUR(Number(i.precio_eur) * i.cantidad)}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-carbon/[0.03] p-3 text-xs">
            <dt className="text-stone">Pago</dt>
            <dd className="flex items-center justify-end gap-1.5 text-carbon">
              {p.metodo_pago === "tarjeta" ? <CreditCard size={13} /> : <Banknote size={13} />}
              {p.metodo_pago === "tarjeta" ? "Tarjeta" : p.metodo_pago === "efectivo" ? "Efectivo al recoger" : p.metodo_pago}
            </dd>
            {p.recogida_fecha && (
              <>
                <dt className="text-stone">Recogida</dt>
                <dd className="text-right text-carbon">
                  {fechaLarga(p.recogida_fecha)}, {p.recogida_hora} h
                </dd>
              </>
            )}
            {p.seguimiento && (
              <>
                <dt className="text-stone">Seguimiento</dt>
                <dd className="text-right text-carbon">{p.seguimiento}</dd>
              </>
            )}
            <dt className="font-medium text-carbon">Total</dt>
            <dd className="text-right font-medium tabular-nums text-carbon">{formatEUR(Number(p.total_eur))}</dd>
          </dl>
          {p.notas && <p className="mt-3 whitespace-pre-line text-xs text-stone">“{p.notas}”</p>}

          {aviso && <p className="mt-3 rounded-lg bg-carbon/5 px-3 py-2 text-xs text-carbon">{aviso}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={repetir}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-carbon px-4 text-xs font-medium text-cream transition hover:bg-carbon-soft"
            >
              <Repeat size={14} /> Repetir pedido
            </button>
            {esActivo(p) && p.recogida_fecha && (
              <button
                type="button"
                onClick={() => descargarCalendario(p)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-carbon/15 px-4 text-xs font-medium text-carbon transition hover:bg-carbon/5"
              >
                <CalendarPlus size={14} /> Calendario
              </button>
            )}
            <a
              href={waLink(waMensaje)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-carbon/15 px-4 text-xs font-medium text-carbon transition hover:bg-carbon/5"
            >
              <MessageCircle size={14} /> Consultar
            </a>
            {p.puede_cancelar && (
              <button
                type="button"
                onClick={cancelar}
                disabled={cancelando}
                className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
              >
                {cancelando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Cancelar pedido
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

interface Reposicion {
  product_id: string;
  variant_index: number;
  sabor: string | null;
  compras: number;
  ultima: string;
  ciclo: number;
  base: "historial" | "duracion";
  proxima: string;
  dias_restantes: number;
}

function cuandoToca(dias: number): string {
  if (dias < -1) return `desde hace ${-dias} días`;
  if (dias === -1) return "desde ayer";
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}

// Productos que se le están acabando, según cada cuánto los pide (o lo que
// dura una unidad si solo los ha comprado una vez). Lo calcula
// amway_mis_reposiciones; si falla, el bloque no se muestra.
function Reposiciones({ pedidos }: { pedidos: MiPedido[] }) {
  const { addItem } = useCesta();
  const catalog = useCatalogState();
  const [lista, setLista] = useState<Reposicion[]>([]);
  const [anadido, setAnadido] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    clienteDb()
      .rpc("amway_mis_reposiciones")
      .then(({ data, error }) => {
        if (vivo) setLista(error ? [] : ((data as Reposicion[] | null) ?? []));
      });
    return () => {
      vivo = false;
    };
  }, [pedidos]);

  const visibles = lista
    .map((r) => ({ ...r, product: getProductById(r.product_id) }))
    .filter((r) => r.product && r.product.variants[r.variant_index] && !catalog.oculto(r.product_id))
    .slice(0, 4);

  if (visibles.length === 0) return null;

  return (
    <section className="rounded-2xl border border-forest/20 bg-forest/[0.04] p-5">
      <h2 className="flex items-center gap-2 font-display text-xl text-carbon">
        <RefreshCw size={16} className="text-forest" /> Te toca reponer
      </h2>
      <p className="mt-1 text-xs text-stone">Calculado con tus pedidos anteriores.</p>
      <ul className="mt-4 space-y-3">
        {visibles.map((r) => {
          const product = r.product!;
          const src = productImageSrc(product);
          const key = `${r.product_id}|${r.variant_index}|${r.sabor ?? ""}`;
          const disponible = !catalog.agotado(product.id) && catalog.precio(product, r.variant_index) != null;
          const vencido = r.dias_restantes <= 0;
          return (
            <li key={key} className="flex items-center gap-3">
              <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-linen">
                {src && <Image src={src} alt="" fill sizes="40px" className="object-contain p-1" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-carbon">{product.name}</p>
                <p className={cn("text-xs", vencido ? "text-amber-800" : "text-stone")}>
                  Te toca {cuandoToca(r.dias_restantes)}
                  {r.base === "historial" ? ` · sueles pedirlo cada ${r.ciclo} días` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={!disponible}
                onClick={() => {
                  addItem(product.id, r.variant_index, r.sabor ?? "");
                  setAnadido(key);
                  setTimeout(() => setAnadido((k) => (k === key ? null : k)), 1500);
                }}
                aria-label={`Añadir ${product.name} a la cesta`}
                title={disponible ? "Añadir a la cesta" : "Agotado"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-carbon text-cream transition hover:bg-carbon-soft disabled:opacity-30"
              >
                {anadido === key ? <CheckCircle2 size={15} /> : <Plus size={15} />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Lo que más pide el cliente, para volver a añadirlo con un toque.
function Habituales({ pedidos }: { pedidos: MiPedido[] }) {
  const { addItem } = useCesta();
  const catalog = useCatalogState();
  const [anadido, setAnadido] = useState<string | null>(null);

  const top = useMemo(() => {
    const cuenta = new Map<string, { productId: string; variantIndex: number; sabor: string; unidades: number; formato: string | null }>();
    for (const p of pedidos) {
      if (p.estado === "cancelado") continue;
      for (const i of p.items) {
        if (!i.product_id) continue;
        const key = `${i.product_id}|${i.variant_index}|${i.sabor ?? ""}`;
        const prev = cuenta.get(key);
        cuenta.set(key, {
          productId: i.product_id,
          variantIndex: i.variant_index,
          sabor: i.sabor ?? "",
          formato: i.formato,
          unidades: (prev?.unidades ?? 0) + i.cantidad,
        });
      }
    }
    return [...cuenta.entries()]
      .map(([key, v]) => ({ key, ...v, product: getProductById(v.productId) }))
      .filter((v) => v.product && v.product.variants[v.variantIndex])
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 4);
  }, [pedidos]);

  if (top.length === 0) return null;

  return (
    <section className="rounded-2xl border border-carbon/10 bg-white/70 p-5">
      <h2 className="font-display text-xl text-carbon">Tus habituales</h2>
      <p className="mt-1 text-xs text-stone">Lo que más pides, a un toque de la cesta.</p>
      <ul className="mt-4 space-y-3">
        {top.map((h) => {
          const product = h.product!;
          const src = productImageSrc(product);
          const disponible =
            !catalog.agotado(product.id) && !catalog.oculto(product.id) && catalog.precio(product, h.variantIndex) != null;
          return (
            <li key={h.key} className="flex items-center gap-3">
              <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-linen">
                {src && <Image src={src} alt="" fill sizes="40px" className="object-contain p-1" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-carbon">{product.name}</p>
                <p className="truncate text-xs text-stone">
                  {[h.formato, h.sabor].filter(Boolean).join(" · ") || `${h.unidades} uds. pedidas`}
                </p>
              </div>
              <button
                type="button"
                disabled={!disponible}
                onClick={() => {
                  addItem(product.id, h.variantIndex, h.sabor);
                  setAnadido(h.key);
                  setTimeout(() => setAnadido((k) => (k === h.key ? null : k)), 1500);
                }}
                aria-label={`Añadir ${product.name} a la cesta`}
                title={disponible ? "Añadir a la cesta" : "Agotado"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-carbon/15 text-carbon transition hover:bg-carbon/5 disabled:opacity-30"
              >
                {anadido === h.key ? <CheckCircle2 size={15} className="text-forest" /> : <Plus size={15} />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Trae a la cuenta un pedido hecho sin sesión (nº de pedido + teléfono).
function VincularPedido({ recargar }: { recargar: () => Promise<void> }) {
  const { perfil } = useCliente();
  const [numero, setNumero] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("pedido");
    if (n && /^\d{1,10}$/.test(n)) setNumero(n);
  }, []);
  useEffect(() => {
    if (perfil?.telefono) setTelefono((t) => t || perfil.telefono);
  }, [perfil?.telefono]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setResultado(null);
    const { data, error } = await clienteDb().rpc("amway_vincular_pedido", {
      p_numero: Number(numero),
      p_telefono: telefono,
    });
    setEnviando(false);
    if (error) return setResultado({ ok: false, texto: "No se pudo comprobar. Inténtalo de nuevo." });
    if (data === "ok") {
      setResultado({ ok: true, texto: `Pedido nº ${numero} añadido a tu cuenta.` });
      setNumero("");
      await recargar();
    } else if (data === "bloqueado") {
      setResultado({ ok: false, texto: "Demasiados intentos. Espera una hora o escríbenos por WhatsApp." });
    } else {
      setResultado({ ok: false, texto: "No encontramos ese pedido con ese teléfono." });
    }
  }

  return (
    <section className="rounded-2xl border border-carbon/10 bg-white/70 p-5">
      <h2 className="flex items-center gap-2 font-display text-xl text-carbon">
        <Link2 size={17} /> ¿Pediste sin cuenta?
      </h2>
      <p className="mt-1 text-xs text-stone">
        Añade a tu historial un pedido anterior con su número y el teléfono que usaste.
      </p>
      <form onSubmit={enviar} className="mt-4 flex flex-col gap-2.5">
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Nº de pedido"
          inputMode="numeric"
          required
          className={campoClase}
        />
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Teléfono del pedido"
          type="tel"
          inputMode="tel"
          required
          maxLength={20}
          className={campoClase}
        />
        {resultado && (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-xs",
              resultado.ok ? "bg-forest/10 text-forest" : "bg-red-50 text-red-700"
            )}
          >
            {resultado.texto}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando || !numero}
          className="flex h-11 items-center justify-center gap-2 rounded-full border border-carbon/15 text-sm font-medium text-carbon transition hover:bg-carbon/5 disabled:opacity-50"
        >
          {enviando && <Loader2 size={15} className="animate-spin" />} Vincular pedido
        </button>
      </form>
    </section>
  );
}

function PerfilCliente() {
  const { session, perfil, guardarPerfil, cerrarSesion } = useCliente();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [novedades, setNovedades] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msgDatos, setMsgDatos] = useState<{ ok: boolean; texto: string } | null>(null);

  const [password, setPassword] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const [msgPass, setMsgPass] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre);
    setTelefono(perfil.telefono);
    setNovedades(perfil.novedades);
  }, [perfil]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (telefono && telefono.replace(/\D/g, "").length < 9) {
      setMsgDatos({ ok: false, texto: "Revisa el teléfono." });
      return;
    }
    setGuardando(true);
    const err = await guardarPerfil({ nombre, telefono, novedades });
    setGuardando(false);
    setMsgDatos(err ? { ok: false, texto: err } : { ok: true, texto: "Datos guardados." });
  }

  async function cambiarPassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMsgPass({ ok: false, texto: "Mínimo 8 caracteres." });
      return;
    }
    setCambiando(true);
    const { error } = await clienteDb().auth.updateUser({ password });
    setCambiando(false);
    if (error) {
      setMsgPass({
        ok: false,
        texto: error.message.toLowerCase().includes("different")
          ? "La contraseña nueva debe ser distinta de la actual."
          : "No se pudo cambiar la contraseña.",
      });
    } else {
      setPassword("");
      setMsgPass({ ok: true, texto: "Contraseña actualizada." });
    }
  }

  async function borrarDatos() {
    if (
      !window.confirm(
        "Se borrarán tus datos de perfil y tus pedidos dejarán de estar en tu cuenta (la tienda los conserva para su contabilidad). ¿Continuar?"
      )
    )
      return;
    const { error } = await clienteDb().rpc("amway_borrar_mis_datos");
    if (error) {
      window.alert("No se pudieron borrar los datos. Escríbenos y lo hacemos nosotros.");
      return;
    }
    await cerrarSesion();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={guardar} className="rounded-2xl border border-carbon/10 bg-white/70 p-5 sm:p-6">
        <h2 className="font-display text-xl text-carbon">Datos de contacto</h2>
        <p className="mt-1 text-xs text-stone">Se rellenan solos en la cesta al hacer un pedido.</p>
        <div className="mt-5 flex flex-col gap-3">
          <label className="text-xs text-stone">
            Correo
            <input value={session?.user.email ?? ""} disabled className={cn(campoClase, "mt-1.5 bg-carbon/[0.03] text-stone")} />
          </label>
          <label className="text-xs text-stone">
            Nombre y apellido
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              maxLength={100}
              className={cn(campoClase, "mt-1.5")}
            />
          </label>
          <label className="text-xs text-stone">
            Teléfono (WhatsApp)
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              className={cn(campoClase, "mt-1.5")}
            />
          </label>
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-stone">
            <input
              type="checkbox"
              checked={novedades}
              onChange={(e) => setNovedades(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-forest"
            />
            Quiero recibir ofertas y novedades.
          </label>
          {msgDatos && (
            <p className={cn("rounded-lg px-3 py-2 text-xs", msgDatos.ok ? "bg-forest/10 text-forest" : "bg-red-50 text-red-700")}>
              {msgDatos.texto}
            </p>
          )}
          <button
            type="submit"
            disabled={guardando}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
          >
            {guardando && <Loader2 size={15} className="animate-spin" />} Guardar cambios
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-6">
        <form onSubmit={cambiarPassword} className="rounded-2xl border border-carbon/10 bg-white/70 p-5 sm:p-6">
          <h2 className="font-display text-xl text-carbon">Contraseña</h2>
          <div className="mt-4 flex flex-col gap-3">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Nueva contraseña (mínimo 8)"
              className={campoClase}
            />
            {msgPass && (
              <p className={cn("rounded-lg px-3 py-2 text-xs", msgPass.ok ? "bg-forest/10 text-forest" : "bg-red-50 text-red-700")}>
                {msgPass.texto}
              </p>
            )}
            <button
              type="submit"
              disabled={cambiando || !password}
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-carbon/15 text-sm font-medium text-carbon transition hover:bg-carbon/5 disabled:opacity-50"
            >
              {cambiando && <Loader2 size={15} className="animate-spin" />} Cambiar contraseña
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-carbon/10 bg-white/70 p-5 sm:p-6">
          <h2 className="font-display text-xl text-carbon">Sesión</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cerrarSesion}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-carbon/15 px-5 text-sm font-medium text-carbon transition hover:bg-carbon/5"
            >
              <LogOut size={15} /> Cerrar sesión
            </button>
            <button
              type="button"
              onClick={borrarDatos}
              className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              <Trash2 size={15} /> Borrar mis datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
