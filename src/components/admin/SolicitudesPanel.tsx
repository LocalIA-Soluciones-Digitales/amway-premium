"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, MessageCircle, Trash2 } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { Badge, Empty, PanelHeader, Segmented, btnGhost, fecha, waHref, type Solicitud } from "./shared";

const TIPO: Record<Solicitud["tipo"], { label: string; tone: "red" | "blue" | "violet" }> = {
  agotado: { label: "Avisar cuando vuelva", tone: "red" },
  encargo: { label: "Encargo", tone: "blue" },
  otro: { label: "Producto fuera de catálogo", tone: "violet" },
};

export function SolicitudesPanel({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<Solicitud[] | null>(null);
  const [filtro, setFiltro] = useState<Solicitud["estado"] | "todas">("pendiente");

  const cargar = useCallback(async () => {
    const { data } = await amwayDb()
      .from("amway_solicitudes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setItems((data as Solicitud[] | null) ?? []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function setEstado(s: Solicitud, estado: Solicitud["estado"]) {
    setItems((prev) => prev?.map((x) => (x.id === s.id ? { ...x, estado } : x)) ?? null);
    await amwayDb().from("amway_solicitudes").update({ estado }).eq("id", s.id);
    onChange();
  }

  async function borrar(s: Solicitud) {
    if (!confirm(`¿Borrar la solicitud de ${s.nombre}?`)) return;
    await amwayDb().from("amway_solicitudes").delete().eq("id", s.id);
    setItems((prev) => prev?.filter((x) => x.id !== s.id) ?? null);
    onChange();
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of items ?? []) c[s.estado] = (c[s.estado] ?? 0) + 1;
    return c;
  }, [items]);

  // Productos más pedidos estando agotados: pista de qué reponer primero.
  const masPedidos = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of items ?? []) {
      if (s.estado === "pendiente") m.set(s.producto_nombre, (m.get(s.producto_nombre) ?? 0) + (s.cantidad ?? 1));
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [items]);

  const lista = (items ?? []).filter((s) => filtro === "todas" || s.estado === filtro);

  return (
    <div>
      <PanelHeader
        title="Solicitudes"
        description="Avisos de productos agotados, encargos y productos que no están en el catálogo."
        actions={
          <Segmented
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: "pendiente", label: "Pendientes", count: counts.pendiente },
              { value: "atendida", label: "Atendidas" },
              { value: "descartada", label: "Descartadas" },
              { value: "todas", label: "Todas" },
            ]}
          />
        }
      />

      {masPedidos.length > 0 && filtro === "pendiente" && (
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-stone">Más solicitados:</span>
          {masPedidos.map(([nombre, n]) => (
            <Badge key={nombre}>
              {nombre} · {n}
            </Badge>
          ))}
        </div>
      )}

      {!items ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : lista.length === 0 ? (
        <Empty>No hay solicitudes en esta vista.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {lista.map((s) => (
            <div key={s.id} className={cn("flex flex-col rounded-2xl border border-carbon/8 bg-white p-5", s.estado !== "pendiente" && "opacity-70")}>
              <div className="flex items-start justify-between gap-2">
                <Badge tone={TIPO[s.tipo].tone}>{TIPO[s.tipo].label}</Badge>
                <span className="text-xs text-stone">{fecha(s.created_at, true)}</span>
              </div>
              <p className="mt-3 font-display text-lg leading-snug text-carbon">{s.producto_nombre}</p>
              <p className="text-xs text-stone">
                {[s.formato, s.cantidad ? `${s.cantidad} ud.` : null].filter(Boolean).join(" · ")}
              </p>
              {s.mensaje && <p className="mt-3 whitespace-pre-line text-sm text-carbon/80">“{s.mensaje}”</p>}
              <div className="mt-4 border-t border-carbon/8 pt-3 text-sm">
                <p className="font-medium text-carbon">{s.nombre}</p>
                <p className="text-stone">{[s.telefono, s.email].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {s.telefono && (
                  <a
                    href={waHref(
                      s.telefono,
                      s.tipo === "agotado"
                        ? `Hola ${s.nombre}, ya tenemos disponible ${s.producto_nombre}. ¿Te lo reservamos?`
                        : `Hola ${s.nombre}, te escribimos por tu solicitud de ${s.producto_nombre}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnGhost}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
                {s.email && (
                  <a href={`mailto:${s.email}?subject=${encodeURIComponent(s.producto_nombre)}`} className={btnGhost}>
                    <Mail size={14} /> Email
                  </a>
                )}
                <select
                  value={s.estado}
                  onChange={(e) => setEstado(s, e.target.value as Solicitud["estado"])}
                  className="ml-auto rounded-full border border-carbon/15 bg-white px-3 py-2 text-base sm:text-xs"
                  aria-label="Estado"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="atendida">Atendida</option>
                  <option value="descartada">Descartada</option>
                </select>
                <button type="button" onClick={() => borrar(s)} aria-label="Borrar" className="p-2 text-stone hover:text-xs-red">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
