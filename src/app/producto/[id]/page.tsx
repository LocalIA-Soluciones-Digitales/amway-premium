import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORY_META, PRODUCTS, getProductById } from "@/data/products";
import { productHref, productImageSrc, priceFrom, type Product } from "@/data/types";
import { SITE } from "@/data/site-config";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductCard } from "@/components/product/ProductCard";

// Una ficha por producto, generada al compilar. Precio, agotado y oculto
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

export async function generateMetadata({ params }: PageProps<"/producto/[id]">): Promise<Metadata> {
  const product = findProduct((await params).id);
  if (!product) return {};
  const image = productImageSrc(product);
  return {
    title: `${product.name} — ${product.brand}`,
    description: product.description.slice(0, 160),
    alternates: { canonical: productHref(product) },
    openGraph: {
      title: product.name,
      description: product.description,
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
  const price = priceFrom(product);
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
            url: `${SITE.url}${productHref(product)}`,
          }
        : undefined,
  };
  const relatedProducts = related(product);

  return (
    <div className="pt-28 sm:pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ProductDetail product={product} categoryLabel={category.label} categoryHref={category.href} />

      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl border-t border-carbon/10 px-6 py-20 sm:px-8">
          <h2 className="font-display text-2xl text-carbon sm:text-3xl">También te puede interesar</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
