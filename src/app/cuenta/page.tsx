import type { Metadata } from "next";
import { CuentaApp } from "@/components/cuenta/CuentaApp";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Consulta tus pedidos, fechas de recogida y datos de contacto.",
  robots: { index: false, follow: false },
};

export default function CuentaPage() {
  return <CuentaApp />;
}
