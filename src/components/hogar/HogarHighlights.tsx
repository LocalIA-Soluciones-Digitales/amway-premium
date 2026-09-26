"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import type { Product } from "@/data/types";
import { priceRangeLabel } from "@/data/types";
import { waProductLink } from "@/data/site-config";

const ESpringScene = dynamic(
  () => import("@/components/animated/ESpringScene").then((m) => m.ESpringScene),
  { ssr: false }
);
const AtmosphereScene = dynamic(
  () => import("@/components/animated/AtmosphereScene").then((m) => m.AtmosphereScene),
  { ssr: false }
);
const ICookSteam = dynamic(
  () => import("@/components/animated/ICookSteam").then((m) => m.ICookSteam),
  { ssr: false }
);

const SCENES: Record<string, React.ComponentType<{ image?: string }>> = {
  espring: ESpringScene,
  atmosphere: AtmosphereScene,
  icook: ICookSteam,
};

export function HogarHighlights({
  items,
}: {
  items: {
    product: Product;
    scene: keyof typeof SCENES;
    image?: string;
    video?: string;
    poster?: string;
    /** CSS object-position for the square crop of the video. */
    videoPosition?: string;
    tag: string;
  }[];
}) {
  return (
    // Swipeable row on phones (next card peeks in), three-column grid from sm up.
    <div className="no-scrollbar -mx-6 mt-8 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
      {items.map(({ product, scene, image, video, poster, videoPosition, tag }) => {
        const Scene = SCENES[scene];
        return (
          <div
            key={product.id}
            className="w-[82%] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-carbon sm:w-auto"
          >
            {video ? (
              <div className="relative aspect-square w-full overflow-hidden">
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  style={videoPosition ? { objectPosition: videoPosition } : undefined}
                  src={video}
                  poster={poster}
                  aria-label={product.name}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              </div>
            ) : (
              <Scene image={image} />
            )}
            <div className="p-5">
              <p className="text-[11px] uppercase tracking-wide text-[#8fb4c2]">{tag}</p>
              <h3 className="mt-2 font-display text-lg text-cream">{product.name}</h3>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-cream">{priceRangeLabel(product)}</span>
                <a
                  href={waProductLink(product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/5 px-4 py-2 text-xs text-cream/60 transition hover:bg-tech hover:text-cream"
                >
                  Consultar
                </a>
              </div>
              {scene === "espring" && (
                <Link
                  href="/espring"
                  className="mt-3 inline-block text-xs text-spring-blue underline-offset-4 transition hover:underline"
                >
                  Descubre eSpring™ →
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
