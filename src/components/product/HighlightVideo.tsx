"use client";

import { useEffect, useRef } from "react";

/**
 * Square looping card video that only plays while it is on screen, so a row of
 * three doesn't decode all at once. With reduced motion it stays on the poster.
 */
export function HighlightVideo({
  src,
  poster,
  label,
  position,
}: {
  src: string;
  poster: string;
  label: string;
  /** CSS object-position for the square crop. */
  position?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative aspect-square w-full overflow-hidden">
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        style={position ? { objectPosition: position } : undefined}
        src={src}
        poster={poster}
        aria-label={label}
        muted
        loop
        playsInline
        preload="metadata"
      />
    </div>
  );
}
