"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

export function SpringVideoMoment({
  id,
  video,
  poster,
  posterAlt,
  eyebrow,
  description,
}: {
  id?: string;
  video: string;
  poster: string;
  posterAlt: string;
  eyebrow: string;
  description: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <section
      id={id}
      className="relative flex min-h-[70svh] items-center justify-center overflow-hidden bg-carbon sm:min-h-[85svh]"
    >
      {playing ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={video}
          poster={poster}
          controls
          autoPlay
          playsInline
        />
      ) : (
        <>
          <Image src={poster} alt={posterAlt} fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/45 to-carbon/20" />

          <div className="relative flex flex-col items-center gap-6 px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-spring-blue">
              {eyebrow}
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
            <p className="max-w-sm text-sm leading-relaxed text-cream/70">{description}</p>
          </div>
        </>
      )}
    </section>
  );
}
