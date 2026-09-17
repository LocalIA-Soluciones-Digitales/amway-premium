import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { waLink, WA_PRESETS } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Pago cancelado",
  robots: { index: false, follow: false },
};

export default function CheckoutCanceladoPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 pt-24 text-center sm:px-8">
      <XCircle className="text-mist" size={56} />
      <h1 className="mt-6 font-display text-3xl text-paper sm:text-4xl">Pago cancelado</h1>
      <p className="mt-4 max-w-md text-mist">
        No te hemos cobrado nada. Si tienes dudas sobre el producto o prefieres pedirlo por
        WhatsApp, aquí estamos.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <a
          href={waLink(WA_PRESETS.info)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-wellness px-7 py-3.5 text-sm font-medium text-obsidian transition hover:bg-wellness/90"
        >
          Hablar por WhatsApp
        </a>
        <Link
          href="/catalogo"
          className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-paper transition hover:border-white/40"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
