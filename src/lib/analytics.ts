import { amwayDb } from "@/lib/amway-db";

// Analítica propia (misma lógica que Arrantza: sesión, atribución "first
// touch", dispositivo, visitante recurrente), con claves y tabla propias de
// Amway. Nada se guarda ni se envía sin consentimiento del banner de cookies.

export type EventType =
  | "pageview"
  | "add_to_cart"
  | "cart_open"
  | "checkout_start"
  | "whatsapp_click"
  | "solicitud"
  | "resena";
export type SourceCategory = "google_ads" | "google_organic" | "social" | "referral" | "direct" | "other";
export type DeviceType = "mobile" | "tablet" | "desktop";

export const CONSENT_KEY = "amway_premium_cookies";
const SESSION_KEY = "amway_premium_session";
const SOURCE_KEY = "amway_premium_source";
const VISITOR_KEY = "amway_premium_visitor";
const RETURNING_KEY = "amway_premium_returning";

const AD_MEDIUMS = ["cpc", "ppc", "paid", "ads"];
const SOCIAL_HOSTS = ["facebook.com", "instagram.com", "x.com", "twitter.com", "tiktok.com", "whatsapp.com", "t.co", "lnkd.in", "linkedin.com"];

export type Consent = "aceptadas" | "rechazadas";

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "aceptadas" || v === "rechazadas" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, v);
    if (v === "rechazadas") {
      localStorage.removeItem(VISITOR_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SOURCE_KEY);
      sessionStorage.removeItem(RETURNING_KEY);
    }
  } catch {
    // storage blocked: behave as "not accepted"
  }
}

function uuid(): string {
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();
  // Old browsers / insecure contexts: RFC 4122 v4 shape from getRandomValues.
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectDevice(): DeviceType {
  const ua = navigator.userAgent;
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

function isReturning(): boolean {
  const cached = sessionStorage.getItem(RETURNING_KEY);
  if (cached !== null) return cached === "1";
  const had = !!localStorage.getItem(VISITOR_KEY);
  if (!had) localStorage.setItem(VISITOR_KEY, uuid());
  sessionStorage.setItem(RETURNING_KEY, had ? "1" : "0");
  return had;
}

interface Attribution {
  source_category: SourceCategory;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
}

function classify(utmSource: string | null, utmMedium: string | null, referrer: string | null): SourceCategory {
  const medium = utmMedium?.toLowerCase() ?? "";
  if (utmSource?.toLowerCase().includes("google") && AD_MEDIUMS.includes(medium)) return "google_ads";
  if (!referrer) return utmSource ? "other" : "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return "direct";
    if (host.includes("google.")) return "google_organic";
    if (SOCIAL_HOSTS.some((s) => host.includes(s))) return "social";
    return "referral";
  } catch {
    return "other";
  }
}

function getAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const stored = sessionStorage.getItem(SOURCE_KEY);
  if (stored && !utmSource) return JSON.parse(stored) as Attribution;
  const utm_medium = params.get("utm_medium");
  const referrer = document.referrer || null;
  const attribution: Attribution = {
    source_category: classify(utmSource, utm_medium, referrer),
    utm_source: utmSource,
    utm_medium,
    utm_campaign: params.get("utm_campaign"),
    referrer,
  };
  sessionStorage.setItem(SOURCE_KEY, JSON.stringify(attribution));
  return attribution;
}

export function track(eventType: EventType, label?: string, path?: string) {
  if (typeof window === "undefined" || getConsent() !== "aceptadas") return;
  if (window.location.pathname.startsWith("/admin")) return;
  try {
    const a = getAttribution();
    void amwayDb()
      .rpc("amway_registrar_visita", {
        p_session_id: getSessionId(),
        p_event_type: eventType,
        p_path: path ?? window.location.pathname,
        p_label: label ?? null,
        p_referrer: a.referrer,
        p_source_category: a.source_category,
        p_utm_source: a.utm_source,
        p_utm_medium: a.utm_medium,
        p_utm_campaign: a.utm_campaign,
        p_device_type: detectDevice(),
        p_is_returning: isReturning(),
      })
      .then(
        () => undefined,
        () => undefined
      );
  } catch {
    // Analytics must never break navigation.
  }
}

// Errores de la web pública: no guardan datos personales, así que se
// registran sin depender del consentimiento (interés legítimo técnico).
let reportedThisPage = 0;
export function reportError(mensaje: string, detalle?: string) {
  if (typeof window === "undefined" || reportedThisPage >= 5) return;
  if (window.location.pathname.startsWith("/admin")) return;
  reportedThisPage++;
  void amwayDb()
    .rpc("amway_registrar_error", {
      p_mensaje: mensaje,
      p_detalle: detalle ?? null,
      p_path: window.location.pathname,
      p_user_agent: navigator.userAgent,
    })
    .then(
      () => undefined,
      () => undefined
    );
}
