import { ExternalLink, PenLine, Star } from "lucide-react";
import { SITE } from "@/data/site-config";
import type { ResumenGoogle } from "@/lib/google-resenas";

// Las opiniones de la tienda viven en el Perfil de Empresa de Google: aquí
// se muestran (si hay clave de Places) y todos los botones llevan a Google.

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? "fill-gold text-gold" : "text-carbon/15"} />
      ))}
    </span>
  );
}

const btnPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-full bg-carbon px-6 py-3 text-sm font-medium text-cream transition hover:bg-carbon-soft";
const btnSecundario =
  "inline-flex items-center justify-center gap-2 rounded-full border border-carbon/15 px-6 py-3 text-sm font-medium text-carbon transition hover:bg-carbon/5";

export function ResenasGoogle({ datos }: { datos: ResumenGoogle | null }) {
  const verTodas = datos?.mapsUrl ?? SITE.googleMaps;
  const hay = !!datos && datos.total > 0;

  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div>
        {hay ? (
          <>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-3xl border border-carbon/10 p-6 sm:p-8">
              <p className="font-display text-7xl leading-none text-carbon tabular-nums">{datos.media.toFixed(1)}</p>
              <div>
                <Stars value={datos.media} size={20} />
                <p className="mt-2 text-sm text-stone">
                  {datos.total} reseña{datos.total === 1 ? "" : "s"} en Google
                </p>
              </div>
              <a href={verTodas} target="_blank" rel="noopener noreferrer" className={`${btnSecundario} sm:ml-auto`}>
                Ver todas en Google
                <ExternalLink size={15} />
              </a>
            </div>

            <ul className="mt-8 flex flex-col gap-4">
              {datos.resenas.map((r, i) => (
                <li key={`${r.fecha}-${i}`} className="rounded-3xl bg-cream-soft p-6 ring-1 ring-carbon/8 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/10 font-display text-lg text-forest">
                        {r.autor.trim().charAt(0).toUpperCase()}
                      </span>
                      <div>
                        {r.autorUrl ? (
                          <a href={r.autorUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-carbon hover:underline">
                            {r.autor}
                          </a>
                        ) : (
                          <p className="font-medium text-carbon">{r.autor}</p>
                        )}
                        <p className="text-xs text-stone">{r.hace ? `${r.hace} · ` : ""}Google</p>
                      </div>
                    </div>
                    <Stars value={r.valoracion} />
                  </div>
                  {r.texto && <p className="mt-4 whitespace-pre-line leading-relaxed text-carbon/85">{r.texto}</p>}
                </li>
              ))}
            </ul>
            {datos.total > datos.resenas.length && (
              <p className="mt-6 text-sm text-stone">
                Aquí ves {datos.resenas.length} de ellas.{" "}
                <a href={verTodas} target="_blank" rel="noopener noreferrer" className="font-medium text-carbon underline underline-offset-2">
                  Lee las {datos.total} en Google
                </a>
                .
              </p>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-carbon/15 px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Star size={24} strokeWidth={1.6} />
            </span>
            <p className="mt-5 font-display text-2xl text-carbon">Nuestras opiniones están en Google</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone">
              Todas las reseñas de la tienda se publican en nuestro perfil de Google, a la vista de todo el mundo y sin filtros.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href={SITE.googleResenas} target="_blank" rel="noopener noreferrer" className={btnPrincipal}>
                <PenLine size={16} />
                Escribir una reseña
              </a>
              <a href={verTodas} target="_blank" rel="noopener noreferrer" className={btnSecundario}>
                Ver reseñas en Google
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        )}
      </div>

      <aside id="opinar" className="h-fit scroll-mt-28 rounded-3xl bg-linen p-6 sm:p-8 lg:sticky lg:top-28">
        <p className="font-display text-2xl text-carbon">¿Ya nos conoces?</p>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          Cuéntalo en Google: es un minuto y ayuda a otras personas de {SITE.city} a encontrarnos. Necesitas una cuenta de Google (la de Gmail sirve).
        </p>
        <a href={SITE.googleResenas} target="_blank" rel="noopener noreferrer" className={`${btnPrincipal} mt-6 w-full`}>
          <Star size={16} />
          Valorar en Google
        </a>
      </aside>
    </div>
  );
}
