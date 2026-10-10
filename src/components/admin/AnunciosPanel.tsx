"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Copy,
  Eye,
  ExternalLink,
  Film,
  ImagePlus,
  Loader2,
  Megaphone,
  MousePointerClick,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { amwayDb } from "@/lib/amway-db";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/data/products";
import { Dialog } from "@/components/ui/Dialog";
import {
  ANUNCIOS_BUCKET,
  TIPO_ANUNCIO,
  VIDEO_MAX_MB,
  reducirImagen,
  leerVideo,
  enlaceValido,
  accionAnuncio,
  fechaEvento,
  horarioEvento,
  imagenAnuncio,
  type Anuncio,
  type TipoAnuncio,
} from "@/lib/anuncios";
import { AnuncioVistaPrevia } from "./AnuncioVistaPrevia";
import { Badge, Empty, PanelHeader, btnGhost, btnPrimary, fecha, inputClass } from "./shared";

type Estado = "visible" | "en_cola" | "programado" | "terminado" | "pausado";

const ESTADO: Record<Estado, { label: string; tone: "green" | "blue" | "grey" | "amber" | "violet" }> = {
  visible: { label: "En la web ahora", tone: "green" },
  en_cola: { label: "En cola", tone: "violet" },
  programado: { label: "Programado", tone: "blue" },
  terminado: { label: "Terminado", tone: "grey" },
  pausado: { label: "Pausado", tone: "amber" },
};

// Misma regla que la RLS pública de amway_anuncios.
function estadoBase(a: Anuncio, ahora = new Date()): Exclude<Estado, "en_cola"> {
  if (!a.activo) return "pausado";
  if (a.inicio && new Date(a.inicio) > ahora) return "programado";
  const hoy = ahora.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  if ((a.fin && new Date(a.fin) <= ahora) || (a.evento_fecha && a.evento_fecha < hoy)) return "terminado";
  return "visible";
}

export function anuncioVigente(a: Anuncio): boolean {
  return estadoBase(a) === "visible";
}

export interface EstadisticaAnuncio {
  vistos: number;
  clics: number;
}

// Personas distintas que lo han visto y que han pulsado su botón.
export async function cargarEstadisticas(): Promise<Record<string, EstadisticaAnuncio>> {
  const { data } = await amwayDb().rpc("amway_estadisticas_anuncios");
  const out: Record<string, EstadisticaAnuncio> = {};
  for (const r of (data as { anuncio_id: string; vistos: number; clics: number }[] | null) ?? []) {
    out[r.anuncio_id] = { vistos: Number(r.vistos), clics: Number(r.clics) };
  }
  return out;
}

const PRODUCTOS_ORDENADOS = [...PRODUCTS].sort((a, b) => a.name.localeCompare(b.name, "es"));

