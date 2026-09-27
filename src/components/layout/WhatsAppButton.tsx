"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  MessageCircle,
  Plus,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { SITE, WA_PRESETS, waLink } from "@/data/site-config";
import {
  INTENTOS,
  TEMAS_INICIO,
  buscarIntentos,
  palabrasDe,
  waDuda,
  type AccionAsistente,
} from "@/data/asistente";
import { CATEGORY_META, getProductById } from "@/data/products";
import { cheapestVariantIndex, productImageSrc, type CategorySlug } from "@/data/types";
import { formatEUR } from "@/lib/currency";
import { buscarProductos, consultaCatalogo } from "@/lib/asistente-productos";
import { useCesta } from "@/components/cart/CartProvider";
import { useCatalogState } from "@/components/catalog/CatalogStateProvider";
import { track } from "@/lib/analytics";

type Mensaje = { id: number; de: "bot" | "cliente"; lineas: string[]; productos?: string[] };

// Qué opciones se ofrecen bajo el último mensaje del asistente.
type Contexto =
  | { tipo: "inicio" }
  | { tipo: "respuesta"; id: string }
  | { tipo: "productos"; texto: string; consulta: string }
  | { tipo: "sugerencias"; ids: string[]; texto: string }
  | { tipo: "sinRespuesta"; texto: string }
  | { tipo: "ayuda"; mensaje: string };

interface Conversacion {
  mensajes: Mensaje[];
  contexto: Contexto;
}

const STORAGE_KEY = "amway_asistente";
const AVISO_KEY = "amway_asistente_aviso";
const AVISO_MS = 40_000;
const VACIA: Conversacion = { mensajes: [], contexto: { tipo: "inicio" } };

// Intenciones en las que, si además se nombra un producto, lo útil es
// enseñar el producto (precio y disponibilidad reales) y no la respuesta
// genérica: «¿tenéis stock del purificador?», «precio del Double X».
const INTENCIONES_DE_PRODUCTO = new Set([
  "disponibilidad",
  "precios",
  "agotado",
  "encargo",
  "pedido",
  "asesoramiento",
  "asesorPersonal",
]);

function leerConversacion(): Conversacion {
  if (typeof window === "undefined") return VACIA;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversacion) : VACIA;
  } catch {
    return VACIA;
  }
}

// Una pausa corta y proporcional a la respuesta: se percibe que "piensa",
// pero sin hacer esperar.
function pausa(lineas: string[]): number {
  return Math.min(350 + lineas.join(" ").length * 2, 900);
}

// Identificador del contexto para la analítica (qué tema derivó a WhatsApp).
function origenDe(contexto: Contexto): string {
  if (contexto.tipo === "respuesta") return contexto.id;
  return contexto.tipo === "sinRespuesta" ? "sin_respuesta" : contexto.tipo;
}

function registrar(label: string) {
  track("asistente", label);
}

