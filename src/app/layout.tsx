import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { SITE } from "@/data/site-config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Productos Amway Premium de Estados Unidos`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Distribuidor independiente de productos originales Amway importados de Estados Unidos: Nutrilite, Artistry, XS Energy, eSpring, Atmosphere e iCook. Atención personalizada en Barakaldo, Bizkaia.",
  keywords: [
    "Amway Barakaldo",
    "Productos Amway Bizkaia",
    "Productos Amway España",
    "Nutrilite España",
    "XS Energy España",
    "Productos americanos en España",
    "Suplementos premium",
    "Filtro de agua eSpring España",
    "Purificador Atmosphere",
    "Artistry España",
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — Productos Amway Premium de Estados Unidos`,
    description:
      "Nutrición, belleza, hogar y salud con la calidad Amway. Importación directa desde Estados Unidos, servicio local en Barakaldo.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Productos Amway Premium`,
    description: "Nutrición, belleza, hogar y salud con la calidad Amway.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col bg-obsidian">
        <SmoothScroll>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </SmoothScroll>
      </body>
    </html>
  );
}
