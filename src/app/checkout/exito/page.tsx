import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { waLink, WA_PRESETS } from "@/data/site-config";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export default function CheckoutExitoPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 pt-24 text-center sm:px-8">
      <CheckCircle2 className="text-wellness" size={56} />
      <h1 className="mt-6 font-display text-3xl text-paper sm:text-4xl">
        ¡Gracias por tu pedido!
      </h1>
      <p className="mt-4 max-w-md text-mist">
        Hemos recibido tu pago correctamente. Te escribiremos en breve por WhatsApp para
        confirmar los datos de envío.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <a
          href={waLink(WA_PRESETS.order)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-wellness px-7 py-3.5 text-sm font-medium text-obsidian transition hover:bg-wellness/90"
        >
          Confirmar por WhatsApp
        </a>
        <Link
          href="/catalogo"
          className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-paper transition hover:border-white/40"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
