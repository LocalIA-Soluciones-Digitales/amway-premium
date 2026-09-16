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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-xs uppercase tracking-wide text-mist">Tu nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre y apellidos"
          className="mt-2 w-full rounded-xl border border-white/10 bg-obsidian/60 px-4 py-3 text-sm text-paper placeholder:text-mist/60 focus:border-wellness/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-mist">Tu mensaje</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Cuéntanos qué producto te interesa…"
          className="mt-2 w-full rounded-xl border border-white/10 bg-obsidian/60 px-4 py-3 text-sm text-paper placeholder:text-mist/60 focus:border-wellness/50 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="mt-2 rounded-full bg-wellness px-6 py-3.5 text-sm font-medium text-obsidian transition hover:bg-wellness/90"
      >
        Enviar por WhatsApp
      </button>
      <p className="text-xs text-mist">
        Al enviar, se abrirá WhatsApp con tu mensaje ya escrito, listo para confirmar el envío.
      </p>
    </form>
  );
}
