import type { Metadata } from "next";
import { RestablecerContrasena } from "@/components/cuenta/RestablecerContrasena";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
};

export default function RestablecerPage() {
  return <RestablecerContrasena />;
}
