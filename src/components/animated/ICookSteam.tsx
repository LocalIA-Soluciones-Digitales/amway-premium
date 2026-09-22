"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const WISPS = [
  { left: "30%", delay: 0 },
  { left: "45%", delay: 0.4 },
  { left: "58%", delay: 0.8 },
  { left: "38%", delay: 1.2 },
];

export function ICookSteam({ image }: { image?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-br from-carbon-soft to-carbon"
    >
      {image && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <Image
            src={`/images/catalog/${image}`}
            alt=""
            width={280}
            height={280}
            className="object-contain drop-shadow-2xl"
          />
        </div>
      )}

      {WISPS.map((w, i) => (
        <motion.div
          key={i}
          className="absolute bottom-[38%] h-24 w-6 rounded-full bg-white/40 blur-md"
          style={{ left: w.left }}
          animate={
            hovered
              ? { y: [-4, -140], opacity: [0, 0.5, 0], scaleX: [1, 1.8] }
              : { y: [-4, -60], opacity: [0, 0.2, 0], scaleX: [1, 1.3] }
          }
          transition={{
            duration: hovered ? 2.2 : 3.5,
            repeat: Infinity,
            delay: w.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
