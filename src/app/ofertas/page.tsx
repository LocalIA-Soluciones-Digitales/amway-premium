import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, MessageCircle, Sparkles, Star } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { HeroFacts, PageHero, heroPrimaryClass, heroSecondaryClass } from "@/components/layout/PageHero";
import { PRODUCTS } from "@/data/products";
import { waLink, WA_PRESETS } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Novedades y destacados",
  description:
    "Los últimos lanzamientos y productos más destacados del catálogo Amway: novedades Nutrilite, Artistry y XS Energy.",
};

function SectionHeader({
  eyebrow,
  icon: Icon,
  title,
  text,
}: {
  eyebrow: string;
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-gold">
          <Icon size={15} />
          {eyebrow}
        </p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] text-carbon sm:text-5xl">{title}</h2>
        <p className="mt-4 text-base leading-relaxed text-stone">{text}</p>
      </div>
      <Link
        href="/catalogo"
        className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-carbon"
      >
        Ver catálogo completo
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default function OfertasPage() {
  const news = PRODUCTS.filter((p) => p.badge === "¡Nuevo!");
  const flagship = PRODUCTS.filter((p) => p.flagship);

  return (
    <>
      <PageHero
        eyebrow="Novedades y destacados"
        title={
          <>
            Lo último, <span className="italic text-gold-soft">recién llegado.</span>
          </>
        }
        description="Los lanzamientos más recientes y los productos más solicitados, tal y como aparecen en el catálogo oficial de Estados Unidos."
        photo="/images/xs-energy/lifestyle/sky-drink.webp"
        photoPosition="75% center"
        actions={
          <>
            <a href="#novedades" className={heroPrimaryClass}>
              Ver novedades
              <ArrowDown size={16} />
            </a>
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className={heroSecondaryClass}
            >
              <MessageCircle size={16} />
              Preguntar por WhatsApp
            </a>
          </>
        }
      >
        <HeroFacts
          items={[
            { value: String(news.length), label: "Novedades en catálogo" },
            { value: String(flagship.length), label: "Productos insignia" },
            { value: "EE. UU.", label: "Originales importados" },
          ]}
        />
      </PageHero>

      <section id="novedades" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24">
        <SectionHeader
          eyebrow="Recién llegados"
          icon={Sparkles}
          title="Novedades"
          text="Lo más nuevo de Nutrilite, Artistry y XS: lanzamientos que acaban de entrar en el catálogo."
        />
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {news.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-forest px-6 py-12 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl leading-tight text-cream sm:text-4xl">
                ¿Buscas algo que no ves aquí?
              </h2>
              <p className="mt-3 text-base leading-relaxed text-cream/75">
                Traemos cualquier producto del catálogo de Amway US. Escríbenos y te decimos precio y
                plazo sin compromiso.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={waLink(WA_PRESETS.general)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-carbon transition hover:bg-white"
              >
                <MessageCircle size={16} />
                Escribir por WhatsApp
              </a>
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3 text-sm font-medium text-cream transition hover:bg-cream/10"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 sm:mt-8">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24">
          <SectionHeader
            eyebrow="Los más pedidos"
            icon={Star}
            title="Productos insignia"
            text="Los imprescindibles de siempre: los que más repiten nuestros clientes y con los que recomendamos empezar."
          />
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {flagship.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
