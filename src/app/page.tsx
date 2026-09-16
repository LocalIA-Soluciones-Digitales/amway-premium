import { Hero } from "@/components/home/Hero";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { FlagshipShowcase } from "@/components/home/FlagshipShowcase";
import { TrustBar } from "@/components/home/TrustBar";
import { Testimonials } from "@/components/home/Testimonials";
import { FinalCta } from "@/components/home/FinalCta";
import { SITE } from "@/data/site-config";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE.name,
    image: `${SITE.url}/images/catalog/p017_0_841x1091.webp`,
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
      <FlagshipShowcase />
      <Testimonials />
      <FinalCta />
    </>
  );
}
