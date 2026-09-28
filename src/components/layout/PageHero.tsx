"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Full-bleed photographic hero for secondary pages. Its route must be listed
// in the header's DARK_HERO_ROUTES so the header starts in its light-on-dark
// state over the photo.
export function PageHero({
  eyebrow,
  title,
  description,
  photo,
  photoPosition = "center",
  actions,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  photo: string;
  photoPosition?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative flex min-h-[72svh] items-end overflow-hidden bg-carbon">
      <div className="absolute inset-0">
        <Image
          src={photo}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: photoPosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/55 to-carbon/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon/60 via-carbon/10 to-transparent" />
      </div>

      <div className="relative w-full px-6 pb-14 pt-40 sm:px-8 sm:pb-20">
        <div className="mx-auto max-w-7xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-sm font-medium uppercase tracking-[0.25em] text-gold-soft"
          >
            {eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="mt-4 max-w-3xl font-display text-5xl leading-[0.98] text-cream sm:text-7xl"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            className="mt-6 max-w-xl text-base leading-relaxed text-cream/75 sm:text-lg"
          >
            {description}
          </motion.p>

          {actions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
              className="mt-9 flex flex-wrap gap-3"
            >
              {actions}
            </motion.div>
          )}

          {children && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
              className="mt-12"
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

export const heroPrimaryClass =
  "inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-carbon transition hover:bg-white";
export const heroSecondaryClass =
  "inline-flex items-center gap-2 rounded-full border border-cream/30 bg-cream/5 px-6 py-3 text-sm font-medium text-cream backdrop-blur transition hover:border-cream/50 hover:bg-cream/10";

// Row of short facts under the hero copy, separated by hairlines.
export function HeroFacts({ items }: { items: { value: string; label: string }[] }) {
  return (
    <ul className="grid max-w-3xl grid-cols-3 divide-x divide-cream/15 border-t border-cream/15 pt-6">
      {items.map((f) => (
        <li key={f.label} className="px-4 first:pl-0 sm:px-6">
          <p className="font-display text-2xl text-cream sm:text-3xl">{f.value}</p>
          <p className="mt-1 text-xs leading-snug text-cream/60 sm:text-sm">{f.label}</p>
        </li>
      ))}
    </ul>
  );
}
