import type { NextConfig } from "next";

// Imágenes y vídeos de public/ se sirven sin hash en el nombre: si se cambia
// el contenido de uno, hay que darle un nombre nuevo para que no se quede la
// versión anterior en la caché de los navegadores (hasta 7 días).
const MEDIA_CACHE = "public, max-age=604800, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
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
      { source: "/videos/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: MEDIA_CACHE }] },
    ];
  },
  async redirects() {
    // Nosotros y Contacto viven ahora en una sola página.
    return [{ source: "/contacto", destination: "/sobre-nosotros#contacto", permanent: true }];
  },
};

export default nextConfig;
