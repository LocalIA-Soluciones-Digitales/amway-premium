"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const LEAVES = [
  { top: "8%", left: "12%", size: 26, delay: 0 },
  { top: "18%", left: "78%", size: 20, delay: 0.1 },
  { top: "62%", left: "82%", size: 22, delay: 0.2 },
  { top: "72%", left: "10%", size: 18, delay: 0.15 },
  { top: "40%", left: "50%", size: 16, delay: 0.25 },
];

function Leaf({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6 6 4 12 6 18C10 20 16 18 18 12C20 6 18 2 12 2Z"
        fill="currentColor"
        opacity={0.8}
      />
      <path d="M12 2C10 8 10 14 6 18" stroke="#0b1a14" strokeWidth={0.6} opacity={0.4} />
    </svg>
  );
}

export function NutriliteBotanical({ image }: { image?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-br from-forest-dim/30 to-carbon-soft"
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(53,208,161,0.28), transparent 65%)",
          opacity: hovered ? 1 : 0.4,
        }}
      />

      {image && (
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <Image
            src={`/images/catalog/${image}`}
            alt=""
            width={280}
            height={340}
            className="object-contain drop-shadow-2xl"
          />
        </div>
      )}

      {LEAVES.map((leaf, i) => (
        <motion.div
          key={i}
          className="absolute text-forest-soft"
          style={{ top: leaf.top, left: leaf.left }}
          animate={
            hovered
              ? { y: [-6, -18, -6], rotate: [0, 12, 0], opacity: 1 }
              : { y: [0, -6, 0], rotate: [0, 4, 0], opacity: 0.6 }
          }
          transition={{
            duration: hovered ? 2.2 : 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: leaf.delay,
          }}
        >
          <Leaf size={leaf.size} />
        </motion.div>
      ))}
    </div>
  );
}
