"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { btnGhost, btnPrimary, inputClass } from "./shared";

// Verificación en dos pasos (TOTP: Google Authenticator, Authy, 1Password…)
// para el panel. La base de datos solo da acceso de admin a quien la tiene
// activada si la sesión está verificada con el código (aal2).

const codigoClass = cn(inputClass, "h-12 w-full text-center font-mono text-lg tracking-[0.4em]");
const soloDigitos = (v: string) => v.replace(/\D/g, "").slice(0, 6);

// ¿Hay que pedir el código antes de enseñar el panel?
export async function necesitaCodigo(): Promise<boolean> {
  const { data } = await amwayDb().auth.mfa.getAuthenticatorAssuranceLevel();
  return !!data && data.nextLevel === "aal2" && data.currentLevel !== "aal2";
}

// Pantalla tras el login cuando la cuenta tiene la verificación activada.
export function PedirCodigo({ email, onVerificado }: { email?: string; onVerificado: () => void }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function verificar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const db = amwayDb();
    const { data: factores } = await db.auth.mfa.listFactors();
    const factor = factores?.totp.find((f) => f.status === "verified");
    if (!factor) {
      setEnviando(false);
      return setError("No se encontró el método de verificación de esta cuenta.");
    }
    const { error: err } = await db.auth.mfa.challengeAndVerify({ factorId: factor.id, code: codigo });
    setEnviando(false);
    if (err) return setError("Código incorrecto o caducado. Prueba con el siguiente.");
    onVerificado();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <form onSubmit={verificar} className="w-full max-w-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-carbon text-cream">
          <ShieldCheck size={22} />
        </span>
        <h1 className="mt-6 font-display text-3xl leading-tight text-carbon">Código de verificación</h1>
        <p className="mt-2 text-sm text-stone">
          Escribe el código de 6 cifras de tu app de autenticación{email ? ` para ${email}` : ""}.
        </p>
        <input
          id="mfa-codigo"
          value={codigo}
          onChange={(e) => setCodigo(soloDigitos(e.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          aria-label="Código de 6 cifras"
          className={cn(codigoClass, "mt-6")}
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-xs-red">
            {error}
          </p>
        )}
        <button type="submit" disabled={codigo.length !== 6 || enviando} className={cn(btnPrimary, "mt-5 h-12 w-full justify-center")}>
          {enviando && <Loader2 size={16} className="animate-spin" />}
          Verificar
        </button>
        <button type="button" onClick={() => amwayDb().auth.signOut()} className={cn(btnGhost, "mt-2 w-full justify-center")}>
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

// Activar o desactivar la verificación desde el panel.
export function DosPasosDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activa, setActiva] = useState<boolean | null>(null);
  const [alta, setAlta] = useState<{ factorId: string; qr: string; secreto: string } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCodigo("");
    setAlta(null);
    void amwayDb()
      .auth.mfa.listFactors()
      .then(({ data }) => setActiva(!!data?.totp.some((f) => f.status === "verified")));
  }, [open]);

  async function empezar() {
    setTrabajando(true);
    setError(null);
    const db = amwayDb();
    // Restos de un alta a medias: se quitan para empezar limpio.
    const { data: lista } = await db.auth.mfa.listFactors();
    for (const f of lista?.all ?? []) {
      if (f.status !== "verified") await db.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error: err } = await db.auth.mfa.enroll({ factorType: "totp", friendlyName: "Panel Amway" });
    setTrabajando(false);
    if (err || !data) return setError("No se pudo iniciar la activación. Inténtalo de nuevo.");
    setAlta({ factorId: data.id, qr: data.totp.qr_code, secreto: data.totp.secret });
  }

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!alta) return;
    setTrabajando(true);
    setError(null);
    const { error: err } = await amwayDb().auth.mfa.challengeAndVerify({ factorId: alta.factorId, code: codigo });
    setTrabajando(false);
    if (err) return setError("Código incorrecto. Comprueba la hora del móvil y prueba con el siguiente.");
    setAlta(null);
    setActiva(true);
  }

  async function desactivar() {
    setTrabajando(true);
    setError(null);
    const db = amwayDb();
    const { data } = await db.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) {
      const { error: err } = await db.auth.mfa.unenroll({ factorId: f.id });
      if (err) {
        setTrabajando(false);
        return setError("Para desactivarla, cierra sesión y vuelve a entrar con el código.");
      }
    }
    setTrabajando(false);
    setActiva(false);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Verificación en dos pasos" eyebrow="Seguridad de la cuenta">
      {activa === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : alta ? (
        <form onSubmit={confirmar} className="flex flex-col gap-3 text-sm text-stone">
          <p>1. Abre tu app de autenticación (Google Authenticator, Authy, 1Password…) y escanea este código:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={alta.qr} alt="Código QR para la app de autenticación" className="mx-auto h-48 w-48 rounded-xl bg-white p-2" />
          <p>
            ¿No puedes escanearlo? Escribe esta clave a mano:{" "}
            <span className="select-all break-all font-mono text-xs text-carbon">{alta.secreto}</span>
          </p>
          <p>2. Escribe el código de 6 cifras que te muestra la app:</p>
          <input
            id="mfa-alta-codigo"
            value={codigo}
            onChange={(e) => setCodigo(soloDigitos(e.target.value))}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Código de 6 cifras"
            className={codigoClass}
          />
          {error && <p role="alert" className="text-xs-red">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setAlta(null)}>
              Cancelar
            </button>
            <button type="submit" disabled={codigo.length !== 6 || trabajando} className={btnPrimary}>
              {trabajando && <Loader2 size={15} className="animate-spin" />} Activar
            </button>
          </div>
        </form>
      ) : activa ? (
        <div className="flex flex-col gap-4 text-sm text-stone">
          <p className="flex items-center gap-2 rounded-xl bg-forest/10 px-4 py-3 text-forest">
            <Check size={16} /> Activada. Al entrar en el panel te pediremos el código de tu app.
          </p>
          {error && <p role="alert" className="text-xs-red">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={desactivar} disabled={trabajando}>
              Desactivar
            </button>
            <button type="button" className={btnPrimary} onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-sm text-stone">
          <p>
            Además de la contraseña, el panel te pedirá un código de 6 cifras que genera una app en tu móvil. Así,
            aunque alguien consiga tu contraseña, no podrá ver los pedidos ni los datos de clientes.
          </p>
          {error && <p role="alert" className="text-xs-red">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={onClose}>
              Ahora no
            </button>
            <button type="button" className={btnPrimary} onClick={empezar} disabled={trabajando}>
              {trabajando && <Loader2 size={15} className="animate-spin" />} Activar
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
