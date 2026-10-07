import type { NextConfig } from "next";

// Imágenes y vídeos de public/ se sirven sin hash en el nombre: si se cambia
// el contenido de uno, hay que darle un nombre nuevo para que no se quede la
// versión anterior en la caché de los navegadores (hasta 7 días).
const MEDIA_CACHE = "public, max-age=604800, stale-while-revalidate=86400";

// Cabeceras de seguridad para toda la web. frame-ancestors/X-Frame-Options
// impiden incrustar la tienda o el panel en otra web (clickjacking). La CSP
// completa va primero en modo «solo informe» para ver en la consola qué
// bloquearía sin romper nada; cuando esté limpia, pasarla a la cabecera real.
const SUPABASE = "https://ukhfaphloxlszomccgde.supabase.co";
const VERCEL_HOST = "amway-premium.vercel.app";
type Redirect = Awaited<ReturnType<NonNullable<NextConfig["redirects"]>>>[number];
const CSP_INFORME = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE}`,
  `media-src 'self' blob: ${SUPABASE}`,
  `connect-src 'self' ${SUPABASE} wss://ukhfaphloxlszomccgde.supabase.co`,
  "font-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_INFORME },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // AVIF pesa bastante menos que WebP a igual calidad; los navegadores que
    // no lo soportan siguen recibiendo WebP.
    formats: ["image/avif", "image/webp"],
    // Las imágenes de public/ no cambian: que Vercel no las vuelva a
    // transformar cada minuto (valor por defecto de Next 15).
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/videos/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
    ];
  },
  async redirects() {
    // Nosotros y Contacto viven ahora en una sola página.
    const redirects: Redirect[] = [{ source: "/contacto", destination: "/sobre-nosotros#contacto", permanent: true }];
    // Con el dominio definitivo configurado (NEXT_PUBLIC_SITE_URL), el de
    // Vercel deja de servir páginas: 308 al dominio para que Google no
    // indexe dos copias de la web. /api/* queda fuera para no romper un
    // webhook de Stripe que aún apunte al dominio de Vercel (Stripe no
    // sigue redirecciones).
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (site && new URL(site).hostname !== VERCEL_HOST) {
      redirects.push({
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: VERCEL_HOST }],
        destination: `${site}/:path`,
        permanent: true,
      });
    }
    return redirects;
  },
};

export default nextConfig;
