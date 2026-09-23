import type { MetadataRoute } from "next";
import { SITE } from "@/data/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/nutricion",
    "/xs-energy",
    "/belleza",
    "/hogar",
    "/espring",
    "/catalogo",
    "/ofertas",
    "/opiniones",
    "/sobre-nosotros",
    "/faq",
    "/contacto",
  ];

  return routes.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
