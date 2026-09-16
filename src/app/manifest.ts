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
    background_color: "#05060a",
    theme_color: "#05060a",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
    ],
  };
}
