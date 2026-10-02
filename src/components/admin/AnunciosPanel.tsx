"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ImagePlus, Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/data/products";
import { Dialog } from "@/components/ui/Dialog";
import {
  ANUNCIOS_BUCKET,
  TIPO_ANUNCIO,
  accionAnuncio,
  fechaEvento,
  horarioEvento,
  imagenAnuncio,
  type Anuncio,
  type TipoAnuncio,
} from "@/lib/anuncios";
import { Badge, Empty, PanelHeader, btnGhost, btnPrimary, fecha, inputClass } from "./shared";

type Estado = "visible" | "programado" | "terminado" | "pausado";

const ESTADO: Record<Estado, { label: string; tone: "green" | "blue" | "grey" | "amber" }> = {
  visible: { label: "Se muestra ahora", tone: "green" },
  programado: { label: "Programado", tone: "blue" },
  terminado: { label: "Terminado", tone: "grey" },
  pausado: { label: "Pausado", tone: "amber" },
};

// Misma regla que la RLS pública de amway_anuncios.
function estadoDe(a: Anuncio, ahora = new Date()): Estado {
  if (!a.activo) return "pausado";
  if (a.inicio && new Date(a.inicio) > ahora) return "programado";
  const hoy = ahora.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  if ((a.fin && new Date(a.fin) <= ahora) || (a.evento_fecha && a.evento_fecha < hoy)) return "terminado";
  return "visible";
}

const PRODUCTOS_ORDENADOS = [...PRODUCTS].sort((a, b) => a.name.localeCompare(b.name, "es"));

