import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { BestSellers } from "@/components/home/BestSellers";
import { Manifesto } from "@/components/home/Manifesto";
import { XsEnergyMoment } from "@/components/home/XsEnergyMoment";
import { FlagshipShowcase } from "@/components/home/FlagshipShowcase";
import { BeautyEditorial } from "@/components/home/BeautyEditorial";
import { ProductDiscovery } from "@/components/home/ProductDiscovery";
import { AboutSeller } from "@/components/home/AboutSeller";
import { FinalCta } from "@/components/home/FinalCta";
import type { Metadata } from "next";
import { SITE } from "@/data/site-config";
import { getProductById } from "@/data/products";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE.name,
    image: `${SITE.url}/images/editorial/hero-bienestar.webp`,
    description:
      "Distribuidora independiente de productos originales Amway: Nutrilite, Artistry, XS Energy, eSpring, Atmosphere e iCook.",
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: "ES",
    },
    telephone: `+${SITE.whatsapp}`,
    url: SITE.url,
    priceRange: "€€",
    // Mismo horario que el calendario de recogida (SITE.horario).
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: SITE.horario.apertura,
      closes: SITE.horario.cierre,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <TrustBar />
      <CategoryShowcase />
      <Manifesto />
      <BestSellers />
      {/* Oscuro → claro → oscuro: Artistry separa XS de eSpring para que dos
          bloques a sangre no queden pegados. */}
      <XsEnergyMoment />
      <BeautyEditorial />
      <FlagshipShowcase espring={getProductById("espring-mesón")!} />
      <ProductDiscovery />
      <AboutSeller />
      <FinalCta />
    </>
  );
}
