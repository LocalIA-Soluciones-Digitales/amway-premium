"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { clienteDb } from "@/lib/amway-db";
import { useCliente } from "./ClienteProvider";
import { campoClase } from "./AccesoCliente";

// Destino del enlace de "¿Has olvidado la contraseña?": Supabase abre la
// sesión desde la URL y aquí se elige la contraseña nueva.
export function RestablecerContrasena() {
  const { session, cargando } = useCliente();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caducado, setCaducado] = useState(false);

  // Si tras unos segundos no hay sesión, el enlace ha caducado o ya se usó.
  useEffect(() => {
    if (session) return;
    const t = setTimeout(() => setCaducado(true), 4000);
    return () => clearTimeout(t);
  }, [session]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    setEnviando(true);
    setError(null);
    const { error } = await clienteDb().auth.updateUser({ password });
    setEnviando(false);
    if (error) setError("No se pudo guardar. Pide un enlace nuevo e inténtalo otra vez.");
    else router.replace("/cuenta");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-cream px-5 pb-20 pt-32">
      <div className="w-full max-w-sm rounded-3xl border border-carbon/10 bg-white/70 p-6 sm:p-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-carbon text-cream">
          <KeyRound size={18} />
        </span>
        <h1 className="mt-5 font-display text-2xl text-carbon">Elige tu nueva contraseña</h1>

        {session ? (
          <form onSubmit={enviar} className="mt-6 flex flex-col gap-3">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Nueva contraseña (mínimo 8)"
              required
              minLength={8}
              autoFocus
              className={campoClase}
            />
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
            >
              {enviando && <Loader2 size={16} className="animate-spin" />} Guardar y entrar
            </button>
          </form>
        ) : cargando || !caducado ? (
          <div className="flex justify-center py-10 text-stone">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="mt-4 text-sm text-stone">
            <p>El enlace ha caducado o ya se ha usado.</p>
            <Link href="/cuenta" className="mt-4 inline-block font-medium text-forest underline-offset-4 hover:underline">
              Pedir uno nuevo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
