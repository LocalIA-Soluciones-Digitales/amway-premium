"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Check, Loader2, Star, Trash2, X } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { Badge, Empty, PanelHeader, Segmented, btnGhost, btnPrimary, fecha, inputClass, revalidarTienda, type Resena } from "./shared";

const ESTADO: Record<Resena["estado"], { label: string; tone: "amber" | "green" | "grey" }> = {
  pendiente: { label: "Pendiente", tone: "amber" },
  aprobada: { label: "Publicada", tone: "green" },
  rechazada: { label: "Rechazada", tone: "grey" },
};

export function ResenasPanel({ session, onChange }: { session: Session; onChange: () => void }) {
  const [items, setItems] = useState<Resena[] | null>(null);
  const [filtro, setFiltro] = useState<Resena["estado"] | "todas">("pendiente");

  const cargar = useCallback(async () => {
    const { data } = await amwayDb().from("amway_resenas").select("*").order("created_at", { ascending: false }).limit(500);
    setItems((data as Resena[] | null) ?? []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function actualizar(r: Resena, cambios: Partial<Resena>) {
    setItems((prev) => prev?.map((x) => (x.id === r.id ? { ...x, ...cambios } : x)) ?? null);
    await amwayDb().from("amway_resenas").update(cambios).eq("id", r.id);
    onChange();
    // Published ratings feed the stars on the product cards.
    if ("estado" in cambios) void revalidarTienda(session.access_token);
  }

  async function borrar(r: Resena) {
    if (!confirm(`¿Borrar la reseña de ${r.nombre}?`)) return;
    await amwayDb().from("amway_resenas").delete().eq("id", r.id);
    setItems((prev) => prev?.filter((x) => x.id !== r.id) ?? null);
    onChange();
    void revalidarTienda(session.access_token);
  }

  const stats = useMemo(() => {
    const pub = (items ?? []).filter((r) => r.estado === "aprobada");
    const c: Record<string, number> = {};
    for (const r of items ?? []) c[r.estado] = (c[r.estado] ?? 0) + 1;
    return { counts: c, media: pub.length ? pub.reduce((s, r) => s + r.valoracion, 0) / pub.length : null, publicadas: pub.length };
  }, [items]);

  const lista = (items ?? []).filter((r) => filtro === "todas" || r.estado === filtro);

  return (
    <div>
      <PanelHeader
        title="Reseñas"
        description={
          stats.media != null
            ? `Media publicada ${stats.media.toFixed(1)} ★ en ${stats.publicadas} reseñas. Solo se muestran en la web las que apruebes.`
            : "Solo se muestran en la web las reseñas que apruebes."
        }
        actions={
          <Segmented
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: "pendiente", label: "Pendientes", count: stats.counts.pendiente },
              { value: "aprobada", label: "Publicadas" },
              { value: "rechazada", label: "Rechazadas" },
              { value: "todas", label: "Todas" },
            ]}
          />
        }
      />

      {!items ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : lista.length === 0 ? (
        <Empty>No hay reseñas en esta vista.</Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((r) => (
            <ResenaCard key={r.id} r={r} onUpdate={(c) => actualizar(r, c)} onDelete={() => borrar(r)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResenaCard({ r, onUpdate, onDelete }: { r: Resena; onUpdate: (c: Partial<Resena>) => void; onDelete: () => void }) {
  const [respuesta, setRespuesta] = useState(r.respuesta ?? "");
  const dirty = respuesta !== (r.respuesta ?? "");

  return (
    <div className="rounded-2xl border border-carbon/8 bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-display text-lg text-carbon">{r.nombre}</p>
        <span className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={13} className={n <= r.valoracion ? "fill-gold text-gold" : "text-carbon/15"} />
          ))}
        </span>
        <Badge tone={ESTADO[r.estado].tone}>{ESTADO[r.estado].label}</Badge>
        <span className="ml-auto text-xs text-stone">{fecha(r.created_at, true)}</span>
      </div>
      <p className="mt-0.5 text-xs text-stone">{r.producto_nombre ?? "Opinión general de la tienda"}</p>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-carbon/85">{r.comentario}</p>

      <textarea
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Respuesta pública de la tienda (opcional)"
        className={cn(inputClass, "mt-4 w-full")}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {r.estado !== "aprobada" && (
          <button type="button" className={btnPrimary} onClick={() => onUpdate({ estado: "aprobada", respuesta: respuesta.trim() || null })}>
            <Check size={14} /> Publicar
          </button>
        )}
        {r.estado !== "rechazada" && (
          <button type="button" className={btnGhost} onClick={() => onUpdate({ estado: "rechazada" })}>
            <X size={14} /> {r.estado === "aprobada" ? "Retirar" : "Rechazar"}
          </button>
        )}
        {dirty && (
          <button type="button" className={btnGhost} onClick={() => onUpdate({ respuesta: respuesta.trim() || null })}>
            Guardar respuesta
          </button>
        )}
        <button type="button" onClick={onDelete} aria-label="Borrar" className="ml-auto p-2 text-stone hover:text-xs-red">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
