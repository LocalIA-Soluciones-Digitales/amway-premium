"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
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

  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_24rem] lg:gap-20">
      <div>
        <div className="flex items-end gap-5 border-b border-carbon/10 pb-6">
          <p className="font-display text-6xl leading-none text-carbon tabular-nums">
            {media != null ? media.toFixed(1) : "—"}
          </p>
          <div className="pb-1">
            <Stars value={media ?? 0} size={18} />
            <p className="mt-1.5 text-sm text-stone">
              {resenas == null
                ? "Cargando opiniones…"
                : `${resenas.length} opinión${resenas.length === 1 ? "" : "es"} verificada${resenas.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {resenas?.length === 0 && (
          <p className="mt-10 text-stone">Todavía no hay opiniones publicadas. ¡Sé el primero en dejar la tuya!</p>
        )}

        <ul className="divide-y divide-carbon/8">
          {resenas?.map((r) => (
            <li key={r.id} className="py-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-lg text-carbon">{r.nombre}</p>
                <Stars value={r.valoracion} />
              </div>
              <p className="mt-0.5 text-xs text-stone">
                {new Date(r.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                {r.producto_nombre && <> · {r.producto_nombre}</>}
              </p>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-carbon/85">{r.comentario}</p>
              {r.respuesta && (
                <div className="mt-4 border-l-2 border-forest/40 pl-4">
                  <p className="text-[11px] uppercase tracking-wider text-forest">Respuesta de la tienda</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone">{r.respuesta}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
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
    <aside className="h-fit rounded-3xl bg-linen p-6 sm:p-8 lg:sticky lg:top-28">
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
