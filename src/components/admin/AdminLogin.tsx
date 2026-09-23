"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldUser } from "lucide-react";
import { SITE } from "@/data/site-config";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error: authError } = await amwayDb().auth.signInWithPassword({ email: email.trim(), password });
    if (authError) setError("Correo o contraseña incorrectos.");
    setSending(false);
  }

  const field =
    "h-12 w-full rounded-xl border border-carbon/[0.12] bg-white px-4 text-base text-carbon placeholder:text-stone/50 transition focus:border-carbon/30 focus:outline-none focus:ring-4 focus:ring-carbon/[0.05] sm:text-sm";

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/images/editorial/hero-bienestar.webp" alt="" fill priority sizes="55vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon/85 via-carbon/30 to-carbon/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-cream">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cream/60">Panel de gestión</p>
          <p className="mt-3 max-w-md font-display text-4xl leading-tight">
            Pedidos, precios y cuentas de {SITE.name}, en un solo sitio.
          </p>
        </div>
      </div>

      <div className="flex flex-col px-6 py-[calc(1.5rem+env(safe-area-inset-top))] sm:px-12">
        <Link href="/" className="inline-flex w-fit items-center gap-1.5 text-xs text-stone transition hover:text-carbon">
          <ArrowLeft size={14} /> Volver a la tienda
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <form onSubmit={submit} className="w-full max-w-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-carbon text-cream">
              <ShieldUser size={22} />
            </span>
            <h1 className="mt-6 font-display text-[2.1rem] leading-tight text-carbon">Accede al panel</h1>
            <p className="mt-2 text-sm text-stone">
              {SITE.name}
              <span className="text-gold">.</span> · Solo personal autorizado.
            </p>

            <label htmlFor="admin-email" className="mb-2 mt-8 block text-xs font-medium text-stone">
              Correo
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />

            <label htmlFor="admin-password" className="mb-2 mt-4 block text-xs font-medium text-stone">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(field, "pr-12")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone transition hover:text-carbon"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending || !email || !password}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending && <Loader2 size={16} className="animate-spin" />}
              {sending ? "Entrando…" : "Entrar"}
            </button>

            <p className="mt-6 text-center text-xs text-stone">
              ¿Has olvidado la contraseña? Pídesela al desarrollador de la web.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