export function AnunciosPanel() {
  const [items, setItems] = useState<Anuncio[] | null>(null);
  const [stats, setStats] = useState<Record<string, EstadisticaAnuncio>>({});
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Anuncio | "nuevo" | null>(null);
  const [copiaDe, setCopiaDe] = useState<Anuncio | null>(null);
  const [previa, setPrevia] = useState<Anuncio | null>(null);

  const cargar = useCallback(async () => {
    const [{ data, error: e }, st] = await Promise.all([
      amwayDb().from("amway_anuncios").select("*").order("updated_at", { ascending: false }),
      cargarEstadisticas(),
    ]);
    setError(e ? "No se pudieron cargar los anuncios. ¿Está creada la tabla amway_anuncios en Supabase?" : null);
    setItems((data as Anuncio[] | null) ?? []);
    setStats(st);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function alternar(a: Anuncio) {
    const { data } = await amwayDb().from("amway_anuncios").update({ activo: !a.activo }).eq("id", a.id).select().single();
    if (data) setItems((prev) => prev?.map((x) => (x.id === a.id ? (data as Anuncio) : x)) ?? null);
  }

  async function borrar(a: Anuncio) {
    if (!confirm(`¿Borrar el anuncio «${a.titulo}»? Si solo quieres quitarlo de la web, mejor páusalo.`)) return;
    await amwayDb().from("amway_anuncios").delete().eq("id", a.id);
    setItems((prev) => prev?.filter((x) => x.id !== a.id) ?? null);
  }

  // En la web sale el más reciente de los vigentes; los demás esperan turno
  // (cada visitante ve uno por visita: el siguiente que aún no haya cerrado).
  const estados = useMemo(() => {
    const ahora = new Date();
    let primero = true;
    const out: Record<string, Estado> = {};
    for (const a of items ?? []) {
      const e = estadoBase(a, ahora);
      out[a.id] = e === "visible" && !primero ? "en_cola" : e;
      if (e === "visible") primero = false;
    }
    return out;
  }, [items]);

  const abrirNuevo = () => {
    setCopiaDe(null);
    setEditando("nuevo");
  };

  return (
    <div>
      <PanelHeader
        title="Anuncios"
        description="Pop-up que aparece al entrar en la web: un producto nuevo, un evento en la tienda o cualquier aviso. Cada visitante lo ve una vez; si lo editas, vuelve a salir."
        actions={
          <button type="button" className={btnPrimary} onClick={abrirNuevo}>
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
              estado={estados[a.id] ?? "pausado"}
              stats={stats[a.id]}
              onEdit={() => setEditando(a)}
              onPreview={() => setPrevia(a)}
              onDuplicate={() => {
                setCopiaDe(a);
                setEditando("nuevo");
              }}
              onToggle={() => void alternar(a)}
              onDelete={() => void borrar(a)}
            />
          ))}
          <p className="px-1 text-xs text-stone">
            «Visto» y «pulsaron» cuentan personas distintas que aceptaron las cookies de la web: la cifra real es algo mayor.
          </p>
        </div>
      )}

      <Dialog
        open={editando !== null}
        onClose={() => setEditando(null)}
        title={editando === "nuevo" ? (copiaDe ? "Copia de anuncio" : "Nuevo anuncio") : "Editar anuncio"}
        eyebrow="Anuncios"
        wide
      >
        {editando !== null && (
          <AnuncioForm
            key={editando === "nuevo" ? `nuevo-${copiaDe?.id ?? ""}` : editando.id}
            inicial={editando === "nuevo" ? null : editando}
            plantilla={editando === "nuevo" ? copiaDe : null}
            onPreview={setPrevia}
            onSaved={(guardado) => {
              setItems((prev) => [guardado, ...(prev ?? []).filter((x) => x.id !== guardado.id)]);
              setEditando(null);
              setCopiaDe(null);
            }}
          />
        )}
      </Dialog>

      <AnuncioVistaPrevia anuncio={previa} onClose={() => setPrevia(null)} />
    </div>
  );
}

