import Link from "next/link";
import { SITE, waLink, WA_PRESETS } from "@/data/site-config";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Categorías",
    links: [
      { href: "/nutricion", label: "Nutrición" },
      { href: "/xs-energy", label: "XS Energy" },
      { href: "/belleza", label: "Belleza" },
      { href: "/hogar", label: "Hogar" },
      { href: "/espring", label: "eSpring" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/sobre-nosotros", label: "Sobre nosotros" },
      { href: "/ofertas", label: "Ofertas destacadas" },
      { href: "/opiniones", label: "Opiniones de clientes" },
      { href: "/faq", label: "Preguntas frecuentes" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-carbon">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2">
            <p className="font-display text-3xl text-cream">
              {SITE.name}
              <span className="text-gold">.</span>
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/55">
              {SITE.legalNote} Servicio local en {SITE.city}, {SITE.region}, con atención
              personalizada y envíos a toda España.
            </p>
            <a
              href={waLink(WA_PRESETS.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#25D366]/90"
            >
              Hablar por WhatsApp
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-medium text-cream">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream/55 transition-colors hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name} · {SITE.city}, {SITE.region}, {SITE.country}
          </p>
          <p>
            Amway™, Nutrilite™, Artistry™, XS™, eSpring™, Atmosphere™ e iCook™ son marcas
            registradas de Amway Corp. Este es un negocio de distribución independiente.
          </p>
        </div>
      </div>
    </footer>
  );
}
