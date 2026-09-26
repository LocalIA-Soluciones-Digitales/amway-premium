"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { amwayDb } from "@/lib/amway-db";
import { btnGhost, btnPrimary, inputClass } from "./shared";
import { cn } from "@/lib/utils";

// Cambio de contraseña del propio usuario del panel. Se pide la actual y se
// comprueba volviendo a iniciar sesión antes de guardar la nueva.
export function CambiarContrasena({ email, open, onClose }: { email?: string; open: boolean; onClose: () => void }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hecho, setHecho] = useState(false);

  function cerrar() {
    setActual("");
    setNueva("");
    setRepetir("");
    setError(null);
    setHecho(false);
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (nueva.length < 6) return setError("La nueva contraseña debe tener al menos 6 caracteres.");
    if (nueva !== repetir) return setError("Las contraseñas nuevas no coinciden.");
    if (nueva === actual) return setError("La nueva contraseña debe ser distinta de la actual.");
    if (!email) return setError("No se pudo identificar la cuenta.");

    setSaving(true);
    const db = amwayDb();
    const { error: authError } = await db.auth.signInWithPassword({ email, password: actual });
    if (authError) {
      setSaving(false);
      return setError("La contraseña actual no es correcta.");
    }
    const { error: updError } = await db.auth.updateUser({ password: nueva });
    setSaving(false);
    if (updError) return setError("No se pudo cambiar la contraseña. Inténtalo de nuevo.");
    setHecho(true);
  }

  const field = cn(inputClass, "h-11 w-full");

  return (
    <Dialog open={open} onClose={cerrar} title="Cambiar contraseña" eyebrow={email}>
      {hecho ? (
        <div>
          <p className="flex items-center gap-2 rounded-xl bg-forest/10 px-4 py-3 text-sm text-forest">
            <Check size={16} /> Contraseña cambiada. Úsala la próxima vez que entres.
          </p>
          <div className="mt-5 flex justify-end">
            <button type="button" className={btnPrimary} onClick={cerrar}>
              Listo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="pw-actual" className="mb-1.5 block text-xs font-medium text-stone">
              Contraseña actual
            </label>
            <input
              id="pw-actual"
              type="password"
              required
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="pw-nueva" className="mb-1.5 block text-xs font-medium text-stone">
              Nueva contraseña
            </label>
            <input
              id="pw-nueva"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="pw-repetir" className="mb-1.5 block text-xs font-medium text-stone">
              Repite la nueva contraseña
            </label>
            <input
              id="pw-repetir"
              type="password"
              required
              autoComplete="new-password"
              value={repetir}
              onChange={(e) => setRepetir(e.target.value)}
              className={field}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={btnGhost} onClick={cerrar}>
              Cancelar
            </button>
            <button type="submit" className={btnPrimary} disabled={saving || !actual || !nueva || !repetir}>
              {saving && <Loader2 size={15} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
