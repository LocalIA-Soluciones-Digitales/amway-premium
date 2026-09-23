"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Header, footer and floating WhatsApp belong to the shop, not to the
// management panel, which has its own full-screen layout.
export function StoreOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