export function AnunciosPanel() {
  const [items, setItems] = useState<Anuncio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Anuncio | "nuevo" | null>(null);

  const cargar = useCallback(async () => {
    const { data, error: e } = await amwayDb().from("amway_anuncios").select("*").order("updated_at", { ascending: false });
    setError(e ? "No se pudieron cargar los anuncios. ¿Está creada la tabla amway_anuncios en Supabase?" : null);
    setItems((data as Anuncio[] | null) ?? []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function alternar(a: Anuncio) {
    const { data } = await amwayDb().from("amway_anuncios").update({ activo: !a.activo }).eq("id", a.id).select().single();
    if (data) setItems((prev) => prev?.map((x) => (x.id === a.id ? (data as Anuncio) : x)) ?? null);
  }

  async function borrar(a: Anuncio) {
    if (!confirm(`¿Borrar el anuncio «${a.titulo}»?`)) return;
    await amwayDb().from("amway_anuncios").delete().eq("id", a.id);
    setItems((prev) => prev?.filter((x) => x.id !== a.id) ?? null);
  }

  // En la web sale el más reciente de los visibles que el visitante no haya cerrado.
  const enPortada = useMemo(() => (items ?? []).find((a) => estadoDe(a) === "visible")?.id, [items]);

  return (
    <div>
      <PanelHeader
        title="Anuncios"
        description="Pop-up que aparece al entrar en la web: un producto nuevo, un evento en la tienda o cualquier aviso. Cada visitante lo ve una vez; si lo editas, vuelve a salir."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setEditando("nuevo")}>
            <Plus size={15} /> Nuevo anuncio
          </button>
        }
      />

      {error && <p className="mb-4 rounded-xl bg-xs-red/10 px-4 py-3 text-sm text-xs-red">{error}</p>}

      {!items ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone" />
        </div>
      ) : items.length === 0 ? (
        <Empty icon={<Megaphone size={18} />}>
          Aún no hay anuncios. Crea uno para presentar un producto nuevo o invitar a un evento en la tienda.
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <AnuncioCard
              key={a.id}
              a={a}
              enPortada={a.id === enPortada}
              onEdit={() => setEditando(a)}
              onToggle={() => void alternar(a)}
              onDelete={() => void borrar(a)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={editando !== null}
        onClose={() => setEditando(null)}
        title={editando === "nuevo" ? "Nuevo anuncio" : "Editar anuncio"}
        eyebrow="Anuncios"
        wide
      >
        {editando !== null && (
          <AnuncioForm
            key={editando === "nuevo" ? "nuevo" : editando.id}
            inicial={editando === "nuevo" ? null : editando}
            onSaved={(guardado) => {
              setItems((prev) => [guardado, ...(prev ?? []).filter((x) => x.id !== guardado.id)]);
              setEditando(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function AnuncioCard({
  a,
  enPortada,
  onEdit,
  onToggle,
  onDelete,
}: {
  a: Anuncio;
  enPortada: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const estado = estadoDe(a);
  const imagen = imagenAnuncio(a);
  const horario = horarioEvento(a);

  return (
    <div className="flex gap-4 rounded-2xl border border-carbon/8 bg-white p-4 sm:p-5">
      <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-linen sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {imagen && <img src={imagen} alt="" className={a.imagen_url ? "h-full w-full object-cover" : "h-full w-full object-contain p-2"} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={ESTADO[estado].tone}>{ESTADO[estado].label}</Badge>
          <span className="text-xs text-stone">{TIPO_ANUNCIO[a.tipo].label}</span>
          {enPortada && <span className="text-xs font-medium text-forest">· Es el que sale ahora en la web</span>}
        </div>
        <p className="mt-1.5 font-display text-lg leading-snug text-carbon">{a.titulo}</p>
        {a.tipo === "evento" && a.evento_fecha && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone">
            <CalendarDays size={13} /> <span className="first-letter:uppercase">{fechaEvento(a.evento_fecha)}</span>
            {horario && ` · ${horario}`}
          </p>
        )}
        {a.texto && <p className="mt-1 line-clamp-2 text-sm text-carbon/70">{a.texto}</p>}
        <p className="mt-1 text-xs text-stone">
          {a.inicio || a.fin
            ? `${a.inicio ? `Desde ${fecha(a.inicio, true)}` : "Desde ya"}${a.fin ? ` · hasta ${fecha(a.fin, true)}` : ""}`
            : a.tipo === "evento" && a.evento_fecha
              ? "Se retira solo cuando pase el evento"
              : "Sin fecha de fin"}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={btnGhost} onClick={onEdit}>
            <Pencil size={14} /> Editar
          </button>
          <button type="button" className={btnGhost} onClick={onToggle}>
            {a.activo ? "Pausar" : "Activar"}
          </button>
          <button type="button" onClick={onDelete} aria-label="Borrar" className="ml-auto p-2 text-stone hover:text-xs-red">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// datetime-local trabaja en hora local del navegador (la de Yuly, Madrid).
function aInputFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const label = "mb-1.5 block text-xs font-medium text-carbon/70";

function AnuncioForm({ inicial, onSaved }: { inicial: Anuncio | null; onSaved: (a: Anuncio) => void }) {
  const [tipo, setTipo] = useState<TipoAnuncio>(inicial?.tipo ?? "producto");
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [texto, setTexto] = useState(inicial?.texto ?? "");
  const [productId, setProductId] = useState(inicial?.product_id ?? "");
  const [imagenUrl, setImagenUrl] = useState(inicial?.imagen_url ?? "");
  const [botonTexto, setBotonTexto] = useState(inicial?.boton_texto ?? "");
  const [enlace, setEnlace] = useState(inicial?.enlace ?? "");
  const [eventoFecha, setEventoFecha] = useState(inicial?.evento_fecha ?? "");
  const [eventoHora, setEventoHora] = useState(inicial?.evento_hora ?? "");
  const [eventoHoraFin, setEventoHoraFin] = useState(inicial?.evento_hora_fin ?? "");
  const [eventoLugar, setEventoLugar] = useState(inicial?.evento_lugar ?? "");
  const [inicio, setInicio] = useState(aInputFecha(inicial?.inicio ?? null));
  const [fin, setFin] = useState(aInputFecha(inicial?.fin ?? null));
  const [activo, setActivo] = useState(inicial?.activo ?? true);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const producto = PRODUCTS.find((p) => p.id === productId);

  function elegirProducto(id: string) {
    setProductId(id);
    const p = PRODUCTS.find((x) => x.id === id);
    if (p && !titulo.trim()) setTitulo(`Nuevo: ${p.name}`);
  }

  async function subirImagen(file: File) {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen pesa más de 5 MB. Prueba con una más ligera.");
      return;
    }
    setSubiendo(true);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const db = amwayDb();
    const { error: e } = await db.storage.from(ANUNCIOS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    setSubiendo(false);
    if (e) {
      setError("No se pudo subir la imagen. Usa JPG, PNG o WebP de menos de 5 MB.");
      return;
    }
    setImagenUrl(db.storage.from(ANUNCIOS_BUCKET).getPublicUrl(path).data.publicUrl);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!titulo.trim()) return setError("Escribe un título.");
    if (tipo === "evento" && !eventoFecha) return setError("Indica el día del evento.");
    if (inicio && fin && new Date(fin) <= new Date(inicio)) return setError("La fecha de fin debe ser posterior a la de inicio.");

    const esEvento = tipo === "evento";
    const fila = {
      tipo,
      titulo: titulo.trim(),
      texto: texto.trim() || null,
      product_id: tipo === "producto" && productId ? productId : null,
      imagen_url: imagenUrl || null,
      boton_texto: botonTexto.trim() || null,
      enlace: enlace.trim() || null,
      evento_fecha: esEvento ? eventoFecha || null : null,
      evento_hora: esEvento ? eventoHora || null : null,
      evento_hora_fin: esEvento && eventoHora ? eventoHoraFin || null : null,
      evento_lugar: esEvento ? eventoLugar.trim() || null : null,
      inicio: inicio ? new Date(inicio).toISOString() : null,
      fin: fin ? new Date(fin).toISOString() : null,
      activo,
    };

    setGuardando(true);
    const db = amwayDb().from("amway_anuncios");
    const { data, error: err } = inicial
      ? await db.update(fila).eq("id", inicial.id).select().single()
      : await db.insert(fila).select().single();
    setGuardando(false);
    if (err || !data) return setError("No se pudo guardar el anuncio. Revisa los datos e inténtalo de nuevo.");
    onSaved(data as Anuncio);
  }

  // Vista previa del botón con los datos tal y como están en el formulario.
  const borrador = {
    ...(inicial ?? ({} as Anuncio)),
    tipo,
    titulo,
    product_id: tipo === "producto" ? productId || null : null,
    boton_texto: botonTexto,
    enlace,
    evento_fecha: eventoFecha || null,
  } as Anuncio;
  const accion = accionAnuncio(borrador);
  const imagenPrevia = imagenAnuncio({ imagen_url: imagenUrl || null, product_id: borrador.product_id });

  return (
    <form onSubmit={guardar} className="flex flex-col gap-5">
      <div>
        <span className={label}>¿Qué quieres anunciar?</span>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TIPO_ANUNCIO) as TipoAnuncio[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm transition",
                tipo === t ? "border-carbon bg-carbon text-cream" : "border-carbon/12 bg-white text-carbon hover:border-carbon/30"
              )}
            >
              {TIPO_ANUNCIO[t].label}
            </button>
          ))}
        </div>
      </div>

      {tipo === "producto" && (
        <div>
          <label className={label} htmlFor="anuncio-producto">
            Producto
          </label>
          <select id="anuncio-producto" value={productId} onChange={(e) => elegirProducto(e.target.value)} className={cn(inputClass, "w-full")}>
            <option value="">— Sin producto del catálogo —</option>
            {PRODUCTOS_ORDENADOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.brand}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone">El botón llevará al producto en el catálogo y se usará su foto si no subes otra.</p>
        </div>
      )}

      <div>
        <label className={label} htmlFor="anuncio-titulo">
          Título
        </label>
        <input
          id="anuncio-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          required
          placeholder={tipo === "evento" ? "Taller de cuidado facial con Artistry" : "Ya ha llegado el nuevo…"}
          className={cn(inputClass, "w-full")}
        />
      </div>

      <div>
        <label className={label} htmlFor="anuncio-texto">
          Texto
        </label>
        <textarea
          id="anuncio-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={600}
          rows={3}
          placeholder="Cuenta en un par de frases qué es y por qué merece la pena."
          className={cn(inputClass, "h-auto w-full py-2.5")}
        />
      </div>

      {tipo === "evento" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="anuncio-fecha">
              Día del evento
            </label>
            <input id="anuncio-fecha" type="date" value={eventoFecha} onChange={(e) => setEventoFecha(e.target.value)} className={cn(inputClass, "w-full")} />
          </div>
          <div>
            <label className={label} htmlFor="anuncio-hora">
              Empieza
            </label>
            <input id="anuncio-hora" type="time" value={eventoHora} onChange={(e) => setEventoHora(e.target.value)} className={cn(inputClass, "w-full")} />
          </div>
          <div>
            <label className={label} htmlFor="anuncio-hora-fin">
              Termina (opcional)
            </label>
            <input
              id="anuncio-hora-fin"
              type="time"
              value={eventoHoraFin}
              onChange={(e) => setEventoHoraFin(e.target.value)}
              disabled={!eventoHora}
              className={cn(inputClass, "w-full")}
            />
          </div>
          <div className="sm:col-span-3">
            <label className={label} htmlFor="anuncio-lugar">
              Lugar
            </label>
            <input
              id="anuncio-lugar"
              value={eventoLugar}
              onChange={(e) => setEventoLugar(e.target.value)}
              maxLength={160}
              placeholder="En la tienda de Barakaldo"
              className={cn(inputClass, "w-full")}
            />
            <p className="mt-1 text-xs text-stone">El anuncio se retira solo al día siguiente del evento.</p>
          </div>
        </div>
      )}

      <div>
        <span className={label}>Imagen</span>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linen">
            {imagenPrevia ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagenPrevia} alt="" className={imagenUrl ? "h-full w-full object-cover" : "h-full w-full object-contain p-2"} />
            ) : (
              <ImagePlus size={20} className="text-stone" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className={cn(btnGhost, "cursor-pointer")}>
              {subiendo ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {imagenUrl ? "Cambiar imagen" : "Subir imagen"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                disabled={subiendo}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void subirImagen(f);
                  e.target.value = "";
                }}
              />
            </label>
            {imagenUrl && (
              <button type="button" className="text-sm text-stone hover:text-carbon" onClick={() => setImagenUrl("")}>
                Quitar
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-stone">
          {producto && !imagenUrl ? "Ahora se usa la foto del producto. " : ""}Mejor en vertical o cuadrada, de menos de 5 MB.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="anuncio-boton">
            Texto del botón (opcional)
          </label>
          <input
            id="anuncio-boton"
            value={botonTexto}
            onChange={(e) => setBotonTexto(e.target.value)}
            maxLength={40}
            placeholder={accion?.texto ?? "Ver más"}
            className={cn(inputClass, "w-full")}
          />
        </div>
        <div>
          <label className={label} htmlFor="anuncio-enlace">
            Enlace del botón (opcional)
          </label>
          <input
            id="anuncio-enlace"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            maxLength={500}
            placeholder="/ofertas o https://…"
            className={cn(inputClass, "w-full")}
          />
        </div>
        <p className="-mt-2 text-xs text-stone sm:col-span-2">
          {accion
            ? `Si lo dejas vacío, el botón «${accion.texto}» ${
                tipo === "evento" && !enlace ? "abre WhatsApp para reservar plaza" : `lleva a ${accion.href.startsWith("https://wa.me") ? "WhatsApp" : accion.href}`
              }.`
            : "Sin enlace, el anuncio se muestra sin botón."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="anuncio-inicio">
            Empezar a mostrar (opcional)
          </label>
          <input id="anuncio-inicio" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className={cn(inputClass, "w-full")} />
        </div>
        <div>
          <label className={label} htmlFor="anuncio-fin">
            Dejar de mostrar (opcional)
          </label>
          <input id="anuncio-fin" type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} className={cn(inputClass, "w-full")} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-carbon">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 accent-forest" />
        Activo (desmárcalo para guardarlo sin publicarlo todavía)
      </label>

      {error && <p className="rounded-xl bg-xs-red/10 px-4 py-3 text-sm text-xs-red">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" className={btnPrimary} disabled={guardando || subiendo}>
          {guardando && <Loader2 size={14} className="animate-spin" />}
          {inicial ? "Guardar cambios" : "Publicar anuncio"}
        </button>
      </div>
    </form>
  );
}
