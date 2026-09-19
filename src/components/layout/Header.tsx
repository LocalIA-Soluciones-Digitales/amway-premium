"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/data/site-config";

const NAV_LINKS = [
  { href: "/nutricion", label: "Nutrición" },
  { href: "/belleza", label: "Belleza" },
  { href: "/hogar", label: "Hogar" },
  { href: "/xs-energy", label: "XS Energy" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/ofertas", label: "Ofertas" },
];

// Routes that open on a full-bleed photographic hero dark enough for light
// header text; everywhere else the header starts directly in its light state.
const DARK_HERO_ROUTES = new Set(["/", "/nutricion", "/belleza", "/hogar", "/xs-energy"]);

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const dark = !scrolled && !open && DARK_HERO_ROUTES.has(pathname);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        scrolled ? "py-2" : "py-6"
      )}
    >
      {dark && (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-carbon/45 to-transparent" />
      )}
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-full px-5 transition-all duration-500 sm:px-8",
          scrolled ? "glass max-w-6xl py-2.5 mx-4 shadow-[0_8px_30px_rgba(28,26,22,0.08)]" : "py-1"
        )}
      >
        <Link
          href="/"
          className={cn(
            "font-display text-lg tracking-tight transition-colors sm:text-xl",
            dark ? "text-cream" : "text-carbon"
          )}
        >
          {SITE.name}
          <span className="ml-1.5 text-gold">.</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative text-sm transition-colors",
                  dark
                    ? active
                      ? "text-cream"
                      : "text-cream/70 hover:text-cream"
                    : active
                      ? "text-carbon"
                      : "text-stone hover:text-carbon"
                )}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className={cn(
                      "absolute -bottom-1.5 left-0 right-0 h-px",
                      dark ? "bg-cream" : "bg-forest"
                    )}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/sobre-nosotros"
            className={cn(
              "text-sm transition-colors",
              dark ? "text-cream/70 hover:text-cream" : "text-stone hover:text-carbon"
            )}
          >
            Nosotros
          </Link>
          <Link
            href="/contacto"
            className={cn(
              "rounded-full border px-5 py-2 text-sm transition",
              dark
                ? "border-cream/30 text-cream hover:bg-cream/10"
                : "border-carbon/15 text-carbon hover:bg-carbon/5"
            )}
          >
            Contacto
          </Link>
        </div>

        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border transition lg:hidden",
            dark ? "border-cream/30 text-cream" : "border-carbon/15 text-carbon"
          )}
        >
          <Menu size={20} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-cream-soft/98 px-6 py-6 backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-carbon">{SITE.name}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-carbon/15 text-carbon"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-1">
              {[...NAV_LINKS, { href: "/sobre-nosotros", label: "Nosotros" }, { href: "/contacto", label: "Contacto" }].map(
                (link, i) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block border-b border-carbon/8 py-4 font-display text-3xl",
                          active ? "text-forest" : "text-carbon"
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                }
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
