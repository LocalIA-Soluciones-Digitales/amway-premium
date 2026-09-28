"use client";

import { useRef } from "react";
import { usePlayWhenVisible } from "@/hooks/usePlayWhenVisible";

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
  usePlayWhenVisible(ref);

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
        preload="none"
      />
    </div>
  );
}
