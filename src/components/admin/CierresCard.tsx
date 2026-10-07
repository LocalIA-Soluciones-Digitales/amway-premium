"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarOff, Trash2 } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { fechaLarga, hoyMadrid } from "@/lib/recogida";
import { Card, CardTitle, btnGhost, inputClass, revalidarTienda } from "./shared";

interface Cierre {
  fecha: string;
  motivo: string | null;
}

// Días en los que la tienda no ofrece recogidas (festivos de Euskadi y
// Barakaldo, vacaciones, un día de médico…). Los domingos y los festivos
// nacionales ya van fijos en el calendario (src/lib/recogida.ts).
export function CierresCard() {
  const [cierres, setCierres] = useState<Cierre[] | null>(null);
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const { data, error: e } = await amwayDb()
      .from("amway_cierres")
      .select("fecha, motivo")
      .gte("fecha", hoyMadrid())
      .order("fecha");
    if (e) {
      // Tabla aún sin crear (migración 20261007b sin aplicar).
      setError("Falta aplicar la migración de días cerrados en la base de datos.");
      setCierres([]);
      return;
    }
    setCierres((data as Cierre[] | null) ?? []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // La tienda cachea el calendario un minuto: se le avisa para que el
  // cambio se vea al momento.
  async function avisarTienda() {
    const { data } = await amwayDb().auth.getSession();
    if (data.session) await revalidarTienda(data.session.access_token);
  }

  async function anadir(e: FormEvent) {
    e.preventDefault();
    if (!fecha) return;
    setGuardando(true);
    setError(null);
    const { error: err } = await amwayDb()
      .from("amway_cierres")
      .upsert({ fecha, motivo: motivo.trim().slice(0, 120) || null });
    setGuardando(false);
    if (err) {
      setError("No se pudo guardar el día. Inténtalo de nuevo.");
      return;
    }
    setFecha("");
    setMotivo("");
    await cargar();
    void avisarTienda();
  }

  async function quitar(f: string) {
    const { error: err } = await amwayDb().from("amway_cierres").delete().eq("fecha", f);
    if (err) {
      setError("No se pudo quitar el día.");
      return;
    }
    setCierres((c) => c?.filter((x) => x.fecha !== f) ?? null);
    void avisarTienda();
  }

  return (
    <Card>
      <CardTitle>Días cerrados</CardTitle>
      <p className="mb-3 text-xs text-stone">
        Esos días no se pueden elegir para recoger. Domingos y festivos nacionales ya van incluidos.
      </p>
      <form onSubmit={anadir} className="flex flex-col gap-2">
        <input
          type="date"
          required
          min={hoyMadrid()}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          aria-label="Día cerrado"
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={motivo}
            maxLength={120}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (opcional)"
            aria-label="Motivo"
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button type="submit" disabled={guardando || !fecha} className={btnGhost}>
            Añadir
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      {cierres && cierres.length > 0 && (
        <ul className="mt-3 divide-y divide-carbon/[0.06]">
          {cierres.map((c) => (
            <li key={c.fecha} className="flex items-center gap-2 py-2 text-sm">
              <CalendarOff size={14} className="shrink-0 text-stone" />
              <span className="min-w-0 flex-1">
                <span className="capitalize text-carbon">{fechaLarga(c.fecha)}</span>
                {c.motivo && <span className="block truncate text-xs text-stone">{c.motivo}</span>}
              </span>
              <button
                type="button"
                onClick={() => void quitar(c.fecha)}
                aria-label={`Quitar ${fechaLarga(c.fecha)}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone transition hover:bg-carbon/5 hover:text-carbon"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
