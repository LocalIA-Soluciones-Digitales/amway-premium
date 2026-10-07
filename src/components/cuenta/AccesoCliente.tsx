"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, History, Loader2, Repeat, UserRound, Zap } from "lucide-react";
import { clienteDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { AvisoPrivacidad } from "@/components/legal/AvisoPrivacidad";

export type ModoAcceso = "entrar" | "registro" | "recuperar";

export const campoClase =
  "h-12 w-full rounded-xl border border-carbon/15 bg-white px-3.5 text-base text-carbon outline-none transition placeholder:text-stone/70 focus:border-carbon/40 sm:text-sm";

// Traduce los mensajes de Supabase Auth que puede ver un cliente.
function mensajeError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Confirma tu correo con el enlace que te enviamos antes de entrar.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Ya existe una cuenta con ese correo. Inicia sesión o recupera la contraseña.";
  if (m.includes("password")) return "La contraseña debe tener al menos 8 caracteres.";
  if (m.includes("rate limit") || m.includes("security purposes"))
    return "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";
  if (m.includes("signups not allowed")) return "El registro no está disponible ahora mismo. Puedes pedir sin cuenta.";
  return "No se pudo completar. Inténtalo de nuevo.";
}

const VENTAJAS = [
  { icon: History, texto: "Todos tus pedidos, fechas de recogida e importes en un sitio" },
  { icon: Repeat, texto: "Repite un pedido anterior con un toque" },
  { icon: Zap, texto: "Tus datos rellenados en la cesta: pedir es más rápido" },
];

export function AccesoCliente({ modoInicial = "entrar" }: { modoInicial?: ModoAcceso }) {
  const [modo, setModo] = useState<ModoAcceso>(modoInicial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [novedades, setNovedades] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => setModo(modoInicial), [modoInicial]);

  // La cesta recuerda nombre y teléfono del último pedido: se aprovechan.
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem("amway_premium_contacto_v1") ?? "null");
      if (typeof c?.nombre === "string") setNombre((v) => v || c.nombre);
      if (typeof c?.telefono === "string") setTelefono((v) => v || c.telefono);
    } catch {}
  }, []);

  function cambiarModo(m: ModoAcceso) {
    setModo(m);
    setError(null);
    setAviso(null);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setAviso(null);
    const auth = clienteDb().auth;
    const origin = window.location.origin;
    try {
      if (modo === "entrar") {
        const { error } = await auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(mensajeError(error.message));
      } else if (modo === "registro") {
        if (!nombre.trim()) return setError("Indica tu nombre.");
        if (telefono && telefono.replace(/\D/g, "").length < 9) return setError("Revisa el teléfono.");
        if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
        const { data, error } = await auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { nombre: nombre.trim(), telefono: telefono.trim(), novedades, tienda: "amway-premium" },
            emailRedirectTo: `${origin}/cuenta`,
          },
        });
        if (error) setError(mensajeError(error.message));
        // Supabase no revela si el correo ya existía: devuelve un usuario sin identidades.
        else if (data.user && data.user.identities?.length === 0)
          setError("Ya existe una cuenta con ese correo. Inicia sesión o recupera la contraseña.");
        else if (!data.session)
          setAviso(`Te hemos enviado un correo a ${email.trim()}. Abre el enlace para activar tu cuenta.`);
      } else {
        const { error } = await auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/cuenta/restablecer` });
        if (error) setError(mensajeError(error.message));
        else setAviso("Si hay una cuenta con ese correo, te llegará un enlace para crear una contraseña nueva.");
      }
    } finally {
      setEnviando(false);
    }
  }

  const titulo =
    modo === "entrar" ? "Entra en tu cuenta" : modo === "registro" ? "Crea tu cuenta" : "Recupera tu contraseña";

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      <div className="lg:pt-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-stone">Mi cuenta</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-carbon sm:text-5xl">
          Tus pedidos, <span className="italic text-forest">siempre a mano</span>.
        </h1>
        <p className="mt-4 max-w-md text-stone">
          La cuenta es opcional: puedes seguir pidiendo sin registrarte. Si la creas, tendrás tu historial y pedirás en
          menos pasos.
        </p>
        <ul className="mt-8 space-y-4">
          {VENTAJAS.map((v) => (
            <li key={v.texto} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest">
                <v.icon size={16} />
              </span>
              <span className="pt-1.5 text-sm text-carbon">{v.texto}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border border-carbon/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(28,26,22,0.06)] sm:p-8">
        {modo !== "recuperar" && (
          <div className="mb-6 grid grid-cols-2 rounded-full bg-carbon/5 p-1 text-sm">
            {(["entrar", "registro"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => cambiarModo(m)}
                aria-pressed={modo === m}
                className={cn(
                  "h-10 rounded-full font-medium transition",
                  modo === m ? "bg-white text-carbon shadow-sm" : "text-stone hover:text-carbon"
                )}
              >
                {m === "entrar" ? "Entrar" : "Crear cuenta"}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-carbon text-cream">
            <UserRound size={18} />
          </span>
          <h2 className="font-display text-2xl text-carbon">{titulo}</h2>
        </div>

        {aviso ? (
          <div className="mt-6 rounded-2xl bg-forest/10 p-5 text-sm leading-relaxed text-carbon">
            <CheckCircle2 size={20} className="mb-2 text-forest" />
            {aviso}
            <button
              type="button"
              onClick={() => cambiarModo("entrar")}
              className="mt-4 block font-medium text-forest underline-offset-4 hover:underline"
            >
              Volver a entrar
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-6 flex flex-col gap-3">
            {modo === "registro" && (
              <>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className={campoClase}
                />
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono (WhatsApp)"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  className={campoClase}
                />
              </>
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              type="email"
              autoComplete="email"
              required
              maxLength={200}
              className={campoClase}
            />
            {modo !== "recuperar" && (
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={modo === "registro" ? "Contraseña (mínimo 8 caracteres)" : "Contraseña"}
                  type={verPassword ? "text" : "password"}
                  autoComplete={modo === "registro" ? "new-password" : "current-password"}
                  required
                  minLength={modo === "registro" ? 8 : undefined}
                  className={cn(campoClase, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone transition hover:text-carbon"
                >
                  {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {modo === "registro" && (
              <label className="mt-1 flex items-start gap-2.5 text-xs leading-relaxed text-stone">
                <input
                  type="checkbox"
                  checked={novedades}
                  onChange={(e) => setNovedades(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-forest"
                />
                Quiero enterarme de ofertas y novedades (puedes cambiarlo cuando quieras).
              </label>
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
            >
              {enviando && <Loader2 size={16} className="animate-spin" />}
              {modo === "entrar" ? "Entrar" : modo === "registro" ? "Crear mi cuenta" : "Enviar enlace"}
            </button>

            {modo === "registro" && (
              <AvisoPrivacidad
                className="text-center"
                finalidad="gestionar tu cuenta y tus pedidos y, solo si marcas la casilla, enviarte ofertas y novedades"
                extra="Puedes borrar tu cuenta desde tu perfil."
              />
            )}
            {modo === "entrar" && (
              <button
                type="button"
                onClick={() => cambiarModo("recuperar")}
                className="mt-1 text-center text-xs text-stone underline-offset-4 hover:text-carbon hover:underline"
              >
                ¿Has olvidado la contraseña?
              </button>
            )}
            {modo === "recuperar" && (
              <button
                type="button"
                onClick={() => cambiarModo("entrar")}
                className="mt-1 text-center text-xs text-stone underline-offset-4 hover:text-carbon hover:underline"
              >
                Volver a entrar
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
