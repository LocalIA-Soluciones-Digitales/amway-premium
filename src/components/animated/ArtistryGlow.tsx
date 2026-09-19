"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export function ArtistryGlow({ image }: { image?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-br from-gold-soft/10 to-carbon-soft"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: hovered
            ? [
                "radial-gradient(circle at 30% 30%, rgba(212,175,106,0.4), transparent 60%)",
                "radial-gradient(circle at 70% 60%, rgba(212,175,106,0.4), transparent 60%)",
                "radial-gradient(circle at 40% 70%, rgba(212,175,106,0.4), transparent 60%)",
              ]
            : "radial-gradient(circle at 50% 50%, rgba(212,175,106,0.15), transparent 65%)",
        }}
        transition={{ duration: 3.5, repeat: hovered ? Infinity : 0, ease: "easeInOut" }}
      />

      {image && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <motion.div
            animate={hovered ? { scale: 1.06, rotate: -1 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={`/images/catalog/${image}`}
              alt=""
              width={260}
              height={320}
              className="object-contain drop-shadow-2xl"
            />
          </motion.div>
        </div>
      )}

      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 48%, transparent 55%)",
        }}
        animate={{ x: hovered ? ["-120%", "120%"] : "-120%" }}
        transition={{ duration: 1.4, repeat: hovered ? Infinity : 0, repeatDelay: 0.6 }}
      />
    </div>
  );
}
