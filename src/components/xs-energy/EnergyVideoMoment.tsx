"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function EnergyVideoMoment() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="relative flex min-h-[70svh] items-center justify-center overflow-hidden bg-carbon sm:min-h-[85svh]">
      {playing ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/xs-energy-launch.mp4"
          poster="/images/xs-energy/video-poster.webp"
          controls
          autoPlay
          playsInline
        />
      ) : (
        <>
          <Image
            src="/images/xs-energy/video-poster.webp"
            alt="XS™ Power Water+ Lemon Peach"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/40 to-carbon/20" />

          <div className="relative flex flex-col items-center gap-6 px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-xs-red">
              Así nace XS™ Power Water+
            </p>
            <button
              onClick={() => setPlaying(true)}
              aria-label="Reproducir vídeo"
              className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-cream/95 transition-transform duration-300 hover:scale-110 active:scale-95 sm:h-24 sm:w-24"
            >
              <span className="absolute inset-0 animate-pulse-slow rounded-full bg-cream/40 blur-xl" />
              <motion.span initial={{ scale: 1 }} className="relative">
                <Play size={30} className="ml-1 fill-carbon text-carbon" />
              </motion.span>
            </button>
            <p className="max-w-sm text-sm leading-relaxed text-cream/70">
              El lanzamiento oficial de XS™ Power Water+ sabor limón-melocotón, con subtítulos en español.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
