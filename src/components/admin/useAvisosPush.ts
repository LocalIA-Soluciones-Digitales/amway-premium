"use client";

import { useCallback, useEffect, useState } from "react";
import { amwayDb } from "@/lib/amway-db";

// Avisos push de pedidos nuevos en ESTE dispositivo (mismo enfoque que el
// panel de Arrantza): el service worker /sw.js recibe el aviso aunque el
// panel esté cerrado, y la suscripción se guarda en amway_push_suscripciones.

export type EstadoAvisos =
  | "cargando"
  | "no_soportado"
  // iPhone/iPad: Web Push solo existe con la web instalada en la pantalla de
  // inicio (iOS 16.4+).
  | "instalar"
  | "denegado"
  | "desactivado"
  | "activado";

export function esIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function esAppInstalada(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function base64AUint8(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

let registro: Promise<ServiceWorkerRegistration | undefined> | null = null;
export function registrarSW(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) return Promise.resolve(undefined);
  registro ??= navigator.serviceWorker
    .register("/sw.js", { scope: "/admin" })
    .then(() => navigator.serviceWorker.ready)
    .catch(() => undefined);
  return registro;
}

// El aviso "Instalar app" de Chrome/Android llega una sola vez al cargar la
// página (a menudo antes de iniciar sesión): se guarda aquí para usarlo luego.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let promptInstalar: BeforeInstallPromptEvent | null = null;
const oyentesInstalar = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    promptInstalar = e as BeforeInstallPromptEvent;
    oyentesInstalar.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    promptInstalar = null;
    oyentesInstalar.forEach((f) => f());
  });
}

export function useInstalarApp() {
  const [, forzar] = useState(0);
  const [instalada, setInstalada] = useState(false);
  useEffect(() => {
    setInstalada(esAppInstalada());
    const f = () => forzar((n) => n + 1);
    oyentesInstalar.add(f);
    return () => void oyentesInstalar.delete(f);
  }, []);
  const instalar = useCallback(async () => {
    if (!promptInstalar) return false;
    await promptInstalar.prompt();
    const { outcome } = await promptInstalar.userChoice;
    promptInstalar = null;
    forzar((n) => n + 1);
    return outcome === "accepted";
  }, []);
  return { instalada, puedeInstalar: !!promptInstalar, instalar };
}

async function guardar(sub: PushSubscription) {
  const json = sub.toJSON();
  const { error } = await amwayDb().rpc("amway_guardar_suscripcion_push", {
    p_endpoint: sub.endpoint,
    p_p256dh: json.keys?.p256dh ?? "",
    p_auth: json.keys?.auth ?? "",
    p_user_agent: navigator.userAgent,
  });
  if (error) throw error;
}

export function useAvisosPush() {
  const [estado, setEstado] = useState<EstadoAvisos>("cargando");
  const [servidorListo, setServidorListo] = useState<boolean | null>(null);
  const [clave, setClave] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/push")
      .then((r) => r.json())
      .then((d: { publicKey: string; configurado: boolean }) => {
        if (cancelado) return;
        setClave(d.publicKey);
        setServidorListo(d.configurado);
      })
      .catch(() => !cancelado && setServidorListo(false));

    (async () => {
      if (!("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) {
        setEstado(esIOS() && !esAppInstalada() ? "instalar" : "no_soportado");
        return;
      }
      const reg = await registrarSW();
      if (cancelado) return;
      if (!reg) return setEstado("no_soportado");
      if (Notification.permission === "denied") return setEstado("denegado");
      const sub = await reg.pushManager.getSubscription();
      if (cancelado) return;
      if (sub && Notification.permission === "granted") {
        setEstado("activado");
        // Se vuelve a guardar en cada carga: si se borró por caducada, este
        // dispositivo vuelve a recibir.
        guardar(sub).catch(() => {});
      } else {
        setEstado("desactivado");
      }
    })().catch(() => !cancelado && setEstado("no_soportado"));

    return () => {
      cancelado = true;
    };
  }, []);

  const activar = useCallback(async () => {
    setError(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "denegado" : "desactivado");
        return false;
      }
      const reg = await registrarSW();
      if (!reg || !clave) {
        setEstado("no_soportado");
        return false;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64AUint8(clave) }));
      await guardar(sub);
      setEstado("activado");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron activar los avisos.");
      return false;
    }
  }, [clave]);

  const desactivar = useCallback(async () => {
    setError(null);
    try {
      const reg = await registrarSW();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await amwayDb().from("amway_push_suscripciones").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("desactivado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron desactivar los avisos.");
    }
  }, []);

  const probar = useCallback(async () => {
    setError(null);
    const reg = await registrarSW();
    const sub = await reg?.pushManager.getSubscription();
    const { data } = await amwayDb().auth.getSession();
    const res = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ endpoint: sub?.endpoint }),
    });
    const d = (await res.json().catch(() => ({}))) as { enviadas?: number; error?: string };
    if (!res.ok) setError(d.error ?? "No se pudo enviar el aviso de prueba.");
    else if (!d.enviadas) setError("No hay ningún dispositivo con avisos activados.");
  }, []);

  return { estado, servidorListo, error, activar, desactivar, probar };
}
