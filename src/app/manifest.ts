import type { MetadataRoute } from "next";
import { SITE } from "@/data/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
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
}
