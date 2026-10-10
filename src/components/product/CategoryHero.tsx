import Image from "next/image";
import { entrada } from "@/lib/entrada";
import { waLink } from "@/data/site-config";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ACCENT_TEXT: Record<string, string> = {
  forest: "text-forest-soft",
  gold: "text-gold-soft",
  tech: "text-[#8fb4c2]",
  xs: "text-[#ff8095]",
};

export function CategoryHero({
  eyebrow,
  title,
  description,
  photo,
  accent = "forest",
  waMessage,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  photo: string;
  accent?: "forest" | "gold" | "tech" | "xs";
  waMessage: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative flex min-h-[85svh] items-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={photo}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/55 to-carbon/25" />
        <div className="absolute inset-0 bg-carbon/10" />
      </div>

      <div className="relative w-full px-6 pb-16 pt-40 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-7xl">
          <p
            style={entrada(0, 0.6)}
            className={cn(
              "text-sm font-medium uppercase tracking-[0.25em]",
              ACCENT_TEXT[accent]
            )}
          >
            {eyebrow}
          </p>
          <h1 style={entrada(0.1)} className="mt-4 max-w-3xl font-display text-5xl leading-[0.98] text-cream sm:text-7xl lg:text-8xl">
            {title}
          </h1>
          <p style={entrada(0.2)} className="mt-6 max-w-xl text-base leading-relaxed text-cream/75 sm:text-lg">
            {description}
          </p>

          <div style={entrada(0.3)} className="mt-9 flex flex-wrap gap-3">
            <a
              href="#catalogo"
              className="rounded-full bg-cream px-6 py-3 text-sm font-medium text-carbon transition hover:bg-white"
            >
              Ver productos
            </a>
            <a
              href={waLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-cream/30 px-6 py-3 text-sm font-medium text-cream transition hover:bg-cream/10"
            >
              Consultar por WhatsApp
            </a>
          </div>

          {children}
        </div>
      </div>
    </section>
  );
}
