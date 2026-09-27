import { SITE } from "@/data/site-config";

// Manifest propio del panel: instalado en el móvil abre directamente la
// gestión (no la tienda) y recibe los avisos de pedidos como una app más.
export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      id: "/admin",
      name: `Gestión · ${SITE.name}`,
      short_name: "Gestión",
      description: `Pedidos, recogidas y avisos de ${SITE.name}.`,
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      orientation: "portrait",
      lang: "es",
      background_color: "#f3f0e9",
      theme_color: "#1c1a16",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
