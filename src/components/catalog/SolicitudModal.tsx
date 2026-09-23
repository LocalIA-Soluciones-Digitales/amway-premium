"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Product } from "@/data/types";
import { amwayDb } from "@/lib/amway-db";
import { Dialog, fieldClass } from "@/components/ui/Dialog";

export type SolicitudTipo = "agotado" | "encargo" | "otro";

const COPY: Record<SolicitudTipo, { eyebrow: string; title: string; intro: string }> = {
  agotado: {
    eyebrow: "Producto agotado",
    title: "Avísame cuando vuelva",
    intro: "Déjanos tu contacto y te escribimos en cuanto vuelva a estar disponible.",
  },
  encargo: {
    eyebrow: "Encargo",
    title: "Solicitar este producto",
    intro: "Indícanos formato y cantidad y te confirmamos disponibilidad y plazo.",
  },
  otro: {
    eyebrow: "Solicitud",
    title: "¿Buscas otro producto?",
    intro: "Si no lo encuentras en el catálogo, cuéntanos cuál es y lo buscamos por ti.",
  },
};

export function SolicitudModal({
  open,
  onClose,
  tipo,
  product,
  variantIndex = 0,
}: {
  open: boolean;
  onClose: () => void;
  tipo: SolicitudTipo;
  product?: Product;
  variantIndex?: number;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [productoLibre, setProductoLibre] = useState("");
  const [formato, setFormato] = useState(variantIndex);
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormato(variantIndex);
      setEstado("idle");
      setError(null);
    }
  }, [open, variantIndex]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!telefono.trim() && !email.trim()) {
      setError("Déjanos un teléfono o un email para poder contestarte.");
      return;
    }
    setEstado("enviando");
    setError(null);
    const { error: rpcError } = await amwayDb().rpc("amway_crear_solicitud", {
      p_tipo: tipo,
      p_product_id: product?.id ?? "",
      p_producto_nombre: product?.name ?? productoLibre.trim(),
      p_formato: product?.variants[formato]?.size ?? "",
      p_cantidad: product ? cantidad : null,
      p_nombre: nombre.trim(),
      p_telefono: telefono.trim(),
      p_email: email.trim(),
      p_mensaje: mensaje.trim(),
    });
    if (rpcError) {
      setEstado("idle");
      setError("No se pudo enviar la solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.");
      return;
    }
    setEstado("ok");
  }

  const copy = COPY[tipo];

  return (
    <Dialog open={open} onClose={onClose} title={copy.title} eyebrow={copy.eyebrow}>
      {estado === "ok" ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto text-forest" size={44} />
          <p className="mt-4 font-display text-xl text-carbon">¡Solicitud recibida!</p>
          <p className="mt-2 text-sm text-stone">Te contactaremos lo antes posible.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full bg-carbon px-6 py-3 text-sm font-medium text-cream transition hover:bg-carbon-soft"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="text-sm text-stone">{copy.intro}</p>

          {product ? (
            <div className="rounded-xl bg-linen px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-stone">{product.brand}</p>
              <p className="font-display text-base leading-snug text-carbon">{product.name}</p>
            </div>
          ) : (
            <input
              required
              maxLength={200}
              value={productoLibre}
              onChange={(e) => setProductoLibre(e.target.value)}
              placeholder="¿Qué producto buscas?"
              className={fieldClass}
            />
          )}

          {product && (
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <select
                value={formato}
                onChange={(e) => setFormato(Number(e.target.value))}
                aria-label="Formato"
                className={fieldClass}
              >
                {product.variants.map((v, i) => (
                  <option key={i} value={i}>
                    {v.size}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={999}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                aria-label="Cantidad"
                className={fieldClass}
              />
            </div>
          )}

          <input
            required
            maxLength={100}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            className={fieldClass}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="tel"
              maxLength={30}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono / WhatsApp"
              autoComplete="tel"
              className={fieldClass}
            />
            <input
              type="email"
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (opcional)"
              autoComplete="email"
              className={fieldClass}
            />
          </div>
          <textarea
            maxLength={1000}
            rows={3}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Comentarios (opcional)"
            className={fieldClass}
          />

          {error && <p role="alert" className="text-sm text-xs-red">{error}</p>}

          <button
            type="submit"
            disabled={estado === "enviando"}
            className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full bg-carbon text-sm font-medium text-cream transition hover:bg-carbon-soft disabled:opacity-60"
          >
            {estado === "enviando" && <Loader2 size={16} className="animate-spin" />}
            Enviar solicitud
          </button>
        </form>
      )}
    </Dialog>
  );
}
