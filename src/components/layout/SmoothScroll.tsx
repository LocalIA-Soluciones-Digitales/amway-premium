"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useRuta } from "@/hooks/useRuta";

// Lenis only re-measures its scroll limit when <html> resizes. Watch the
// body too, so content that grows after load (images, hydration, lazy
// sections) never leaves a stale limit that clamps scrolling mid-page.
// Lenis runs its own rAF loop: GSAP (≈50 KB and 2 s of CPU on a mid-range
// phone) only loads on the pages that animate with it, and those sync
// ScrollTrigger themselves (see EnergyScrollStory).
function LenisResizeWatcher() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => lenis.resize());
    });
    observer.observe(document.body);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [lenis]);

  return null;
}

// Lenis keeps its own scroll target, so after a client-side navigation it
// could carry the previous page's position over (e.g. arriving at the
// bottom of /nutricion after scrolling down /belleza). Every new page opens
// at the top, except back/forward (the browser restores where you were) and
// links to an anchor (#contacto…), which scroll to it themselves.
function ScrollToTopOnNavigate() {
  const lenis = useLenis();
  const pathname = useRuta();
  const fromHistory = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;
    lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on page change
  }, [pathname]);

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
        autoRaf: true,
        // The site is a single vertical column with no horizontal-scroll
        // widgets, but sections like the XS Energy can carousel look
        // horizontal, so people swipe/tilt-wheel sideways over them. With
        // the default "vertical" gesture orientation Lenis silently drops
        // any gesture with no vertical component instead of scrolling —
        // "both" folds a horizontal-dominant delta into page scroll too.
        gestureOrientation: "both",
      }}
    >
      <LenisResizeWatcher />
      <ScrollToTopOnNavigate />
      {children}
    </ReactLenis>
  );
}
