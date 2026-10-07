import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { waLink, WA_PRESETS } from "@/data/site-config";

const TITLE_LINES = [["Bienestar"], ["para", "tu", "día", "a", "día"]];

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// Animado solo con CSS (keyframes hero-word / hero-fade-up en globals.css):
// el texto llega pintado en el HTML y la animación arranca con él, sin
// esperar a GSAP ni a la hidratación, que en móvil retrasaban el LCP ~3 s.
function entrada(nombre: "hero-word" | "hero-fade-up", delay: number, duracion = 0.7) {
  return { animation: `${nombre} ${duracion}s ${EASE} ${delay}s both` };
}

export function Hero() {
  let palabra = 0;

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/editorial/hero-bienestar.webp"
          alt="Bienestar cotidiano con productos Amway"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/25 to-carbon/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon/55 via-transparent to-transparent" />
      </div>

      <div className="relative w-full px-6 pb-20 pt-40 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl">
          <p
            style={entrada("hero-fade-up", 0, 0.6)}
            className="text-sm font-medium uppercase tracking-[0.3em] text-cream/70"
          >
            Productos originales Amway · Barakaldo
          </p>

          <h1 className="mt-5 font-display text-[16vw] leading-[0.92] text-cream sm:text-[9rem] lg:text-[clamp(4rem,10vw,9rem)]">
            {TITLE_LINES.map((line, li) => (
              <span key={li} className="flex flex-wrap gap-x-4">
                {line.map((w, i) => (
                  <span key={i} className="inline-block overflow-hidden">
                    <span className="inline-block" style={entrada("hero-word", 0.1 + 0.06 * palabra++, 1.1)}>
                      {w}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            style={entrada("hero-fade-up", 0.35)}
            className="mt-7 max-w-md text-base leading-relaxed text-cream/80 sm:text-lg"
          >
            Productos seleccionados de nutrición, belleza y cuidado del hogar,
            con atención personalizada en Barakaldo.
          </p>

          <div style={entrada("hero-fade-up", 0.5)} className="mt-9 flex flex-wrap gap-4">
            <a
              href="/catalogo"
              className="rounded-full bg-cream px-7 py-3.5 text-sm font-medium text-carbon transition hover:bg-white"
            >
              Descubrir productos
            </a>
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-cream/30 bg-cream/5 px-7 py-3.5 text-sm font-medium text-cream backdrop-blur transition hover:border-cream/50 hover:bg-cream/10"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div
        style={entrada("hero-fade-up", 1)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/70"
        aria-hidden="true"
      >
        <ChevronDown size={22} className="animate-float" />
      </div>
    </section>
  );
}
