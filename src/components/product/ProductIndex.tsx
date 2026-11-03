import Link from "next/link";
import { productHref, type Product } from "@/data/types";

// Índice de todas las fichas de la página, en enlaces normales del HTML.
// El explorador pinta 24 y el resto llega con «Ver más» en el navegador, así
// que Google solo veía esas 24 por categoría: las demás le llegaban únicamente
// por el sitemap y se quedaban «descubiertas, sin indexar». Va plegado (los
// enlaces dentro de <details> siguen en el HTML y Google los sigue).
export function ProductIndex({ products, title }: { products: Product[]; title: string }) {
  const grupos = new Map<string, Product[]>();
  for (const p of products) {
    const lista = grupos.get(p.subcategory) ?? [];
    lista.push(p);
    grupos.set(p.subcategory, lista);
  }

  return (
    <nav aria-label={title} className="mx-auto max-w-7xl px-6 pb-16 sm:px-8">
      <details className="group rounded-2xl border border-carbon/10 bg-linen/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-carbon sm:px-6 [&::-webkit-details-marker]:hidden">
          <span>
            {title} <span className="text-stone">({products.length})</span>
          </span>
          <span aria-hidden className="text-stone transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="columns-1 gap-8 px-5 pb-6 sm:columns-2 sm:px-6 lg:columns-3">
          {Array.from(grupos, ([sub, lista]) => (
            <div key={sub} className="mb-5 break-inside-avoid">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-stone">{sub}</h3>
              <ul className="space-y-1">
                {lista.map((p) => (
                  <li key={p.id}>
                    <Link href={productHref(p)} prefetch={false} className="text-sm text-carbon/80 hover:text-carbon hover:underline">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </nav>
  );
}
