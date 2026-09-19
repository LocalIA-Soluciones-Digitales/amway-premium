"use client";

import { useState } from "react";
import { waLink } from "@/data/site-config";

export function ContactForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hola, soy ${name || "un cliente"}. ${message || "Quiero más información."}`;
    window.open(waLink(text), "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="text-xs uppercase tracking-wide text-stone">Tu nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre y apellidos"
          className="mt-2 w-full border-b border-carbon/15 bg-transparent py-2.5 text-sm text-carbon placeholder:text-stone/70 focus:border-forest focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-stone">Tu mensaje</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Cuéntanos qué producto te interesa…"
          className="mt-2 w-full border-b border-carbon/15 bg-transparent py-2.5 text-sm text-carbon placeholder:text-stone/70 focus:border-forest focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="mt-2 rounded-full bg-forest px-6 py-3.5 text-sm font-medium text-cream transition hover:bg-forest-dim"
      >
        Enviar por WhatsApp
      </button>
      <p className="text-xs text-stone">
        Al enviar, se abrirá WhatsApp con tu mensaje ya escrito, listo para confirmar el envío.
      </p>
    </form>
  );
}
