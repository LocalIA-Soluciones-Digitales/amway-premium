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

    // Lenis only re-measures its scroll limit when <html> resizes. Watch the
    // body too, so content that grows after load (images, hydration, lazy
    // sections) never leaves a stale limit that clamps scrolling mid-page.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      });
    });
    observer.observe(document.body);

    return () => {
      gsap.ticker.remove(update);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
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
        // The site is a single vertical column with no horizontal-scroll
        // widgets, but sections like the XS Energy can carousel look
        // horizontal, so people swipe/tilt-wheel sideways over them. With
        // the default "vertical" gesture orientation Lenis silently drops
        // any gesture with no vertical component instead of scrolling —
        // "both" folds a horizontal-dominant delta into page scroll too.
        gestureOrientation: "both",
      }}
    >
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}
