"use client";

import { ArrowRight, CalendarDays, CalendarPlus, Clock, MapPin, X } from "lucide-react";
import {
  TIPO_ANUNCIO,
  accionAnuncio,
  calendarioEvento,
  fechaEvento,
  horarioEvento,
  imagenAnuncio,
  type Anuncio,
} from "@/lib/anuncios";
import { cn } from "@/lib/utils";

// El pop-up del anuncio tal cual lo ve el cliente. Lo usan la web y la
// vista previa del panel: responde al ancho de su contenedor (@container),
// no al de la pantalla, para que la vista previa «móvil» sea exacta también
// desde el ordenador.
export function AnuncioTarjeta({
  anuncio,
  onCerrar,
  onAccion,
  reducirMovimiento,
  className,
}: {
  anuncio: Anuncio;
  onCerrar: () => void;
  onAccion?: () => void;
  reducirMovimiento?: boolean;
  className?: string;
}) {
  const imagen = imagenAnuncio(anuncio);
  const video = anuncio.video_url || null;
  const accion = accionAnuncio(anuncio);
  const calendario = calendarioEvento(anuncio);
  const horario = horarioEvento(anuncio);
  const esEvento = anuncio.tipo === "evento";

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden overflow-y-auto overscroll-contain rounded-t-3xl bg-cream-soft shadow-2xl @2xl:flex-row @2xl:rounded-3xl",
        className
      )}
    >
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar anuncio"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream-soft/90 text-carbon shadow-sm backdrop-blur transition hover:bg-cream"
      >
        <X size={18} />
      </button>

      {(imagen || video) && (
        <div className="relative h-60 shrink-0 overflow-hidden bg-linen @2xl:h-auto @2xl:min-h-[26rem] @2xl:w-[44%]">
          {/* En ordenador la foto o el vídeo subidos se ven enteros (un cartel no
              pierde los bordes) y el hueco sobrante se rellena con la misma imagen
              difuminada. En móvil siguen ocupando todo el ancho. */}
          {anuncio.imagen_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={anuncio.imagen_url}
              alt=""
              aria-hidden
              className="absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-70 blur-2xl @2xl:block"
            />
          )}
          {video ? (
            // Con «reducir movimiento» se queda quieto en la portada.
            <video
              key={video}
              src={video}
              poster={imagen ?? undefined}
              muted
              loop
              playsInline
              autoPlay={!reducirMovimiento}
              preload="auto"
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover @2xl:object-contain"
            />
          ) : (
            // Imágenes subidas al panel (Supabase) o de public/: <img> sirve para ambas.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagen!}
              alt=""
              className={
                anuncio.imagen_url
                  ? "absolute inset-0 h-full w-full object-cover @2xl:object-contain"
                  : "absolute inset-0 h-full w-full object-contain p-8"
              }
            />
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7 @2xl:px-9 @2xl:py-10">
        <p className="pr-12 text-[11px] uppercase tracking-[0.24em] text-forest">{TIPO_ANUNCIO[anuncio.tipo].eyebrow}</p>
        <h2 id="anuncio-titulo" className="mt-3 pr-8 font-display text-3xl leading-[1.08] text-carbon @2xl:text-[2.35rem]">
          {anuncio.titulo || "Título del anuncio"}
        </h2>

        {esEvento && (anuncio.evento_fecha || horario || anuncio.evento_lugar) && (
          <ul className="mt-5 flex flex-col gap-2 text-sm text-carbon/80">
            {anuncio.evento_fecha && (
              <li className="flex items-center gap-2.5">
                <CalendarDays size={16} className="shrink-0 text-forest" />
                <span className="first-letter:uppercase">{fechaEvento(anuncio.evento_fecha)}</span>
              </li>
            )}
            {horario && (
              <li className="flex items-center gap-2.5">
                <Clock size={16} className="shrink-0 text-forest" />
                {horario}
              </li>
            )}
            {anuncio.evento_lugar && (
              <li className="flex items-center gap-2.5">
                <MapPin size={16} className="shrink-0 text-forest" />
                {anuncio.evento_lugar}
              </li>
            )}
          </ul>
        )}

        {anuncio.texto && <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-carbon/75">{anuncio.texto}</p>}

        <div className="mt-7 flex flex-wrap items-center gap-3 @2xl:mt-auto @2xl:pt-8">
          {/* <a> y no <Link>: /catalogo?q=… solo lee la búsqueda al cargar la página. */}
          {accion && (
            <a
              href={accion.href}
              {...(accion.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={onAccion}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-carbon px-6 text-sm font-medium text-cream transition hover:bg-carbon-soft"
            >
              {accion.texto} <ArrowRight size={16} />
            </a>
          )}
          {calendario && (
            <a
              href={calendario}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-carbon/15 px-5 text-sm text-carbon transition hover:bg-carbon/5"
            >
              <CalendarPlus size={16} /> Añadir al calendario
            </a>
          )}
          <button type="button" onClick={onCerrar} className="h-12 px-2 text-sm text-stone transition hover:text-carbon">
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
