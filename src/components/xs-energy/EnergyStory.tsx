"use client";

import Image from "next/image";
import { waLink } from "@/data/site-config";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ENERGY_FLAVORS } from "@/data/energy-drinks";
import { EnergyScrollStory } from "./EnergyScrollStory";
import { EnergyFlavorSwipe } from "./EnergyFlavorSwipe";

function EnergyStoryStatic() {
  return (
    <div className="bg-xs-ink py-20">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <h2 className="mb-12 text-center font-display text-3xl italic uppercase text-cream sm:text-4xl">
          Nuestros sabores
        </h2>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          {ENERGY_FLAVORS.map((flavor) => (
            <div
              key={flavor.id}
              className="flex items-center gap-5 rounded-2xl border border-cream/10 p-5"
            >
              <div className="relative h-28 w-20 shrink-0">
                <Image
                  src={`/images/xs-energy/cans/${flavor.image}`}
                  alt={`XS™ ${flavor.name} sabor ${flavor.flavorEs}`}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/50">
                  {flavor.line}
                </p>
                <h3 className="mt-1 font-display text-xl text-cream">{flavor.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-wide text-stone-soft">{flavor.flavorEs}</p>
                <a
                  href={waLink(`Hola, quiero información sobre XS™ ${flavor.name} sabor ${flavor.flavorEs}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-xs-red underline underline-offset-4"
                >
                  Pedir por WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EnergyStory() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div id="historia">
      {reducedMotion ? (
        <EnergyStoryStatic />
      ) : (
        <>
          <EnergyScrollStory />
          <EnergyFlavorSwipe />
        </>
      )}
    </div>
  );
}
