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
import { SITE } from "@/data/site-config";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE.name,
    image: `${SITE.url}/images/editorial/hero-bienestar.webp`,
    description:
      "Distribuidor independiente de productos originales Amway importados de Estados Unidos: Nutrilite, Artistry, XS Energy, eSpring, Atmosphere e iCook.",
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: "ES",
    },
    telephone: `+${SITE.whatsapp}`,
    url: SITE.url,
    priceRange: "$$-$$$",
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
      <BestSellers />
      <Manifesto />
      <XsEnergyMoment />
      <FlagshipShowcase />
      <BeautyEditorial />
      <ProductDiscovery />
      <AboutSeller />
      <FinalCta />
    </>
  );
}
