"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, MessageSquareQuote, Star } from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { amwayDb } from "@/lib/amway-db";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/ui/Dialog";

interface ResenaPublica {
  id: string;
  nombre: string;
  valoracion: number;
  comentario: string;
  respuesta: string | null;
  producto_nombre: string | null;
  created_at: string;
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? "fill-gold text-gold" : "text-carbon/15"} />
      ))}
    </span>
  );
}

export function ResenasSection() {
  const [resenas, setResenas] = useState<ResenaPublica[] | null>(null);

  useEffect(() => {
    amwayDb()
      .from("amway_resenas")
      .select("id, nombre, valoracion, comentario, respuesta, producto_nombre, created_at")
      .eq("estado", "aprobada")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setResenas((data as ResenaPublica[] | null) ?? []));
  }, []);

  const media = useMemo(() => {
    if (!resenas?.length) return null;
    return resenas.reduce((s, r) => s + r.valoracion, 0) / resenas.length;
  }, [resenas]);

  const distribucion = useMemo(
    () => [5, 4, 3, 2, 1].map((n) => ({ n, count: resenas?.filter((r) => r.valoracion === n).length ?? 0 })),
    [resenas]
  );

  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <div>
        <div className="grid gap-8 rounded-3xl border border-carbon/10 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-12 sm:p-8">
          <div>
            <p className="font-display text-7xl leading-none text-carbon tabular-nums">
              {media != null ? media.toFixed(1) : "—"}
            </p>
            <div className="mt-3">
              <Stars value={media ?? 0} size={18} />
            </div>
            <p className="mt-2 text-sm text-stone">
              {resenas == null
                ? "Cargando opiniones…"
                : `${resenas.length} opinión${resenas.length === 1 ? "" : "es"} publicada${resenas.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <ul className="flex flex-col gap-2" aria-label="Distribución de valoraciones">
            {distribucion.map(({ n, count }) => {
              const pct = resenas?.length ? (count / resenas.length) * 100 : 0;
              return (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <span className="flex w-7 items-center gap-1 text-stone tabular-nums">
                    {n}
                    <Star size={11} className="fill-gold text-gold" />
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-carbon/8">
                    <span
                      className="block h-full rounded-full bg-gold transition-[width] duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-6 text-right text-xs text-stone tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {resenas == null && (
          <ul className="mt-8 flex flex-col gap-4" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-36 animate-pulse rounded-3xl bg-linen/70" />
            ))}
          </ul>
        )}

        {resenas?.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-carbon/15 px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <MessageSquareQuote size={24} strokeWidth={1.6} />
            </span>
            <p className="mt-5 font-display text-2xl text-carbon">Todavía no hay opiniones publicadas</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone">
              ¿Ya has probado algo de la tienda? Tu experiencia ayudará a quien venga detrás.
            </p>
            <a
              href="#opinar"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-carbon px-6 py-3 text-sm font-medium text-cream transition hover:bg-carbon-soft"
            >
              Escribir la primera opinión
            </a>
          </div>
        )}

        {!!resenas?.length && (
          <ul className="mt-8 flex flex-col gap-4">
            {resenas.map((r) => (
              <li key={r.id} className="rounded-3xl bg-cream-soft p-6 ring-1 ring-carbon/8 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest/10 font-display text-lg text-forest">
                      {r.nombre.trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium text-carbon">{r.nombre}</p>
                      <p className="text-xs text-stone">
                        {new Date(r.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Stars value={r.valoracion} />
                </div>
                {r.producto_nombre && (
                  <p className="mt-4 inline-flex rounded-full bg-linen px-3 py-1 text-xs text-carbon/75">
                    {r.producto_nombre}
                  </p>
                )}
                <p className="mt-4 whitespace-pre-line leading-relaxed text-carbon/85">{r.comentario}</p>
                {r.respuesta && (
                  <div className="mt-5 rounded-2xl bg-linen/70 px-4 py-3.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-forest">Respuesta de la tienda</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone">{r.respuesta}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ResenaForm />
    </div>
  );
}

function ResenaForm() {
  const [nombre, setNombre] = useState("");
  const [valoracion, setValoracion] = useState(0);
  const [productId, setProductId] = useState("");
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string | null>(null);

  const productosPorMarca = useMemo(() => {
    const map = new Map<string, typeof PRODUCTS>();
    for (const p of PRODUCTS) map.set(p.brand, [...(map.get(p.brand) ?? []), p]);
    return Array.from(map.entries());
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (valoracion === 0) {
      setError("Elige de 1 a 5 estrellas.");
      return;
    }
    setEstado("enviando");
    setError(null);
    const product = PRODUCTS.find((p) => p.id === productId);
    const { error: rpcError } = await amwayDb().rpc("amway_crear_resena", {
      p_product_id: product?.id ?? "",
      p_producto_nombre: product?.name ?? "",
      p_nombre: nombre.trim(),
      p_valoracion: valoracion,
      p_comentario: comentario.trim(),
    });
    if (rpcError) {
      setEstado("idle");
      setError("No se pudo enviar tu opinión. Inténtalo de nuevo en unos minutos.");
      return;
    }
    track("resena", product?.id);
    setEstado("ok");
  }

  return (
    <aside id="opinar" className="h-fit scroll-mt-28 rounded-3xl bg-linen p-6 sm:p-8 lg:sticky lg:top-28">
      {estado === "ok" ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto text-forest" size={44} />
          <p className="mt-4 font-display text-xl text-carbon">¡Gracias por tu opinión!</p>
          <p className="mt-2 text-sm text-stone">La publicaremos en cuanto la revisemos.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="font-display text-2xl text-carbon">Deja tu opinión</p>
          <p className="text-sm text-stone">Cuéntanos qué tal tu experiencia con la tienda o con un producto.</p>

          <div className="flex items-center gap-1 py-1" role="radiogroup" aria-label="Valoración">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={valoracion === n}
                aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
                onClick={() => setValoracion(n)}
                className="p-0.5"
              >
                <Star
                  size={28}
                  className={cn("transition", n <= valoracion ? "fill-gold text-gold" : "text-carbon/20 hover:text-gold/60")}
                />
              </button>
            ))}
          </div>

          <input
            required
            maxLength={100}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="given-name"
            className={fieldClass}
          />
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={fieldClass} aria-label="Producto">
            <option value="">Opinión general de la tienda</option>
            {productosPorMarca.map(([brand, list]) => (
              <optgroup key={brand} label={brand}>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <textarea
            required
            minLength={3}
            maxLength={1000}
            rows={5}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Tu experiencia…"
            className={fieldClass}
          />

          {error && <p role="alert" className="text-sm text-xs-red">{error}</p>}

          <button
            type="submit"
            disabled={estado === "enviando"}
            className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
          >
            {estado === "enviando" && <Loader2 size={16} className="animate-spin" />}
            Enviar opinión
          </button>
        </form>
      )}
    </aside>
  );
}
