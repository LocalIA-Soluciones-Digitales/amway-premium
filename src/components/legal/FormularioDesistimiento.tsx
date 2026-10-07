"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { LEGAL, waLink } from "@/data/site-config";
import { amwayRpc } from "@/lib/amway-db";
import { fieldClass } from "@/components/ui/Dialog";
import { AvisoPrivacidad } from "@/components/legal/AvisoPrivacidad";

type Respuesta = { referencia: string; fecha: string } | { error: "datos" | "bloqueado" | "no_encontrado" };

// Función de desistimiento: el cliente comunica que desiste de un pedido y
// recibe al momento una referencia con la fecha y hora (su acuse de recibo).
export function FormularioDesistimiento({ numeroInicial = "" }: { numeroInicial?: string }) {
  const [numero, setNumero] = useState(numeroInicial);
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ referencia: string; fecha: string } | null>(null);
  const [sinServicio, setSinServicio] = useState(false);

  const n = Number(numero.replace(/\D/g, ""));
  const mensajeManual =
    `Hola, comunico que desisto de mi pedido nº ${n || "[número]"}. ` +
    `Nombre: ${nombre || "[nombre]"}. Teléfono del pedido: ${telefono || "[teléfono]"}.` +
    (motivo ? ` Motivo: ${motivo}` : "");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!n || telefono.replace(/\D/g, "").length < 9 || !nombre.trim()) {
      setError("Indica el número de pedido, el teléfono con el que lo hiciste y tu nombre.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await amwayRpc<Respuesta>(
        "amway_solicitar_desistimiento",
        { p_numero: n, p_telefono: telefono, p_nombre: nombre.trim(), p_email: email.trim(), p_motivo: motivo.trim() },
        { cache: "no-store" }
      );
      if ("referencia" in r) setHecho(r);
      else if (r.error === "no_encontrado")
        setError("No encontramos un pedido con ese número y teléfono. Revisa los datos o escríbenos por email.");
      else if (r.error === "bloqueado")
        setError("Por seguridad hemos pausado los intentos un rato. Escríbenos por email y lo tramitamos igual.");
      else setError("Revisa los datos del formulario.");
    } catch {
      // Servicio no disponible: el desistimiento se puede comunicar igual por email o WhatsApp.
      setSinServicio(true);
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) {
    const fecha = new Date(hecho.fecha).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" });
    return (
      <div className="rounded-3xl bg-linen p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto text-forest" size={44} />
        <p className="mt-4 font-display text-2xl text-carbon">Hemos recibido tu desistimiento</p>
        <p className="mt-3 text-sm text-stone">
          Pedido nº {n} · Referencia <strong className="font-mono text-carbon">{hecho.referencia}</strong> · {fecha}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Guarda esta referencia (haz una captura). Te contactaremos para la devolución de los productos y el
          reembolso, que haremos en un máximo de 14 días.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-3xl bg-linen p-6 sm:p-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          id="desist-numero"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          inputMode="numeric"
          maxLength={10}
          placeholder="Nº de pedido"
          aria-label="Número de pedido"
          required
          className={fieldClass}
        />
        <input
          id="desist-telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          type="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="Teléfono del pedido"
          aria-label="Teléfono con el que hiciste el pedido"
          required
          className={fieldClass}
        />
      </div>
      <input
        id="desist-nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        autoComplete="name"
        maxLength={100}
        placeholder="Nombre y apellidos"
        aria-label="Nombre y apellidos"
        required
        className={fieldClass}
      />
      <input
        id="desist-email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        autoComplete="email"
        maxLength={200}
        placeholder="Email (opcional, para el justificante)"
        aria-label="Email"
        className={fieldClass}
      />
      <textarea
        id="desist-motivo"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Productos de los que desistes o comentario (opcional; no hace falta dar motivos)"
        aria-label="Comentario"
        className={fieldClass}
      />

      {error && (
        <p role="alert" className="text-sm text-xs-red">
          {error}
        </p>
      )}
      {sinServicio && (
        <div role="alert" className="rounded-xl bg-white/70 p-4 text-sm leading-relaxed text-carbon">
          <p>
            Ahora mismo no podemos registrarlo desde aquí. Tu derecho no cambia: envíanos este mensaje por email a{" "}
            <strong>{LEGAL.email}</strong> o por WhatsApp y te confirmaremos la recepción.
          </p>
          <p className="mt-2 rounded-lg bg-linen p-3 text-xs text-stone">{mensajeManual}</p>
          <a
            href={waLink(mensajeManual)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-cream"
          >
            Enviar por WhatsApp
          </a>
        </div>
      )}

      <AvisoPrivacidad finalidad="tramitar tu desistimiento y el reembolso" />

      <button
        type="submit"
        disabled={enviando}
        className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
      >
        {enviando && <Loader2 size={16} className="animate-spin" />}
        Desistir del contrato
      </button>
    </form>
  );
}
