import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Panel de gestión",
  robots: { index: false, follow: false },
  manifest: "/admin/app.webmanifest",
  appleWebApp: { capable: true, title: "Gestión", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fbf9f5",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