function categoriaDeRuta(pathname: string): CategorySlug | null {
  const slug = pathname.split("/")[1];
  return slug && slug in CATEGORY_META ? (slug as CategorySlug) : null;
}

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [conv, setConv] = useState<Conversacion>(leerConversacion);
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const { openCesta, isOpen: cestaAbierta, totalUnits, isLoaded } = useCesta();
  const catalog = useCatalogState();

  const { mensajes, contexto } = conv;
  const enCurso = mensajes.length > 0;
  const conCesta = isLoaded && totalUnits > 0;
  const categoria = categoriaDeRuta(pathname);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conv));
    } catch {
      // modo privado: la conversación vale para esta página
    }
  }, [conv]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Aviso discreto, una vez por sesión: quien lleva un rato con productos en
  // la cesta sin terminar suele tener una duda (pago, recogida…).
  useEffect(() => {
    if (!conCesta || open || cestaAbierta || pathname.startsWith("/checkout")) return;
    try {
      if (sessionStorage.getItem(AVISO_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      setAviso(true);
      registrar("aviso");
      try {
        sessionStorage.setItem(AVISO_KEY, "1");
      } catch {
        // sin almacenamiento, el aviso puede repetirse en otra página
      }
    }, AVISO_MS);
    return () => clearTimeout(t);
  }, [conCesta, open, cestaAbierta, pathname]);

  // Al llegar una respuesta, se deja arriba la pregunta del cliente para que
  // la respuesta se lea desde el principio (no desde el final).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const preguntas = el.querySelectorAll<HTMLElement>("[data-de='cliente']");
    const ancla = preguntas[preguntas.length - 1];
    if (escribiendo || !ancla) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTo({ top: ancla.offsetTop - 12, behavior: "smooth" });
    }
  }, [mensajes.length, escribiendo, open]);

  function abrir() {
    setAviso(false);
    if (!open) registrar("abrir");
    setOpen(!open);
  }

  function responder(pregunta: string, respuesta: string[], siguiente: Contexto, productos?: string[]) {
    if (timer.current) clearTimeout(timer.current);
    setConv((c) => ({
      mensajes: [...c.mensajes, { id: Date.now(), de: "cliente", lineas: [pregunta] }],
      contexto: c.contexto,
    }));
    setEscribiendo(true);
    timer.current = setTimeout(() => {
      setConv((c) => ({
        mensajes: [...c.mensajes, { id: Date.now() + 1, de: "bot", lineas: respuesta, productos }],
        contexto: siguiente,
      }));
      setEscribiendo(false);
    }, pausa(respuesta));
  }

  function abrirTema(id: string) {
    const intento = INTENTOS[id];
    if (!intento || escribiendo) return;
    registrar(`tema:${id}`);
    responder(intento.pregunta, intento.respuesta, { tipo: "respuesta", id });
  }

  function enviarTexto(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || escribiendo) return;
    setTexto("");

    const intentos = buscarIntentos(t);
    const [mejor, segundo] = intentos;
    const encontrados = buscarProductos(t, (id) => !catalog.oculto(id)).map((r) => r.producto);
    const productos = encontrados.map((p) => p.id);

    if (productos.length > 0 && (!mejor || INTENCIONES_DE_PRODUCTO.has(mejor.id))) {
      registrar("texto:productos");
      responder(
        t,
        [productos.length === 1 ? "Esto es lo que tenemos:" : "Esto es lo que he encontrado:"],
        { tipo: "productos", texto: t, consulta: consultaCatalogo(t, encontrados) },
        productos
      );
    } else if (mejor && (!segundo || mejor.puntos > segundo.puntos) && (mejor.puntos >= 1.5 || (mejor.puntos >= 1 && palabrasDe(t).length <= 2))) {
      // Una intención claramente por delante: respuesta directa. Si solo
      // encaja por una errata, o por una palabra suelta en una frase larga,
      // mejor preguntar «¿te refieres a…?».
      registrar(`texto:${mejor.id}`);
      responder(t, INTENTOS[mejor.id].respuesta, { tipo: "respuesta", id: mejor.id });
    } else if (mejor) {
      registrar("texto:sugerencias");
      responder(t, ["Para darte la respuesta exacta, ¿te refieres a alguna de estas?"], {
        tipo: "sugerencias",
        ids: intentos.slice(0, 3).map((r) => r.id),
        texto: t,
      });
    } else {
      registrar("texto:sin_respuesta");
      responder(
        t,
        [
          "Esa no la tengo resuelta aquí, pero te la contestamos personalmente.",
          "Te abro WhatsApp con tu pregunta ya escrita:",
        ],
        { tipo: "sinRespuesta", texto: t }
      );
    }
  }

  function valorar(util: boolean) {
    if (contexto.tipo !== "respuesta" && contexto.tipo !== "productos") return;
    registrar(`${util ? "util" : "no_util"}:${origenDe(contexto)}`);
    const mensaje =
      contexto.tipo === "productos"
        ? `Hola, busco «${contexto.texto}» y no lo encuentro en la web. ¿Me podéis ayudar?`
        : waDuda(`«${INTENTOS[contexto.id]?.pregunta ?? "un producto"}»`);
    setConv((c) => ({
      mensajes: [
        ...c.mensajes,
        {
          id: Date.now(),
          de: "bot",
          lineas: util
            ? ["¡Me alegro! ¿Te ayudo con algo más?"]
            : [
                "Vaya, gracias por decírmelo.",
                "Escríbeme abajo tu duda con otras palabras, o pregúntala directamente a una persona:",
              ],
        },
      ],
      contexto: util ? { tipo: "inicio" } : { tipo: "ayuda", mensaje },
    }));
    if (!util) inputRef.current?.focus();
  }

  function reiniciar() {
    if (timer.current) clearTimeout(timer.current);
    setEscribiendo(false);
    setConv(VACIA);
  }

  function alWhatsApp(origen: string) {
    track("whatsapp_click", `asistente · ${origen}`);
  }

  const saludo = [`¡Hola! Soy el asistente de ${SITE.name}.`];
  if (conCesta) {
    saludo.push(
      `Veo que tienes ${totalUnits} ${totalUnits === 1 ? "producto" : "productos"} en la cesta. ¿Te ayudo a terminar el pedido o tienes alguna duda?`
    );
  } else if (categoria) {
    saludo.push(
      `¿Buscas algo de ${CATEGORY_META[categoria].label}? Escríbeme el nombre del producto o lo que necesitas y te digo precio y disponibilidad.`
    );
  } else {
    saludo.push("Pregúntame por cualquier producto (precio, stock) o elige un tema:");
  }

  const acciones = accionesPara(contexto, conCesta);
  const valorable = (contexto.tipo === "respuesta" && contexto.id !== "gracias") || contexto.tipo === "productos";

  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-3 sm:right-8 sm:bottom-[calc(2rem+env(safe-area-inset-bottom))]">
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={`Asistente de ${SITE.name}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[min(38rem,calc(100dvh-7.5rem))] w-[calc(100vw-2rem)] max-w-[23rem] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-carbon/10 bg-cream-soft text-sm text-carbon shadow-2xl shadow-carbon/20"
          >
            <header className="flex items-center gap-2.5 border-b border-carbon/8 py-3 pr-2 pl-4">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-cream">
                <MessageCircle size={17} />
                <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-cream-soft bg-[#25D366]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] leading-tight">{SITE.name}</p>
                <p className="truncate text-xs text-stone">Respuestas al momento</p>
              </div>
              <a
                href={waLink(WA_PRESETS.general)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => alWhatsApp("cabecera")}
                aria-label="Hablar por WhatsApp"
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-2 text-xs font-medium text-white transition hover:bg-[#1fbe5b] min-[400px]:px-3"
              >
                <MessageCircle size={14} />
                <span className="hidden min-[400px]:inline">WhatsApp</span>
              </a>
              {enCurso && (
                <IconoBoton label="Empezar de nuevo" onClick={reiniciar}>
                  <RotateCcw size={15} />
                </IconoBoton>
              )}
              <IconoBoton label="Cerrar" onClick={() => setOpen(false)}>
                <X size={17} />
              </IconoBoton>
            </header>

            <div
              ref={scrollRef}
              data-lenis-prevent
              aria-live="polite"
              className="relative flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-4"
            >
              <Burbuja de="bot" lineas={saludo} />
              {mensajes.map((m) => (
                <div key={m.id} data-de={m.de} className="flex flex-col gap-2">
                  <Burbuja de={m.de} lineas={m.lineas} />
                  {m.productos && m.productos.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {m.productos.map((id) => (
                        <TarjetaProducto key={id} productId={id} onWhatsApp={alWhatsApp} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {escribiendo && <Escribiendo />}

              {!escribiendo && (
                <motion.div
                  key={`${mensajes.length}-${contexto.tipo}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="flex flex-col gap-2.5"
                >
                  {acciones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {acciones.map((a, i) => (
                        <Chip
                          key={`${a.tipo}-${i}`}
                          accion={a}
                          onTema={abrirTema}
                          onCesta={() => {
                            setOpen(false);
                            openCesta();
                          }}
                          onEnlace={() => setOpen(false)}
                          onWhatsApp={() => alWhatsApp(origenDe(contexto))}
                        />
                      ))}
                    </div>
                  )}

                  {valorable && (
                    <div className="flex items-center gap-1 text-xs text-stone">
                      <span className="mr-1">¿Te ha resuelto la duda?</span>
                      <IconoBoton label="Sí" onClick={() => valorar(true)} compacto>
                        <ThumbsUp size={14} />
                      </IconoBoton>
                      <IconoBoton label="No" onClick={() => valorar(false)} compacto>
                        <ThumbsDown size={14} />
                      </IconoBoton>
                    </div>
                  )}

                  {contexto.tipo !== "inicio" && (
                    <button
                      type="button"
                      onClick={() => setConv((c) => ({ ...c, contexto: { tipo: "inicio" } }))}
                      className="w-fit text-xs text-stone underline-offset-2 transition hover:text-carbon hover:underline"
                    >
                      Ver todos los temas
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            <form onSubmit={enviarTexto} className="flex items-center gap-2 border-t border-carbon/8 p-3">
              <input
                ref={inputRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={200}
                enterKeyHint="send"
                placeholder="Pregunta o busca un producto…"
                aria-label="Escribe tu pregunta o el producto que buscas"
                className="h-11 min-w-0 flex-1 rounded-full border border-carbon/12 bg-white px-4 text-base text-carbon placeholder:text-stone focus:border-forest focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                disabled={!texto.trim() || escribiendo}
                aria-label="Enviar pregunta"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-cream transition hover:bg-forest-dim disabled:opacity-35"
              >
                <ArrowUp size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aviso && !open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-w-[16rem] items-start gap-1 rounded-2xl rounded-br-md border border-carbon/10 bg-cream-soft py-2.5 pr-1.5 pl-3.5 text-sm text-carbon shadow-xl shadow-carbon/15"
          >
            <button type="button" onClick={abrir} className="text-left leading-snug">
              ¿Alguna duda con tu pedido? <span className="font-medium text-forest">Te ayudo</span>
            </button>
            <IconoBoton label="Cerrar aviso" onClick={() => setAviso(false)} compacto>
              <X size={14} />
            </IconoBoton>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={abrir}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente y WhatsApp"}
        aria-expanded={open}
        className="relative flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
      >
        <span className="absolute inset-0 animate-pulse-slow rounded-full bg-[#25D366]/50 blur-md" />
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="relative"
            >
              <X size={26} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageCircle size={26} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

function consultaWhatsApp(texto: string): string {
  return `Hola, tengo una duda: «${texto}». ¿Me podéis ayudar? Gracias.`;
}

function accionesPara(contexto: Contexto, conCesta: boolean): AccionAsistente[] {
  switch (contexto.tipo) {
    case "inicio": {
      const temas: AccionAsistente[] = TEMAS_INICIO.map((id) => ({ tipo: "tema", id }));
      return conCesta ? [{ tipo: "cesta", label: "Terminar mi pedido" }, ...temas] : temas;
    }
    case "respuesta":
      return INTENTOS[contexto.id]?.acciones ?? [];
    case "productos":
      return [
        { tipo: "enlace", href: `/catalogo?q=${encodeURIComponent(contexto.consulta)}`, label: "Ver más en el catálogo" },
        { tipo: "whatsapp", mensaje: consultaWhatsApp(contexto.texto), label: "Preguntar por WhatsApp" },
      ];
    case "sugerencias":
      return [
        ...contexto.ids.map((id): AccionAsistente => ({ tipo: "tema", id })),
        { tipo: "whatsapp", mensaje: consultaWhatsApp(contexto.texto), label: "Ninguna, preguntar por WhatsApp" },
      ];
    case "sinRespuesta":
      return [{ tipo: "whatsapp", mensaje: consultaWhatsApp(contexto.texto), label: "Enviar mi pregunta" }];
    case "ayuda":
      return [{ tipo: "whatsapp", mensaje: contexto.mensaje, label: "Preguntar a una persona" }];
  }
}

// Producto con su precio y estado reales (los del panel de gestión) y la
// acción que corresponde: añadir, elegir formato, pedir precio o avisar.
function TarjetaProducto({ productId, onWhatsApp }: { productId: string; onWhatsApp: (origen: string) => void }) {
  const catalog = useCatalogState();
  const { addItem, items } = useCesta();
  const product = getProductById(productId);
  if (!product || catalog.oculto(productId)) return null;

  const variante = cheapestVariantIndex(product);
  const precio = catalog.precio(product, variante);
  const agotado = catalog.agotado(productId);
  const variasOpciones = product.variants.length > 1;
  const enCesta = items.some((i) => i.productId === productId);
  const img = productImageSrc(product);

  const accionBase =
    "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-xs font-medium transition";

  let accion: ReactNode;
  if (agotado) {
    accion = (
      <a
        href={waLink(`Hola, me interesa «${product.name}», que aparece agotado. ¿Cuándo lo volveréis a tener?`)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onWhatsApp(`agotado:${productId}`)}
        className={`${accionBase} bg-[#25D366] text-white hover:bg-[#1fbe5b]`}
      >
        Avisarme
      </a>
    );
  } else if (precio == null) {
    accion = (
      <a
        href={waLink(`Hola, ¿qué precio tiene «${product.name}»? Gracias.`)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onWhatsApp(`precio:${productId}`)}
        className={`${accionBase} bg-[#25D366] text-white hover:bg-[#1fbe5b]`}
      >
        Pedir precio
      </a>
    );
  } else if (variasOpciones) {
    accion = (
      <Link
        href={`/catalogo?q=${encodeURIComponent(product.name)}`}
        className={`${accionBase} border border-forest/25 text-forest hover:bg-forest hover:text-cream`}
      >
        Ver formatos
      </Link>
    );
  } else {
    accion = (
      <button
        type="button"
        onClick={() => {
          addItem(productId, variante);
          track("add_to_cart", productId);
          registrar(`anadir:${productId}`);
        }}
        className={`${accionBase} ${enCesta ? "bg-forest/10 text-forest" : "bg-carbon text-cream hover:bg-carbon-soft"}`}
      >
        {enCesta ? <Check size={13} /> : <Plus size={13} />}
        {enCesta ? "En la cesta" : "Añadir"}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 rounded-2xl border border-carbon/8 bg-white p-2.5"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-linen">
        {img && <Image src={img} alt="" fill sizes="48px" className="object-contain p-1" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] leading-snug font-medium">{product.name}</p>
        <p className="mt-0.5 text-xs text-stone">
          {precio != null ? `${variasOpciones ? "Desde " : ""}${formatEUR(precio)}` : "Precio a consultar"}
          {" · "}
          <span className={agotado ? "text-[#b4532a]" : "text-forest"}>{agotado ? "Agotado" : "Disponible"}</span>
        </p>
      </div>
      {accion}
    </motion.div>
  );
}

function IconoBoton({
  label,
  onClick,
  compacto,
  children,
}: {
  label: string;
  onClick: () => void;
  compacto?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center rounded-full text-stone transition hover:bg-linen hover:text-carbon ${compacto ? "h-7 w-7" : "h-8 w-8"}`}
    >
      {children}
    </button>
  );
}

function Burbuja({ de, lineas }: { de: Mensaje["de"]; lineas: string[] }) {
  const bot = de === "bot";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={
        bot
          ? "max-w-[88%] self-start rounded-2xl rounded-tl-md bg-linen px-3.5 py-2.5 leading-relaxed"
          : "max-w-[80%] self-end rounded-2xl rounded-tr-md bg-forest px-3.5 py-2 break-words text-cream"
      }
    >
      {lineas.map((l, i) => (
        <p key={i} className={i > 0 ? "mt-1.5" : undefined}>
          {l}
        </p>
      ))}
    </motion.div>
  );
}

function Escribiendo() {
  return (
    <div
      className="flex w-fit items-center gap-1 self-start rounded-2xl rounded-tl-md bg-linen px-3.5 py-3"
      aria-label="Escribiendo"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-stone"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

const chipClass =
  "inline-flex items-center gap-1 rounded-full border border-forest/25 bg-white/70 px-3 py-1.5 text-xs font-medium text-forest transition hover:border-forest hover:bg-forest hover:text-cream";

function Chip({
  accion,
  onTema,
  onCesta,
  onEnlace,
  onWhatsApp,
}: {
  accion: AccionAsistente;
  onTema: (id: string) => void;
  onCesta: () => void;
  onEnlace: () => void;
  onWhatsApp: () => void;
}) {
  switch (accion.tipo) {
    case "tema": {
      const intento = INTENTOS[accion.id];
      if (!intento) return null;
      return (
        <button type="button" onClick={() => onTema(accion.id)} className={chipClass}>
          {accion.label ?? intento.pregunta}
        </button>
      );
    }
    case "cesta":
      return (
        <button type="button" onClick={onCesta} className={chipClass}>
          {accion.label}
        </button>
      );
    case "enlace":
      return (
        <Link href={accion.href} onClick={onEnlace} className={chipClass}>
          {accion.label}
        </Link>
      );
    case "whatsapp":
      return (
        <a
          href={waLink(accion.mensaje)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsApp}
          className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1fbe5b]"
        >
          {accion.label}
          <ArrowUpRight size={12} />
        </a>
      );
  }
}
