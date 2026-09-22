"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

// Keeps GSAP ScrollTrigger in sync with Lenis's smoothed scroll position,
// and lets GSAP's ticker drive Lenis's rAF loop instead of running two
// independent frame loops. Standard Lenis+GSAP integration.
function LenisGsapBridge() {
  const lenis = useLenis(() => ScrollTrigger.update());

  useEffect(() => {
    if (!lenis) return;
    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(update);
  }, [lenis]);

  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        touchMultiplier: 1.5,
        autoRaf: false,
      }}
    >
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}
