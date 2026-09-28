"use client";

import { useEffect, type RefObject } from "react";

/**
 * Plays a muted looping video only while it is on screen and pauses it when
 * it leaves. Pair it with preload="none" so nothing is downloaded until the
 * video is about to be seen. With reduced motion it stays on the poster.
 */
export function usePlayWhenVisible(ref: RefObject<HTMLVideoElement | null>, threshold = 0.5) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [ref, threshold]);
}
