"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bug, ChevronDown, Trash2 } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { Badge, Empty, Loading, PanelHeader, btnGhost, fecha } from "../shared";

interface ErrorRow {
  id: string;
  mensaje: string;
  detalle: string | null;
  path: string | null;
  user_agent: string | null;
  created_at: string;
}

export function ErroresPanel() {
  const [rows, setRows] = useState<ErrorRow[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data } = await amwayDb().from("amway_errores").select("*").order("created_at", { ascending: false }).limit(1000);
    setRows((data as ErrorRow[] | null) ?? []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Agrupa por mensaje: el mismo fallo repetido es una sola incidencia.
  const grupos = useMemo(() => {
    const m = new Map<string, ErrorRow[]>();
    for (const r of rows ?? []) m.set(r.mensaje, [...(m.get(r.mensaje) ?? []), r]);
    return Array.from(m.entries()).map(([mensaje, list]) => ({
      mensaje,
      list,
      paths: Array.from(new Set(list.map((r) => r.path).filter(Boolean))),
    }));
  }, [rows]);

  async function borrarTodo() {
    if (!confirm("¿Vaciar el registro de errores?")) return;
    await amwayDb().from("amway_errores").delete().gte("created_at", "1970-01-01");
    setRows([]);
  }

  async function borrarGrupo(mensaje: string) {
    await amwayDb().from("amway_errores").delete().eq("mensaje", mensaje);
    setRows((prev) => prev?.filter((r) => r.mensaje !== mensaje) ?? null);
  }

  return (
    <div>
      <PanelHeader
        title="Registro de errores"
        description="Fallos de JavaScript que han tenido los visitantes en la tienda, agrupados por mensaje."
        actions={
          rows && rows.length > 0 ? (
            <button type="button" onClick={borrarTodo} className={btnGhost}>
              <Trash2 size={14} /> Vaciar
            </button>
          ) : undefined
        }
      />
      {!rows ? (
        <Loading />
      ) : grupos.length === 0 ? (
        <Empty icon={<Bug size={18} />}>Sin errores registrados. Todo en orden.</Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {grupos.map((g) => {
            const open = abierto === g.mensaje;
            const ultimo = g.list[0];
            return (
              <div key={g.mensaje} className="rounded-2xl border border-carbon/[0.07] bg-white">
                <button
                  type="button"
                  onClick={() => setAbierto(open ? null : g.mensaje)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <Badge tone={g.list.length > 5 ? "red" : "amber"}>{g.list.length}×</Badge>
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-carbon">{g.mensaje}</span>
                  <span className="hidden text-xs text-stone sm:block">Último: {fecha(ultimo.created_at, true)}</span>
                  <ChevronDown size={16} className={cn("text-stone transition", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="border-t border-carbon/[0.06] px-5 py-4 text-xs">
                    <p className="text-stone">Páginas: {g.paths.join(", ") || "—"}</p>
                    <p className="mt-1 text-stone">Navegador: {ultimo.user_agent ?? "—"}</p>
                    {ultimo.detalle && (
                      <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-carbon p-4 font-mono text-[11px] leading-relaxed text-cream/85">
                        {ultimo.detalle}
                      </pre>
                    )}
                    <button type="button" onClick={() => borrarGrupo(g.mensaje)} className={`${btnGhost} mt-3 h-8 text-xs`}>
                      <Trash2 size={13} /> Marcar como resuelto
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
