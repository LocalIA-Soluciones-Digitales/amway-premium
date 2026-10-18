"use client";

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { SITE } from "@/data/site-config";

// Mapa de Google del local. No se carga hasta que el visitante lo pide: el
// mapa incrustado pone cookies de Google y la web no usa cookies de terceros
// sin permiso. «Cómo llegar» abre la ficha en Google Maps.
const DIRECCION = `${SITE.street}, ${SITE.postalCode} ${SITE.city}`;
const EMBED = `https://www.google.com/maps?q=${encodeURIComponent(`${SITE.name}, ${DIRECCION}`)}&z=17&output=embed`;

export function MapaTienda() {
  const [cargado, setCargado] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-carbon/10 bg-white">
      <div className="relative aspect-[16/10] bg-linen">
        {cargado ? (
          <iframe
            src={EMBED}
            title={`Mapa: ${SITE.name}, ${DIRECCION}`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setCargado(true)}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-cream transition group-hover:scale-105">
              <MapPin size={24} />
            </span>
            <span className="font-display text-xl text-carbon">Ver mapa</span>
            <span className="max-w-xs text-xs leading-relaxed text-stone">
              Se carga Google Maps, que puede guardar sus propias cookies.
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="font-medium text-carbon">{DIRECCION}</p>
          <p className="text-xs text-stone">Recogida en el local, {SITE.horario.texto}</p>
        </div>
        <a
          href={SITE.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-carbon px-4 py-2.5 text-sm font-medium text-cream transition hover:bg-carbon-soft"
        >
          <Navigation size={15} />
          Cómo llegar
        </a>
      </div>
    </div>
  );
}
