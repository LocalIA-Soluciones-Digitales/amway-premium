import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORY_META, PRODUCTS, getProductById } from "@/data/products";
import { productHref, productImageSrc, type Product } from "@/data/types";
import { fetchCatalogoPublico, indexCatalogo, precioVenta } from "@/lib/catalog-state";
import { SITE } from "@/data/site-config";
import { GALERIA, galeriaSrc } from "@/data/galeria";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductDetail, type ProductAccent } from "@/components/product/ProductDetail";
import { ProductCard } from "@/components/product/ProductCard";

// Una ficha por producto, generada al compilar. Precio y oculto
// llegan del panel a través de CatalogStateProvider, así que no hace falta
// regenerar la página cuando cambian.
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export const dynamicParams = false;

function findProduct(rawId: string): Product | undefined {
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    // Ya venía decodificado.
  }
  return getProductById(id);
}

// Corta en el último espacio antes del límite (antes cortaba a media palabra).
function recortar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  return corte.slice(0, corte.lastIndexOf(" ")).replace(/[\s,.;:—-]+$/, "") + "…";
}

// Precio más bajo entre las variantes, el del panel (el que ve el cliente).
// Misma petición y caché que el layout, así que no añade otra consulta.
async function precioDesde(product: Product): Promise<number | null> {
  const catalogo = indexCatalogo(await fetchCatalogoPublico({ next: { revalidate: 60, tags: ["amway-catalogo"] } }));
  const precios = product.variants
    .map((_, i) => precioVenta(catalogo, product, i))
    .filter((x): x is number => x != null);
  return precios.length > 0 ? Math.min(...precios) : null;
}

const sinMarca = (s: string) => s.replace(/[™®]/g, "").toLowerCase();

export async function generateMetadata({ params }: PageProps<"/producto/[id]">): Promise<Metadata> {
  const product = findProduct((await params).id);
  if (!product) return {};
  const image = productImageSrc(product);
  const price = await precioDesde(product);
  // Casi todos los nombres ya llevan la marca («Nutrilite™ Sleep Easy — Nutrilite»).
  const title = sinMarca(product.name).includes(sinMarca(product.brand))
    ? product.name
    : `${product.name} — ${product.brand}`;
  // Precio y recogida en el resultado de Google: es lo que decide el clic.
  const cola = `${price != null ? ` Precio: ${price.toFixed(2).replace(".", ",")} €.` : ""} Recogida en Barakaldo.`;
  const description = recortar(product.description, 158 - cola.length) + cola;
  return {
    title,
    description,
    alternates: { canonical: productHref(product) },
    openGraph: {
      title: product.name,
      description,
      url: productHref(product),
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

// Mismo tipo de producto primero; si no llegan a cuatro, se completa con la categoría.
function related(product: Product): Product[] {
  const others = PRODUCTS.filter((p) => p.id !== product.id);
  const same = others.filter((p) => p.subcategory === product.subcategory && p.category === product.category);
  const rest = others.filter((p) => p.category === product.category && !same.includes(p));
  return [...same, ...rest].slice(0, 4);
}

export default async function ProductPage({ params }: PageProps<"/producto/[id]">) {
  const product = findProduct((await params).id);
  if (!product) notFound();

  const category = CATEGORY_META[product.category];
  const image = productImageSrc(product);
  // Precio del panel (el mismo que ve el cliente), no el de catálogo:
  // Google compara el precio del marcado con el de la página.
  const price = await precioDesde(product);
  const url = `${SITE.url}${productHref(product)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.variants[0]?.sku,
    image: image ? `${SITE.url}${image}` : undefined,
    category: `${category.label} > ${product.subcategory}`,
    offers:
      price != null
        ? {
            "@type": "Offer",
            priceCurrency: "EUR",
            price: price.toFixed(2),
            availability: "https://schema.org/InStock",
            // Solo recogida en el local de Barakaldo.
            availableDeliveryMethod: "https://schema.org/OnSitePickup",
            url,
          }
        : undefined,
  };
  // Las mismas migas que se ven encima de la ficha.
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catálogo", item: `${SITE.url}/catalogo` },
      { "@type": "ListItem", position: 2, name: category.label, item: `${SITE.url}${category.href}` },
      { "@type": "ListItem", position: 3, name: product.name, item: url },
    ],
  };
  const relatedProducts = related(product);
  // Fotos extra de cada variante; la galería entera no viaja al navegador.
  const galerias = product.variants.map((v) => (v.sku ? (GALERIA[v.sku] ?? []).map(galeriaSrc) : []));

  return (
    <div className="pt-28 sm:pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <ProductDetail
        product={product}
        categoryLabel={category.label}
        categoryHref={category.href}
        accent={category.accent as ProductAccent}
        galerias={galerias}
      />

      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone">{category.label}</p>
              <h2 className="mt-3 font-display text-3xl text-carbon sm:text-4xl">También te puede interesar</h2>
            </div>
            <Link
              href={category.href}
              className="group flex items-center gap-1.5 text-sm font-medium text-carbon underline-offset-4 hover:underline"
            >
              Ver todo
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
