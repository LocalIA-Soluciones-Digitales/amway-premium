import type { MetadataRoute } from "next";
import { SITE } from "@/data/site-config";
import { PRODUCTS, productHref } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/nutricion",
    "/xs-energy",
    "/belleza",
    "/cuidado-personal",
    "/hogar",
    "/espring",
    "/catalogo",
    "/ofertas",
    "/opiniones",
    "/sobre-nosotros",
    "/faq",
    "/aviso-legal",
    "/privacidad",
    "/cookies",
    "/condiciones",
    "/desistimiento",
  ];

  const pages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
  const products: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${SITE.url}${productHref(p)}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...pages, ...products];
}
