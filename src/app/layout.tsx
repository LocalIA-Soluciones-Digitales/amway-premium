import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { AnuncioPopup } from "@/components/layout/AnuncioPopup";
import { CartProvider } from "@/components/cart/CartProvider";
import { ClienteProvider } from "@/components/cuenta/ClienteProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CatalogStateProvider } from "@/components/catalog/CatalogStateProvider";
import { StoreOnly } from "@/components/layout/StoreOnly";
import { Analytics } from "@/components/layout/Analytics";
import { fetchCatalogoPublico } from "@/lib/catalog-state";
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
  manifest: "/manifest.webmanifest",
  title: {
    default: `${SITE.name} — Distribuidora independiente de productos Amway`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Distribuidora independiente de productos originales Amway: Nutrilite, Artistry, XS Energy, eSpring, Atmosphere e iCook. Atención personalizada en Barakaldo, Bizkaia.",
  keywords: [
    "Amway Barakaldo",
    "Productos Amway Bizkaia",
    "Productos Amway España",
    "Nutrilite España",
    "XS Energy España",
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
    title: `${SITE.name} — Distribuidora independiente de productos Amway`,
    description:
      "Nutrición, belleza y hogar con productos originales Amway. Distribuidora independiente con atención y recogida en Barakaldo.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Productos Amway Premium`,
    description: "Nutrición, belleza, hogar y salud con la calidad Amway.",
  },
  robots: { index: true, follow: true },
};

// Guarda en window.__amwayErrores los errores desde el primer instante;
// <Analytics> los envía al montar y desde entonces sustituye `push` por el
// envío directo (ver analytics.ts → atenderErroresTempranos).
const CAPTURA_ERRORES = `(function(){var q=window.__amwayErrores=[];function p(m,d){if(q.length<10)q.push([String(m||"Error").slice(0,500),d?String(d).slice(0,4000):null])}window.addEventListener("error",function(e){p(e.message,e.error&&e.error.stack)});window.addEventListener("unhandledrejection",function(e){var r=e.reason;p(r&&r.message||r,r&&r.stack)})})();`;

export const viewport: Viewport = {
  themeColor: "#f7f4ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Precios/agotados del panel de gestión: se sirven con la página y se
  // regeneran como mucho cada minuto (el cliente además los refresca).
  const catalogo = await fetchCatalogoPublico({ next: { revalidate: 60, tags: ["amway-catalogo"] } });

  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} antialiased`}
    >
      <body className="grain min-h-screen flex flex-col bg-cream">
        {/* Antes que nada: los errores de la carga y de la hidratación ocurren
            antes de que monte <Analytics>, que es quien los envía. */}
        <script dangerouslySetInnerHTML={{ __html: CAPTURA_ERRORES }} />
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-carbon px-5 py-2.5 text-sm font-medium text-cream transition-transform focus-visible:translate-y-0"
        >
          Saltar al contenido
        </a>
        <SmoothScroll>
          <CatalogStateProvider initial={catalogo}>
            <ClienteProvider>
              <CartProvider>
                <StoreOnly>
                  <Header />
                </StoreOnly>
                <main id="main-content" className="flex-1">
                  {children}
                </main>
                <StoreOnly>
                  <Footer />
                  <WhatsAppButton />
                  <AnuncioPopup />
                </StoreOnly>
                <CartDrawer />
                <Analytics />
              </CartProvider>
            </ClienteProvider>
          </CatalogStateProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
