import type { MetadataRoute } from "next";
import { SITE } from "@/data/site-config";

// Manifest de la tienda. Va como ruta normal (y no como app/manifest.ts)
// para que /admin pueda declarar el suyo propio en su layout: el de la
// convención de archivos se impone a cualquier metadata anidada.
export const dynamic = "force-static";

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    name: `${SITE.name} — Productos Amway Premium`,
    short_name: SITE.name,
    description:
      "Distribuidor independiente de productos originales Amway importados de Estados Unidos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#f7f4ee",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json" } });
}
