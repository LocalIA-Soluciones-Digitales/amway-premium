"use client";

import { useState } from "react";
import { CalendarClock, Check, ClipboardCopy, HandCoins, MessageCircle, PackageCheck, Printer, Send, Trash2, Truck, XCircle } from "lucide-react";
import { SITE } from "@/data/site-config";
import { cn } from "@/lib/utils";
import { FotoItem } from "./recogidas";
import { cuandoRecoge, estadoSinCerrar, mensajesCliente } from "./mensajes-cliente";
import { ESTADO_PEDIDO, METODO_PAGO, btnGhost, btnPrimary, eur, fecha, inputClass, waHref, type Pedido } from "./shared";

const PASOS_ENVIO: { estado: Pedido["estado"]; label: string }[] = [
  { estado: "pagado", label: "Pagado" },
  { estado: "enviado", label: "Enviado" },
  { estado: "entregado", label: "Entregado" },
];
const PASOS_RECOGIDA: { estado: Pedido["estado"]; label: string }[] = [
  { estado: "pagado", label: "Pagado" },
  { estado: "entregado", label: "Recogido" },
];

function imprimirAlbaran(p: Pedido) {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const filas = p.items
    .map(
      (i) =>
        `<tr><td>${i.cantidad}</td><td>${esc(i.nombre)}<br><small>${esc([i.formato, i.sabor].filter(Boolean).join(" · "))}</small></td><td class="r">${eur(
          Number(i.precio_eur) * i.cantidad
        )}</td></tr>`
    )
    .join("");
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Albarán #${p.numero}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#1c1a16;margin:40px}h1{font:600 22px Georgia,serif;margin:0}
.muted{color:#8a8271}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:8px 4px;border-bottom:1px solid #e8e2d6;text-align:left;vertical-align:top}
.r{text-align:right}small{color:#8a8271}.box{margin-top:24px;padding:16px;border:1px solid #e8e2d6;border-radius:12px}.tot{font-weight:600;font-size:16px}</style></head>
<body><h1>${esc(SITE.name)}</h1><p class="muted">Albarán del pedido #${p.numero} · ${fecha(p.created_at, true)}</p>
<div class="box"><strong>${esc(p.cliente_nombre ?? "")}</strong><br>${esc(p.direccion ?? "")}<br>${esc(p.cliente_telefono ?? "")} ${esc(
    p.cliente_email ?? ""
  )}</div>
<table><thead><tr><th>Uds.</th><th>Producto</th><th class="r">Importe</th></tr></thead><tbody>${filas}
${Number(p.envio_eur) > 0 ? `<tr><td></td><td>Envío</td><td class="r">${eur(p.envio_eur)}</td></tr>` : ""}
<tr><td></td><td class="tot">Total</td><td class="r tot">${eur(p.total_eur)}</td></tr></tbody></table>
${p.recogida_fecha ? `<p style="margin-top:24px"><strong>Recogida:</strong> ${esc(cuandoRecoge(p) ?? "")}</p>` : ""}
<p class="muted" style="margin-top:32px">${
    p.estado === "pendiente" ? `Pago en ${METODO_PAGO[p.metodo_pago].toLowerCase()} al recoger` : `Pagado con ${METODO_PAGO[p.metodo_pago]}`
  }. ¡Gracias por tu compra!</p>
<script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
}

// Día y hora de recogida, con opción de cambiarlos (el cliente avisa de un
// imprevisto) o de ponerlos en una venta manual que pasará a recoger.
function Recogida({ p, onUpdate }: { p: Pedido; onUpdate: (c: Partial<Pedido>) => void }) {
  const [editando, setEditando] = useState(false);
  const [dia, setDia] = useState(p.recogida_fecha ?? "");
  const [hora, setHora] = useState(p.recogida_hora ?? "");

  if (!editando) {
    return (
      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-white px-2.5 py-2 text-carbon">
        <CalendarClock size={14} className="mt-0.5 shrink-0 text-stone" />
        <span className="min-w-0 flex-1">{p.recogida_fecha ? `Recoge ${cuandoRecoge(p)}` : "Sin día de recogida"}</span>
        <button
          type="button"
          onClick={() => {
            setDia(p.recogida_fecha ?? "");
            setHora(p.recogida_hora ?? "");
            setEditando(true);
          }}
          className="shrink-0 text-xs text-forest hover:underline"
        >
          {p.recogida_fecha ? "Cambiar" : "Poner"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-white p-2.5">
      <div className="flex gap-2">
        <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} className={cn(inputClass, "min-w-0 flex-1")} aria-label="Día" />
        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} step={900} className={cn(inputClass, "w-28")} aria-label="Hora" />
      </div>
      <div className="flex justify-end gap-2">
        {p.recogida_fecha && (
          <button
            type="button"
            onClick={() => {
              onUpdate({ recogida_fecha: null, recogida_hora: null });
              setEditando(false);
            }}
            className="mr-auto text-xs text-stone hover:text-carbon"
          >
            Quitar
          </button>
        )}
        <button type="button" onClick={() => setEditando(false)} className={cn(btnGhost, "h-8 px-3 text-xs")}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={!dia}
          onClick={() => {
            onUpdate({ recogida_fecha: dia, recogida_hora: hora || null });
            setEditando(false);
          }}
          className={cn(btnPrimary, "h-8 px-3 text-xs")}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export function PedidoDetalle({
  p,
  onUpdate,
  onDelete,
  compact,
}: {
  p: Pedido;
  onUpdate: (c: Partial<Pedido>) => void;
  onDelete: () => void;
  /** Una sola columna, para el panel lateral. */
  compact?: boolean;
}) {
  const [seguimiento, setSeguimiento] = useState(p.seguimiento ?? "");
  const [copiado, setCopiado] = useState(false);
  const recoge = p.recogida_fecha != null;
  const PASOS = recoge ? PASOS_RECOGIDA : PASOS_ENVIO;
  const pasoActual = PASOS.findIndex((x) => x.estado === p.estado);
  const cancelado = p.estado === "cancelado";

  function copiarDireccion() {
    const txt = [p.cliente_nombre, p.direccion, p.cliente_telefono].filter(Boolean).join("\n");
    void navigator.clipboard.writeText(txt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  }

  return (
    <div
      className={cn(
        "grid gap-6 px-4 py-5 sm:px-5",
        compact ? "gap-5" : "border-t border-carbon/[0.07] lg:grid-cols-[1fr_20rem]"
      )}
    >
      <div className="min-w-0">
        {/* Progreso del pedido */}
        {!cancelado && p.estado !== "pendiente" && (
          <ol className="mb-5 flex items-center gap-2">
            {PASOS.map((paso, i) => {
              const hecho = i <= pasoActual;
              return (
                <li key={paso.estado} className="flex flex-1 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      hecho ? "bg-forest text-cream" : "bg-carbon/[0.06] text-stone"
                    )}
                  >
                    {hecho ? <Check size={14} /> : i + 1}
                  </span>
                  <span className={cn("text-xs font-medium", hecho ? "text-carbon" : "text-stone")}>{paso.label}</span>
                  {i < PASOS.length - 1 && <span className={cn("h-px flex-1", i < pasoActual ? "bg-forest" : "bg-carbon/10")} />}
                </li>
              );
            })}
          </ol>
        )}

        <ul className="flex flex-col text-sm">
          {p.items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-3 border-b border-carbon/[0.05] py-2.5 last:border-0">
              <FotoItem item={i} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block leading-snug text-carbon">{i.nombre}</span>
                <span className="mt-0.5 block text-xs text-stone">
                  <span className="font-medium text-carbon">{i.cantidad} ud.</span>
                  {[i.formato, i.sabor].filter(Boolean).map((x) => ` · ${x}`)}
                  {i.cantidad > 1 && ` · ${eur(i.precio_eur)}/ud.`}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-carbon">{eur(i.precio_eur * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-end gap-6 text-sm">
          {p.envio_eur > 0 && <span className="text-stone">Envío {eur(p.envio_eur)}</span>}
          <span className="font-medium text-carbon">Total {eur(p.total_eur)}</span>
        </div>

        {p.notas && (
          <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-amber-200/70">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800">Comentario del cliente</p>
            <p className="mt-0.5 whitespace-pre-line text-carbon">{p.notas}</p>
          </div>
        )}
        <textarea
          defaultValue={p.notas_internas ?? ""}
          onBlur={(e) =>
            e.target.value !== (p.notas_internas ?? "") && onUpdate({ notas_internas: e.target.value.trim() || null })
          }
          placeholder="Notas internas (solo las ves tú: incidencias, preferencias…)"
          rows={2}
          className={cn(inputClass, "mt-4 h-auto w-full py-2")}
        />
      </div>

      <div className="flex flex-col gap-3 text-sm">
        <div className="rounded-xl bg-cream p-3.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-carbon">{p.cliente_nombre || "—"}</p>
            {(p.direccion || p.cliente_telefono) && (
              <button type="button" onClick={copiarDireccion} className="text-xs text-stone hover:text-carbon" title="Copiar datos de envío">
                {copiado ? <Check size={14} /> : <ClipboardCopy size={14} />}
              </button>
            )}
          </div>
          {p.cliente_telefono && <p className="text-stone">{p.cliente_telefono}</p>}
          {p.cliente_email && <p className="break-all text-stone">{p.cliente_email}</p>}
          {p.direccion && <p className="mt-1 text-stone">{p.direccion}</p>}
          {(recoge || !cancelado) && <Recogida p={p} onUpdate={onUpdate} />}
          <p className="mt-2 text-xs text-stone">
            {METODO_PAGO[p.metodo_pago]} · {p.origen === "web" ? "Pedido web" : "Venta manual"}
            {p.enviado_at && ` · enviado ${fecha(p.enviado_at)}`}
          </p>
        </div>

        {/* Siguiente paso, en un clic */}
        {recoge && p.estado === "pendiente" && (
          <button type="button" className={btnPrimary} onClick={() => onUpdate({ estado: "entregado" })}>
            <HandCoins size={15} /> Recogido y cobrado
          </button>
        )}
        {recoge && p.estado === "pagado" && (
          <button type="button" className={btnPrimary} onClick={() => onUpdate({ estado: "entregado" })}>
            <PackageCheck size={15} /> Marcar como recogido
          </button>
        )}
        {!recoge && p.estado === "pagado" && (
          <div className="flex flex-col gap-2 rounded-xl border border-carbon/[0.08] p-3">
            <input
              value={seguimiento}
              onChange={(e) => setSeguimiento(e.target.value)}
              placeholder="Nº de seguimiento (opcional)"
              maxLength={200}
              className={inputClass}
            />
            <button
              type="button"
              className={btnPrimary}
              onClick={() => onUpdate({ estado: "enviado", seguimiento: seguimiento.trim() || null, enviado_at: new Date().toISOString() })}
            >
              <Truck size={15} /> Marcar como enviado
            </button>
          </div>
        )}
        {p.estado === "enviado" && (
          <button type="button" className={btnPrimary} onClick={() => onUpdate({ estado: "entregado" })}>
            <PackageCheck size={15} /> Marcar como entregado
          </button>
        )}
        {p.estado === "pendiente" && (
          <button type="button" className={recoge ? btnGhost : btnPrimary} onClick={() => onUpdate({ estado: "pagado" })}>
            <Check size={15} /> Marcar como pagado
          </button>
        )}
        {p.seguimiento && p.estado !== "pagado" && (
          <p className="text-xs text-stone">
            Seguimiento: <span className="font-mono text-carbon">{p.seguimiento}</span>
          </p>
        )}

        {p.cliente_telefono && (
          <div className="rounded-xl border border-carbon/[0.08] p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-stone">
              <MessageCircle size={13} /> Escribir por WhatsApp
            </p>
            <div className="flex flex-col gap-1">
              {mensajesCliente(p).map((m) => (
                <a
                  key={m.id}
                  href={waHref(p.cliente_telefono!, m.texto)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-carbon transition hover:bg-cream"
                >
                  {m.label}
                  <Send size={13} className="text-stone" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => imprimirAlbaran(p)} className={cn(btnGhost, "h-9 text-xs")}>
            <Printer size={14} /> Albarán
          </button>
          {!cancelado ? (
            <button
              type="button"
              onClick={() => confirm(`¿Cancelar el pedido #${p.numero}? Se repondrá el stock.`) && onUpdate({ estado: "cancelado" })}
              className={cn(btnGhost, "h-9 text-xs")}
            >
              <XCircle size={14} /> Cancelar
            </button>
          ) : (
            <button type="button" onClick={() => onUpdate({ estado: estadoSinCerrar(p) })} className={cn(btnGhost, "h-9 text-xs")}>
              Reactivar
            </button>
          )}
          <button type="button" onClick={onDelete} className={cn(btnGhost, "h-9 text-xs text-red-600")} title="Borrar definitivamente">
            <Trash2 size={14} />
          </button>
        </div>
        <p className="text-[11px] text-stone">Estado actual: {ESTADO_PEDIDO[p.estado].label}</p>
      </div>
    </div>
  );
}
