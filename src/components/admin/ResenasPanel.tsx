"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Check, Copy, ExternalLink, Loader2, MessageCircle, MessageSquareReply, Star } from "lucide-react";
import { SITE } from "@/data/site-config";
import { amwayDb } from "@/lib/amway-db";
import { hoyMadrid, sumarDias } from "@/lib/recogida";
import { cn } from "@/lib/utils";
import { mensajesCliente } from "./mensajes-cliente";
import { Empty, PanelHeader, btnGhost, btnPrimary, fecha, inputClass, waHref, type Pedido } from "./shared";

// Las reseñas viven en el Perfil de Empresa de Google. Aquí:
//  1. A quién pedírsela: clientes que ya recogieron y a los que aún no se
//     les ha pedido (un cliente que repite no vuelve a salir).
//  2. Las reseñas de Google para leerlas y responderlas, cuando la API de
//     Perfiles de Empresa esté conectada (si no, accesos directos a Google).

const DIAS_PARA_PEDIR = 21;
const telKey = (t: string | null) => (t ?? "").replace(/\D/g, "").slice(-9);

/** Pedidos recogidos hace poco cuyo cliente nunca ha recibido la petición de reseña. */
export async function cargarParaResena(): Promise<Pedido[]> {
  const db = amwayDb();
  const desde = sumarDias(hoyMadrid(), -DIAS_PARA_PEDIR);
  const [recogidos, pedidas] = await Promise.all([
    db
      .from("amway_pedidos")
      .select("*")
      .eq("estado", "entregado")
      .is("resena_pedida_at", null)
      .gte("recogida_fecha", desde)
      .not("cliente_telefono", "is", null)
      .order("recogida_fecha", { ascending: false })
      .limit(200),
    db.from("amway_pedidos").select("cliente_telefono").not("resena_pedida_at", "is", null).limit(5000),
  ]);
  const yaPedidas = new Set(((pedidas.data as { cliente_telefono: string | null }[] | null) ?? []).map((r) => telKey(r.cliente_telefono)));
  const vistos = new Set<string>();
  return ((recogidos.data as Pedido[] | null) ?? []).filter((p) => {
    const k = telKey(p.cliente_telefono);
    if (!k || yaPedidas.has(k) || vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

interface ResenaPerfil {
  id: string;
  autor: string;
  valoracion: number;
  comentario: string;
  fecha: string;
  respuesta: { texto: string; fecha: string } | null;
}
type EstadoGoogle =
  | { tipo: "cargando" }
  | { tipo: "sin-conectar" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "ok"; media: number; total: number; resenas: ResenaPerfil[] };

export function ResenasPanel({ session, onChange }: { session: Session; onChange: () => void }) {
  const [paraPedir, setParaPedir] = useState<Pedido[] | null>(null);
  const [google, setGoogle] = useState<EstadoGoogle>({ tipo: "cargando" });

  const cargar = useCallback(async () => {
    setParaPedir(await cargarParaResena());
  }, []);

  const cargarGoogle = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/resenas-google", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const j = await r.json();
      if (j.configurado === false) setGoogle({ tipo: "sin-conectar" });
      else if (!r.ok || j.error) setGoogle({ tipo: "error", mensaje: j.error ?? "No se pudieron cargar las reseñas." });
      else setGoogle({ tipo: "ok", media: j.media, total: j.total, resenas: j.resenas });
    } catch {
      setGoogle({ tipo: "error", mensaje: "No se pudo conectar con el servidor." });
    }
  }, [session.access_token]);

  useEffect(() => {
    void cargar();
    void cargarGoogle();
  }, [cargar, cargarGoogle]);

  async function marcarPedida(p: Pedido) {
    setParaPedir((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
    await amwayDb().from("amway_pedidos").update({ resena_pedida_at: new Date().toISOString() }).eq("id", p.id);
    onChange();
  }

  return (
    <div className="flex flex-col gap-10">
      <PanelHeader
        title="Reseñas"
        description="Las reseñas están en Google: se publican solas, sin aprobar nada, y salen también en la web. Tú solo las pides y las respondes."
      />

      <section>
        <h3 className="font-display text-xl text-carbon">Pedir reseña</h3>
        <p className="mt-1 text-sm text-stone">
          Clientes que recogieron en las últimas {DIAS_PARA_PEDIR / 7} semanas y a los que aún no se la has pedido.
        </p>
        <div className="mt-4">
          {!paraPedir ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-stone" />
            </div>
          ) : paraPedir.length === 0 ? (
            <Empty>No hay nadie pendiente. Cuando un cliente recoja su pedido, aparecerá aquí.</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {paraPedir.map((p) => {
                const msg = mensajesCliente(p).find((m) => m.id === "resena");
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-carbon/8 bg-white px-4 py-3">
                    <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                      <p className="truncate font-medium text-carbon">
                        {p.cliente_nombre || "Sin nombre"} <span className="text-xs font-normal text-stone">#{p.numero}</span>
                      </p>
                      <p className="truncate text-xs text-stone">
                        Recogió el {p.recogida_fecha ? fecha(`${p.recogida_fecha}T12:00:00Z`) : "—"} ·{" "}
                        {p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
                      </p>
                    </div>
                    {msg && (
                      <a
                        href={waHref(p.cliente_telefono!, msg.texto)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => void marcarPedida(p)}
                        className={cn(btnPrimary, "h-9 text-xs")}
                      >
                        <MessageCircle size={14} /> Pedir por WhatsApp
                      </a>
                    )}
                    <button type="button" onClick={() => void marcarPedida(p)} className={cn(btnGhost, "h-9 text-xs")} title="Quitar de la lista sin mandar nada">
                      <Check size={14} /> Ya pedida
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl text-carbon">Reseñas en Google</h3>
        <div className="mt-4">
          {google.tipo === "cargando" ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-stone" />
            </div>
          ) : google.tipo === "ok" ? (
            <ListaGoogle datos={google} token={session.access_token} onRecargar={cargarGoogle} />
          ) : (
            <>
              {google.tipo === "error" && (
                <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{google.mensaje}</p>
              )}
              <AccesosGoogle />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Estrellas({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${n} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(n) ? "fill-gold text-gold" : "text-carbon/15"} />
      ))}
    </span>
  );
}

function ListaGoogle({
  datos,
  token,
  onRecargar,
}: {
  datos: { media: number; total: number; resenas: ResenaPerfil[] };
  token: string;
  onRecargar: () => Promise<void>;
}) {
  const [filtro, setFiltro] = useState<"sin" | "todas">("sin");
  const sinResponder = datos.resenas.filter((r) => !r.respuesta).length;
  const lista = datos.resenas.filter((r) => filtro === "todas" || !r.respuesta);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-carbon/8 bg-white px-5 py-4">
        <p className="font-display text-4xl tabular-nums text-carbon">{datos.total ? datos.media.toFixed(1) : "—"}</p>
        <div>
          <Estrellas n={datos.media} size={16} />
          <p className="mt-1 text-xs text-stone">{datos.total} reseñas en Google</p>
        </div>
        <div className="ml-auto flex gap-1.5 rounded-full bg-cream p-1 text-xs">
          {(
            [
              ["sin", `Sin responder (${sinResponder})`],
              ["todas", "Todas"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setFiltro(v)}
              className={cn("rounded-full px-3 py-1.5", filtro === v ? "bg-carbon text-cream" : "text-carbon hover:bg-white")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {lista.length === 0 ? (
        <Empty>{filtro === "sin" ? "Todas las reseñas tienen respuesta." : "Todavía no hay reseñas."}</Empty>
      ) : (
        lista.map((r) => <TarjetaGoogle key={r.id} r={r} token={token} onRecargar={onRecargar} />)
      )}
    </div>
  );
}

function TarjetaGoogle({ r, token, onRecargar }: { r: ResenaPerfil; token: string; onRecargar: () => Promise<void> }) {
  const [texto, setTexto] = useState(r.respuesta?.texto ?? "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cambiado = texto.trim() !== (r.respuesta?.texto ?? "");

  async function guardar(valor: string) {
    setEnviando(true);
    setError(null);
    const res = await fetch("/api/admin/resenas-google", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, texto: valor }),
    }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setEnviando(false);
    if (!res?.ok) return setError(j?.error ?? "No se pudo guardar la respuesta en Google.");
    await onRecargar();
  }

  return (
    <div className="rounded-2xl border border-carbon/8 bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-display text-lg text-carbon">{r.autor}</p>
        <Estrellas n={r.valoracion} />
        <span className="ml-auto text-xs text-stone">{r.fecha ? fecha(r.fecha) : ""}</span>
      </div>
      {r.comentario ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-carbon/85">{r.comentario}</p>
      ) : (
        <p className="mt-3 text-sm italic text-stone">Solo puso estrellas, sin comentario.</p>
      )}
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        maxLength={4000}
        placeholder="Tu respuesta pública en Google"
        className={cn(inputClass, "mt-4 w-full")}
      />
      {error && <p className="mt-2 text-xs text-xs-red">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" disabled={enviando || !texto.trim() || !cambiado} onClick={() => void guardar(texto.trim())} className={cn(btnPrimary, "disabled:opacity-50")}>
          {enviando ? <Loader2 size={14} className="animate-spin" /> : <MessageSquareReply size={14} />}
          {r.respuesta ? "Guardar cambios" : "Responder"}
        </button>
        {r.respuesta && (
          <>
            <span className="text-xs text-forest">Respondida el {fecha(r.respuesta.fecha)}</span>
            <button type="button" disabled={enviando} onClick={() => confirm("¿Borrar tu respuesta en Google?") && void guardar("")} className={cn(btnGhost, "ml-auto h-9 text-xs")}>
              Borrar respuesta
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Mientras la API de Google no esté conectada: accesos directos.
function AccesosGoogle() {
  const [copiado, setCopiado] = useState(false);
  function copiar() {
    void navigator.clipboard.writeText(SITE.googleResenas).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    });
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-3 rounded-2xl border border-carbon/8 bg-white p-5">
        <p className="font-display text-lg text-carbon">Leer y responder</p>
        <p className="text-sm leading-relaxed text-stone">
          Abre tu ficha de Google con tu cuenta y pulsa «Leer reseñas». Debajo de cada una tienes «Responder».
        </p>
        <a href="https://www.google.com/search?q=mi+empresa" target="_blank" rel="noopener noreferrer" className={cn(btnPrimary, "mt-auto self-start")}>
          Abrir mi ficha de Google <ExternalLink size={14} />
        </a>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-carbon/8 bg-white p-5">
        <p className="font-display text-lg text-carbon">Enlace para pedir reseña</p>
        <p className="break-all rounded-lg bg-cream px-3 py-2 font-mono text-xs text-carbon">{SITE.googleResenas}</p>
        <button type="button" onClick={copiar} className={cn(btnGhost, "mt-auto self-start")}>
          {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}
