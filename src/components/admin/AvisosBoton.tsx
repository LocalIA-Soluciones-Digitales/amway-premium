"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, Check, Download, Loader2, Share, Smartphone, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnGhost, btnPrimary } from "./shared";
import { esIOS, useAvisosPush, useInstalarApp } from "./useAvisosPush";

const CLAVE_SONIDO = "amway-panel-sonido";

export function sonidoActivado(): boolean {
  try {
    return localStorage.getItem(CLAVE_SONIDO) !== "0";
  } catch {
    return true;
  }
}

// Campana de la cabecera: avisos al móvil en ESTE dispositivo, sonido en el
// panel e instalar el panel como app. Apagada lleva un punto de aviso para
// que se vea que falta activarla (como en Arrantza).
export function AvisosBoton() {
  const { estado, servidorListo, error, activar, desactivar, probar } = useAvisosPush();
  const { instalada, puedeInstalar, instalar } = useInstalarApp();
  const [open, setOpen] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [probado, setProbado] = useState(false);
  const [sonido, setSonido] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setSonido(sonidoActivado()), []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (estado === "cargando") return null;
  const activado = estado === "activado";
  const ios = esIOS();

  async function conCarga(f: () => Promise<unknown>) {
    setOcupado(true);
    try {
      await f();
    } finally {
      setOcupado(false);
    }
  }

  function cambiarSonido() {
    const v = !sonido;
    setSonido(v);
    try {
      localStorage.setItem(CLAVE_SONIDO, v ? "1" : "0");
    } catch {
      // Sin almacenamiento: vale solo para esta sesión.
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={activado ? "Avisos de pedidos activados" : "Activar avisos de pedidos"}
        title={activado ? "Avisos de pedidos activados en este dispositivo" : "Activar avisos de pedidos"}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border transition",
          activado
            ? "border-forest/25 bg-forest/10 text-forest"
            : "border-carbon/10 bg-white text-stone hover:border-carbon/25 hover:text-carbon"
        )}
      >
        {activado ? <BellRing size={15} /> : <BellOff size={15} />}
        {!activado && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500" />}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top))] z-40 rounded-2xl border border-carbon/[0.07] bg-white p-4 text-sm shadow-[0_20px_50px_rgba(28,26,22,0.16)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <p className="flex items-center gap-2 font-medium text-carbon">
            <Bell size={15} /> Avisos de pedidos nuevos
          </p>
          <p className="mt-1 text-xs leading-relaxed text-stone">
            Te llega una notificación al móvil en cuanto alguien hace un pedido en la web, aunque tengas el panel cerrado.
          </p>

          <div className="mt-3">
            {estado === "activado" && (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-1.5 rounded-xl bg-forest/10 px-3 py-2 text-xs font-medium text-forest">
                  <Check size={14} /> Activados en este dispositivo
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() =>
                      conCarga(async () => {
                        await probar();
                        setProbado(true);
                      })
                    }
                    className={cn(btnGhost, "h-9 flex-1 text-xs")}
                  >
                    {ocupado ? <Loader2 size={13} className="animate-spin" /> : <BellRing size={13} />}
                    {probado ? "Enviado" : "Probar"}
                  </button>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => confirm("¿Dejar de recibir avisos de pedidos en este dispositivo?") && void conCarga(desactivar)}
                    className={cn(btnGhost, "h-9 flex-1 text-xs")}
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            )}
            {estado === "desactivado" && (
              <button type="button" disabled={ocupado} onClick={() => conCarga(activar)} className={cn(btnPrimary, "w-full")}>
                {ocupado ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                Activar avisos en este dispositivo
              </button>
            )}
            {estado === "instalar" && (
              <p className="rounded-xl bg-cream px-3 py-2.5 text-xs leading-relaxed text-carbon">
                En iPhone los avisos solo funcionan con el panel instalado: pulsa <Share size={12} className="inline" /> <b>Compartir</b> →{" "}
                <b>Añadir a pantalla de inicio</b>, ábrelo desde ese icono y vuelve a pulsar la campana.
              </p>
            )}
            {estado === "denegado" && (
              <p className="rounded-xl bg-cream px-3 py-2.5 text-xs leading-relaxed text-carbon">
                Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador o del móvil (Notificaciones → {location.hostname}) y
                vuelve a abrir el panel.
              </p>
            )}
            {estado === "no_soportado" && (
              <p className="rounded-xl bg-cream px-3 py-2.5 text-xs text-stone">Este navegador no admite avisos. Prueba con Chrome o Safari.</p>
            )}
            {servidorListo === false && estado !== "no_soportado" && (
              <p className="mt-2 text-[11px] text-amber-700">Falta configurar el envío en el servidor: por ahora solo avisa el panel abierto.</p>
            )}
            {error && <p className="mt-2 text-xs text-xs-red">{error}</p>}
          </div>

          <div className="mt-4 border-t border-carbon/[0.07] pt-3">
            <button
              type="button"
              onClick={cambiarSonido}
              className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left text-xs text-carbon"
            >
              <span className="flex items-center gap-2">
                {sonido ? <Volume2 size={14} /> : <VolumeX size={14} className="text-stone" />}
                Sonido con el panel abierto
              </span>
              <span className={cn("relative h-5 w-9 rounded-full transition", sonido ? "bg-forest" : "bg-carbon/15")}>
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", sonido ? "left-[18px]" : "left-0.5")} />
              </span>
            </button>
          </div>

          {!instalada && (
            <div className="mt-3 border-t border-carbon/[0.07] pt-3">
              <p className="flex items-center gap-2 text-xs font-medium text-carbon">
                <Smartphone size={14} /> Tener el panel como app
              </p>
              {puedeInstalar ? (
                <button type="button" onClick={() => void instalar()} className={cn(btnGhost, "mt-2 h-9 w-full text-xs")}>
                  <Download size={13} /> Instalar en este dispositivo
                </button>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-stone">
                  {ios
                    ? "Safari → Compartir → Añadir a pantalla de inicio."
                    : "En el menú del navegador (⋮), elige «Instalar aplicación» o «Añadir a pantalla de inicio»."}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
