"use client";

import { useRuta } from "@/hooks/useRuta";
import type { ReactNode } from "react";

// Header, footer and floating WhatsApp belong to the shop, not to the
// management panel, which has its own full-screen layout.
export function StoreOnly({ children }: { children: ReactNode }) {
  const pathname = useRuta();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