function AnuncioCard({
  a,
  estado,
  stats,
  onEdit,
  onPreview,
  onDuplicate,
  onToggle,
  onDelete,
}: {
  a: Anuncio;
  estado: Estado;
  stats?: EstadisticaAnuncio;
  onEdit: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const imagen = imagenAnuncio(a);
  const horario = horarioEvento(a);
  const enWeb = estado === "visible" || estado === "en_cola";

  return (
    <div className="flex gap-4 rounded-2xl border border-carbon/8 bg-white p-4 sm:p-5">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Vista previa de «${a.titulo}»`}
        className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-linen sm:h-28 sm:w-24"
      >
        {a.video_url ? (
          <video src={a.video_url} poster={imagen ?? undefined} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          imagen && <img src={imagen} alt="" className={a.imagen_url ? "h-full w-full object-cover" : "h-full w-full object-contain p-2"} />
        )}
        {a.video_url && (
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-carbon/70 p-1 text-cream">
            <Film size={10} />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={ESTADO[estado].tone}>{ESTADO[estado].label}</Badge>
          <span className="text-xs text-stone">{TIPO_ANUNCIO[a.tipo].label}</span>
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
          {estado === "en_cola" && "Sale a quien ya haya cerrado el más reciente · "}
          {a.inicio || a.fin
            ? `${a.inicio ? `Desde ${fecha(a.inicio, true)}` : "Desde ya"}${a.fin ? ` · hasta ${fecha(a.fin, true)}` : ""}`
            : a.tipo === "evento" && a.evento_fecha
              ? "Se retira solo cuando pase el evento"
              : "Sin fecha de fin"}
        </p>

        {stats && stats.vistos > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-carbon/80">
            <span className="inline-flex items-center gap-1.5">
              <Eye size={13} className="text-stone" /> Visto por <b className="tabular-nums">{stats.vistos}</b>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MousePointerClick size={13} className="text-stone" /> <b className="tabular-nums">{stats.clics}</b> pulsaron el botón
              <span className="text-stone">({Math.round((stats.clics / stats.vistos) * 100)} %)</span>
            </span>
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={btnGhost} onClick={onEdit}>
            <Pencil size={14} /> Editar
          </button>
          <button type="button" className={btnGhost} onClick={onPreview}>
            <Eye size={14} /> Vista previa
          </button>
          {enWeb && (
            <a href={`/?anuncio=${a.id}`} target="_blank" rel="noopener" className={btnGhost}>
              <ExternalLink size={14} /> Ver en la web
            </a>
          )}
          <button type="button" className={btnGhost} onClick={onToggle}>
            {a.activo ? "Pausar" : "Activar"}
          </button>
          <div className="ml-auto flex items-center">
            <button type="button" onClick={onDuplicate} aria-label="Duplicar" title="Duplicar" className="p-2 text-stone hover:text-carbon">
              <Copy size={15} />
            </button>
            <button type="button" onClick={onDelete} aria-label="Borrar" title="Borrar" className="p-2 text-stone hover:text-xs-red">
              <Trash2 size={15} />
            </button>
          </div>
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

function Paso({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-carbon/[0.07] pt-5 first:border-0 first:pt-0">
      <h3 className="flex items-center gap-2.5 text-sm font-medium text-carbon">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-carbon text-[11px] text-cream tabular-nums">{n}</span>
        {titulo}
      </h3>
      {children}
    </section>
  );
}

// Recuadro para elegir o soltar un archivo (en el móvil abre la galería).
function SelectorArchivo({
  accept,
  ocupado,
  onFile,
  quitar,
  children,
}: {
  accept: string;
  ocupado: boolean;
  onFile: (f: File) => void;
  quitar?: { texto: string; onClick: () => void };
  children: ReactNode;
}) {
  const [encima, setEncima] = useState(false);
  return (
    <div className="relative">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => {
          e.preventDefault();
          setEncima(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !ocupado) onFile(f);
        }}
        className={cn(
          "relative flex h-36 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-dashed text-center text-xs text-stone transition",
          encima ? "border-forest bg-forest/5" : "border-carbon/15 bg-white hover:border-carbon/30",
          ocupado && "pointer-events-none"
        )}
      >
        {children}
        <input
          type="file"
          accept={accept}
          className="sr-only"
          disabled={ocupado}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {/* Fuera del <label>: dentro abriría el selector de archivos. */}
      {quitar && !ocupado && (
        <button
          type="button"
          onClick={quitar.onClick}
          aria-label={quitar.texto}
          title={quitar.texto}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-carbon/75 text-cream transition hover:bg-red-600"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

function AnuncioForm({
  inicial,
  plantilla,
  onSaved,
  onPreview,
}: {
  inicial: Anuncio | null;
  plantilla: Anuncio | null;
  onSaved: (a: Anuncio) => void;
  onPreview: (a: Anuncio) => void;
}) {
  const base = inicial ?? plantilla;
  const [tipo, setTipo] = useState<TipoAnuncio>(base?.tipo ?? "producto");
  const [titulo, setTitulo] = useState(base?.titulo ?? "");
  const [texto, setTexto] = useState(base?.texto ?? "");
  const [productId, setProductId] = useState(base?.product_id ?? "");
  const [imagenUrl, setImagenUrl] = useState(base?.imagen_url ?? "");
  const [botonTexto, setBotonTexto] = useState(base?.boton_texto ?? "");
  const [enlace, setEnlace] = useState(base?.enlace ?? "");
  const [eventoFecha, setEventoFecha] = useState(base?.evento_fecha ?? "");
  const [eventoHora, setEventoHora] = useState(base?.evento_hora ?? "");
  const [eventoHoraFin, setEventoHoraFin] = useState(base?.evento_hora_fin ?? "");
  const [eventoLugar, setEventoLugar] = useState(base?.evento_lugar ?? "");
  // Una copia no hereda las fechas: suelen ser las de la campaña anterior.
  const [inicio, setInicio] = useState(aInputFecha(inicial?.inicio ?? null));
  const [fin, setFin] = useState(aInputFecha(inicial?.fin ?? null));
  const [programar, setProgramar] = useState(!!(inicial?.inicio || inicial?.fin));
  const [videoUrl, setVideoUrl] = useState(base?.video_url ?? "");
  const [subiendo, setSubiendo] = useState<"imagen" | "video" | null>(null);
  const [guardando, setGuardando] = useState<"publicar" | "borrador" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const producto = PRODUCTS.find((p) => p.id === productId);

  function elegirProducto(id: string) {
    setProductId(id);
    const p = PRODUCTS.find((x) => x.id === id);
    if (p && !titulo.trim()) setTitulo(`Nuevo: ${p.name}`);
  }

  async function subir(blob: Blob, ext: string): Promise<string | null> {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const db = amwayDb();
    const { error: e } = await db.storage.from(ANUNCIOS_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
    return e ? null : db.storage.from(ANUNCIOS_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  // Cualquier foto vale: se reduce en el navegador antes de subirla.
  async function subirImagen(file: File) {
    setError(null);
    if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      return setError("Eso no parece una foto. Para vídeos usa el recuadro de al lado.");
    }
    setSubiendo("imagen");
    const reducida = await reducirImagen(file);
    if (!reducida) {
      setSubiendo(null);
      setError("No se puede leer esta foto. Si es del iPhone (HEIC), ábrela y guárdala como JPG, o súbela desde el propio iPhone.");
      return;
    }
    const url = await subir(reducida, reducida.type === "image/webp" ? "webp" : "jpg");
    setSubiendo(null);
    if (!url) return setError("No se pudo subir la imagen. Inténtalo de nuevo.");
    setImagenUrl(url);
  }

  async function subirVideo(file: File) {
    setError(null);
    setAviso(null);
    // Los .mov del iPhone son el mismo contenedor que el MP4: se suben como MP4.
    const esMov = file.type === "video/quicktime" || /\.mov$/i.test(file.name);
    if (!["video/mp4", "video/webm"].includes(file.type) && !esMov) {
      setError("El vídeo tiene que ser MP4, MOV (iPhone) o WebM.");
      return;
    }
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setError(`El vídeo pesa más de ${VIDEO_MAX_MB} MB. Recórtalo a unos segundos o expórtalo en menor calidad.`);
      return;
    }
    setSubiendo("video");
    // Si no hay foto propia, un fotograma del vídeo hace de portada: es lo que
    // se ve mientras el vídeo carga (y si el cliente pide menos movimiento).
    const { portada, duracion, ladoCorto } = await leerVideo(file);
    const [url, urlPortada] = await Promise.all([
      file.type === "video/webm" ? subir(file, "webm") : subir(new Blob([file], { type: "video/mp4" }), "mp4"),
      !imagenUrl && portada ? subir(portada, portada.type === "image/webp" ? "webp" : "jpg") : Promise.resolve(null),
    ]);
    setSubiendo(null);
    if (!url) return setError("No se pudo subir el vídeo. Inténtalo de nuevo.");
    setVideoUrl(url);
    if (urlPortada) setImagenUrl(urlPortada);
    // En el pop-up se ve a pantalla casi completa: por debajo de 720 px de
    // lado corto el navegador lo amplía y se nota borroso.
    if (ladoCorto && ladoCorto < 720) {
      setAviso(`El vídeo es pequeño (${ladoCorto} px de ancho) y se verá algo borroso. Si puedes, súbelo exportado en 1080p.`);
    } else if (duracion && duracion > 30) {
      setAviso(`El vídeo dura ${Math.round(duracion)} s. Se verá en bucle y sin sonido: los de menos de 15 s funcionan mejor.`);
    }
  }

  function construir(activo: boolean) {
    const esEvento = tipo === "evento";
    return {
      tipo,
      titulo: titulo.trim(),
      texto: texto.trim() || null,
      product_id: tipo === "producto" && productId ? productId : null,
      imagen_url: imagenUrl || null,
      video_url: videoUrl || null,
      boton_texto: botonTexto.trim() || null,
      enlace: enlace.trim() || null,
      evento_fecha: esEvento ? eventoFecha || null : null,
      evento_hora: esEvento ? eventoHora || null : null,
      evento_hora_fin: esEvento && eventoHora ? eventoHoraFin || null : null,
      evento_lugar: esEvento ? eventoLugar.trim() || null : null,
      inicio: programar && inicio ? new Date(inicio).toISOString() : null,
      fin: programar && fin ? new Date(fin).toISOString() : null,
      activo,
    };
  }

  async function guardar(modo: "publicar" | "borrador") {
    setError(null);
    if (!titulo.trim()) return setError("Escribe un título.");
    if (tipo === "evento" && !eventoFecha) return setError("Indica el día del evento.");
    if (!enlaceValido(enlace)) return setError("El enlace del botón debe empezar por / (una página de la tienda, p. ej. /ofertas) o por https://");
    if (programar && inicio && fin && new Date(fin) <= new Date(inicio)) return setError("La fecha de fin debe ser posterior a la de inicio.");

    // Al editar se respeta si estaba pausado; al crear lo decide el botón.
    const fila = construir(inicial ? inicial.activo : modo === "publicar");
    setGuardando(modo);
    const db = amwayDb().from("amway_anuncios");
    const { data, error: err } = inicial
      ? await db.update(fila).eq("id", inicial.id).select().single()
      : await db.insert(fila).select().single();
    setGuardando(null);
    if (err || !data) return setError("No se pudo guardar el anuncio. Revisa los datos e inténtalo de nuevo.");
    onSaved(data as Anuncio);
  }

  // El anuncio tal y como está ahora en el formulario.
  const borrador = {
    id: inicial?.id ?? "borrador",
    created_at: inicial?.created_at ?? "",
    updated_at: inicial?.updated_at ?? "",
    ...construir(true),
    titulo,
  } as Anuncio;
  const accion = accionAnuncio(borrador);
  const imagenPrevia = imagenAnuncio(borrador);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void guardar("publicar");
      }}
      className="flex flex-col gap-6"
    >
      <Paso n={1} titulo="¿Qué quieres anunciar?">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TIPO_ANUNCIO) as TipoAnuncio[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              aria-pressed={tipo === t}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm transition",
                tipo === t ? "border-carbon bg-carbon text-cream" : "border-carbon/12 bg-white text-carbon hover:border-carbon/30"
              )}
            >
              {TIPO_ANUNCIO[t].label}
            </button>
          ))}
        </div>

        {tipo === "producto" && (
          <div>
            <label className={label} htmlFor="anuncio-producto">
              Producto del catálogo
            </label>
            <select id="anuncio-producto" value={productId} onChange={(e) => elegirProducto(e.target.value)} className={cn(inputClass, "w-full")}>
              <option value="">— Sin producto del catálogo —</option>
              {PRODUCTOS_ORDENADOS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.brand}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone">El botón llevará a su ficha y, si no subes foto, se usa la del producto.</p>
          </div>
        )}
      </Paso>

      <Paso n={2} titulo="El mensaje">
        <div>
          <label className={label} htmlFor="anuncio-titulo-input">
            Título
          </label>
          <input
            id="anuncio-titulo-input"
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
          <p className={cn("mt-1 text-right text-[11px] tabular-nums", texto.length > 280 ? "text-amber-700" : "text-stone")}>
            {texto.length > 280 ? "Mejor corto: en el móvil se lee de un vistazo · " : ""}
            {texto.length}/600
          </p>
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
      </Paso>

      <Paso n={3} titulo="Foto o vídeo">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <SelectorArchivo
              accept="image/*"
              ocupado={subiendo !== null}
              onFile={(f) => void subirImagen(f)}
              quitar={imagenUrl ? { texto: "Eliminar foto", onClick: () => setImagenUrl("") } : undefined}
            >
              {imagenPrevia ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagenPrevia}
                    alt=""
                    className={cn("absolute inset-0 h-full w-full", imagenUrl ? "object-cover" : "object-contain p-4")}
                  />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-carbon/75 px-3 py-1 text-[11px] text-cream">
                    {subiendo === "imagen" ? "Subiendo…" : "Cambiar foto"}
                  </span>
                </>
              ) : subiendo === "imagen" ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Subiendo…
                </>
              ) : (
                <>
                  <ImagePlus size={22} />
                  <span className="font-medium text-carbon">Subir foto</span>
                  <span className="hidden sm:block">o arrástrala aquí</span>
                </>
              )}
            </SelectorArchivo>
            <p className="mt-1.5 text-xs text-stone">
              {producto && !imagenUrl ? "Ahora se usa la del producto." : "Vertical o cuadrada. Se ajusta sola."}
            </p>
          </div>

          <div>
            <SelectorArchivo
              accept="video/mp4,video/quicktime,video/webm,.mov"
              ocupado={subiendo !== null}
              onFile={(f) => void subirVideo(f)}
              quitar={videoUrl ? { texto: "Eliminar vídeo", onClick: () => setVideoUrl("") } : undefined}
            >
              {videoUrl ? (
                <>
                  <video src={videoUrl} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-carbon/75 px-3 py-1 text-[11px] text-cream">
                    {subiendo === "video" ? "Subiendo…" : "Cambiar vídeo"}
                  </span>
                </>
              ) : subiendo === "video" ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Subiendo vídeo…
                  <span>Puede tardar un poco</span>
                </>
              ) : (
                <>
                  <Film size={22} />
                  <span className="font-medium text-carbon">Subir vídeo</span>
                  <span>Opcional · MP4 o MOV</span>
                </>
              )}
            </SelectorArchivo>
            <p className="mt-1.5 text-xs text-stone">Pocos segundos, hasta {VIDEO_MAX_MB} MB. En bucle y sin sonido.</p>
          </div>
        </div>
        {aviso && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{aviso}</p>}
      </Paso>

      <Paso n={4} titulo="El botón">
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
              Adónde lleva (opcional)
            </label>
            <input
              id="anuncio-enlace"
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              maxLength={500}
              placeholder="/ofertas o https://…"
              className={cn(inputClass, "w-full", !enlaceValido(enlace) && "border-xs-red/50")}
            />
          </div>
          <p className="-mt-2 text-xs text-stone sm:col-span-2">
            {accion
              ? `Si lo dejas vacío, el botón «${accion.texto}» ${
                  accion.href.startsWith("https://api.whatsapp.com")
                    ? tipo === "evento"
                      ? "abre WhatsApp para reservar plaza"
                      : "abre WhatsApp"
                    : `lleva a ${accion.href}`
                }.`
              : "Sin enlace, el anuncio se muestra sin botón."}
          </p>
        </div>
      </Paso>

      <Paso n={5} titulo="Cuándo se muestra">
        <div className="flex flex-wrap gap-2">
          {(
            [
              [false, tipo === "evento" ? "Desde ya hasta el día del evento" : "Desde ya, hasta que lo pause"],
              [true, "Elegir fechas"],
            ] as const
          ).map(([v, txt]) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setProgramar(v)}
              aria-pressed={programar === v}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                programar === v ? "border-carbon bg-carbon text-cream" : "border-carbon/12 bg-white text-carbon hover:border-carbon/30"
              )}
            >
              {txt}
            </button>
          ))}
        </div>
        {programar && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="anuncio-inicio">
                Empezar a mostrar
              </label>
              <input id="anuncio-inicio" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className={cn(inputClass, "w-full")} />
            </div>
            <div>
              <label className={label} htmlFor="anuncio-fin">
                Dejar de mostrar
              </label>
              <input id="anuncio-fin" type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} className={cn(inputClass, "w-full")} />
            </div>
          </div>
        )}
      </Paso>

      {error && <p className="rounded-xl bg-xs-red/10 px-4 py-3 text-sm text-xs-red">{error}</p>}

      <div className="sticky bottom-0 -mx-6 -mb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-wrap items-center gap-2 border-t border-carbon/[0.07] bg-cream-soft/95 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mb-7 sm:pb-5">
        <button type="button" className={btnGhost} onClick={() => onPreview(borrador)} disabled={subiendo !== null}>
          <Eye size={14} /> Vista previa
        </button>
        <span className="flex-1" />
        {!inicial && (
          <button type="button" className={btnGhost} onClick={() => void guardar("borrador")} disabled={guardando !== null || subiendo !== null}>
            {guardando === "borrador" && <Loader2 size={14} className="animate-spin" />}
            Guardar sin publicar
          </button>
        )}
        <button type="submit" className={btnPrimary} disabled={guardando !== null || subiendo !== null}>
          {guardando === "publicar" && <Loader2 size={14} className="animate-spin" />}
          {inicial ? "Guardar cambios" : "Publicar anuncio"}
        </button>
      </div>
    </form>
  );
}
