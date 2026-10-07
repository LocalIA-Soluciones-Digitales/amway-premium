"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ExternalLink,
  KeyRound,
  LogOut,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { SITE } from "@/data/site-config";
import { cn } from "@/lib/utils";
import { CambiarContrasena } from "./CambiarContrasena";
import { DosPasosDialog } from "./DosPasos";

export interface ShellTab<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface ViewSwitch {
  current: string;
  other: string;
  onSwitch: () => void;
}

// Same anatomy as the Arrantza dashboards: sticky header with title, pill
// tabs (with pending badges), view switcher for developers and sign-out —
// restyled with this shop's palette and typography.
export function DashboardShell<T extends string>({
  title,
  subtitle,
  tabs,
  tab,
  onTab,
  email,
  onSignOut,
  viewSwitch,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  tabs: ShellTab<T>[];
  tab: T;
  onTab: (t: T) => void;
  email?: string;
  onSignOut: () => void;
  viewSwitch?: ViewSwitch;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [pwOpen, setPwOpen] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);
  // En tablet y móvil no caben todas las pestañas: la activa se desplaza a la
  // vista para que siempre se vea dónde estás.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const activa = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !activa) return;
    const izq = activa.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
    if (izq < nav.scrollLeft || izq + activa.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: izq - (nav.clientWidth - activa.offsetWidth) / 2, behavior: "smooth" });
    }
    // También cuando llegan los contadores, que ensanchan las pestañas.
  }, [tab, tabs]);
  const tabsNav = (
    <nav
      ref={navRef}
      className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none]"
      aria-label="Secciones"
    >
      {tabs.map(({ id, label, icon: Icon, badge }) => {
        const active = id === tab;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition",
              active
                ? "bg-carbon text-cream shadow-sm"
                : "text-stone hover:bg-carbon/[0.05] hover:text-carbon",
            )}
          >
            <Icon size={15} strokeWidth={1.8} />
            {label}
            {!!badge && (
              <span
                className={cn(
                  "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                  active ? "bg-cream/20 text-cream" : "bg-xs-red text-cream",
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f3f0e9] print:bg-white">
      {/* En el móvil la cabecera se va al bajar y solo quedan fijas las
          pestañas, opacas y pegadas arriba del todo (así Safari tiñe también la
          zona de la hora). En la app instalada, una franja tapa esa zona. */}
      <div className="fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-cream-soft md:hidden print:hidden" />
      <header className="z-30 print:hidden max-md:contents md:sticky md:top-0 md:border-b md:border-carbon/[0.07] md:bg-cream-soft/90 md:backdrop-blur-xl">
        <div className="bg-cream-soft md:bg-transparent">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:gap-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                aria-label="Ir a la tienda"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-carbon font-display text-base text-cream sm:h-10 sm:w-10 sm:text-lg"
              >
                {SITE.name.charAt(0)}
              </Link>
              <div className="min-w-0">
                <h1 className="truncate font-display text-xl leading-tight text-carbon">
                  {title}
                </h1>
                <p className="hidden truncate text-[11px] uppercase tracking-[0.16em] text-stone sm:block">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {viewSwitch && (
                <div className="hidden md:block">
                  <ViewSwitcher {...viewSwitch} />
                </div>
              )}
              <Link
                href="/"
                target="_blank"
                className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-stone transition hover:bg-carbon/[0.05] hover:text-carbon sm:inline-flex"
              >
                Ver tienda <ExternalLink size={12} />
              </Link>
              {actions}
              <div className="hidden text-right lg:block">
                <p className="max-w-[12rem] truncate text-xs text-carbon">
                  {email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPwOpen(true)}
                aria-label="Cambiar contraseña"
                title="Cambiar contraseña"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-carbon/10 bg-white text-stone transition hover:border-carbon/25 hover:text-carbon"
              >
                <KeyRound size={15} />
              </button>
              <button
                type="button"
                onClick={() => setMfaOpen(true)}
                aria-label="Verificación en dos pasos"
                title="Verificación en dos pasos"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-carbon/10 bg-white text-stone transition hover:border-carbon/25 hover:text-carbon"
              >
                <ShieldCheck size={15} />
              </button>
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-carbon/10 bg-white text-stone transition hover:border-carbon/25 hover:text-carbon"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
          {viewSwitch && (
            <div className="mx-auto max-w-[1440px] px-4 pb-3 sm:px-8 md:hidden">
              <ViewSwitcher {...viewSwitch} />
            </div>
          )}
        </div>
        <div className="z-30 border-b border-carbon/[0.07] bg-cream-soft max-md:sticky max-md:top-[env(safe-area-inset-top)] md:border-0 md:bg-transparent">
          <div className="mx-auto max-w-[1440px] px-4 py-2 sm:px-8 md:pb-3 md:pt-0">
            {tabsNav}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-5 sm:px-8 sm:pt-8 print:max-w-none print:p-0">
        {children}
      </div>
      <CambiarContrasena
        email={email}
        open={pwOpen}
        onClose={() => setPwOpen(false)}
      />
      <DosPasosDialog open={mfaOpen} onClose={() => setMfaOpen(false)} />
    </div>
  );
}

export function ViewSwitcher({ current, other, onSwitch }: ViewSwitch) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-carbon/10 bg-white pl-3.5 pr-2.5 text-xs font-medium text-carbon transition hover:border-carbon/25"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-forest" />
        {current}
        <ChevronDown
          size={14}
          className={cn("text-stone transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-56 rounded-2xl border border-carbon/[0.07] bg-white p-1.5 shadow-[0_20px_50px_rgba(28,26,22,0.14)] md:left-auto md:right-0">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-carbon">
            <Check size={14} className="text-forest" />
            {current}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSwitch();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-stone transition hover:bg-cream hover:text-carbon"
          >
            <span className="w-3.5" />
            {other}
          </button>
        </div>
      )}
    </div>
  );
}
